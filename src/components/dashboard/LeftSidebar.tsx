"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Clock, Calendar, Mail, Search, Video } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { CalendarEvent } from "@/types";
import { getAuthHeaders } from "@/lib/api-helpers";

const LeftSidebar = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [query, setQuery] = useState("");

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch upcoming events
  const { data: calendarData, error: calendarError } = useQuery({
    queryKey: ["calendar-events"],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const timeMin = new Date().toISOString();
      const timeMax = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const res = await fetch(
        `/api/calendar/events?timeMin=${timeMin}&timeMax=${timeMax}&maxResults=3`,
        { headers }
      );
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 403 && errorData.code === "GOOGLE_NOT_CONNECTED") {
          throw new Error("Google not connected. Please sign in again.");
        }
        throw new Error(errorData.error || "Failed to fetch events");
      }
      return res.json();
    },
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry on 403 errors
  });

  // Fetch unread email count
  const { data: emailData, error: emailError } = useQuery({
    queryKey: ["gmail-unread"],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/gmail/unread", { headers });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 403 && errorData.code === "GOOGLE_NOT_CONNECTED") {
          throw new Error("Google not connected. Please sign in again.");
        }
        throw new Error(errorData.error || "Failed to fetch unread count");
      }
      return res.json();
    },
    refetchInterval: 2 * 60 * 1000, // 2 minutes
    retry: false, // Don't retry on 403 errors
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/ai/query", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      console.log("AI Response:", data);
      // Handle response - could show in a modal or toast
    } catch (error) {
      console.error("Query error:", error);
    }
  };

  const getTimeUntilEvent = (event: CalendarEvent) => {
    const startTime = new Date(event.start.dateTime || event.start.date || "");
    const diff = startTime.getTime() - currentTime.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `in ${days}d ${hours % 24}h`;
    if (hours > 0) return `in ${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `in ${minutes}m`;
    return "now";
  };

  const getMeetingLink = (event: CalendarEvent) => {
    return (
      event.hangoutLink ||
      event.conferenceData?.entryPoints?.find((ep) => ep.entryPointType === "video")
        ?.uri
    );
  };

  return (
    <div className="h-full bg-gray-900 border-r border-gray-800 p-4 space-y-6 overflow-y-auto">
      {/* Current Time & Date */}
      <Card className="bg-gray-800 border-gray-700 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-5 h-5 text-blue-400" />
          <span className="text-sm text-gray-400">Right Now</span>
        </div>
        <div className="text-3xl font-bold text-white">
          {format(currentTime, "h:mm a")}
        </div>
        <div className="text-sm text-gray-400">
          {format(currentTime, "EEEE, MMMM d, yyyy")}
        </div>
      </Card>

      {/* Upcoming Meetings */}
      <Card className="bg-gray-800 border-gray-700 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-5 h-5 text-green-400" />
          <span className="text-sm font-semibold text-white">Upcoming Meetings</span>
        </div>
        <div className="space-y-3">
          {calendarData?.events?.slice(0, 3).map((event: CalendarEvent) => {
            const meetingLink = getMeetingLink(event);
            return (
              <div
                key={event.id}
                className="border-l-2 border-green-400 pl-3 py-1 space-y-1"
              >
                <div className="text-sm font-medium text-white">
                  {event.summary}
                </div>
                <div className="text-xs text-gray-400">
                  {format(
                    new Date(event.start.dateTime || event.start.date || ""),
                    "h:mm a"
                  )}
                </div>
                <div className="text-xs font-semibold text-green-400">
                  {getTimeUntilEvent(event)}
                </div>
                {meetingLink && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 h-7 text-xs"
                    onClick={() => window.open(meetingLink, "_blank")}
                  >
                    <Video className="w-3 h-3 mr-1" />
                    Join
                  </Button>
                )}
              </div>
            );
          })}
          {calendarError && (
            <div className="text-sm text-yellow-400 text-center py-4">
              {calendarError.message || "Failed to load calendar"}
            </div>
          )}
          {(!calendarData?.events || calendarData.events.length === 0) && !calendarError && (
            <div className="text-sm text-gray-500 text-center py-4">
              No upcoming meetings
            </div>
          )}
        </div>
      </Card>

      {/* Email Status */}
      <Card className="bg-gray-800 border-gray-700 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-yellow-400" />
            <span className="text-sm font-semibold text-white">Email</span>
          </div>
          {emailData?.unreadCount > 0 && !emailError && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {emailData.unreadCount}
            </span>
          )}
        </div>
        {emailError ? (
          <div className="text-sm text-yellow-400">
            {emailError.message || "Failed to load email"}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-sm text-gray-400">
              {emailData?.email || "Loading..."}
            </div>
            <div className="text-lg font-semibold text-white">
              {emailData?.messagesUnread || 0} unread
            </div>
          </div>
        )}
      </Card>

      {/* AI Query Input */}
      <Card className="bg-gray-800 border-gray-700 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Search className="w-5 h-5 text-purple-400" />
          <span className="text-sm font-semibold text-white">Ask Anything</span>
        </div>
        <form onSubmit={handleSearch} className="space-y-2">
          <Input
            placeholder="Search emails, events, clients..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
          />
          <Button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700"
            size="sm"
          >
            Search
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default LeftSidebar;


