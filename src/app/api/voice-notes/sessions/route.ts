import { NextRequest, NextResponse } from "next/server";
import { getFirebaseUser } from "@/lib/auth-helpers";
import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const user = await getFirebaseUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const snapshot = await adminDb
      .collection("voiceNoteSessions")
      .where("userId", "==", user.uid)
      .orderBy("updatedAt", "desc")
      .limit(50)
      .get();

    const sessions = snapshot.docs.map((doc) => {
      const data = doc.data() as any;
      return {
        id: doc.id,
        userId: data.userId,
        title: data.title,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        lastSummary: data.lastSummary || "",
        lastTaskCount: data.lastTaskCount || 0,
        totalEntries: data.totalEntries || 0,
      };
    });

    return NextResponse.json({ sessions });
  } catch (error: any) {
    console.error("Error listing voice note sessions:", error);
    return NextResponse.json(
      { error: "Failed to load sessions", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getFirebaseUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const title =
      typeof body.title === "string" && body.title.trim()
        ? body.title.trim()
        : `Voice Note - ${new Date().toLocaleString()}`;

    const now = new Date().toISOString();
    const data = {
      userId: user.uid,
      title,
      createdAt: now,
      updatedAt: now,
      lastSummary: "",
      lastTaskCount: 0,
      totalEntries: 0,
    };

    const ref = await adminDb.collection("voiceNoteSessions").add(data);

    return NextResponse.json({ session: { id: ref.id, ...data } }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating voice note session:", error);
    return NextResponse.json(
      { error: "Failed to create session", details: error.message },
      { status: 500 }
    );
  }
}


