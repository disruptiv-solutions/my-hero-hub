import { NextRequest, NextResponse } from "next/server";
import { getFirebaseUser } from "@/lib/auth-helpers";
import { getAllEmailAccounts } from "@/lib/google-tokens-server";
import { getGmailClient } from "@/lib/google-apis";
import { Email } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const user = await getFirebaseUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all email accounts for the user
    const accounts = await getAllEmailAccounts(user.uid);
    
    if (accounts.length === 0) {
      console.log(`No Google tokens found for user ${user.uid}. User needs to sign in with Google.`);
      return NextResponse.json(
        { 
          error: "Gmail not connected. Please sign in again with Google.",
          code: "GOOGLE_NOT_CONNECTED"
        },
        { status: 403 }
      );
    }

    // Get query parameter for specific account (optional)
    const { searchParams } = new URL(request.url);
    const accountEmail = searchParams.get('accountEmail');
    const maxResults = parseInt(searchParams.get('maxResults') || '50');
    
    // Filter to specific account if requested, otherwise use all accounts
    const accountsToFetch = accountEmail 
      ? accounts.filter((acc: any) => acc.email === accountEmail)
      : accounts;

    const allEmails: Email[] = [];
    const accountEmails: string[] = [];

    // Fetch emails from all accounts
    for (const account of accountsToFetch) {
      // Check if token is expired
      if (account.expiresAt && Date.now() >= account.expiresAt) {
        console.log(`Token expired for account ${account.email}`);
        continue; // Skip expired accounts
      }

      try {
        // Get Gmail client for this account
        const gmail = getGmailClient(account.accessToken);
        
        // Get user profile to get email address
        const profile = await gmail.users.getProfile({ userId: "me" });
        const email = profile.data.emailAddress || account.email || "unknown@email.com";
        
        // Update account email if it was "loading..." placeholder
        if (account.email === "loading..." || !account.email) {
          account.email = email;
        }
        
        accountEmails.push(email);

        // Get messages from inbox
        const messagesResponse = await gmail.users.messages.list({
          userId: "me",
          maxResults,
          labelIds: ["INBOX"],
          q: "in:inbox",
        });

        const messages = messagesResponse.data.messages || [];

        // Fetch full message details for each message
        for (const message of messages.slice(0, maxResults)) {
          try {
            const messageDetail = await gmail.users.messages.get({
              userId: "me",
              id: message.id!,
              format: "full",
            });

            const msg = messageDetail.data;
            const headers = msg.payload?.headers || [];
            
            const getHeader = (name: string) => {
              return headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || "";
            };

            const from = getHeader("From");
            const to = getHeader("To");
            const subject = getHeader("Subject");
            const date = getHeader("Date");

            // Extract body text
            let bodyText = "";
            if (msg.payload?.body?.data) {
              bodyText = Buffer.from(msg.payload.body.data, "base64").toString("utf-8");
            } else if (msg.payload?.parts) {
              for (const part of msg.payload.parts) {
                if (part.mimeType === "text/plain" && part.body?.data) {
                  bodyText = Buffer.from(part.body.data, "base64").toString("utf-8");
                  break;
                }
              }
            }

            const isUnread = msg.labelIds?.includes("UNREAD") || false;
            const isStarred = msg.labelIds?.includes("STARRED") || false;

            allEmails.push({
              id: msg.id || "",
              threadId: msg.threadId || "",
              labelIds: msg.labelIds || [],
              snippet: msg.snippet || "",
              payload: {
                headers: headers.map((h) => ({
                  name: h.name || "",
                  value: h.value || "",
                })),
                body: bodyText ? { data: bodyText } : undefined,
              },
              internalDate: msg.internalDate || "",
              from,
              to,
              subject,
              date: date || new Date(parseInt(msg.internalDate || "0")).toISOString(),
              isUnread,
              isStarred,
              accountEmail: email, // Tag each email with its account
            });
          } catch (msgError) {
            console.error(`Error fetching message ${message.id}:`, msgError);
            // Continue with other messages
          }
        }
      } catch (accountError) {
        console.error(`Error fetching emails for account ${account.email}:`, accountError);
        // Continue with other accounts
      }
    }

    // Sort by date (newest first)
    allEmails.sort((a, b) => {
      const aTime = new Date(a.date || a.internalDate).getTime();
      const bTime = new Date(b.date || b.internalDate).getTime();
      return bTime - aTime;
    });

    return NextResponse.json({
      emails: allEmails,
      accountEmails, // List of all accounts that were queried
      accountEmail: accountEmails.length === 1 ? accountEmails[0] : undefined, // For backwards compatibility
    });
  } catch (error: any) {
    console.error("Error fetching emails:", error);
    
    // Check if it's an API not enabled error
    if (error.message?.includes("has not been used") || error.message?.includes("disabled")) {
      return NextResponse.json(
        { 
          error: "Gmail API is not enabled. Please enable it in Google Cloud Console.",
          code: "API_NOT_ENABLED",
          details: error.message
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to fetch emails", details: error.message },
      { status: 500 }
    );
  }
}
