import { NextRequest, NextResponse } from "next/server";
import { getFirebaseUser } from "@/lib/auth-helpers";
import { getGoogleTokens } from "@/lib/google-tokens-server";
import { getGoogleCalendarClient } from "@/lib/google-apis";
import { CalendarEvent } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const user = await getFirebaseUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get Google OAuth tokens from Firestore
    const tokens = await getGoogleTokens(user.uid);
    
    if (!tokens?.accessToken) {
      console.log(`No Google tokens found for user ${user.uid}. User needs to sign in with Google.`);
      return NextResponse.json(
        { 
          error: "Google Calendar not connected. Please sign in again with Google.",
          code: "GOOGLE_NOT_CONNECTED"
        },
        { status: 403 }
      );
    }

    // Check if token is expired (optional - could implement refresh logic)
    if (tokens.expiresAt && Date.now() >= tokens.expiresAt) {
      console.log(`Google token expired for user ${user.uid}. Expired at: ${new Date(tokens.expiresAt).toISOString()}`);
      return NextResponse.json(
        { 
          error: "Google token expired. Please sign in again.",
          code: "GOOGLE_TOKEN_EXPIRED"
        },
        { status: 403 }
      );
    }

    // Get Google Calendar client
    const calendar = getGoogleCalendarClient(tokens.accessToken);

    // Get calendar list
    const calendarsResponse = await calendar.calendarList.list();
    const calendars = calendarsResponse.data.items || [];

    // Get events from all calendars
    const timeMin = new Date().toISOString();
    const timeMax = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // Next 7 days

    const allEvents: CalendarEvent[] = [];
    const calendarMap: Record<string, any> = {};

    for (const cal of calendars) {
      if (!cal.id) continue;
      
      calendarMap[cal.id] = {
        id: cal.id,
        summary: cal.summary || cal.id,
        colorId: cal.colorId || "1",
        primary: cal.primary || false,
      };

      try {
        const eventsResponse = await calendar.events.list({
          calendarId: cal.id,
          timeMin,
          timeMax,
          maxResults: 50,
          singleEvents: true,
          orderBy: "startTime",
        });

        const events = eventsResponse.data.items || [];
        
        for (const event of events) {
          if (!event.id || !event.start) continue;

          const calendarEvent: CalendarEvent = {
            id: event.id,
            summary: event.summary || "No title",
            description: event.description || undefined,
            start: {
              dateTime: event.start.dateTime || undefined,
              date: event.start.date || undefined,
              timeZone: event.start.timeZone || undefined,
            },
            end: {
              dateTime: event.end?.dateTime || undefined,
              date: event.end?.date || undefined,
              timeZone: event.end?.timeZone || undefined,
            },
            attendees: event.attendees?.map((a) => ({
              email: a.email || "",
              displayName: a.displayName || undefined,
              responseStatus: a.responseStatus || undefined,
            })),
            hangoutLink: event.hangoutLink || undefined,
            meetLink: event.conferenceData?.entryPoints?.[0]?.uri || undefined,
            calendarId: cal.id,
            colorId: cal.colorId || "1",
          };

          allEvents.push(calendarEvent);
        }
      } catch (calendarError) {
        console.error(`Error fetching events from calendar ${cal.id}:`, calendarError);
        // Continue with other calendars
      }
    }

    // Sort events by start time
    allEvents.sort((a, b) => {
      const aTime = a.start.dateTime || a.start.date || "";
      const bTime = b.start.dateTime || b.start.date || "";
      return aTime.localeCompare(bTime);
    });

    return NextResponse.json({
      events: allEvents,
      calendars: Object.values(calendarMap),
    });
  } catch (error: any) {
    console.error("Error fetching calendar events:", error);
    
    // Check if it's an API not enabled error
    if (error.message?.includes("has not been used") || error.message?.includes("disabled")) {
      return NextResponse.json(
        { 
          error: "Google Calendar API is not enabled. Please enable it in Google Cloud Console.",
          code: "API_NOT_ENABLED",
          details: error.message
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to fetch calendar events", details: error.message },
      { status: 500 }
    );
  }
}

