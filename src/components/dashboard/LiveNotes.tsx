"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, MonitorUp, Pause, Play, Trash2, Download, Clock, MessageSquare, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAuthHeaders } from "@/lib/api-helpers";

type ScreenshotItem = {
  id: string;
  dataUrl: string;
  capturedAt: string; // ISO string
  interpretation?: string;
};

const CAPTURE_INTERVAL_MS = 20_000;

const LiveNotes = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [screenshots, setScreenshots] = useState<ScreenshotItem[]>([]);
  const [nextCaptureInMs, setNextCaptureInMs] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSavingShot, setIsSavingShot] = useState(false);

  const queryClient = useQueryClient();
  const sessionIdRef = useRef<string | null>(null);

  const { data: sessionsData } = useQuery({
    queryKey: ["live-note-sessions"],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/live-notes/sessions", { headers });
      if (!res.ok) throw new Error("Failed to load sessions");
      return res.json();
    },
  });

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [details, setDetails] = useState<Record<string, { shots: Array<{ id: string; imageDataUrl: string; interpretation?: string; createdAt: string }>; loading: boolean; summarizing: boolean; summary?: string }>>({});

  const loadSessionDetails = useCallback(async (id: string) => {
    setDetails((prev) => ({ ...prev, [id]: { ...(prev[id] || { shots: [], summarizing: false }), loading: true } }));
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/live-notes/sessions/${id}`, { headers });
      if (res.ok) {
        const payload = await res.json();
        setDetails((prev) => ({
          ...prev,
          [id]: {
            shots: payload?.shots || [],
            loading: false,
            summarizing: false,
            summary: payload?.session?.summary || payload?.session?.lastSummary || prev[id]?.summary,
          },
        }));
      } else {
        setDetails((prev) => ({ ...prev, [id]: { ...(prev[id] || { shots: [] }), loading: false, summarizing: false } }));
      }
    } catch {
      setDetails((prev) => ({ ...prev, [id]: { ...(prev[id] || { shots: [] }), loading: false, summarizing: false } }));
    }
  }, []);

  const toggleSession = useCallback(
    (id: string) => {
      setExpanded((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
          if (!details[id]) {
            // lazy load
            void loadSessionDetails(id);
          }
        }
        return next;
      });
    },
    [details, loadSessionDetails]
  );

  const summarizeSession = useCallback(async (id: string) => {
    setDetails((prev) => ({ ...prev, [id]: { ...(prev[id] || { shots: [] }), summarizing: true, loading: false } }));
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/live-notes/sessions/${id}/summarize`, {
        method: "POST",
        headers,
      });
      if (res.ok) {
        const payload = await res.json();
        setDetails((prev) => ({ ...prev, [id]: { ...(prev[id] || { shots: [] }), summarizing: false, summary: payload?.summary || "Summary generated." } }));
        queryClient.invalidateQueries({ queryKey: ["live-note-sessions"] });
      } else {
        setDetails((prev) => ({ ...prev, [id]: { ...(prev[id] || { shots: [] }), summarizing: false } }));
      }
    } catch {
      setDetails((prev) => ({ ...prev, [id]: { ...(prev[id] || { shots: [] }), summarizing: false } }));
    }
  }, [queryClient]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);

  const stopAllTracks = () => {
    const tracks = mediaStreamRef.current?.getTracks() || [];
    tracks.forEach((t) => t.stop());
    mediaStreamRef.current = null;
  };

  const clearTimers = () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (countdownRef.current) {
      window.clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setNextCaptureInMs(null);
  };

type HTMLVideoElementWithOptionalSrcObject = HTMLVideoElement & {
  srcObject?: MediaStream | null;
};

