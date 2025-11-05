"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  format,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  addWeeks,
  addMonths,
  subWeeks,
  subMonths,
  isSameDay,
  isSameMonth,
  eachDayOfInterval,
} from "date-fns";
import { CalendarEvent } from "@/types";
import { getAuthHeaders } from "@/lib/api-helpers";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Users, ChevronLeft, ChevronRight } from "lucide-react";

type ViewType = "week" | "month" | "year";

const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>("month");

  // Calculate date range based on view type
  const getDateRange = () => {
    if (viewType === "week") {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
      const weekEnd = addDays(weekStart, 6);
      return { timeMin: weekStart, timeMax: weekEnd };
    } else if (viewType === "month") {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      return { timeMin: monthStart, timeMax: monthEnd };
    } else {
      // Year view - show entire year
      const yearStart = new Date(currentDate.getFullYear(), 0, 1);
      const yearEnd = new Date(currentDate.getFullYear(), 11, 31);
      return { timeMin: yearStart, timeMax: yearEnd };
    }
  };

  const { timeMin, timeMax } = getDateRange();

  const { data, isLoading, error } = useQuery({
    queryKey: ["calendar-events", viewType, format(currentDate, "yyyy-MM")],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch(
        `/api/calendar/events?timeMin=${timeMin.toISOString()}&timeMax=${timeMax.toISOString()}&maxResults=250`,
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

  const handlePrevious = () => {
    if (viewType === "week") {
      setCurrentDate(subWeeks(currentDate, 1));
    } else if (viewType === "month") {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 12));
    }
  };

  const handleNext = () => {
    if (viewType === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else if (viewType === "month") {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 12));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getCalendarDays = () => {
    if (viewType === "week") {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
      return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    } else if (viewType === "month") {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
      const calendarEnd = startOfWeek(monthEnd, { weekStartsOn: 0 });
      const days = eachDayOfInterval({ start: calendarStart, end: addDays(calendarEnd, 6) });
      return days;
    } else {
      // Year view - show months in a grid
      return [];
    }
  };

  const calendarDays = getCalendarDays();

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

  const getHeaderText = () => {
    if (viewType === "week") {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
      return `Week of ${format(weekStart, "MMM d, yyyy")}`;
    } else if (viewType === "month") {
      return format(currentDate, "MMMM yyyy");
    } else {
      return format(currentDate, "yyyy");
    }
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
      {/* Header with Navigation */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">Calendar</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1">
            <Button
              variant={viewType === "week" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewType("week")}
              className="text-xs"
            >
              Week
            </Button>
            <Button
              variant={viewType === "month" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewType("month")}
              className="text-xs"
            >
              Month
            </Button>
            <Button
              variant={viewType === "year" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewType("year")}
              className="text-xs"
            >
              Year
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="text-lg font-semibold text-white">
          {getHeaderText()}
        </div>
      </div>

      {/* Calendar Grid */}
      {viewType === "year" ? (
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 12 }, (_, i) => {
            const monthDate = new Date(currentDate.getFullYear(), i, 1);
            const monthEvents = data?.events?.filter((event: CalendarEvent) => {
              const eventDate = new Date(
                event.start.dateTime || event.start.date || ""
              );
              return isSameMonth(eventDate, monthDate);
            }) || [];
            
            return (
              <Card
                key={i}
                className="bg-gray-800 border-gray-700 p-4 cursor-pointer hover:bg-gray-750 transition-colors"
                onClick={() => {
                  setCurrentDate(monthDate);
                  setViewType("month");
                }}
              >
                <div className="text-center">
                  <div className="text-sm font-semibold text-white mb-2">
                    {format(monthDate, "MMMM")}
                  </div>
                  <div className="text-xs text-gray-400">
                    {monthEvents.length} event{monthEvents.length !== 1 ? "s" : ""}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <>
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-3 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-sm font-semibold text-gray-400">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-3">
            {calendarDays.map((day) => {
              const events = getEventsForDay(day);
              const isToday = isSameDay(day, new Date());
              const isCurrentMonth = isSameMonth(day, currentDate);

              return (
                <Card
                  key={day.toISOString()}
                  className={`bg-gray-800 border-gray-700 p-3 ${
                    viewType === "month" ? "min-h-[120px]" : "min-h-[200px]"
                  } ${
                    isToday ? "ring-2 ring-blue-500" : ""
                  } ${
                    !isCurrentMonth && viewType === "month"
                      ? "opacity-40"
                      : ""
                  }`}
                >
                  <div className="text-center mb-2">
                    {viewType === "week" && (
                      <div className="text-xs text-gray-400 uppercase mb-1">
                        {format(day, "EEE")}
                      </div>
                    )}
                    <div
                      className={`text-lg font-bold ${
                        isToday ? "text-blue-400" : isCurrentMonth ? "text-white" : "text-gray-500"
                      }`}
                    >
                      {format(day, "d")}
                    </div>
                  </div>
                  <div className="space-y-1">
                    {events.slice(0, viewType === "month" ? 3 : 10).map((event: CalendarEvent) => (
                      <Card
                        key={event.id}
                        className="bg-gray-900 border-gray-600 p-1.5 hover:bg-gray-750 cursor-pointer transition-colors"
                      >
                        <div className="text-xs font-medium text-white mb-0.5 line-clamp-1">
                          {event.summary}
                        </div>
                        {event.start.dateTime && (
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock className="w-3 h-3" />
                            {format(new Date(event.start.dateTime), "h:mm a")}
                          </div>
                        )}
                      </Card>
                    ))}
                    {events.length > (viewType === "month" ? 3 : 10) && (
                      <div className="text-xs text-gray-500 text-center pt-1">
                        +{events.length - (viewType === "month" ? 3 : 10)} more
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

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


