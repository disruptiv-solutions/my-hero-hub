import { NextRequest, NextResponse } from "next/server";
import { getFirebaseUser } from "@/lib/auth-helpers";
import { adminDb } from "@/lib/firebase-admin";

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

    const sessionRef = adminDb.collection("liveNoteSessions").doc(id);
    const sessionSnap = await sessionRef.get();
    if (!sessionSnap.exists || sessionSnap.data()?.userId !== user.uid) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const session = { id: sessionSnap.id, ...sessionSnap.data() };

    const shotsSnap = await sessionRef
      .collection("shots")
      .orderBy("createdAt", "desc")
      .limit(25)
      .get();
    const shots = shotsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    return NextResponse.json({ session, shots });
  } catch (error: any) {
    console.error("Error loading session:", error);
    return NextResponse.json(
      { error: "Failed to load session", details: error.message },
      { status: 500 }
    );
  }
}