const handleStop = useCallback(() => {
    clearTimers();
    stopAllTracks();
    const videoElement = videoRef.current;
  if (!videoElement) {
    setIsCapturing(false);
    return;
  }

  const videoWithSrcObject = videoElement as HTMLVideoElementWithOptionalSrcObject;
  if ("srcObject" in videoWithSrcObject && videoWithSrcObject.srcObject) {
    videoWithSrcObject.srcObject = null;
  }
  videoWithSrcObject.src = "";
    setIsCapturing(false);
  }, []);

  const sendShotToServer = useCallback(
    async (dataUrl: string, clientLocalId: string) => {
      const sid = sessionIdRef.current;
      if (!sid) return;
      setIsSavingShot(true);
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/live-notes/sessions/${sid}/screenshot`, {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ imageDataUrl: dataUrl, clientLocalId }),
        });
        if (res.ok) {
          const payload = await res.json();
          const interpretation: string | undefined = payload?.interpretation;
          const returnedLocalId: string | null = payload?.clientLocalId ?? null;
          // Update matching shot by local id
          setScreenshots((prev) => {
            return prev.map((s) =>
              s.id === returnedLocalId ? { ...s, interpretation: interpretation || s.interpretation } : s
            );
          });
          // Refresh sessions list
          queryClient.invalidateQueries({ queryKey: ["live-note-sessions"] });
        }
      } catch (e) {
        // Ignore interpretation failure
      } finally {
        setIsSavingShot(false);
      }
    },
    [queryClient]
  );

  const captureOnce = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const sourceWidth = video.videoWidth || 1280;
    const sourceHeight = video.videoHeight || 720;
    const targetWidth = Math.min(1024, sourceWidth);
    const scale = targetWidth / sourceWidth;
    const targetHeight = Math.round(sourceHeight * scale);
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
    const localId = `${Date.now()}`;
    const item: ScreenshotItem = {
      id: localId,
      dataUrl,
      capturedAt: new Date().toISOString(),
    };
    setScreenshots((prev) => [item, ...prev]);
    // Kick off save + interpretation
    void sendShotToServer(dataUrl, localId);
  }, [sendShotToServer]);

  const handleStart = useCallback(async () => {
    try {
      // Create a session first
      const headers = await getAuthHeaders();
      const createRes = await fetch("/api/live-notes/sessions", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ title: `Live Notes - ${new Date().toLocaleString()}` }),
      });
      if (!createRes.ok) {
        throw new Error("Failed to create session");
      }
      const created = await createRes.json();
      const newId = created.session?.id || created.id;
      setSessionId(newId);
      sessionIdRef.current = newId;

      // Must be triggered by user gesture
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "monitor",
          logicalSurface: true,
          frameRate: 30,
        } as MediaTrackConstraints,
        audio: false,
        preferCurrentTab: false,
      } as DisplayMediaStreamConstraints);

      mediaStreamRef.current = stream;
      const videoElement = videoRef.current;
      if (!videoElement) {
        return;
      }
      if ("srcObject" in videoElement) {
        (videoElement as HTMLVideoElement & { srcObject: MediaStream | null }).srcObject = stream;
      } else {
        videoElement.src = URL.createObjectURL(stream as unknown as MediaSource);
      }
      await videoElement.play().catch(() => {});

      // First capture immediately for fast feedback
      captureOnce();

      setIsCapturing(true);
      setNextCaptureInMs(CAPTURE_INTERVAL_MS);

      intervalRef.current = window.setInterval(() => {
        captureOnce();
        setNextCaptureInMs(CAPTURE_INTERVAL_MS);
      }, CAPTURE_INTERVAL_MS);

      countdownRef.current = window.setInterval(() => {
        setNextCaptureInMs((prev) => {
          if (prev === null) return null;
          const next = prev - 1000;
          return next <= 0 ? 0 : next;
        });
      }, 1000);

      // If the user stops sharing from browser UI, end cleanly
      const [videoTrack] = stream.getVideoTracks();
      videoTrack.addEventListener("ended", () => {
        handleStop();
      });
    } catch (err) {
      // User likely canceled the picker; do nothing
      setIsCapturing(false);
    }
  }, [captureOnce, handleStop]);

  const handleClearScreenshots = () => {
    setScreenshots([]);
  };

  const formatCountdown = (ms: number | null) => {
    if (ms === null) return "";
    const secs = Math.ceil(ms / 1000);
    return `${secs}s`;
  };

  useEffect(() => {
    return () => {
      handleStop();
    };
  }, [handleStop]);

  return (
    <Card className="bg-gray-800 border-gray-700 p-4 overflow-x-hidden">
      <h3 className="text-white font-semibold mb-3">Live Notes (Screen Snapshots)</h3>
      <p className="text-sm text-gray-400 mb-4">
        Share your screen to automatically capture a screenshot every 20 seconds. Thumbnails appear below.
      </p>

      <div className="flex items-center gap-2 mb-4">
        {isCapturing ? (
          <Button
            onClick={handleStop}
            className="bg-red-900/40 text-red-300 border-red-700 hover:bg-red-900/60"
            variant="outline"
            aria-label="Stop capturing"
          >
            <Pause className="w-4 h-4 mr-2" />
            Stop
          </Button>
        ) : (
          <Button
            onClick={handleStart}
            className="bg-blue-900/40 text-blue-300 border-blue-700 hover:bg-blue-900/60"
            variant="outline"
            aria-label="Start screen share for live notes"
          >
            <Play className="w-4 h-4 mr-2" />
            Start
          </Button>
        )}

        <Button
          onClick={() => captureOnce()}
          disabled={!isCapturing}
          className="bg-gray-700/40 text-gray-200 border-gray-600 hover:bg-gray-700"
          variant="outline"
          aria-label="Capture screenshot now"
        >
          <Camera className="w-4 h-4 mr-2" />
          Snapshot
        </Button>

        <Button
          onClick={handleClearScreenshots}
          disabled={screenshots.length === 0}
          className="bg-gray-700/40 text-gray-200 border-gray-600 hover:bg-gray-700"
          variant="outline"
          aria-label="Clear screenshots"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear
        </Button>

        <div className="ml-auto flex items-center text-xs text-gray-400">
          <MonitorUp className="w-4 h-4 mr-1" />
          {isCapturing ? "Sharing" : "Idle"}
          <span className="mx-2">•</span>
          <Clock className="w-4 h-4 mr-1" />
          Next in {formatCountdown(nextCaptureInMs)}
        </div>
      </div>

      {sessionId && (
        <div className="text-xs text-gray-400 mb-3">
          Session: <span className="text-gray-300">{sessionId}</span>
          {isSavingShot && <span className="ml-2 text-gray-500">Saving…</span>}
        </div>
      )}

      {/* Hidden media elements for capture */}
      <video ref={videoRef} className="hidden" playsInline muted />
      <canvas ref={canvasRef} className="hidden" />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {screenshots.map((shot) => (
          <div
            key={shot.id}
            className="group rounded-lg overflow-hidden border border-gray-700 bg-gray-900"
            tabIndex={0}
            aria-label={`Screenshot captured at ${new Date(shot.capturedAt).toLocaleString()}`}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                window.open(shot.dataUrl, "_blank");
              }
            }}
          >
            <img src={shot.dataUrl} alt="Screen snapshot" className="w-full h-32 object-cover" />
            <div className="px-2 py-2 space-y-1">
              <div className="text-[10px] text-gray-500">
                {new Date(shot.capturedAt).toLocaleString()}
              </div>
              <div className="text-xs text-gray-200 whitespace-normal break-words">
                {shot.interpretation || "Interpreting…"}
              </div>
            </div>
            <a
              href={shot.dataUrl}
              download={`live-note-${shot.id}.png`}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Download screenshot"
              tabIndex={0}
            >
              <Button size="icon" variant="outline" className="h-7 w-7 bg-gray-900/70 border-gray-600 text-gray-200">
                <Download className="w-3.5 h-3.5" />
              </Button>
            </a>
          </div>
        ))}
        {screenshots.length === 0 && (
          <div className="col-span-full text-center text-gray-400 py-6 text-sm">
            No screenshots yet. Click Start and share your entire screen.
          </div>
        )}
      </div>

      {/* Recent Captures List (side-by-side image + AI note) */}
      {screenshots.length > 0 && (
        <div className="mt-6">
          <h4 className="text-white font-semibold mb-2">Recent Captures</h4>
          <div className="space-y-2">
            {screenshots.slice(0, 10).map((shot) => (
              <div key={`row-${shot.id}`} className="flex items-start gap-3 bg-gray-900 border border-gray-700 rounded-md p-2">
                <img
                  src={shot.dataUrl}
                  alt="Capture thumbnail"
                  className="w-20 h-14 object-cover rounded-sm flex-shrink-0"
                />
                <div className="min-w-0">
                  <div className="text-xs text-gray-500 mb-1">
                    {new Date(shot.capturedAt).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-200 whitespace-normal break-words">
                    {shot.interpretation || "Interpreting…"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sessions List */}
      <div className="mt-6">
        <h4 className="text-white font-semibold mb-2">Recent Live Note Sessions</h4>
        <div className="space-y-2">
          {sessionsData?.sessions?.length ? (
            sessionsData.sessions.map((s: any) => {
              const isOpen = expanded.has(s.id);
              const det = details[s.id];
              return (
                <div key={s.id} className="bg-gray-900 border border-gray-700 rounded-md overflow-hidden">
                  <button
                    onClick={() => toggleSession(s.id)}
                    className="w-full flex items-center justify-between text-left px-3 py-2 hover:bg-gray-800"
                    aria-expanded={isOpen}
                    aria-controls={`session-${s.id}`}
                  >
                    <div className="flex items-center gap-2 min-w-0 max-w-full">
                      {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                      <div className="min-w-0">
                        <div className="text-gray-200 truncate">{s.title || s.id}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(s.updatedAt).toLocaleString()} • {s.totalShots || 0} shots
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
                    <div id={`session-${s.id}`} className="px-3 pb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Button
                          onClick={() => summarizeSession(s.id)}
                          variant="outline"
                          className="bg-gray-800/60 border-gray-700 text-gray-200 hover:bg-gray-800"
                          disabled={!!det?.summarizing}
                          aria-label="Summarize this session"
                        >
                          {det?.summarizing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MessageSquare className="w-4 h-4 mr-2" />}
                          Summarize Session
                        </Button>
                        <Button
                          onClick={() => loadSessionDetails(s.id)}
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
                          <div className="text-xs text-gray-400 mb-1">Session Summary</div>
                          <div className="text-sm text-gray-200 whitespace-pre-wrap break-words">{det.summary}</div>
                        </Card>
                      )}

                      {det?.loading ? (
                        <div className="text-sm text-gray-400 py-4 flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" /> Loading shots…
                        </div>
                      ) : det?.shots?.length ? (
                        <div className="space-y-2">
                          {det.shots.map((shot) => (
                            <div key={shot.id} className="flex items-start gap-3 bg-gray-900/60 border border-gray-700 rounded-md p-2">
                              <img src={shot.imageDataUrl} alt="Shot" className="w-20 h-14 object-cover rounded-sm flex-shrink-0" />
                              <div className="min-w-0">
                                <div className="text-xs text-gray-500 mb-1">{new Date(shot.createdAt).toLocaleString()}</div>
                                <div className="text-sm text-gray-200 whitespace-normal break-words">{shot.interpretation || "No note yet."}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500">No shots in this session yet.</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-xs text-gray-500">No sessions yet.</div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default LiveNotes;


