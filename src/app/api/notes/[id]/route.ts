import { NextRequest, NextResponse } from "next/server";
import { getFirebaseUser } from "@/lib/auth-helpers";
import { adminDb } from "@/lib/firebase-admin";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getFirebaseUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: noteId } = await params;

    // Verify note belongs to user before deleting
    const noteRef = adminDb.collection("notes").doc(noteId);
    const noteDoc = await noteRef.get();

    if (!noteDoc.exists) {
      return NextResponse.json(
        { error: "Note not found" },
        { status: 404 }
      );
    }

    const noteData = noteDoc.data();
    if (noteData?.userId !== user.uid) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    await noteRef.delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting note:", error);
    return NextResponse.json(
      { error: "Failed to delete note", details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getFirebaseUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id: noteId } = await params;
    const body = await request.json();

    const noteRef = adminDb.collection("notes").doc(noteId);
    const noteDoc = await noteRef.get();
    if (!noteDoc.exists) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }
    const data = noteDoc.data();
    if (data?.userId !== user.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const updates: any = {};
    if (typeof body.text === "string") {
      updates.text = body.text.trim();
    }
    if (typeof body.summary === "string" || body.summary === null) {
      updates.summary = body.summary;
    }
    if (Array.isArray(body.suggestedTasks)) {
      updates.suggestedTasks = body.suggestedTasks;
    }
    updates.updatedAt = new Date().toISOString();

    await noteRef.update(updates);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating note:", error);
    return NextResponse.json(
      { error: "Failed to update note", details: error.message },
      { status: 500 }
    );
  }
}

