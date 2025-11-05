import { NextRequest, NextResponse } from "next/server";
import { getFirebaseUser } from "@/lib/auth-helpers";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getFirebaseUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: conversationId } = await params;

    // Verify conversation belongs to user
    const convRef = adminDb.collection("conversations").doc(conversationId);
    const convDoc = await convRef.get();

    if (!convDoc.exists) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const convData = convDoc.data();
    if (convData?.userId !== user.uid) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Get messages for this conversation
    const messagesSnapshot = await adminDb
      .collection("conversationMessages")
      .where("conversationId", "==", conversationId)
      .orderBy("timestamp", "asc")
      .get();

    const messages = messagesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      conversation: convData,
      messages,
    });
  } catch (error: any) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getFirebaseUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: conversationId } = await params;
    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // Verify conversation belongs to user
    const convRef = adminDb.collection("conversations").doc(conversationId);
    const convDoc = await convRef.get();

    if (!convDoc.exists) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const convData = convDoc.data();
    if (convData?.userId !== user.uid) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Delete existing messages and save new ones
    const existingMessagesSnapshot = await adminDb
      .collection("conversationMessages")
      .where("conversationId", "==", conversationId)
      .get();

    const batch = adminDb.batch();
    existingMessagesSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Add new messages
    messages.forEach((msg: any) => {
      const messageRef = adminDb.collection("conversationMessages").doc();
      batch.set(messageRef, {
        conversationId,
        userId: user.uid,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp || new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });
    });

    // Update conversation
    batch.update(convRef, {
      messageCount: messages.length,
      updatedAt: new Date().toISOString(),
    });

    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error saving messages:", error);
    return NextResponse.json(
      { error: "Failed to save messages", details: error.message },
      { status: 500 }
    );
  }
}

