import { NextRequest, NextResponse } from "next/server";
import { getFirebaseUser } from "@/lib/auth-helpers";
import { adminDb } from "@/lib/firebase-admin";
import { ClientChatSession } from "@/types";

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
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const clientId = decodeURIComponent(id);
    const user = await getFirebaseUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify client belongs to user
    const clientRef = adminDb.collection("clients").doc(clientId);
    const clientDoc = await clientRef.get();
    
    if (!clientDoc.exists) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const clientData = clientDoc.data();
    if (clientData?.userId !== user.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all sessions for this client
    const sessionsSnapshot = await adminDb
      .collection("clientChatSessions")
      .where("clientId", "==", clientId)
      .where("userId", "==", user.uid)
      .orderBy("updatedAt", "desc")
      .get();

    const sessions: ClientChatSession[] = [];
    sessionsSnapshot.forEach((doc) => {
      const data = doc.data();
      sessions.push({
        id: doc.id,
        clientId: data.clientId,
        userId: data.userId,
        title: data.title || undefined,
        messages: Array.isArray(data.messages) ? data.messages : [],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Error fetching chat sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat sessions" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const clientId = decodeURIComponent(id);
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
    const { title } = body;

    // Verify client belongs to user
    const clientRef = adminDb.collection("clients").doc(clientId);
    const clientDoc = await clientRef.get();
    
    if (!clientDoc.exists) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const clientData = clientDoc.data();
    if (clientData?.userId !== user.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Create new session
    const now = new Date().toISOString();
    const sessionData = {
      clientId,
      userId: user.uid,
      title: title || `Chat ${new Date().toLocaleDateString()}`,
      messages: [],
      createdAt: now,
      updatedAt: now,
    };

    const sessionRef = await adminDb
      .collection("clientChatSessions")
      .add(sessionData);

    const newSession: ClientChatSession = {
      id: sessionRef.id,
      ...sessionData,
    };

    return NextResponse.json({ session: newSession }, { status: 201 });
  } catch (error) {
    console.error("Error creating chat session:", error);
    return NextResponse.json(
      { error: "Failed to create chat session" },
      { status: 500 }
    );
  }
}


