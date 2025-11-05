import { NextRequest, NextResponse } from "next/server";
import { getFirebaseUser } from "@/lib/auth-helpers";

export async function POST(request: NextRequest) {
  try {
    const user = await getFirebaseUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { query, context } = body;

    // Basic keyword-based search for MVP
    // In production, integrate with Claude API or implement vector search
    const queryLower = query.toLowerCase();

    let answer = "";
    let results: any[] = [];
    let suggestions: string[] = [];

    // Simple pattern matching for common queries
    if (
      queryLower.includes("meeting") ||
      queryLower.includes("calendar") ||
      queryLower.includes("when")
    ) {
      answer =
        "I can help you search your calendar. Try asking 'What's my next meeting?' or 'Show meetings this week'.";
      suggestions = [
        "What's my next meeting?",
        "Show meetings today",
        "When is my meeting with [name]?",
      ];
    } else if (
      queryLower.includes("email") ||
      queryLower.includes("message") ||
      queryLower.includes("from")
    ) {
      answer =
        "I can search your emails. Try asking 'Show emails from [name]' or 'Unread emails today'.";
      suggestions = [
        "Show recent emails",
        "Emails from [contact]",
        "Unread messages",
      ];
    } else if (
      queryLower.includes("client") ||
      queryLower.includes("project")
    ) {
      answer =
        "I can help with client information. Try asking 'List active clients' or 'What's the status of [project]?'";
      suggestions = [
        "Show active clients",
        "List all projects",
        "Client revenue this month",
      ];
    } else if (
      queryLower.includes("revenue") ||
      queryLower.includes("money") ||
      queryLower.includes("payment")
    ) {
      answer =
        "I can help with financial data. Try asking 'What's my revenue this month?' or 'Show pending payments'.";
      suggestions = [
        "Revenue this month",
        "Pending payments",
        "Recent transactions",
      ];
    } else {
      answer =
        "I can help you search across your calendar, emails, clients, and financial data. What would you like to know?";
      suggestions = [
        "What's my next meeting?",
        "Show recent emails",
        "List active clients",
        "Revenue this month",
      ];
    }

    return NextResponse.json({
      answer,
      results,
      suggestions,
    });
  } catch (error) {
    console.error("Error processing AI query:", error);
    return NextResponse.json(
      { error: "Failed to process query" },
      { status: 500 }
    );
  }
}

