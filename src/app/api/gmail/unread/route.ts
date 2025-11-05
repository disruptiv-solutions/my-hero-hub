import { NextRequest, NextResponse } from "next/server";
import { getFirebaseUser } from "@/lib/auth-helpers";
import { getAllEmailAccounts } from "@/lib/google-tokens-server";
import { getGmailClient } from "@/lib/google-apis";

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

    let totalUnread = 0;
    let totalMessages = 0;
    const accountStats: Array<{ email: string; unread: number; total: number }> = [];

    // Get unread count from all accounts
    for (const account of accounts) {
      // Check if token is expired
      if (account.expiresAt && Date.now() >= account.expiresAt) {
        console.log(`Token expired for account ${account.email}`);
        continue; // Skip expired accounts
      }

      try {
        // Get Gmail client for this account
        const gmail = getGmailClient(account.accessToken);

        // Get user profile
        const profile = await gmail.users.getProfile({ userId: "me" });
        const accountEmail = profile.data.emailAddress || account.email;

        // Get unread count
        const unreadResponse = await gmail.users.messages.list({
          userId: "me",
          labelIds: ["INBOX", "UNREAD"],
          maxResults: 1,
        });

        const unreadCount = unreadResponse.data.resultSizeEstimate || 0;

        // Get total message count
        const inboxResponse = await gmail.users.messages.list({
          userId: "me",
          labelIds: ["INBOX"],
          maxResults: 1,
        });

        const messagesTotal = inboxResponse.data.resultSizeEstimate || 0;

        totalUnread += unreadCount;
        totalMessages += messagesTotal;

        accountStats.push({
          email: accountEmail,
          unread: unreadCount,
          total: messagesTotal,
        });
      } catch (accountError) {
        console.error(`Error fetching unread count for account ${account.email}:`, accountError);
        // Continue with other accounts
      }
    }

    // For backwards compatibility, return primary account email or first account
    const primaryEmail = accountStats.length > 0 ? accountStats[0].email : user.email || "";

    return NextResponse.json({
      email: primaryEmail, // For backwards compatibility
      unreadCount: totalUnread,
      messagesTotal: totalMessages,
      messagesUnread: totalUnread,
      accounts: accountStats, // New: detailed stats per account
    });
  } catch (error: any) {
    console.error("Error fetching unread count:", error);
    
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
      { error: "Failed to fetch unread count", details: error.message },
      { status: 500 }
    );
  }
}

