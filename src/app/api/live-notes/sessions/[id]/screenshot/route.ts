import { NextRequest, NextResponse } from "next/server";
import { getFirebaseUser } from "@/lib/auth-helpers";
import { adminDb } from "@/lib/firebase-admin";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
// Prefer a widely available vision model by default; allow override via env
const MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-5-mini";

async function callOpenRouter(
  apiKey: string,
  body: Record<string, any>
) {
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
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
  // Robust content extraction across providers
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

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getFirebaseUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await context.params;

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "OpenRouter API key not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const imageDataUrl: string = body?.imageDataUrl;
    const clientLocalId: string | undefined = body?.clientLocalId;
    if (!imageDataUrl || typeof imageDataUrl !== "string") {
      return NextResponse.json(
        { error: "imageDataUrl is required" },
        { status: 400 }
      );
    }

    // Ensure session exists and belongs to user
    const sessionRef = adminDb.collection("liveNoteSessions").doc(id);
    const sessionSnap = await sessionRef.get();
    if (!sessionSnap.exists || sessionSnap.data()?.userId !== user.uid) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Fetch last few interpretations for context
    const historySnap = await sessionRef
      .collection("shots")
      .orderBy("createdAt", "desc")
      .limit(5)
      .get();

    const history = historySnap.docs
      .map((d) => d.data())
      .filter((d) => typeof d.interpretation === "string" && d.interpretation.trim())
      .reverse();

    const messages: Array<any> = [
      {
        role: "system",
        content:
          "You are an assistant that infers what the user is doing on their computer from periodic screenshots. " +
          "Summarize actions succinctly and maintain continuity across messages for the same session. " +
          "Prefer short, high-signal sentences and include inferred intent when useful.",
      },
    ];

    if (history.length > 0) {
      messages.push({
        role: "assistant",
        content:
          "Recent context: " +
          history.map((h: any) => `• ${h.interpretation}`).join(" "),
      });
    }

    // Send the image as a multimodal part when supported.
    messages.push({
      role: "user",
      content: [
        {
          type: "text",
          text:
            "Another screenshot has been captured. Based on ongoing context, infer what the user is doing now. " +
            "Describe in one or two concise sentences.",
        },
        {
          type: "image_url",
          image_url: { url: imageDataUrl, detail: "low" },
        },
      ],
    });

    const requestBody = {
      model: MODEL,
      // Leave routing to OpenRouter providers for this model
      route: "fallback",
      messages,
      temperature: 0.4,
      max_tokens: 300,
    };

    // Primary attempt
    let interpretation: string | null = null;
    try {
      interpretation = await callOpenRouter(process.env.OPENROUTER_API_KEY!, requestBody);
    } catch (e) {
      console.error("OpenRouter call failed:", e);
      interpretation = null;
    }

    // Retry with detail:auto if first attempt returned no content
    if (!interpretation) {
      try {
        const retryMessages = messages.map((m: any) => {
          if (m.role === "user" && Array.isArray(m.content)) {
            return {
              ...m,
              content: m.content.map((p: any) =>
                p?.type === "image_url" ? { ...p, image_url: { ...(p.image_url || {}), detail: "auto" } } : p
              ),
            };
          }
          return m;
        });
        const retryBody = { ...requestBody, messages: retryMessages };
        interpretation = await callOpenRouter(process.env.OPENROUTER_API_KEY!, retryBody);
      } catch (e) {
        console.error("OpenRouter retry (detail:auto) failed:", e);
      }
    }

    // Optional final fallback to gpt-4o-mini if still empty (respects env override to disable)
    if (!interpretation && process.env.LIVE_NOTES_ALLOW_FALLBACK !== "false") {
      try {
        const fallbackBody = {
          ...requestBody,
          model: "openai/gpt-4o-mini",
        };
        interpretation = await callOpenRouter(process.env.OPENROUTER_API_KEY!, fallbackBody);
      } catch (e) {
        console.error("OpenRouter final fallback failed:", e);
      }
    }

    if (!interpretation) {
      interpretation = "Unable to interpret this screenshot at the moment.";
    }

    const now = new Date().toISOString();
    const shotData = {
      imageDataUrl,
      interpretation,
      createdAt: now,
    };

    const shotRef = await sessionRef.collection("shots").add(shotData);

    // Update session aggregate
    await sessionRef.update({
      updatedAt: now,
      lastSummary: interpretation,
      totalShots: (sessionSnap.data()?.totalShots || 0) + 1,
    });

    return NextResponse.json({
      id: shotRef.id,
      clientLocalId: clientLocalId || null,
      ...shotData,
    });
  } catch (error: any) {
    console.error("Error saving screenshot:", error);
    return NextResponse.json(
      { error: "Failed to save screenshot", details: error.message },
      { status: 500 }
    );
  }
}


