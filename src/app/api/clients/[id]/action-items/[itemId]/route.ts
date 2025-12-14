import { NextRequest, NextResponse } from "next/server";
import { getFirebaseUser } from "@/lib/auth-helpers";
import { adminDb } from "@/lib/firebase-admin";
import { ClientActionItem } from "@/types";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await context.params;
    const user = await getFirebaseUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, status, priority, dueDate } = body;

    const itemRef = adminDb
      .collection("clientActionItems")
      .doc(itemId);
    const itemDoc = await itemRef.get();

    if (!itemDoc.exists) {
      return NextResponse.json({ error: "Action item not found" }, { status: 404 });
    }

    const itemData = itemDoc.data();
    if (itemData?.userId !== user.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (status !== undefined) {
      updateData.status = status;
      if (status === "completed" && itemData.status !== "completed") {
        updateData.completedAt = new Date().toISOString();
      } else if (status !== "completed") {
        updateData.completedAt = null;
      }
    }
    if (priority !== undefined) updateData.priority = priority;
    if (dueDate !== undefined) updateData.dueDate = dueDate || null;

    await itemRef.update(updateData);

    // Sync with linked master priority if exists
    if (itemData.masterPriorityId) {
      try {
        const masterPriorityRef = adminDb
          .collection("masterPriorities")
          .doc(itemData.masterPriorityId);
        const masterPriorityDoc = await masterPriorityRef.get();

        if (masterPriorityDoc.exists) {
          const masterPriorityUpdate: any = {
            updatedAt: new Date().toISOString(),
          };
          if (title !== undefined) masterPriorityUpdate.title = title.trim();
          if (description !== undefined) masterPriorityUpdate.description = description?.trim() || null;
          if (priority !== undefined) masterPriorityUpdate.priority = priority;
          if (status !== undefined) {
            masterPriorityUpdate.status = status;
            if (status === "completed" && itemData.status !== "completed") {
              masterPriorityUpdate.completedAt = new Date().toISOString();
            } else if (status !== "completed") {
              masterPriorityUpdate.completedAt = null;
            }
          }
          if (dueDate !== undefined) masterPriorityUpdate.dueDate = dueDate || null;

          await masterPriorityRef.update(masterPriorityUpdate);
        }
      } catch (syncError) {
        console.warn("Failed to sync with master priority:", syncError);
        // Don't fail the request if sync fails
      }
    }

    const updatedDoc = await itemRef.get();
    const updatedData = updatedDoc.data()!;

    const updatedItem: ClientActionItem = {
      id: updatedDoc.id,
      clientId: updatedData.clientId,
      title: updatedData.title,
      description: updatedData.description || undefined,
      status: updatedData.status,
      priority: updatedData.priority,
      dueDate: updatedData.dueDate || undefined,
      createdAt: updatedData.createdAt,
      updatedAt: updatedData.updatedAt,
      completedAt: updatedData.completedAt || undefined,
      masterPriorityId: updatedData.masterPriorityId || undefined,
    };

    return NextResponse.json({ actionItem: updatedItem });
  } catch (error) {
    console.error("Error updating action item:", error);
    return NextResponse.json(
      { error: "Failed to update action item" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await context.params;
    const user = await getFirebaseUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const itemRef = adminDb
      .collection("clientActionItems")
      .doc(itemId);
    const itemDoc = await itemRef.get();

    if (!itemDoc.exists) {
      return NextResponse.json({ error: "Action item not found" }, { status: 404 });
    }

    const itemData = itemDoc.data();
    if (itemData?.userId !== user.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete linked master priority if exists
    if (itemData.masterPriorityId) {
      try {
        const masterPriorityRef = adminDb
          .collection("masterPriorities")
          .doc(itemData.masterPriorityId);
        const masterPriorityDoc = await masterPriorityRef.get();
        
        if (masterPriorityDoc.exists) {
          await masterPriorityRef.delete();
        }
      } catch (priorityError) {
        console.warn("Failed to delete linked master priority:", priorityError);
        // Don't fail the request if master priority deletion fails
      }
    }

    await itemRef.delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting action item:", error);
    return NextResponse.json(
      { error: "Failed to delete action item" },
      { status: 500 }
    );
  }
}

