"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAuthHeaders } from "@/lib/api-helpers";
import { Client, ClientTranscript, ClientAnalytics } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/lib/hooks/use-toast";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Mail,
  Phone,
  Users,
  FileText,
  Plus,
  Loader2,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  Sparkles,
  Edit,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import ChatPanel from "@/components/client/ChatPanel";
import ActionItems from "@/components/client/ActionItems";

const ClientDetailPage = () => {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const idOrSlug = decodeURIComponent(params.id);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isTranscriptDialogOpen, setIsTranscriptDialogOpen] = useState(false);
  const [isEditTranscriptDialogOpen, setIsEditTranscriptDialogOpen] = useState(false);
  const [editingTranscript, setEditingTranscript] = useState<ClientTranscript | null>(null);
  const [transcriptTitle, setTranscriptTitle] = useState("");
  const [transcriptContent, setTranscriptContent] = useState("");
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [expandedTranscripts, setExpandedTranscripts] = useState<Set<string>>(new Set());

  const { data, isLoading, error } = useQuery({
    queryKey: ["client-detail", idOrSlug],
    queryFn: async (): Promise<{ client: Client }> => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/clients/${encodeURIComponent(idOrSlug)}`, {
        headers,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to load client");
      }
      return res.json();
    },
  });

  const client = data?.client;

  // Analytics query
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ["client-analytics", idOrSlug],
    queryFn: async (): Promise<{ analytics: ClientAnalytics | null }> => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/clients/${encodeURIComponent(idOrSlug)}/analytics`, {
        headers,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to load analytics");
      }
      return res.json();
    },
    enabled: !!client,
  });

  const analytics = analyticsData?.analytics;

  // Generate/Update analytics mutation
  const generateAnalyticsMutation = useMutation({
    mutationFn: async (isUpdate: boolean) => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/clients/${encodeURIComponent(idOrSlug)}/analytics`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isUpdate }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to generate analytics");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-analytics", idOrSlug] });
      toast({
        title: "Analytics generated",
        description: "Client analytics have been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to generate analytics",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleGenerateAnalytics = () => {
    const isUpdate = !!analytics;
    generateAnalyticsMutation.mutate(isUpdate);
  };

  const addTranscriptMutation = useMutation({
    mutationFn: async ({
      content,
      title,
    }: {
      content: string;
      title?: string;
    }) => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/clients/${encodeURIComponent(idOrSlug)}`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content, title }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to add transcript");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-detail", idOrSlug] });
      setIsTranscriptDialogOpen(false);
      setTranscriptTitle("");
      setTranscriptContent("");
      toast({
        title: "Transcript added",
        description: "The transcript has been added successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add transcript",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = async (file: File | null) => {
    if (!file) return;

    setIsUploadingFile(true);
    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      // For text files, read directly
      if (fileExtension === 'txt' || fileExtension === 'md') {
        const text = await file.text();
        setTranscriptContent(text);
      } 
      // For PDF, DOC, DOCX - try to read as text (works if file contains plain text)
      // Note: Complex formatted documents may not read correctly
      else if (fileExtension === 'pdf' || fileExtension === 'doc' || fileExtension === 'docx') {
        try {
          const text = await file.text();
          // Check if we got meaningful text (not binary garbage)
          if (text.length > 0 && text.trim().length > 10) {
            setTranscriptContent(text);
            toast({
              title: "File read",
              description: "Note: For formatted documents, you may need to copy-paste the content manually for best results.",
            });
          } else {
            throw new Error("Could not extract text from file");
          }
        } catch (readError) {
          toast({
            title: "File format not supported",
            description: "Please copy the text content from your document and paste it into the text area below, or save the document as a .txt file.",
            variant: "destructive",
          });
          return;
        }
      } else {
        toast({
          title: "Unsupported file type",
          description: "Please use .txt, .md, .doc, .docx, or .pdf files, or paste the content directly.",
          variant: "destructive",
        });
        return;
      }

      // Auto-generate title from filename if no title provided
      if (!transcriptTitle) {
        const fileName = file.name.replace(/\.[^/.]+$/, "");
        setTranscriptTitle(fileName);
      }
    } catch (error: any) {
      toast({
        title: "Failed to read file",
        description: error.message || "Could not read the file. Please try copying the content and pasting it directly.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleSubmitTranscript = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transcriptContent.trim()) {
      toast({
        title: "Content required",
        description: "Please enter transcript content.",
        variant: "destructive",
      });
      return;
    }
    addTranscriptMutation.mutate({
      content: transcriptContent,
      title: transcriptTitle || undefined,
    });
  };

  const toggleTranscript = (transcriptId: string) => {
    setExpandedTranscripts((prev) => {
      const next = new Set(prev);
      if (next.has(transcriptId)) {
        next.delete(transcriptId);
      } else {
        next.add(transcriptId);
      }
      return next;
    });
  };

  const handleEditTranscript = (transcript: ClientTranscript) => {
    setEditingTranscript(transcript);
    setTranscriptTitle(transcript.title || "");
    setTranscriptContent(transcript.content);
    setIsEditTranscriptDialogOpen(true);
  };

  const handleDeleteTranscript = async (transcriptId: string) => {
    if (!confirm("Are you sure you want to delete this transcript? This action cannot be undone.")) {
      return;
    }

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(
        `/api/clients/${encodeURIComponent(idOrSlug)}?transcriptId=${encodeURIComponent(transcriptId)}`,
        {
          method: "DELETE",
          headers,
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete transcript");
      }
      queryClient.invalidateQueries({ queryKey: ["client-detail", idOrSlug] });
      toast({
        title: "Transcript deleted",
        description: "The transcript has been deleted successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to delete transcript",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateTranscriptMutation = useMutation({
    mutationFn: async ({
      transcriptId,
      content,
      title,
    }: {
      transcriptId: string;
      content: string;
      title?: string;
    }) => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/clients/${encodeURIComponent(idOrSlug)}`, {
        method: "PUT",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transcriptId, content, title }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update transcript");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-detail", idOrSlug] });
      setIsEditTranscriptDialogOpen(false);
      setEditingTranscript(null);
      setTranscriptTitle("");
      setTranscriptContent("");
      toast({
        title: "Transcript updated",
        description: "The transcript has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update transcript",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmitEditTranscript = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transcriptContent.trim() || !editingTranscript) {
      toast({
        title: "Content required",
        description: "Please enter transcript content.",
        variant: "destructive",
      });
      return;
    }

    updateTranscriptMutation.mutate({
      transcriptId: editingTranscript.id,
      content: transcriptContent,
      title: transcriptTitle || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-gray-400">Loading client...</div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="space-y-4">
        <Button
          variant="outline"
          className="border-gray-700 text-gray-300 hover:bg-gray-800"
          onClick={() => router.push("/dashboard/clients")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Clients
        </Button>
        <Card className="bg-gray-800 border-gray-700 p-6">
          <div className="text-red-400">Client not found</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-900/40 flex items-center justify-center">
            <Users className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{client.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="bg-gray-700/40 text-gray-300 border-gray-600">
                {client.status}
              </Badge>
              {client.newsletterSubscribed && (
                <Badge className="bg-emerald-900/40 text-emerald-400 border-emerald-700">
                  newsletter
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          className="border-gray-700 text-gray-300 hover:bg-gray-800"
          onClick={() => router.push("/dashboard/clients")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Contact & Details Combined */}
          <Card className="bg-gray-800 border-gray-700 p-4">
            <h3 className="text-white font-semibold mb-4">Contact & Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Contact Info */}
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-gray-300">
                  <Mail className="w-4 h-4" />
                  <span>{client.email}</span>
                </div>
                {client.phone && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <Phone className="w-4 h-4" />
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.value && (
                  <div className="flex items-center gap-2 text-green-400 font-medium">
                    <DollarSign className="w-4 h-4" />
                    <span>${client.value.toLocaleString()}</span>
                  </div>
                )}
                {client.lastContact && (
                  <div className="flex items-center gap-2 text-gray-400 text-xs">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Last contact: {format(new Date(client.lastContact), "MMM d, yyyy")}
                    </span>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Created: {format(new Date(client.createdDate), "MMM d, yyyy")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>Projects: {client.projectCount ?? 0}</span>
                </div>
                {Array.isArray(client.events) && client.events.length > 0 && (
                  <div>
                    <div className="mb-2 text-gray-400 text-xs">Tags:</div>
                    <div className="flex flex-wrap gap-2">
                      {client.events.map((e) => (
                        <Badge key={e} className="bg-purple-900/40 text-purple-300 border-purple-700">
                          {e}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Analytics */}
          <Card className="bg-gray-800 border-gray-700 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Analytics</h3>
              {!analytics ? (
                <Button
                  onClick={handleGenerateAnalytics}
                  disabled={generateAnalyticsMutation.isPending}
                  className="bg-purple-600 hover:bg-purple-700"
                  size="sm"
                >
                  {generateAnalyticsMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Analyze
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleGenerateAnalytics}
                  disabled={generateAnalyticsMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  {generateAnalyticsMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Update
                    </>
                  )}
                </Button>
              )}
            </div>

            {analyticsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : !analytics ? (
              <div className="text-center py-8 text-gray-400">
                <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No analytics yet</p>
                <p className="text-xs mt-1">Click "Analyze" to generate AI-powered insights</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Client Avatar */}
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-gray-400">Client Avatar</div>
                    {analytics.avatar.ageRange && (
                      <Badge className="bg-indigo-900/40 text-indigo-300 border-indigo-700 text-xs">
                        Age: {analytics.avatar.ageRange}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-300 mb-3">{analytics.avatar.description}</p>
                  {analytics.avatar.characteristics && analytics.avatar.characteristics.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {analytics.avatar.characteristics.map((char, idx) => (
                        <Badge
                          key={idx}
                          className="bg-indigo-900/30 text-indigo-300 border-indigo-700/50 text-xs"
                        >
                          {char}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Sentiment Trend */}
                  <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
                  <div className="text-xs text-gray-400 mb-1">Sentiment Trend</div>
                  <div className="flex items-center gap-2">
                    <div className={`text-2xl font-bold ${
                      analytics.sentimentTrend.current === "positive" 
                        ? "text-green-400" 
                        : analytics.sentimentTrend.current === "negative"
                        ? "text-red-400"
                        : "text-yellow-400"
                    }`}>
                      {analytics.sentimentTrend.current.charAt(0).toUpperCase() + 
                       analytics.sentimentTrend.current.slice(1)}
                    </div>
                    {analytics.sentimentTrend.change !== 0 && (
                      <Badge className={`${
                        analytics.sentimentTrend.change > 0
                          ? "bg-green-900/40 text-green-300 border-green-700"
                          : "bg-red-900/40 text-red-300 border-red-700"
                      } text-xs`}>
                        {analytics.sentimentTrend.change > 0 ? "↑" : "↓"} {Math.abs(analytics.sentimentTrend.change)}%
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{analytics.sentimentTrend.description}</p>
                </div>

                {/* Engagement Level */}
                <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
                  <div className="text-xs text-gray-400 mb-1">Engagement Level</div>
                  <div className="flex items-center gap-2">
                    <div className={`text-2xl font-bold ${
                      analytics.engagementLevel.level === "high"
                        ? "text-blue-400"
                        : analytics.engagementLevel.level === "low"
                        ? "text-orange-400"
                        : "text-yellow-400"
                    }`}>
                      {analytics.engagementLevel.level.charAt(0).toUpperCase() + 
                       analytics.engagementLevel.level.slice(1)}
                    </div>
                    <Badge className="bg-blue-900/40 text-blue-300 border-blue-700 text-xs">
                      {analytics.engagementLevel.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{analytics.engagementLevel.description}</p>
                </div>

                {/* Key Topics */}
                <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
                  <div className="text-xs text-gray-400 mb-2">Key Topics</div>
                  <div className="flex flex-wrap gap-1">
                    {analytics.keyTopics.map((topic, idx) => (
                      <Badge 
                        key={idx}
                        className="bg-purple-900/30 text-purple-300 border-purple-700/50 text-xs"
                      >
                        {topic}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Most discussed themes</p>
                </div>

                {/* Next Best Action */}
                <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
                  <div className="text-xs text-gray-400 mb-1">Next Best Action</div>
                  <div className="text-sm font-medium text-orange-400 mb-1">
                    {analytics.nextBestAction.action}
                  </div>
                  <p className="text-xs text-gray-500">{analytics.nextBestAction.reasoning}</p>
                </div>
                </div>
              </div>
            )}
          </Card>

          {client.notes && (
            <Card className="bg-gray-800 border-gray-700 p-4">
              <h3 className="text-white font-semibold mb-3">Notes</h3>
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{client.notes}</p>
            </Card>
          )}

          {/* Transcripts and Action Items Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ height: 'calc(100vh - 200px)', minHeight: '600px' }}>
            {/* Transcripts Section */}
            <Card className="bg-gray-800 border-gray-700 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4 p-4 pb-0 flex-shrink-0">
                <h3 className="text-white font-semibold">Conversation Transcripts & Notes</h3>
                <Button
                  onClick={() => setIsTranscriptDialogOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Transcript
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 pt-4">
                {client.transcripts && client.transcripts.length > 0 ? (
                  <div className="space-y-2">
                    {client.transcripts
                      .sort(
                        (a, b) =>
                          new Date(b.createdAt).getTime() -
                          new Date(a.createdAt).getTime()
                      )
                      .map((transcript: ClientTranscript) => {
                        const isExpanded = expandedTranscripts.has(transcript.id);
                        
                        return (
                          <Card
                            key={transcript.id}
                            className="bg-gray-900 border-gray-700 overflow-hidden group"
                          >
                            <div className="flex items-start gap-2">
                              <button
                                onClick={() => toggleTranscript(transcript.id)}
                                className="flex-1 flex items-center gap-3 text-left p-4 hover:bg-gray-800 transition-colors"
                                aria-expanded={isExpanded}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  {transcript.title ? (
                                    <h4 className="text-white font-medium mb-1 truncate">
                                      {transcript.title}
                                    </h4>
                                  ) : (
                                    <h4 className="text-white font-medium mb-1">
                                      Untitled Transcript
                                    </h4>
                                  )}
                                  <div className="text-xs text-gray-400">
                                    {format(
                                      new Date(transcript.createdAt),
                                      "MMM d, yyyy 'at' h:mm a"
                                    )}
                                    {transcript.updatedAt && (
                                      <span className="ml-2">(edited)</span>
                                    )}
                                  </div>
                                  {!isExpanded && (
                                    <p className="text-sm text-gray-400 mt-2 line-clamp-2">
                                      {transcript.content}
                                    </p>
                                  )}
                                </div>
                              </button>
                              <div className="flex items-center gap-1 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditTranscript(transcript);
                                  }}
                                  className="p-1.5 hover:bg-gray-800 rounded text-gray-400 hover:text-blue-400 transition-colors"
                                  aria-label="Edit transcript"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteTranscript(transcript.id);
                                  }}
                                  className="p-1.5 hover:bg-gray-800 rounded text-gray-400 hover:text-red-400 transition-colors"
                                  aria-label="Delete transcript"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            {isExpanded && (
                              <div className="px-4 pb-4 pt-2 border-t border-gray-700">
                                <p className="text-sm text-gray-300 whitespace-pre-wrap">
                                  {transcript.content}
                                </p>
                              </div>
                            )}
                          </Card>
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No transcripts yet. Add your first conversation transcript or notes.</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Action Items Section */}
            <ActionItems clientId={client.id} />
          </div>
        </div>

        {/* Right Column - Chat */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <ChatPanel clientId={client.id} />
          </div>
        </div>
      </div>

      {/* Edit Transcript Dialog */}
      <Dialog open={isEditTranscriptDialogOpen} onOpenChange={setIsEditTranscriptDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Conversation Transcript or Notes</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update the transcript content and title below
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEditTranscript} className="space-y-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-transcript-title" className="text-gray-200">
                Title (optional)
              </Label>
              <Input
                id="edit-transcript-title"
                value={transcriptTitle}
                onChange={(e) => setTranscriptTitle(e.target.value)}
                placeholder="e.g., Sales Call - Jan 15, 2024"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-transcript-content" className="text-gray-200">
                Content <span className="text-red-400">*</span>
              </Label>
              <Textarea
                id="edit-transcript-content"
                value={transcriptContent}
                onChange={(e) => setTranscriptContent(e.target.value)}
                placeholder="Type or paste conversation transcript or notes here..."
                className="bg-gray-800 border-gray-700 text-white min-h-[300px] font-mono text-sm"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditTranscriptDialogOpen(false);
                  setEditingTranscript(null);
                  setTranscriptTitle("");
                  setTranscriptContent("");
                }}
                disabled={updateTranscriptMutation.isPending}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateTranscriptMutation.isPending || !transcriptContent.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {updateTranscriptMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating...
                  </span>
                ) : (
                  "Update Transcript"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Transcript Dialog */}
      <Dialog open={isTranscriptDialogOpen} onOpenChange={setIsTranscriptDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Conversation Transcript or Notes</DialogTitle>
            <DialogDescription className="text-gray-400">
              Type directly in the text area below, or upload a file (.txt, .md, .doc, .docx, .pdf)
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitTranscript} className="space-y-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="transcript-title" className="text-gray-200">
                Title (optional)
              </Label>
              <Input
                id="transcript-title"
                value={transcriptTitle}
                onChange={(e) => setTranscriptTitle(e.target.value)}
                placeholder="e.g., Sales Call - Jan 15, 2024"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="transcript-content" className="text-gray-200">
                Content <span className="text-red-400">*</span>
              </Label>
              <Textarea
                id="transcript-content"
                value={transcriptContent}
                onChange={(e) => setTranscriptContent(e.target.value)}
                placeholder="Type or paste conversation transcript or notes here..."
                className="bg-gray-800 border-gray-700 text-white min-h-[300px] font-mono text-sm"
                required
              />
              <p className="text-xs text-gray-400">
                You can type directly here or paste content from any document.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="transcript-file" className="text-gray-200">
                Or Upload File (optional)
              </Label>
              <input
                id="transcript-file"
                type="file"
                accept=".txt,.md,.doc,.docx,.pdf"
                onChange={(e) => handleFileUpload(e.target.files?.[0] || null)}
                disabled={isUploadingFile}
                className="block w-full text-sm text-gray-300
                  file:mr-4 file:py-2 file:px-4
                  file:rounded file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-600 file:text-white
                  hover:file:bg-blue-700
                  disabled:opacity-50"
              />
              {isUploadingFile && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Reading file...
                </div>
              )}
              <p className="text-xs text-gray-400">
                Supported formats: .txt, .md, .doc, .docx, .pdf. For formatted documents, you may need to copy-paste the content for best results.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
                onClick={() => {
                  setIsTranscriptDialogOpen(false);
                  setTranscriptTitle("");
                  setTranscriptContent("");
                }}
                disabled={addTranscriptMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={addTranscriptMutation.isPending || !transcriptContent.trim()}
              >
                {addTranscriptMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Adding...
                  </span>
                ) : (
                  "Add Transcript"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientDetailPage;


