import { NextRequest, NextResponse } from "next/server";
import { getFirebaseUser } from "@/lib/auth-helpers";
import { adminDb } from "@/lib/firebase-admin";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-5-mini";

async function callOpenRouter(apiKey: string, body: Record<string, any>) {
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
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "OpenRouter API key not configured" },
        { status: 500 }
      );
    }

    const { id } = await context.params;

    // Verify session ownership
    const sessionRef = adminDb.collection("liveNoteSessions").doc(id);
    const sessionSnap = await sessionRef.get();
    if (!sessionSnap.exists || sessionSnap.data()?.userId !== user.uid) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Load interpretations (text only). Cap to avoid extreme payloads.
    const shotsSnap = await sessionRef
      .collection("shots")
      .orderBy("createdAt", "asc")
      .limit(800)
      .get();

    const lines: string[] = [];
    shotsSnap.forEach((d) => {
      const data = d.data() as any;
      const t = data?.createdAt || "";
      const interp = (data?.interpretation || "").toString().trim();
      if (interp) {
        lines.push(`- [${t}] ${interp}`);
      }
    });

    if (lines.length === 0) {
      return NextResponse.json({
        summary:
          "No notes were interpreted for this session yet. Generate a few captures and try summarizing again.",
      });
    }

    const textBlock =
      "Below are chronological short notes from a live screen‑capture session. " +
      "Summarize the user's activities clearly and concisely. STRICT REQUIREMENTS:\n" +
      "- The timeline MUST be in chronological order (earliest → latest) and include the original timestamps as shown.\n" +
      "- Use only the text provided; do NOT speculate about image content.\n" +
      "Output sections:\n" +
      "1) Overview: 3–6 bullets.\n" +
      "2) Timeline (chronological): bullets like `[YYYY-MM-DDTHH:mm:ssZ] action...` using the timestamps below.\n" +
      "3) Next steps: 2–4 actionable bullets.\n\n" +
      lines.join("\n");

    const body = {
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that writes concise activity summaries from short notes.",
        },
        { role: "user", content: textBlock },
      ],
      temperature: 0.4,
      max_tokens: 1000,
    };

    let summary: string;
    try {
      summary = await callOpenRouter(process.env.OPENROUTER_API_KEY!, body);
    } catch (e) {
      // Optional fallback
      const fb = { ...body, model: "openai/gpt-4o-mini" };
      summary = await callOpenRouter(process.env.OPENROUTER_API_KEY!, fb);
    }

    // Save on session
    const now = new Date().toISOString();
    await sessionRef.update({
      summary,
      lastSummary: summary,
      updatedAt: now,
    });

    return NextResponse.json({ summary });
  } catch (error: any) {
    console.error("Error summarizing session:", error);
    return NextResponse.json(
      { error: "Failed to summarize session", details: error.message },
      { status: 500 }
    );
  }
}


