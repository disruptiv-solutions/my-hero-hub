import { NextRequest, NextResponse } from "next/server";
import { getFirebaseUser } from "@/lib/auth-helpers";
import { adminDb } from "@/lib/firebase-admin";
import { MasterPriority } from "@/types";

// GET - Fetch all master priorities
export async function GET(request: NextRequest) {
  try {
    const user = await getFirebaseUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First, backfill any action items that don't have master priorities
    try {
      const actionItemsSnapshot = await adminDb
        .collection("clientActionItems")
        .where("userId", "==", user.uid)
        .get();

      const backfillPromises: Promise<void>[] = [];
      
      actionItemsSnapshot.forEach((doc) => {
        const data = doc.data();
        // If action item doesn't have a masterPriorityId, create one
        if (!data.masterPriorityId) {
          const backfillPromise = (async () => {
            try {
              const priorityData = {
                userId: user.uid,
                title: data.title,
                description: data.description || null,
                priority: data.priority || "medium",
                status: data.status || "pending",
                clientId: data.clientId || null,
                clientActionItemId: doc.id,
                dueDate: data.dueDate || null,
                createdAt: data.createdAt || new Date().toISOString(),
                updatedAt: data.updatedAt || new Date().toISOString(),
                completedAt: data.completedAt || null,
              };

              const masterPriorityRef = await adminDb
                .collection("masterPriorities")
                .add(priorityData);
              
              // Update action item with master priority link
              await doc.ref.update({ masterPriorityId: masterPriorityRef.id });
            } catch (error) {
              console.warn(`Failed to backfill master priority for action item ${doc.id}:`, error);
            }
          })();
          
          backfillPromises.push(backfillPromise);
        }
      });

      // Wait for all backfills to complete (but don't block if some fail)
      await Promise.allSettled(backfillPromises);
    } catch (backfillError) {
      console.warn("Error during backfill:", backfillError);
      // Continue even if backfill fails
    }

    // Now fetch all master priorities
    const snapshot = await adminDb
      .collection("masterPriorities")
      .where("userId", "==", user.uid)
      .orderBy("createdAt", "desc")
      .get();

    const priorities: MasterPriority[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      priorities.push({
        id: doc.id,
        userId: data.userId,
        title: data.title,
        description: data.description || undefined,
        priority: data.priority,
        status: data.status,
        clientId: data.clientId || undefined,
        clientActionItemId: data.clientActionItemId || undefined,
        dueDate: data.dueDate || undefined,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        completedAt: data.completedAt || undefined,
      });
    });

    return NextResponse.json({ priorities }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching priorities:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch priorities" },
      { status: 500 }
    );
  }
}

// POST - Create a new master priority
export async function POST(request: NextRequest) {
  try {
    const user = await getFirebaseUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, priority, clientId, clientActionItemId, dueDate } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const priorityData = {
      userId: user.uid,
      title: title.trim(),
      description: description?.trim() || null,
      priority: priority || "medium",
      status: "pending",
      clientId: clientId || null,
      clientActionItemId: clientActionItemId || null,
      dueDate: dueDate || null,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    };

    const docRef = await adminDb.collection("masterPriorities").add(priorityData);

    const newPriority: MasterPriority = {
      id: docRef.id,
      ...priorityData,
      description: priorityData.description || undefined,
      clientId: priorityData.clientId || undefined,
      clientActionItemId: priorityData.clientActionItemId || undefined,
      dueDate: priorityData.dueDate || undefined,
      completedAt: priorityData.completedAt || undefined,
    };

    return NextResponse.json({ priority: newPriority }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating priority:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create priority" },
      { status: 500 }
    );
  }
}

