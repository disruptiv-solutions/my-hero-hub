import { NextRequest, NextResponse } from "next/server";
import { getFirebaseUser } from "@/lib/auth-helpers";
import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

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
    const body = await request.json().catch(() => ({}));
    const text: string = typeof body.text === "string" ? body.text.trim() : "";
    if (!text) {
      return NextResponse.json({ error: "Transcript text required" }, { status: 400 });
    }

    const sessionRef = adminDb.collection("voiceNoteSessions").doc(id);
    const sessionSnap = await sessionRef.get();
    if (!sessionSnap.exists || sessionSnap.data()?.userId !== user.uid) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const now = new Date().toISOString();
    const entry = { text, createdAt: now };
    await sessionRef.collection("entries").add(entry);
    await sessionRef.update({
      updatedAt: now,
      totalEntries: (sessionSnap.data()?.totalEntries || 0) + 1,
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Error saving transcript:", error);
    return NextResponse.json(
      { error: "Failed to save transcript", details: error.message },
      { status: 500 }
    );
  }
}


