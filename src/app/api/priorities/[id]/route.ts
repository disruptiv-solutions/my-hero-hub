import { NextRequest, NextResponse } from "next/server";
import { getFirebaseUser } from "@/lib/auth-helpers";
import { adminDb } from "@/lib/firebase-admin";
import { MasterPriority } from "@/types";

// PATCH - Update a master priority
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getFirebaseUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const priorityRef = adminDb.collection("masterPriorities").doc(id);
    const priorityDoc = await priorityRef.get();

    if (!priorityDoc.exists) {
      return NextResponse.json({ error: "Priority not found" }, { status: 404 });
    }

    const priorityData = priorityDoc.data();
    if (priorityData?.userId !== user.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.description !== undefined) updateData.description = body.description?.trim() || null;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.status !== undefined) {
      updateData.status = body.status;
      if (body.status === "completed" && !priorityData.completedAt) {
        updateData.completedAt = new Date().toISOString();
      } else if (body.status !== "completed") {
        updateData.completedAt = null;
      }
    }
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate || null;

    await priorityRef.update(updateData);

    // Sync with linked client action item if exists
    if (priorityData.clientActionItemId && priorityData.clientId) {
      try {
        const actionItemRef = adminDb
          .collection("clientActionItems")
          .doc(priorityData.clientActionItemId);
        const actionItemDoc = await actionItemRef.get();

        if (actionItemDoc.exists) {
          const actionItemUpdate: any = {
            updatedAt: new Date().toISOString(),
          };
          if (body.status !== undefined) {
            actionItemUpdate.status = body.status;
            if (body.status === "completed" && !actionItemDoc.data()?.completedAt) {
              actionItemUpdate.completedAt = new Date().toISOString();
            } else if (body.status !== "completed") {
              actionItemUpdate.completedAt = null;
            }
          }
          if (body.priority !== undefined) {
            actionItemUpdate.priority = body.priority;
          }
          if (body.title !== undefined) {
            actionItemUpdate.title = body.title.trim();
          }
          if (body.description !== undefined) {
            actionItemUpdate.description = body.description?.trim() || null;
          }
          if (body.dueDate !== undefined) {
            actionItemUpdate.dueDate = body.dueDate || null;
          }
          await actionItemRef.update(actionItemUpdate);
        }
      } catch (syncError) {
        console.warn("Failed to sync with client action item:", syncError);
        // Don't fail the request if sync fails
      }
    }

    const updatedDoc = await priorityRef.get();
    const updatedData = updatedDoc.data()!;

    const updatedPriority: MasterPriority = {
      id: updatedDoc.id,
      userId: updatedData.userId,
      title: updatedData.title,
      description: updatedData.description || undefined,
      priority: updatedData.priority,
      status: updatedData.status,
      clientId: updatedData.clientId || undefined,
      clientActionItemId: updatedData.clientActionItemId || undefined,
      dueDate: updatedData.dueDate || undefined,
      createdAt: updatedData.createdAt,
      updatedAt: updatedData.updatedAt,
      completedAt: updatedData.completedAt || undefined,
    };

    return NextResponse.json({ priority: updatedPriority }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating priority:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update priority" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a master priority
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getFirebaseUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const priorityRef = adminDb.collection("masterPriorities").doc(id);
    const priorityDoc = await priorityRef.get();

    if (!priorityDoc.exists) {
      return NextResponse.json({ error: "Priority not found" }, { status: 404 });
    }

    const priorityData = priorityDoc.data();
    if (priorityData?.userId !== user.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await priorityRef.delete();

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting priority:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete priority" },
      { status: 500 }
    );
  }
}

