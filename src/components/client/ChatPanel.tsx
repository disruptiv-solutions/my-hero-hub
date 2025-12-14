"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAuthHeaders } from "@/lib/api-helpers";
import { ClientChatSession, ChatMessage } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/lib/hooks/use-toast";
import { Send, Loader2, MessageSquare, Plus, Trash2, Copy, CheckCircle, Sparkles } from "lucide-react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";

interface ChatPanelProps {
  clientId: string;
}

const ChatPanel = ({ clientId }: ChatPanelProps) => {
  const [message, setMessage] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch sessions
  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ["client-chat-sessions", clientId],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/clients/${encodeURIComponent(clientId)}/chat/sessions`, {
        headers,
      });
      if (!res.ok) throw new Error("Failed to fetch sessions");
      return res.json();
    },
  });

  // Fetch selected session
  const { data: sessionData, isLoading: sessionLoading } = useQuery({
    queryKey: ["client-chat-session", clientId, selectedSessionId],
    queryFn: async () => {
      if (!selectedSessionId) return null;
      const headers = await getAuthHeaders();
      const res = await fetch(
        `/api/clients/${encodeURIComponent(clientId)}/chat/sessions/${selectedSessionId}`,
        { headers }
      );
      if (!res.ok) throw new Error("Failed to fetch session");
      return res.json();
    },
    enabled: !!selectedSessionId,
  });

  const currentSession = sessionData?.session;

  // Create new session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (title?: string) => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/clients/${encodeURIComponent(clientId)}/chat/sessions`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create session");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["client-chat-sessions", clientId] });
      setSelectedSessionId(data.session.id);
      toast({
        title: "New session created",
        description: "You can now start chatting.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create session",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete session mutation
  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionIdToDelete: string) => {
      const headers = await getAuthHeaders();
      const res = await fetch(
        `/api/clients/${encodeURIComponent(clientId)}/chat/sessions/${sessionIdToDelete}`,
        {
          method: "DELETE",
          headers,
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete session");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-chat-sessions", clientId] });
      // Clear selected session if it was deleted
      setSelectedSessionId(null);
      toast({
        title: "Session deleted",
        description: "The conversation session has been deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete session",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (msg: string) => {
      if (!selectedSessionId) throw new Error("No session selected");
      const headers = await getAuthHeaders();
      const res = await fetch(
        `/api/clients/${encodeURIComponent(clientId)}/chat/sessions/${selectedSessionId}`,
        {
          method: "POST",
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: msg }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to send message");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["client-chat-session", clientId, selectedSessionId],
      });
      setMessage("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Auto-select first session or create one
  useEffect(() => {
    if (!selectedSessionId && sessionsData?.sessions?.length > 0) {
      setSelectedSessionId(sessionsData.sessions[0].id);
    }
  }, [sessionsData, selectedSessionId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentSession?.messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    if (!selectedSessionId) {
      createSessionMutation.mutate();
      return;
    }
    sendMessageMutation.mutate(message);
  };

  const handleNewSession = () => {
    createSessionMutation.mutate();
  };

  const handleCopyMessage = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      toast({
        title: "Copied",
        description: "Message copied to clipboard",
      });
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy message to clipboard",
        variant: "destructive",
      });
    }
  };

  const generateActionItemsMutation = useMutation({
    mutationFn: async (aiMessage: string) => {
      const headers = await getAuthHeaders();
      const res = await fetch(
        `/api/clients/${encodeURIComponent(clientId)}/action-items/generate`,
        {
          method: "POST",
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: aiMessage }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to generate action items");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["client-action-items", clientId] });
      queryClient.invalidateQueries({ queryKey: ["master-priorities"] });
      toast({
        title: "Action items created",
        description: `Created ${data.actionItems?.length || 0} action item(s) from the AI response.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create action items",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const sessions = sessionsData?.sessions || [];
  const messages = currentSession?.messages?.filter((m: ChatMessage) => m.role !== "system") || [];

  return (
    <Card className="bg-gray-800 border-gray-700 flex flex-col" style={{ height: 'calc(100vh - 200px)', minHeight: '600px' }}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 flex items-center gap-2">
            {sessionsLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                <span className="text-gray-400 text-sm">Loading sessions...</span>
              </div>
            ) : sessions.length > 0 ? (
              <>
                <select
                  value={selectedSessionId || ""}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                  className="flex-1 bg-gray-900 border border-gray-700 text-white text-sm rounded px-3 py-2 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {sessions.map((session: ClientChatSession) => (
                    <option key={session.id} value={session.id}>
                      {session.title || `Session ${new Date(session.createdAt).toLocaleDateString()}`}
                    </option>
                  ))}
                </select>
                {selectedSessionId && (
                  <Button
                    onClick={() => {
                      if (window.confirm("Are you sure you want to delete this conversation session? This cannot be undone.")) {
                        deleteSessionMutation.mutate(selectedSessionId);
                      }
                    }}
                    size="sm"
                    variant="outline"
                    className="border-red-700 text-red-400 hover:bg-red-900/20 hover:text-red-300 flex-shrink-0"
                    disabled={deleteSessionMutation.isPending}
                    aria-label="Delete session"
                  >
                    {deleteSessionMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </>
            ) : (
              <span className="text-white font-semibold text-sm">No sessions yet</span>
            )}
          </div>
          <Button
            onClick={handleNewSession}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 flex-shrink-0"
            disabled={createSessionMutation.isPending}
          >
            {createSessionMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Plus className="w-4 h-4 mr-1" />
                New
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {sessionLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : !selectedSessionId ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <MessageSquare className="w-12 h-12 mb-2 opacity-30" />
            <p className="text-sm">No session selected</p>
            <p className="text-xs mt-1">Create a new session to start chatting</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <MessageSquare className="w-12 h-12 mb-2 opacity-30" />
            <p className="text-sm">Start a conversation</p>
            <p className="text-xs mt-1">Ask questions or request help with this client</p>
          </div>
        ) : (
          messages.map((msg: ChatMessage, idx: number) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-200"
                }`}
              >
                {msg.role === "assistant" ? (
                  <>
                    <div className="text-sm text-gray-200 markdown-content">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                          h1: ({ children }) => <h1 className="text-lg font-bold mb-2 mt-3 first:mt-0 text-white">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-base font-bold mb-2 mt-3 first:mt-0 text-white">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-sm font-bold mb-2 mt-2 first:mt-0 text-white">{children}</h3>,
                          ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1 ml-2">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1 ml-2">{children}</ol>,
                          li: ({ children }) => <li className="ml-1">{children}</li>,
                          code: ({ children, className }) => {
                            const isInline = !className;
                            return isInline ? (
                              <code className="bg-gray-800 px-1.5 py-0.5 rounded text-xs font-mono text-gray-100">{children}</code>
                            ) : (
                              <code className="block bg-gray-800 p-2 rounded text-xs font-mono overflow-x-auto text-gray-100 mb-2">{children}</code>
                            );
                          },
                          pre: ({ children }) => <pre className="bg-gray-800 p-2 rounded mb-2 overflow-x-auto">{children}</pre>,
                          blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-500 pl-3 italic mb-2 text-gray-300">{children}</blockquote>,
                          a: ({ children, href }) => <a href={href} className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                          strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                          em: ({ children }) => <em className="italic">{children}</em>,
                          hr: () => <hr className="border-gray-600 my-3" />,
                          table: ({ children }) => <table className="border-collapse border border-gray-600 mb-2">{children}</table>,
                          th: ({ children }) => <th className="border border-gray-600 px-2 py-1 bg-gray-800 font-semibold">{children}</th>,
                          td: ({ children }) => <td className="border border-gray-600 px-2 py-1">{children}</td>,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-600">
                      <p className="text-xs opacity-70 text-gray-400">
                        {format(new Date(msg.timestamp), "h:mm a")}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleCopyMessage(msg.content, msg.timestamp)}
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs text-gray-400 hover:text-gray-200"
                        >
                          {copiedMessageId === msg.timestamp ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 mr-1" />
                              Copy
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => generateActionItemsMutation.mutate(msg.content)}
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs text-gray-400 hover:text-gray-200"
                          disabled={generateActionItemsMutation.isPending}
                        >
                          {generateActionItemsMutation.isPending ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3 h-3 mr-1" />
                              Create Actions
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p className="text-xs opacity-70 mt-1 text-blue-200">
                      {format(new Date(msg.timestamp), "h:mm a")}
                    </p>
                  </>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-700">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="bg-gray-900 border-gray-700 text-white flex-1"
            disabled={sendMessageMutation.isPending || !selectedSessionId}
          />
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700"
            disabled={sendMessageMutation.isPending || !message.trim() || !selectedSessionId}
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>
    </Card>
  );
};

export default ChatPanel;

