"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, MicOff, Save, Trash2, Loader2, StickyNote } from "lucide-react";
import { toast } from "@/lib/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAuthHeaders } from "@/lib/api-helpers";
import { format } from "date-fns";

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
              <Button
                onClick={saveNote}
                disabled={isSaving || !transcript.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
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
            </div>
          )}

          <div className="text-xs text-gray-400 text-center">
            Click "Start Recording" to begin recording your voice note. Speak clearly and click "Stop Recording" when done.
          </div>
        </div>
      </Card>

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




