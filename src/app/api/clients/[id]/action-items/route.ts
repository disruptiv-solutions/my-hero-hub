import { NextRequest, NextResponse } from "next/server";
import { getFirebaseUser } from "@/lib/auth-helpers";
import { adminDb } from "@/lib/firebase-admin";
import { ClientActionItem } from "@/types";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const clientId = decodeURIComponent(id);
    const user = await getFirebaseUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify client belongs to user
    const clientRef = adminDb.collection("clients").doc(clientId);
    const clientDoc = await clientRef.get();
    
    if (!clientDoc.exists) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const clientData = clientDoc.data();
    if (clientData?.userId !== user.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all action items for this client
    const actionItemsSnapshot = await adminDb
      .collection("clientActionItems")
      .where("clientId", "==", clientId)
      .where("userId", "==", user.uid)
      .orderBy("createdAt", "desc")
      .get();

    const actionItems: ClientActionItem[] = [];
    actionItemsSnapshot.forEach((doc) => {
      const data = doc.data();
      actionItems.push({
        id: doc.id,
        clientId: data.clientId,
        title: data.title,
        description: data.description || undefined,
        status: data.status,
        priority: data.priority,
        dueDate: data.dueDate || undefined,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        completedAt: data.completedAt || undefined,
        masterPriorityId: data.masterPriorityId || undefined,
      });
    });

    return NextResponse.json({ actionItems });
  } catch (error) {
    console.error("Error fetching action items:", error);
    return NextResponse.json(
      { error: "Failed to fetch action items" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const clientId = decodeURIComponent(id);
    const user = await getFirebaseUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, status, priority, dueDate } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Verify client belongs to user
    const clientRef = adminDb.collection("clients").doc(clientId);
    const clientDoc = await clientRef.get();
    
    if (!clientDoc.exists) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const clientData = clientDoc.data();
    if (clientData?.userId !== user.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Create new action item
    const now = new Date().toISOString();
    const actionItemData = {
      clientId,
      userId: user.uid,
      title: title.trim(),
      description: description?.trim() || null,
      status: status || "pending",
      priority: priority || "medium",
      dueDate: dueDate || null,
      createdAt: now,
      updatedAt: now,
      completedAt: status === "completed" ? now : null,
    };

    const actionItemRef = await adminDb
      .collection("clientActionItems")
      .add(actionItemData);

    // Create corresponding master priority
    let masterPriorityId: string | undefined;
    try {
      const priorityData = {
        userId: user.uid,
        title: actionItemData.title,
        description: actionItemData.description,
        priority: actionItemData.priority,
        status: actionItemData.status,
        clientId: clientId,
        clientActionItemId: actionItemRef.id,
        dueDate: actionItemData.dueDate,
        createdAt: now,
        updatedAt: now,
        completedAt: actionItemData.completedAt,
      };

      const masterPriorityRef = await adminDb
        .collection("masterPriorities")
        .add(priorityData);
      
      masterPriorityId = masterPriorityRef.id;

      // Update action item with master priority link
      await actionItemRef.update({ masterPriorityId });
    } catch (priorityError) {
      console.warn("Failed to create master priority:", priorityError);
      // Don't fail the request if master priority creation fails
    }

    const newActionItem: ClientActionItem = {
      id: actionItemRef.id,
      ...actionItemData,
      description: actionItemData.description || undefined,
      dueDate: actionItemData.dueDate || undefined,
      completedAt: actionItemData.completedAt || undefined,
      masterPriorityId,
    };

    return NextResponse.json({ actionItem: newActionItem }, { status: 201 });
  } catch (error) {
    console.error("Error creating action item:", error);
    return NextResponse.json(
      { error: "Failed to create action item" },
      { status: 500 }
    );
  }
}

