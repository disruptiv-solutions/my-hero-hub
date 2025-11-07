import { NextRequest, NextResponse } from "next/server";
import { getFirebaseUser } from "@/lib/auth-helpers";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    const user = await getFirebaseUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's conversations from Firestore, ordered by updated date
    const conversationsSnapshot = await adminDb
      .collection("conversations")
      .where("userId", "==", user.uid)
      .orderBy("updatedAt", "desc")
      .get();

    const conversations = conversationsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ conversations });
  } catch (error: any) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations", details: error.message },
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

    const body = await request.json();
    const { title } = body;

    const conversationData = {
      userId: user.uid,
      title: title || "New Conversation",
      messageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const conversationRef = await adminDb.collection("conversations").add(conversationData);

    return NextResponse.json({
      conversation: {
        id: conversationRef.id,
        ...conversationData,
      },
    });
  } catch (error: any) {
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { error: "Failed to create conversation", details: error.message },
      { status: 500 }
    );
  }
}




