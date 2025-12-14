import { NextRequest, NextResponse } from "next/server";
import { getFirebaseUser } from "@/lib/auth-helpers";
import { adminDb } from "@/lib/firebase-admin";
import { ClientActionItem } from "@/types";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = process.env.OPENROUTER_MODEL || "openrouter/auto";

async function callOpenRouter(apiKey: string, body: Record<string, any>) {
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://my-hero-hub",
      "X-Title": "Hero Hub Action Items Generator",
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

function extractJsonFromText(text: string): any {
  try {
    return JSON.parse(text);
  } catch {}
  const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (match) {
    try {
      return JSON.parse(match[1]);
    } catch {}
  }
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start !== -1 && end !== -1 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {}
  }
  const startObj = text.indexOf("{");
  const endObj = text.lastIndexOf("}");
  if (startObj !== -1 && endObj !== -1 && endObj > startObj) {
    try {
      const parsed = JSON.parse(text.slice(startObj, endObj + 1));
      if (parsed.actionItems && Array.isArray(parsed.actionItems)) {
        return parsed.actionItems;
      }
      return parsed;
    } catch {}
  }
  throw new Error("Could not extract JSON from AI response");
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
    const { message } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
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

    // Generate action items using AI
    const systemPrompt = `You are an AI assistant that extracts actionable items from conversation messages. 
Analyze the following AI assistant message and extract specific, actionable tasks that should be created as action items.

Return ONLY a JSON array of action items. Each action item should have:
- title: A clear, concise title (required)
- description: Optional detailed description
- priority: "low", "medium", or "high" (default: "medium")
- status: "pending" (default)
- dueDate: Optional ISO date string if a deadline is mentioned

Example format:
[
  {
    "title": "Follow up on proposal",
    "description": "Send follow-up email regarding the proposal sent last week",
    "priority": "high",
    "status": "pending"
  },
  {
    "title": "Schedule meeting",
    "description": "Set up a call to discuss project details",
    "priority": "medium",
    "status": "pending"
  }
]

Only extract items that are clearly actionable tasks. Do not include general advice or information.
Return ONLY the JSON array, no other text.`;

    const aiResponse = await callOpenRouter(process.env.OPENROUTER_API_KEY, {
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Extract action items from this message:\n\n${message}` },
      ],
      temperature: 0.3,
    });

    // Extract JSON from response
    let actionItemsData: any[];
    try {
      const parsed = extractJsonFromText(aiResponse);
      actionItemsData = Array.isArray(parsed) ? parsed : parsed.actionItems || [];
    } catch (error) {
      // Try to parse as JSON object with actionItems key
      try {
        const obj = JSON.parse(aiResponse);
        actionItemsData = Array.isArray(obj) ? obj : obj.actionItems || [];
      } catch {
        return NextResponse.json(
          { error: "Failed to parse AI response as action items" },
          { status: 500 }
        );
      }
    }

    if (!Array.isArray(actionItemsData) || actionItemsData.length === 0) {
      return NextResponse.json(
        { error: "No action items could be extracted from the message" },
        { status: 400 }
      );
    }

    // Create action items in Firestore
    const now = new Date().toISOString();
    const createdItems: ClientActionItem[] = [];

    for (const item of actionItemsData) {
      if (!item.title || typeof item.title !== "string") continue;

      const actionItemData = {
        clientId,
        userId: user.uid,
        title: item.title.trim(),
        description: item.description?.trim() || null,
        status: item.status || "pending",
        priority: item.priority || "medium",
        dueDate: item.dueDate || null,
        createdAt: now,
        updatedAt: now,
        completedAt: null,
      };

      const actionItemRef = await adminDb
        .collection("clientActionItems")
        .add(actionItemData);

      // Create corresponding master priority
      let masterPriorityId: string | undefined;
      try {
        const priorityData = {
          userId: user.uid,
          title: actionItemData.title,
          description: actionItemData.description,
          priority: actionItemData.priority,
          status: actionItemData.status,
          clientId: clientId,
          clientActionItemId: actionItemRef.id,
          dueDate: actionItemData.dueDate,
          createdAt: now,
          updatedAt: now,
          completedAt: actionItemData.completedAt,
        };

        const masterPriorityRef = await adminDb
          .collection("masterPriorities")
          .add(priorityData);
        
        masterPriorityId = masterPriorityRef.id;

        // Update action item with master priority link
        await actionItemRef.update({ masterPriorityId });
      } catch (priorityError) {
        console.warn("Failed to create master priority for action item:", priorityError);
        // Don't fail the request if master priority creation fails
      }

      createdItems.push({
        id: actionItemRef.id,
        ...actionItemData,
        description: actionItemData.description || undefined,
        dueDate: actionItemData.dueDate || undefined,
        masterPriorityId,
      });
    }

    if (createdItems.length === 0) {
      return NextResponse.json(
        { error: "No valid action items could be created" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      actionItems: createdItems,
    });
  } catch (error: any) {
    console.error("Error generating action items:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate action items" },
      { status: 500 }
    );
  }
}

