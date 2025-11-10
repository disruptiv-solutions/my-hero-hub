import { NextRequest, NextResponse } from "next/server";
import { getFirebaseUser } from "@/lib/auth-helpers";
import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

async function callOpenRouter(apiKey: string, body: Record<string, any>) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter error: ${res.status} ${text}`);
  }
  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content || "";
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
    const sessionRef = adminDb.collection("voiceNoteSessions").doc(id);
    const sessionSnap = await sessionRef.get();
    if (!sessionSnap.exists || sessionSnap.data()?.userId !== user.uid) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const entriesSnap = await sessionRef
      .collection("entries")
      .orderBy("createdAt", "asc")
      .limit(1000)
      .get();
    const lines: string[] = [];
    entriesSnap.forEach((d) => {
      const e = d.data() as any;
      const t = e?.createdAt || "";
      const text = (e?.text || "").toString().trim();
      if (text) {
        lines.push(`[${t}] ${text}`);
      }
    });
    if (lines.length === 0) {
      return NextResponse.json({
        summary: "No transcripts recorded in this session.",
        tasks: [],
      });
    }

    const transcriptBlock =
      lines.length > 100 ? lines.slice(-100).join("\n") : lines.join("\n");

    const system =
      "You are an assistant that summarizes meeting or voice notes and proposes actionable tasks. Return concise results.";
    const userPrompt = `
Given the following chronological transcript lines, produce:
1) A concise Summary (<= 200 words)
2) A list of up to 10 Tasks with short, imperative titles. Include optional priority: low|medium|high when clear.

Return strictly as JSON:
{
  "summary": "...",
  "tasks": [
    {"title": "...", "priority": "low|medium|high" }
  ]
}

Transcript:
${transcriptBlock}
`;

    const content = await callOpenRouter(process.env.OPENROUTER_API_KEY, {
      model: "openai/gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
    });

    let parsed: { summary?: string; tasks?: Array<{ title: string; priority?: string }> } = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      // try to extract JSON
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        parsed = { summary: content, tasks: [] };
      }
    }
    const summary = (parsed.summary || "").toString().trim();
    const tasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];

    const now = new Date().toISOString();
    await sessionRef.update({
      updatedAt: now,
      lastSummary: summary,
      summary,
      tasks,
      lastTaskCount: tasks.length,
    });

    return NextResponse.json({ summary, tasks });
  } catch (error: any) {
    console.error("Error summarizing voice note session:", error);
    return NextResponse.json(
      { error: "Failed to summarize session", details: error.message },
      { status: 500 }
    );
  }
}


