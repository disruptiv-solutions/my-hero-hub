import { NextRequest, NextResponse } from "next/server";
import { getFirebaseUser } from "@/lib/auth-helpers";
import { adminDb } from "@/lib/firebase-admin";
import { ClientAnalytics, ClientActionItem, ClientTranscript } from "@/types";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const slugify = (str: string) =>
  String(str || "")
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

async function findClientDocument(clientIdOrSlug: string, userId: string) {
  // Try direct doc by ID first
  const directRef = adminDb.collection("clients").doc(clientIdOrSlug);
  const directDoc = await directRef.get();
  if (directDoc.exists && directDoc.data()?.userId === userId) {
    return { ref: directRef, doc: directDoc };
  }

  // Otherwise, look up by slug
  const slug = slugify(clientIdOrSlug);
  const query = adminDb
    .collection("clients")
    .where("userId", "==", userId)
    .where("slug", "==", slug);
  const snap = await query.limit(1).get();

  if (!snap.empty) {
    const doc = snap.docs[0];
    return { ref: adminDb.collection("clients").doc(doc.id), doc };
  }

  // Fallback: scan user's clients and match by slugified name
  const allForUser = await adminDb
    .collection("clients")
    .where("userId", "==", userId)
    .get();
  const matched = allForUser.docs.find(
    (d) => slugify(d.data()?.name || "") === slug
  );
  if (matched) {
    return { ref: adminDb.collection("clients").doc(matched.id), doc: matched };
  }

  return null;
}

// GET - Fetch analytics for a client
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const clientIdOrSlug = decodeURIComponent(id);
    const user = await getFirebaseUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find client document
    const clientResult = await findClientDocument(clientIdOrSlug, user.uid);
    if (!clientResult) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const { ref: clientRef, doc: clientDoc } = clientResult;
    const clientId = clientDoc.id;

    // Get latest analytics for this client
    const analyticsSnapshot = await adminDb
      .collection("clientAnalytics")
      .where("clientId", "==", clientId)
      .where("userId", "==", user.uid)
      .orderBy("updatedAt", "desc")
      .limit(1)
      .get();

    if (analyticsSnapshot.empty) {
      return NextResponse.json({ analytics: null }, { status: 200 });
    }

    const doc = analyticsSnapshot.docs[0];
    const data = doc.data();
    const analytics: ClientAnalytics = {
      id: doc.id,
      clientId: data.clientId,
      avatar: data.avatar || {
        description: "Client profile analysis pending.",
        characteristics: [],
      },
      sentimentTrend: data.sentimentTrend,
      engagementLevel: data.engagementLevel,
      keyTopics: data.keyTopics,
      nextBestAction: data.nextBestAction,
      analysisHistory: data.analysisHistory || [],
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };

    return NextResponse.json({ analytics }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

// POST - Generate or update analytics
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const clientIdOrSlug = decodeURIComponent(id);
    const user = await getFirebaseUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { isUpdate } = await request.json();

    // Find client document
    const clientResult = await findClientDocument(clientIdOrSlug, user.uid);
    if (!clientResult) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const { ref: clientRef, doc: clientDoc } = clientResult;
    const clientId = clientDoc.id;
    const clientData = clientDoc.data()!;

    // Fetch transcripts (stored as array on client document)
    const transcripts: ClientTranscript[] = Array.isArray(clientData.transcripts)
      ? clientData.transcripts
      : [];

    // Fetch action items
    const actionItemsSnapshot = await adminDb
      .collection("clientActionItems")
      .where("clientId", "==", clientId)
      .where("userId", "==", user.uid)
      .orderBy("createdAt", "desc")
      .get();

    const actionItems: ClientActionItem[] = actionItemsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        clientId: data.clientId,
        title: data.title,
        description: data.description || undefined,
        status: data.status,
        priority: data.priority,
        dueDate: data.dueDate || undefined,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        completedAt: data.completedAt || undefined,
      };
    });

    // Fetch previous analytics if updating
    let previousAnalytics: ClientAnalytics | null = null;
    if (isUpdate) {
      const analyticsSnapshot = await adminDb
        .collection("clientAnalytics")
        .where("clientId", "==", clientId)
        .where("userId", "==", user.uid)
        .orderBy("updatedAt", "desc")
        .limit(1)
        .get();

      if (!analyticsSnapshot.empty) {
        const doc = analyticsSnapshot.docs[0];
        const data = doc.data();
        previousAnalytics = {
          id: doc.id,
          clientId: data.clientId,
          avatar: data.avatar || {
            description: "Client profile analysis pending.",
            characteristics: [],
          },
          sentimentTrend: data.sentimentTrend,
          engagementLevel: data.engagementLevel,
          keyTopics: data.keyTopics,
          nextBestAction: data.nextBestAction,
          analysisHistory: data.analysisHistory || [],
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };
      }
    }

    // Generate AI analysis
    const analysis = await generateAnalysis(
      clientData,
      transcripts,
      actionItems,
      previousAnalytics
    );

    // Save analytics
    const now = new Date().toISOString();
    const analyticsData = {
      clientId,
      userId: user.uid,
      avatar: analysis.avatar || {
        description: "Client profile analysis pending.",
        characteristics: [],
      },
      sentimentTrend: analysis.sentimentTrend,
      engagementLevel: analysis.engagementLevel,
      keyTopics: analysis.keyTopics,
      nextBestAction: analysis.nextBestAction,
      analysisHistory: [
        ...(previousAnalytics?.analysisHistory || []),
        {
          timestamp: now,
          summary: isUpdate ? "Updated analysis" : "Initial analysis",
        },
      ],
      createdAt: previousAnalytics?.createdAt || now,
      updatedAt: now,
    };

    const analyticsRef = await adminDb.collection("clientAnalytics").add(analyticsData);

    const savedAnalytics: ClientAnalytics = {
      id: analyticsRef.id,
      ...analyticsData,
    };

    return NextResponse.json({ analytics: savedAnalytics }, { status: 200 });
  } catch (error: any) {
    console.error("Error generating analytics:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate analytics" },
      { status: 500 }
    );
  }
}

