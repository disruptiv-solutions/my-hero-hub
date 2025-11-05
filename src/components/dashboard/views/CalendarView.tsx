"use client";

import { useQuery } from "@tanstack/react-query";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { CalendarEvent } from "@/types";
import { getAuthHeaders } from "@/lib/api-helpers";
import { Card } from "@/components/ui/card";
import { Clock, MapPin, Users } from "lucide-react";

const CalendarView = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["calendar-events-week"],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const timeMin = new Date().toISOString();
      const timeMax = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toISOString();
      const res = await fetch(
        `/api/calendar/events?timeMin=${timeMin}&timeMax=${timeMax}&maxResults=50`,
        { headers }
      );
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 403 && errorData.code === "GOOGLE_NOT_CONNECTED") {
          throw new Error("Google not connected. Please sign out and sign in again.");
        }
        throw new Error(errorData.error || "Failed to fetch events");
      }
      return res.json();
    },
    refetchInterval: 5 * 60 * 1000,
    retry: false,
  });

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getEventsForDay = (day: Date) => {
    return (
      data?.events?.filter((event: CalendarEvent) => {
        const eventDate = new Date(
          event.start.dateTime || event.start.date || ""
        );
        return isSameDay(eventDate, day);
      }) || []
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading calendar...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-yellow-400 text-lg font-semibold">
          {error.message || "Failed to load calendar"}
        </div>
        <div className="text-gray-400 text-sm text-center max-w-md">
          Please sign out and sign in again to connect your Google Calendar.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">Calendar</h2>
        <div className="text-sm text-gray-400">
          Week of {format(weekStart, "MMM d, yyyy")}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-3">
        {weekDays.map((day) => {
          const events = getEventsForDay(day);
          const isToday = isSameDay(day, new Date());

          return (
            <Card
              key={day.toISOString()}
              className={`bg-gray-800 border-gray-700 p-3 min-h-[200px] ${
                isToday ? "ring-2 ring-blue-500" : ""
              }`}
            >
              <div className="text-center mb-3">
                <div className="text-xs text-gray-400 uppercase">
                  {format(day, "EEE")}
                </div>
                <div
                  className={`text-xl font-bold ${
                    isToday ? "text-blue-400" : "text-white"
                  }`}
                >
                  {format(day, "d")}
                </div>
              </div>
              <div className="space-y-2">
                {events.map((event: CalendarEvent) => (
                  <Card
                    key={event.id}
                    className="bg-gray-900 border-gray-600 p-2 hover:bg-gray-750 cursor-pointer transition-colors"
                  >
                    <div className="text-xs font-medium text-white mb-1 line-clamp-2">
                      {event.summary}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      {event.start.dateTime &&
                        format(new Date(event.start.dateTime), "h:mm a")}
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Today's Events Detail */}
      <Card className="bg-gray-800 border-gray-700 p-4 mt-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Today&apos;s Events
        </h3>
        <div className="space-y-3">
          {getEventsForDay(new Date()).length > 0 ? (
            getEventsForDay(new Date()).map((event: CalendarEvent) => (
              <Card
                key={event.id}
                className="bg-gray-900 border-gray-700 p-4 hover:bg-gray-750 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-base font-semibold text-white">
                    {event.summary}
                  </h4>
                  {event.start.dateTime && (
                    <span className="text-sm text-blue-400 font-medium">
                      {format(new Date(event.start.dateTime), "h:mm a")}
                    </span>
                  )}
                </div>
                {event.description && (
                  <p className="text-sm text-gray-400 mb-2">
                    {event.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                  {event.start.dateTime && event.end.dateTime && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(event.start.dateTime), "h:mm a")} -{" "}
                      {format(new Date(event.end.dateTime), "h:mm a")}
                    </div>
                  )}
                  {event.attendees && event.attendees.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {event.attendees.length} attendees
                    </div>
                  )}
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">
              No events scheduled for today
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default CalendarView;


