import { NextRequest, NextResponse } from "next/server";
import { getFirebaseUser } from "@/lib/auth-helpers";
import { adminDb } from "@/lib/firebase-admin";
import { Client } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const user = await getFirebaseUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    // Query Firestore
    let query = adminDb.collection("clients").where("userId", "==", user.uid);

    if (status) {
      query = query.where("status", "==", status);
    }

    const snapshot = await query.get();
    let clients: Client[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      clients.push({
        id: doc.id,
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        status: data.status,
        value: data.value || undefined,
        lastContact: data.lastContact || undefined,
        createdDate: data.createdDate,
        notes: data.notes || undefined,
        projectCount: data.projectCount || 0,
      });
    });

    // Client-side filtering for search (Firestore doesn't support case-insensitive search easily)
    if (search) {
      const searchLower = search.toLowerCase();
      clients = clients.filter(
        (c) =>
          c.name.toLowerCase().includes(searchLower) ||
          c.email.toLowerCase().includes(searchLower)
      );
    }

    // Sort by createdDate descending
    clients.sort((a, b) => 
      new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
    );

    return NextResponse.json({ clients });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { error: "Failed to fetch clients" },
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
    
    // Validate required fields
    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    const newClientData = {
      userId: user.uid,
      name: body.name,
      email: body.email,
      phone: body.phone || null,
      status: body.status || "lead",
      value: body.value || null,
      createdDate: new Date().toISOString(),
      notes: body.notes || null,
      projectCount: 0,
    };

    // Add to Firestore
    const docRef = await adminDb.collection("clients").add(newClientData);
    
    const newClient: Client = {
      id: docRef.id,
      ...newClientData,
      phone: newClientData.phone || undefined,
      value: newClientData.value || undefined,
      notes: newClientData.notes || undefined,
    };

    return NextResponse.json({ client: newClient }, { status: 201 });
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json(
      { error: "Failed to create client" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getFirebaseUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json(
        { error: "Client ID required" },
        { status: 400 }
      );
    }

    // Verify client belongs to user
    const clientRef = adminDb.collection("clients").doc(body.id);
    const clientDoc = await clientRef.get();
    
    if (!clientDoc.exists) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const clientData = clientDoc.data();
    if (clientData?.userId !== user.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update client
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone || null;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.value !== undefined) updateData.value = body.value || null;
    if (body.notes !== undefined) updateData.notes = body.notes || null;
    if (body.lastContact !== undefined) updateData.lastContact = body.lastContact || null;
    if (body.projectCount !== undefined) updateData.projectCount = body.projectCount;

    await clientRef.update(updateData);

    // Get updated client
    const updatedDoc = await clientRef.get();
    const updatedData = updatedDoc.data()!;
    
    const updatedClient: Client = {
      id: updatedDoc.id,
      name: updatedData.name,
      email: updatedData.email,
      phone: updatedData.phone || undefined,
      status: updatedData.status,
      value: updatedData.value || undefined,
      lastContact: updatedData.lastContact || undefined,
      createdDate: updatedData.createdDate,
      notes: updatedData.notes || undefined,
      projectCount: updatedData.projectCount || 0,
    };

    return NextResponse.json({ client: updatedClient });
  } catch (error) {
    console.error("Error updating client:", error);
    return NextResponse.json(
      { error: "Failed to update client" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getFirebaseUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Client ID required" },
        { status: 400 }
      );
    }

    // Verify client belongs to user
    const clientRef = adminDb.collection("clients").doc(id);
    const clientDoc = await clientRef.get();
    
    if (!clientDoc.exists) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const clientData = clientDoc.data();
    if (clientData?.userId !== user.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete client
    await clientRef.delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json(
      { error: "Failed to delete client" },
      { status: 500 }
    );
  }
}