async function generateAnalysis(
  clientData: any,
  transcripts: ClientTranscript[],
  actionItems: ClientActionItem[],
  previousAnalytics: ClientAnalytics | null
) {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OpenRouter API key not configured");
  }

  // Build context for AI
  const transcriptsContext = transcripts
    .map((t) => `[${t.title || "Untitled"}] ${t.content}`)
    .join("\n\n");

  const actionItemsContext = actionItems
    .map(
      (item) =>
        `- [${item.status}] ${item.title}: ${item.description || "No description"}`
    )
    .join("\n");

  const previousContext = previousAnalytics
    ? `
Previous Analysis:
- Sentiment: ${previousAnalytics.sentimentTrend.current} (${previousAnalytics.sentimentTrend.description})
- Engagement: ${previousAnalytics.engagementLevel.level} (${previousAnalytics.engagementLevel.description})
- Key Topics: ${previousAnalytics.keyTopics.join(", ")}
- Previous Action: ${previousAnalytics.nextBestAction.action}
`
    : "";

  const prompt = `You are analyzing a client relationship for a business. Based on the following information, provide a comprehensive analysis.

Client: ${clientData.name}
Email: ${clientData.email}
Status: ${clientData.status}
${clientData.notes ? `Notes: ${clientData.notes}` : ""}

${previousContext}

Conversation Transcripts & Notes:
${transcriptsContext || "No transcripts available"}

Action Items:
${actionItemsContext || "No action items available"}

Provide a JSON response with the following structure:
{
  "avatar": {
    "description": "<A 2-3 sentence description of who this client is, their role, their business context, and what they represent as a customer. Think of this as a customer persona/avatar that captures their essence.>",
    "characteristics": ["<characteristic1>", "<characteristic2>", "<characteristic3>", "<characteristic4>"],
    "ageRange": "<Estimated age range based on communication style, references, and context clues. Format as '25-35', '40-50', '55+', etc. Only include if there are clear indicators, otherwise omit this field.>"
  },
  "sentimentTrend": {
    "current": "positive" | "neutral" | "negative",
    "change": <number between -100 and 100>,
    "description": "<brief explanation of sentiment>"
  },
  "engagementLevel": {
    "level": "high" | "medium" | "low",
    "status": "<short status like 'Active', 'Responsive', 'Needs attention'>",
    "description": "<brief explanation of engagement>"
  },
  "keyTopics": ["<topic1>", "<topic2>", "<topic3>"],
  "nextBestAction": {
    "action": "<recommended action>",
    "reasoning": "<why this action is recommended>"
  }
}

${previousAnalytics ? "Consider the previous analysis and note any changes or trends. Update the avatar if the client's profile has evolved." : "This is the initial analysis."}

Respond ONLY with valid JSON, no additional text.`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "My Hero Hub",
    },
    body: JSON.stringify({
      model: "anthropic/claude-3.5-sonnet",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to generate analysis");
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error("No response from AI");
  }

  // Parse JSON response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Invalid JSON response from AI");
  }

  const analysis = JSON.parse(jsonMatch[0]);
  return analysis;
}

