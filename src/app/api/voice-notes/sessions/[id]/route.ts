import { NextRequest, NextResponse } from "next/server";
import { getFirebaseUser } from "@/lib/auth-helpers";
import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getFirebaseUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await context.params;

    const sessionRef = adminDb.collection("voiceNoteSessions").doc(id);
    const sessionSnap = await sessionRef.get();
    if (!sessionSnap.exists || sessionSnap.data()?.userId !== user.uid) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const session = { id: sessionSnap.id, ...sessionSnap.data() };

    const entriesSnap = await sessionRef
      .collection("entries")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();
    const entries = entriesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    return NextResponse.json({ session, entries });
  } catch (error: any) {
    console.error("Error loading voice note session:", error);
    return NextResponse.json(
      { error: "Failed to load session", details: error.message },
      { status: 500 }
    );
  }
}


