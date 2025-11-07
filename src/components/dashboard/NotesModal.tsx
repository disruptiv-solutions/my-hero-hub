"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Save, X, Loader2 } from "lucide-react";
import { toast } from "@/lib/hooks/use-toast";
import { useAuth } from "@/components/providers/AuthProvider";

interface NotesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotesModal({ isOpen, onClose }: NotesModalProps) {
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Check for microphone permission and start recording
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
        setAudioBlob(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Transcribe the audio
        await transcribeAudio(audioBlob);
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
      
      // Convert webm to a format OpenAI accepts (mp3 or wav)
      // For now, we'll send webm and let the server handle conversion if needed
      formData.append('file', audioBlob, 'recording.webm');
      formData.append('model', 'whisper-1');

      const headers = await getAuthHeaders();
      const response = await fetch('/api/notes/transcribe', {
        method: 'POST',
        headers: {
          ...headers,
        },
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
      
      // Reset state
      setTranscript("");
      setAudioBlob(null);
      onClose();
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

  const getAuthHeaders = async () => {
    // Import dynamically to avoid SSR issues
    const { getAuthHeaders } = await import("@/lib/api-helpers");
    return await getAuthHeaders();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">Voice Notes</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Recording Controls */}
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

          {/* Transcript Display */}
          {transcript && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Your Note:</label>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                className="w-full min-h-[200px] p-4 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your transcribed note will appear here..."
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2">
            <Button
              onClick={onClose}
              variant="outline"
              className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            {transcript && (
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
            )}
          </div>

          {/* Instructions */}
          <div className="text-xs text-gray-400 text-center">
            Click "Start Recording" to begin recording your voice note. Speak clearly and click "Stop Recording" when done.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}




