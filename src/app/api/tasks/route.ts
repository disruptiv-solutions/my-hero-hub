import { NextRequest, NextResponse } from "next/server";
import { getFirebaseUser } from "@/lib/auth-helpers";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    const user = await getFirebaseUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's tasks from Firestore, ordered by creation date
    const tasksSnapshot = await adminDb
      .collection("tasks")
      .where("userId", "==", user.uid)
      .orderBy("createdAt", "desc")
      .get();

    const tasks = tasksSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ tasks });
  } catch (error: any) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks", details: error.message },
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
    const { title, priority, dueDate } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Task title is required" },
        { status: 400 }
      );
    }

    // Get current tasks count to set order
    const tasksSnapshot = await adminDb
      .collection("tasks")
      .where("userId", "==", user.uid)
      .get();

    const taskData = {
      userId: user.uid,
      title: title.trim(),
      completed: false,
      priority: priority || "medium",
      dueDate: dueDate || null,
      order: tasksSnapshot.size,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const taskRef = await adminDb.collection("tasks").add(taskData);

    return NextResponse.json({
      id: taskRef.id,
      ...taskData,
    });
  } catch (error: any) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task", details: error.message },
      { status: 500 }
    );
  }
}

