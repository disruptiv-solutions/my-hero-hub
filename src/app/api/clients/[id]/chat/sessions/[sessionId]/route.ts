import { NextRequest, NextResponse } from "next/server";
import { getFirebaseUser } from "@/lib/auth-helpers";
import { adminDb } from "@/lib/firebase-admin";
import { ClientChatSession, ChatMessage } from "@/types";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = process.env.OPENROUTER_MODEL || "openrouter/auto";

async function callOpenRouter(apiKey: string, body: Record<string, any>) {
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://my-hero-hub",
      "X-Title": "Hero Hub Client Chat",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`OpenRouter error (${res.status}): ${err}`);
  }

  const data = await res.json().catch(async () => {
    const txt = await res.text().catch(() => "");
    return { raw: txt };
  });

  const firstChoice = Array.isArray(data?.choices) ? data.choices[0] : undefined;
  const content =
    firstChoice?.message?.content ||
    firstChoice?.content ||
    (Array.isArray(data?.choices)
      ? data.choices
          .map((c: any) => c?.message?.content || c?.content)
          .filter(Boolean)
          .join(" ")
      : "");

  if (!content || typeof content !== "string" || !content.trim()) {
    throw new Error("No content returned from OpenRouter");
  }
  return content.trim();
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    const { id, sessionId } = await context.params;
    const user = await getFirebaseUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionRef = adminDb
      .collection("clientChatSessions")
      .doc(sessionId);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const sessionData = sessionDoc.data();
    if (sessionData?.userId !== user.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const session: ClientChatSession = {
      id: sessionDoc.id,
      clientId: sessionData.clientId,
      userId: sessionData.userId,
      title: sessionData.title || undefined,
      messages: Array.isArray(sessionData.messages) ? sessionData.messages : [],
      createdAt: sessionData.createdAt,
      updatedAt: sessionData.updatedAt,
    };

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Error fetching chat session:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat session" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    const { id, sessionId } = await context.params;
    const user = await getFirebaseUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY is not set" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Get session
    const sessionRef = adminDb
      .collection("clientChatSessions")
      .doc(sessionId);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const sessionData = sessionDoc.data();
    if (sessionData?.userId !== user.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get client data for context
    let clientData: any = null;
    try {
      const clientRef = adminDb.collection("clients").doc(sessionData.clientId);
      const clientDoc = await clientRef.get();
      if (clientDoc.exists) {
        clientData = clientDoc.data();
      }
    } catch (error) {
      console.error("Error fetching client data:", error);
    }

    // Build system prompt with client context
    const transcriptsText = Array.isArray(clientData?.transcripts)
      ? clientData.transcripts
          .map(
            (t: any) =>
              `Title: ${t.title || "Untitled"}\nDate: ${t.createdAt}\nContent: ${t.content}`
          )
          .join("\n\n---\n\n")
      : "No transcripts available.";

    const tagsText = Array.isArray(clientData?.events) && clientData.events.length > 0
      ? clientData.events.join(", ")
      : "No tags";

    const systemPrompt = `You are an AI assistant helping Ian work with ${clientData?.name || "a client"}.

Client Information:
- Name: ${clientData?.name || "N/A"}
- Email: ${clientData?.email || "N/A"}
- Phone: ${clientData?.phone || "N/A"}
- Status: ${clientData?.status || "N/A"}
- Value: ${clientData?.value ? `$${clientData.value.toLocaleString()}` : "N/A"}
- Tags: ${tagsText}
- Notes: ${clientData?.notes || "No notes"}

Conversation Transcripts & Notes:
${transcriptsText}

Your role is to assist Ian in working with this client. This includes:
- Helping formulate responses to the client
- Providing insights based on the client's history and transcripts
- Suggesting next steps or actions
- Answering questions about the client
- Helping with communication strategies

Be helpful, professional, and context-aware. Reference the client's information, transcripts, and notes when relevant.`;

    // Build messages array
    const messages: Array<{ role: "user" | "assistant" | "system"; content: string }> = [
      { role: "system", content: systemPrompt },
    ];

    // Add existing messages from session
    const existingMessages = Array.isArray(sessionData.messages)
      ? sessionData.messages
      : [];
    existingMessages.forEach((msg: ChatMessage) => {
      if (msg.role !== "system") {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    });

    // Add current user message
    messages.push({
      role: "user",
      content: message.trim(),
    });

    // Call OpenRouter
    const response = await callOpenRouter(process.env.OPENROUTER_API_KEY, {
      model: MODEL,
      messages,
      temperature: 0.7,
    });

    // Add messages to session
    const now = new Date().toISOString();
    const userMessage: ChatMessage = {
      role: "user",
      content: message.trim(),
      timestamp: now,
    };
    const assistantMessage: ChatMessage = {
      role: "assistant",
      content: response,
      timestamp: now,
    };

    const updatedMessages = [...existingMessages, userMessage, assistantMessage];

    await sessionRef.update({
      messages: updatedMessages,
      updatedAt: now,
    });

    return NextResponse.json({
      message: assistantMessage,
      session: {
        id: sessionId,
        messages: updatedMessages,
        updatedAt: now,
      },
    });
  } catch (error: any) {
    console.error("Error sending chat message:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send message" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    const { id, sessionId } = await context.params;
    const user = await getFirebaseUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionRef = adminDb
      .collection("clientChatSessions")
      .doc(sessionId);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const sessionData = sessionDoc.data();
    if (sessionData?.userId !== user.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await sessionRef.delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting chat session:", error);
    return NextResponse.json(
      { error: "Failed to delete session" },
      { status: 500 }
    );
  }
}

