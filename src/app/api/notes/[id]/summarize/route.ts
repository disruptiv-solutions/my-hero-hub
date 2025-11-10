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
  const data = await res.json();
  const first = Array.isArray(data?.choices) ? data.choices[0] : null;
  const content =
    first?.message?.content ||
    first?.content ||
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
    const noteRef = adminDb.collection("notes").doc(id);
    const snap = await noteRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }
    const note = snap.data() as any;
    if (note.userId !== user.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const text = (note.text || "").toString().trim();
    if (!text) {
      return NextResponse.json(
        { error: "Note text is empty" },
        { status: 400 }
      );
    }

    const prompt =
      "You will receive a raw meeting or personal note transcript.\n" +
      "Return a concise JSON object with two fields: `summary` (string, 3-6 bullet summary as plain text) and `tasks` (array of short actionable strings, max 8).\n" +
      "Rules:\n" +
      "- Keep summary crisp and helpful for later review.\n" +
      "- Tasks should be atomic and start with a verb.\n" +
      "- If no tasks are appropriate, return an empty array for `tasks`.\n" +
      "- Respond with ONLY valid JSON. Do not include code fences.\n";

    const body = {
      model: MODEL,
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: text },
      ],
      temperature: 0.3,
      max_tokens: 800,
      response_format: { type: "json_object" },
    };

    let raw: string = await callOpenRouter(process.env.OPENROUTER_API_KEY!, body);
    // Some models may still wrap JSON in code fences or text; attempt to extract JSON
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? jsonMatch[0] : raw;
    let parsed: { summary?: string; tasks?: string[] } = {};
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      // Fallback: produce minimal summary and no tasks
      parsed = { summary: raw.slice(0, 2000), tasks: [] };
    }

    const summary = (parsed.summary || "").toString().trim();
    const tasks = Array.isArray(parsed.tasks)
      ? parsed.tasks
          .map((t) => (t || "").toString().trim())
          .filter((t) => t.length > 0)
          .slice(0, 12)
      : [];

    const now = new Date().toISOString();
    await noteRef.update({
      summary: summary || null,
      suggestedTasks: tasks,
      updatedAt: now,
    });

    return NextResponse.json({ summary, tasks });
  } catch (error: any) {
    console.error("Error summarizing note:", error);
    return NextResponse.json(
      { error: "Failed to summarize note", details: error.message },
      { status: 500 }
    );
  }
}


