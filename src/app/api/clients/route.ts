import { NextRequest, NextResponse } from "next/server";
import { getFirebaseUser } from "@/lib/auth-helpers";
import { adminDb } from "@/lib/firebase-admin";
import { Client } from "@/types";

const slugify = (str: string) =>
  String(str || "")
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

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

    // Fetch analytics and counts for all clients in parallel
    const clientPromises = snapshot.docs.map(async (doc) => {
      const data = doc.data();
      const clientId = doc.id;

      let analytics = null;
      let actionItemCount = 0;

      try {
        // Get analytics (may fail if index doesn't exist yet)
        const analyticsSnapshot = await adminDb
          .collection("clientAnalytics")
          .where("clientId", "==", clientId)
          .where("userId", "==", user.uid)
          .orderBy("updatedAt", "desc")
          .limit(1)
          .get();
        
        if (!analyticsSnapshot.empty) {
          analytics = analyticsSnapshot.docs[0].data();
        }
      } catch (error) {
        // Index might not exist yet, skip analytics
        console.warn(`Analytics query failed for client ${clientId}:`, error);
      }

      try {
        // Get action items count
        const actionItemsSnapshot = await adminDb
          .collection("clientActionItems")
          .where("clientId", "==", clientId)
          .where("userId", "==", user.uid)
          .get();
        actionItemCount = actionItemsSnapshot.size;
      } catch (error) {
        console.warn(`Action items query failed for client ${clientId}:`, error);
      }

      // Get transcript count
      const transcripts = Array.isArray(data.transcripts) ? data.transcripts : [];

      return {
        id: clientId,
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        status: data.status,
        value: data.value || undefined,
        lastContact: data.lastContact || undefined,
        createdDate: data.createdDate,
        notes: data.notes || undefined,
        projectCount: data.projectCount || 0,
        newsletterSubscribed: data.newsletterSubscribed || false,
        events: Array.isArray(data.events) ? data.events : [],
        transcripts: transcripts,
        // Add stats
        analytics: analytics ? {
          sentiment: analytics.sentimentTrend?.current,
          engagement: analytics.engagementLevel?.level,
          nextBestAction: analytics.nextBestAction?.action,
        } : undefined,
        transcriptCount: transcripts.length,
        actionItemCount: actionItemCount > 0 ? actionItemCount : undefined,
      };
    });

    clients = await Promise.all(clientPromises);

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
      newsletterSubscribed: Boolean(body.newsletterSubscribed) || false,
      slug: slugify(body.name),
      events: Array.isArray(body.events)
        ? body.events.filter((e: any) => typeof e === "string" && e.trim()).map((e: string) => e.trim())
        : [],
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
    if (body.name !== undefined) updateData.slug = slugify(body.name);
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone || null;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.value !== undefined) updateData.value = body.value || null;
    if (body.notes !== undefined) updateData.notes = body.notes || null;
    if (body.lastContact !== undefined) updateData.lastContact = body.lastContact || null;
    if (body.projectCount !== undefined) updateData.projectCount = body.projectCount;
    if (body.newsletterSubscribed !== undefined) updateData.newsletterSubscribed = Boolean(body.newsletterSubscribed);
    if (Array.isArray(body.events)) {
      updateData.events = body.events
        .filter((e: any) => typeof e === "string" && e.trim())
        .map((e: string) => e.trim());
    }

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
      newsletterSubscribed: updatedData.newsletterSubscribed || false,
      events: Array.isArray(updatedData.events) ? updatedData.events : [],
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

export async function PATCH(request: NextRequest) {
  try {
    const user = await getFirebaseUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    if (!Array.isArray(body.ids) || body.ids.length === 0) {
      return NextResponse.json(
        { error: "Client IDs array required" },
        { status: 400 }
      );
    }

    // Verify all clients belong to user and update them
    const updatePromises = body.ids.map(async (id: string) => {
      const clientRef = adminDb.collection("clients").doc(id);
      const clientDoc = await clientRef.get();
      
      if (!clientDoc.exists) {
        throw new Error(`Client ${id} not found`);
      }

      const clientData = clientDoc.data();
      if (clientData?.userId !== user.uid) {
        throw new Error(`Client ${id} forbidden`);
      }

      const updateData: any = {};
      
      // Handle tags/events addition
      if (body.addTags && Array.isArray(body.addTags)) {
        const existingEvents = Array.isArray(clientData.events) ? clientData.events : [];
        const newTags = body.addTags
          .filter((tag: any) => typeof tag === "string" && tag.trim())
          .map((tag: string) => tag.trim());
        updateData.events = Array.from(new Set([...existingEvents, ...newTags]));
      }
      
      // Handle tags/events removal
      if (body.removeTags && Array.isArray(body.removeTags)) {
        const existingEvents = Array.isArray(clientData.events) ? clientData.events : [];
        const tagsToRemove = body.removeTags
          .filter((tag: any) => typeof tag === "string" && tag.trim())
          .map((tag: string) => tag.trim());
        updateData.events = existingEvents.filter((tag: string) => !tagsToRemove.includes(tag));
      }

      // Handle other bulk updates if needed
      if (body.status !== undefined) {
        updateData.status = body.status;
      }
      if (body.newsletterSubscribed !== undefined) {
        updateData.newsletterSubscribed = Boolean(body.newsletterSubscribed);
      }

      if (Object.keys(updateData).length > 0) {
        await clientRef.update(updateData);
      }

      return id;
    });

    await Promise.all(updatePromises);

    return NextResponse.json({ 
      success: true, 
      updated: body.ids.length 
    });
  } catch (error: any) {
    console.error("Error bulk updating clients:", error);
    return NextResponse.json(
      { error: error.message || "Failed to bulk update clients" },
      { status: 500 }
    );
  }
}

