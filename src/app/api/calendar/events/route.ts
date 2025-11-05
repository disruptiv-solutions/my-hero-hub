import { NextRequest, NextResponse } from "next/server";
import { getFirebaseUser } from "@/lib/auth-helpers";
import { getAllEmailAccounts } from "@/lib/google-tokens-server";
import { getGoogleCalendarClient } from "@/lib/google-apis";
import { CalendarEvent } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const user = await getFirebaseUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all email accounts for the user (including additional accounts added via profile)
    const accounts = await getAllEmailAccounts(user.uid);
    
    if (accounts.length === 0) {
      console.log(`No Google tokens found for user ${user.uid}. User needs to sign in with Google.`);
      return NextResponse.json(
        { 
          error: "Google Calendar not connected. Please sign in again with Google.",
          code: "GOOGLE_NOT_CONNECTED"
        },
        { status: 403 }
      );
    }

    // Get query parameters for date range
    const { searchParams } = new URL(request.url);
    const timeMinParam = searchParams.get('timeMin');
    const timeMaxParam = searchParams.get('timeMax');
    const maxResultsParam = parseInt(searchParams.get('maxResults') || '250');

    // Use provided date range or default to next 7 days
    const timeMin = timeMinParam 
      ? new Date(timeMinParam).toISOString()
      : new Date().toISOString();
    const timeMax = timeMaxParam
      ? new Date(timeMaxParam).toISOString()
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const allEvents: CalendarEvent[] = [];
    const calendarMap: Record<string, any> = {};

    // Fetch events from all connected accounts
    for (const account of accounts) {
      // Check if token is expired
      if (account.expiresAt && Date.now() >= account.expiresAt) {
        console.log(`Token expired for account ${account.email}`);
        continue; // Skip expired accounts
      }

      try {
        // Get Google Calendar client for this account
        const calendar = getGoogleCalendarClient(account.accessToken);

        // Get calendar list for this account
        const calendarsResponse = await calendar.calendarList.list();
        const calendars = calendarsResponse.data.items || [];

        // Process each calendar for this account
        for (const cal of calendars) {
          if (!cal.id) continue;
          
          // Create unique calendar key with account email to avoid conflicts
          const calendarKey = `${account.email || account.id || 'unknown'}_${cal.id}`;
          
          calendarMap[calendarKey] = {
            id: cal.id,
            summary: cal.summary || cal.id,
            colorId: cal.colorId || "1",
            primary: cal.primary || false,
            accountEmail: account.email || account.id || 'unknown',
          };

          try {
            const eventsResponse = await calendar.events.list({
              calendarId: cal.id,
              timeMin,
              timeMax,
              maxResults: Math.floor(maxResultsParam / accounts.length), // Distribute max results across accounts
              singleEvents: true,
              orderBy: "startTime",
            });

            const events = eventsResponse.data.items || [];
            
            for (const event of events) {
              if (!event.id || !event.start) continue;

              const calendarEvent: CalendarEvent = {
                id: `${account.email || account.id || 'unknown'}_${event.id}`, // Make event ID unique per account
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
                accountEmail: account.email || account.id || 'unknown', // Add account identifier
              };

              allEvents.push(calendarEvent);
            }
          } catch (calendarError) {
            console.error(`Error fetching events from calendar ${cal.id} for account ${account.email}:`, calendarError);
            // Continue with other calendars
          }
        }
      } catch (accountError) {
        console.error(`Error fetching calendars for account ${account.email}:`, accountError);
        // Continue with other accounts
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

