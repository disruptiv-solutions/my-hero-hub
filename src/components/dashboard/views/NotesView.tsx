"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, MicOff, Save, Trash2, Loader2, StickyNote, MessageSquare, ChevronDown, ChevronRight, ListChecks } from "lucide-react";
import { toast } from "@/lib/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAuthHeaders } from "@/lib/api-helpers";
import { format } from "date-fns";
import LiveNotes from "@/components/dashboard/LiveNotes";

interface Note {
  id: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}

export default function NotesView() {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [creatingSession, setCreatingSession] = useState(false);
  const [summarizing, setSummarizing] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [details, setDetails] = useState<Record<string, { entries: Array<{ id: string; text: string; createdAt: string }>; loading: boolean; summary?: string; tasks?: Array<{ title: string; priority?: string }> }>>({});
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const queryClient = useQueryClient();

  // Fetch notes
  const { data: notesData, isLoading } = useQuery({
    queryKey: ["notes"],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/notes", { headers });
      if (!res.ok) throw new Error("Failed to fetch notes");
      return res.json();
    },
  });

  // Voice note sessions
  const { data: voiceSessionsData } = useQuery({
    queryKey: ["voice-note-sessions"],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/voice-notes/sessions", { headers });
      if (res.status === 401) return { sessions: [] };
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        console.error("Failed to fetch voice note sessions:", res.status, txt);
        return { sessions: [] };
      }
      return res.json();
    },
  });

  const loadVoiceSessionDetails = async (id: string) => {
    setDetails((prev) => ({ ...prev, [id]: { ...(prev[id] || { entries: [] }), loading: true } }));
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/voice-notes/sessions/${id}`, { headers });
      if (res.ok) {
        const payload = await res.json();
        setDetails((prev) => ({
          ...prev,
          [id]: {
            entries: payload?.entries || [],
            loading: false,
            summary: payload?.session?.summary,
            tasks: payload?.session?.tasks,
          },
        }));
      } else {
        setDetails((prev) => ({ ...prev, [id]: { ...(prev[id] || { entries: [] }), loading: false } }));
      }
    } catch {
      setDetails((prev) => ({ ...prev, [id]: { ...(prev[id] || { entries: [] }), loading: false } }));
    }
  };

  const toggleVoiceSession = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        if (!details[id]) {
          void loadVoiceSessionDetails(id);
        }
      }
      return next;
    });
  };

  const summarizeVoiceSession = async (id: string) => {
    setSummarizing((prev) => ({ ...prev, [id]: true }));
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/voice-notes/sessions/${id}/summarize`, {
        method: "POST",
        headers,
      });
      if (res.ok) {
        const payload = await res.json();
        setDetails((prev) => ({ 
          ...prev, 
          [id]: { ...(prev[id] || { entries: [] }), summary: payload.summary, tasks: payload.tasks, loading: false } 
        }));
        queryClient.invalidateQueries({ queryKey: ["voice-note-sessions"] });
      }
    } finally {
      setSummarizing((prev) => ({ ...prev, [id]: false }));
    }
  };

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/notes/${noteId}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete note");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      toast({
        title: "Success",
        description: "Note deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast({
        title: "Recording started",
        description: "Speak your note...",
      });
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Error",
        description: "Failed to access microphone. Please allow microphone permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast({
        title: "Recording stopped",
        description: "Transcribing your note...",
      });
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');
      formData.append('model', 'whisper-1');

      const headers = await getAuthHeaders();
      const response = await fetch('/api/notes/transcribe', {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to transcribe audio');
      }

      const data = await response.json();
      setTranscript(data.text);
      toast({
        title: "Transcription complete",
        description: "Your note has been transcribed.",
      });
    } catch (error: any) {
      console.error("Error transcribing audio:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to transcribe audio",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const saveNote = async () => {
    if (!transcript.trim()) {
      toast({
        title: "Error",
        description: "No note to save. Please record a note first.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: transcript,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save note');
      }

      toast({
        title: "Success",
        description: "Note saved successfully!",
      });
      
      setTranscript("");
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    } catch (error: any) {
      console.error("Error saving note:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save note",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const saveTranscriptToNewSession = async (withSummarize: boolean) => {
    if (!transcript.trim()) {
      toast({
        title: "Error",
        description: "No transcript available.",
        variant: "destructive",
      });
      return;
    }
    setCreatingSession(true);
    try {
      const headers = await getAuthHeaders();
      const createRes = await fetch("/api/voice-notes/sessions", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ title: `Voice Note - ${new Date().toLocaleString()}` }),
      });
      if (createRes.status === 401) {
        throw new Error("You must be signed in to save and summarize.");
      }
      if (!createRes.ok) {
        const txt = await createRes.text().catch(() => "");
        throw new Error(`Failed to create session (${createRes.status}). ${txt}`);
      }
      const created = await createRes.json();
      const sid = created.session?.id;
      if (!sid) throw new Error("No session id returned");

      const tRes = await fetch(`/api/voice-notes/sessions/${sid}/transcript`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ text: transcript }),
      });
      if (tRes.status === 401) {
        throw new Error("You must be signed in to save transcript.");
      }
      if (!tRes.ok) {
        const txt = await tRes.text().catch(() => "");
        throw new Error(`Failed to save transcript (${tRes.status}). ${txt}`);
      }

      toast({ title: "Saved", description: "Transcript saved to a session." });
      setTranscript("");
      queryClient.invalidateQueries({ queryKey: ["voice-note-sessions"] });

      if (withSummarize) {
        setSummarizing((prev) => ({ ...prev, [sid]: true }));
        const sRes = await fetch(`/api/voice-notes/sessions/${sid}/summarize`, {
          method: "POST",
          headers,
        });
        if (sRes.status === 401) {
          toast({ title: "Sign in required", description: "Please sign in to run AI summarization.", variant: "destructive" });
        } else if (sRes.ok) {
          const payload = await sRes.json();
          setDetails((prev) => ({
            ...prev,
            [sid]: { ...(prev[sid] || { entries: [] }), summary: payload.summary, tasks: payload.tasks, loading: false },
          }));
          toast({ title: "AI Complete", description: "Summary and tasks generated." });
        } else {
          const txt = await sRes.text().catch(() => "");
          toast({ title: "AI Failed", description: `Could not generate summary. ${txt}`, variant: "destructive" });
        }
        setSummarizing((prev) => ({ ...prev, [sid]: false }));
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to save transcript", variant: "destructive" });
    } finally {
      setCreatingSession(false);
    }
  };

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);

  const notes = notesData?.notes || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Voice Notes</h2>
      </div>

      {/* Recording Section */}
      <Card className="bg-gray-800 border-gray-700 p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-4">
            {!isRecording && !isTranscribing && (
              <Button
                onClick={startRecording}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                <Mic className="w-5 h-5 mr-2" />
                Start Recording
              </Button>
            )}
            
            {isRecording && (
              <Button
                onClick={stopRecording}
                className="bg-red-600 hover:bg-red-700 text-white animate-pulse"
                size="lg"
              >
                <MicOff className="w-5 h-5 mr-2" />
                Stop Recording
              </Button>
            )}
            
            {isTranscribing && (
              <div className="flex items-center gap-2 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Transcribing...</span>
              </div>
            )}
          </div>

          {transcript && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Your Note:</label>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                className="w-full min-h-[150px] p-4 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your transcribed note will appear here..."
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Button
                  onClick={saveNote}
                  disabled={isSaving || !transcript.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Note
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => saveTranscriptToNewSession(false)}
                  disabled={creatingSession || !transcript.trim()}
                  className="bg-gray-700 hover:bg-gray-600 text-white"
                  aria-label="Save transcript to a session"
                >
                  {creatingSession ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <StickyNote className="w-4 h-4 mr-2" />}
                  Save to Session
                </Button>
                <Button
                  onClick={() => saveTranscriptToNewSession(true)}
                  disabled={creatingSession || !transcript.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  aria-label="Ask AI to summarize and create task suggestions"
                >
                  {creatingSession ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MessageSquare className="w-4 h-4 mr-2" />}
                  Save + AI Summary & Tasks
                </Button>
              </div>
            </div>
          )}

          <div className="text-xs text-gray-400 text-center">
            Click "Start Recording" to begin recording your voice note. Speak clearly and click "Stop Recording" when done.
          </div>
        </div>
      </Card>

      {/* Live Notes (Screen Snapshots) */}
      <LiveNotes />

      {/* Voice Note Sessions */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-white mb-2">Recent Voice Note Sessions</h3>
        <div className="space-y-2">
          {voiceSessionsData?.sessions?.length ? (
            voiceSessionsData.sessions.map((s: any) => {
              const isOpen = expanded.has(s.id);
              const det = details[s.id];
              return (
                <div key={s.id} className="bg-gray-900 border border-gray-700 rounded-md overflow-hidden">
                  <button
                    onClick={() => toggleVoiceSession(s.id)}
                    className="w-full flex items-center justify-between text-left px-3 py-2 hover:bg-gray-800"
                    aria-expanded={isOpen}
                    aria-controls={`voice-session-${s.id}`}
                  >
                    <div className="flex items-center gap-2 min-w-0 max-w-full">
                      {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                      <div className="min-w-0">
                        <div className="text-gray-200 truncate">{s.title || s.id}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(s.updatedAt).toLocaleString()} • {s.totalEntries || 0} entries
                        </div>
                      </div>
                    </div>
                    {s.lastSummary ? (
                      <div className="ml-4 hidden sm:flex items-center gap-1 text-xs text-gray-400 max-w-[50%] whitespace-normal break-words overflow-hidden">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span className="line-clamp-1">{s.lastSummary}</span>
                      </div>
                    ) : null}
                  </button>

                  {isOpen && (
                    <div id={`voice-session-${s.id}`} className="px-3 pb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Button
                          onClick={() => summarizeVoiceSession(s.id)}
                          variant="outline"
                          className="bg-gray-800/60 border-gray-700 text-gray-200 hover:bg-gray-800"
                          disabled={!!summarizing[s.id]}
                          aria-label="Summarize this voice note session"
                        >
                          {summarizing[s.id] ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ListChecks className="w-4 h-4 mr-2" />}
                          Generate Summary & Tasks
                        </Button>
                        <Button
                          onClick={() => loadVoiceSessionDetails(s.id)}
                          variant="outline"
                          className="bg-gray-800/60 border-gray-700 text-gray-200 hover:bg-gray-800"
                          disabled={!!det?.loading}
                          aria-label="Refresh session"
                        >
                          {det?.loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                          Refresh
                        </Button>
                      </div>

                      {det?.summary && (
                        <Card className="bg-gray-800/60 border-gray-700 p-3 mb-2">
                          <div className="text-xs text-gray-400 mb-1">AI Summary</div>
                          <div className="text-sm text-gray-200 whitespace-pre-wrap break-words">{det.summary}</div>
                        </Card>
                      )}
                      {det?.tasks?.length ? (
                        <Card className="bg-gray-800/60 border-gray-700 p-3 mb-2">
                          <div className="text-xs text-gray-400 mb-1">Suggested Tasks</div>
                          <ul className="list-disc pl-5 space-y-1">
                            {det.tasks.map((t, idx) => (
                              <li key={idx} className="text-sm text-gray-200">
                                {t.title}
                                {t.priority ? <span className="ml-2 text-xs text-gray-400">({t.priority})</span> : null}
                              </li>
                            ))}
                          </ul>
                        </Card>
                      ) : null}

                      {det?.loading ? (
                        <div className="text-sm text-gray-400 py-4 flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" /> Loading entries…
                        </div>
                      ) : det?.entries?.length ? (
                        <div className="space-y-2">
                          {det.entries.map((e) => (
                            <div key={e.id} className="bg-gray-900/60 border border-gray-700 rounded-md p-2">
                              <div className="text-xs text-gray-500 mb-1">{new Date(e.createdAt).toLocaleString()}</div>
                              <div className="text-sm text-gray-200 whitespace-normal break-words">{e.text}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500">No entries in this session yet.</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-xs text-gray-500">No voice note sessions yet.</div>
          )}
        </div>
      </div>

      {/* Saved Notes List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Saved Notes</h3>
        
        {isLoading ? (
          <div className="text-center py-8 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p>Loading notes...</p>
          </div>
        ) : notes.length === 0 ? (
          <Card className="bg-gray-800 border-gray-700 p-8">
            <div className="text-center text-gray-400">
              <StickyNote className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No notes yet. Record your first voice note above!</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {notes.map((note: Note) => (
              <Card key={note.id} className="bg-gray-800 border-gray-700 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-white whitespace-pre-wrap break-words">
                      {note.text}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {format(new Date(note.createdAt), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                  <Button
                    onClick={() => deleteNoteMutation.mutate(note.id)}
                    disabled={deleteNoteMutation.isPending}
                    variant="outline"
                    size="sm"
                    className="bg-red-900/20 border-red-700 text-red-400 hover:bg-red-900/40 flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}





