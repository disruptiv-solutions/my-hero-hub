import { NextRequest, NextResponse } from "next/server";
import { getFirebaseUser } from "@/lib/auth-helpers";
import { adminDb } from "@/lib/firebase-admin";
import { Client, ClientTranscript } from "@/types";

const slugify = (str: string) =>
  String(str || "")
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const idOrSlug = decodeURIComponent(id);
    const user = await getFirebaseUser(_request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Try direct doc by ID first
    const directRef = adminDb.collection("clients").doc(idOrSlug);
    const directDoc = await directRef.get();
    if (directDoc.exists && directDoc.data()?.userId === user.uid) {
      const data = directDoc.data()!;
      const client: Client = {
        id: directDoc.id,
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
        transcripts: Array.isArray(data.transcripts) ? data.transcripts : [],
      };
      return NextResponse.json({ client });
    }

    // Otherwise, look up by slug or name for this user
    const slug = slugify(idOrSlug);
    let query = adminDb
      .collection("clients")
      .where("userId", "==", user.uid)
      .where("slug", "==", slug);
    let snap = await query.limit(1).get();

    if (snap.empty) {
      // Fallback: scan user's clients and match by slugified name
      const allForUser = await adminDb
        .collection("clients")
        .where("userId", "==", user.uid)
        .get();
      const matched = allForUser.docs.find((d) => slugify(d.data()?.name || "") === slug);
      if (!matched) {
        return NextResponse.json({ error: "Client not found" }, { status: 404 });
      }
      snap = { docs: [matched], empty: false, size: 1 } as any;
    }

    const doc = snap.docs[0];
    const data = doc.data();
    const client: Client = {
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
      newsletterSubscribed: data.newsletterSubscribed || false,
      events: Array.isArray(data.events) ? data.events : [],
      transcripts: Array.isArray(data.transcripts) ? data.transcripts : [],
    };

    return NextResponse.json({ client });
  } catch (error) {
    console.error("Error fetching client:", error);
    return NextResponse.json(
      { error: "Failed to fetch client" },
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
    const idOrSlug = decodeURIComponent(id);
    const user = await getFirebaseUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { content, title } = body;

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { error: "Transcript content is required" },
        { status: 400 }
      );
    }

    // Find the client document
    let clientRef = adminDb.collection("clients").doc(idOrSlug);
    let clientDoc = await clientRef.get();

    if (!clientDoc.exists || clientDoc.data()?.userId !== user.uid) {
      // Try to find by slug
      const slug = slugify(idOrSlug);
      const query = adminDb
        .collection("clients")
        .where("userId", "==", user.uid)
        .where("slug", "==", slug)
        .limit(1);
      const snap = await query.get();

      if (snap.empty) {
        // Fallback: scan user's clients
        const allForUser = await adminDb
          .collection("clients")
          .where("userId", "==", user.uid)
          .get();
        const matched = allForUser.docs.find(
          (d) => slugify(d.data()?.name || "") === slug
        );
        if (!matched) {
          return NextResponse.json(
            { error: "Client not found" },
            { status: 404 }
          );
        }
        clientRef = adminDb.collection("clients").doc(matched.id);
        clientDoc = await matched;
      } else {
        clientRef = adminDb.collection("clients").doc(snap.docs[0].id);
        clientDoc = snap.docs[0];
      }
    }

    const clientData = clientDoc.data();
    if (clientData?.userId !== user.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Create new transcript
    const newTranscript: ClientTranscript = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: content.trim(),
      title: title?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    // Get existing transcripts or initialize empty array
    const existingTranscripts = Array.isArray(clientData.transcripts)
      ? clientData.transcripts
      : [];

    // Add new transcript
    const updatedTranscripts = [...existingTranscripts, newTranscript];

    // Update client document
    await clientRef.update({
      transcripts: updatedTranscripts,
    });

    return NextResponse.json({
      success: true,
      transcript: newTranscript,
    });
  } catch (error) {
    console.error("Error adding transcript:", error);
    return NextResponse.json(
      { error: "Failed to add transcript" },
      { status: 500 }
    );
  }
}

// Helper function to find client document
async function findClientDocument(idOrSlug: string, userId: string) {
  // Try direct doc by ID first
  const directRef = adminDb.collection("clients").doc(idOrSlug);
  const directDoc = await directRef.get();
  if (directDoc.exists && directDoc.data()?.userId === userId) {
    return { ref: directRef, doc: directDoc };
  }

  // Try to find by slug
  const slug = slugify(idOrSlug);
  const query = adminDb
    .collection("clients")
    .where("userId", "==", userId)
    .where("slug", "==", slug)
    .limit(1);
  const snap = await query.get();

  if (!snap.empty) {
    return {
      ref: adminDb.collection("clients").doc(snap.docs[0].id),
      doc: snap.docs[0],
    };
  }

  // Fallback: scan user's clients
  const allForUser = await adminDb
    .collection("clients")
    .where("userId", "==", userId)
    .get();
  const matched = allForUser.docs.find(
    (d) => slugify(d.data()?.name || "") === slug
  );
  if (matched) {
    return {
      ref: adminDb.collection("clients").doc(matched.id),
      doc: matched,
    };
  }

  return null;
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const idOrSlug = decodeURIComponent(id);
    const user = await getFirebaseUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { transcriptId, content, title } = body;

    if (!transcriptId || !content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { error: "Transcript ID and content are required" },
        { status: 400 }
      );
    }

    const clientResult = await findClientDocument(idOrSlug, user.uid);
    if (!clientResult) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    const { ref: clientRef, doc: clientDoc } = clientResult;
    const clientData = clientDoc.data()!;

    if (clientData.userId !== user.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get existing transcripts
    const existingTranscripts = Array.isArray(clientData.transcripts)
      ? clientData.transcripts
      : [];

    // Find and update the transcript
    const transcriptIndex = existingTranscripts.findIndex(
      (t: ClientTranscript) => t.id === transcriptId
    );

    if (transcriptIndex === -1) {
      return NextResponse.json(
        { error: "Transcript not found" },
        { status: 404 }
      );
    }

    // Update the transcript
    const updatedTranscript: ClientTranscript = {
      ...existingTranscripts[transcriptIndex],
      content: content.trim(),
      title: title?.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };

    const updatedTranscripts = [...existingTranscripts];
    updatedTranscripts[transcriptIndex] = updatedTranscript;

    // Update client document
    await clientRef.update({
      transcripts: updatedTranscripts,
    });

    return NextResponse.json({
      success: true,
      transcript: updatedTranscript,
    });
  } catch (error) {
    console.error("Error updating transcript:", error);
    return NextResponse.json(
      { error: "Failed to update transcript" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const idOrSlug = decodeURIComponent(id);
    const user = await getFirebaseUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const transcriptId = searchParams.get("transcriptId");

    if (!transcriptId) {
      return NextResponse.json(
        { error: "Transcript ID is required" },
        { status: 400 }
      );
    }

    const clientResult = await findClientDocument(idOrSlug, user.uid);
    if (!clientResult) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    const { ref: clientRef, doc: clientDoc } = clientResult;
    const clientData = clientDoc.data()!;

    if (clientData.userId !== user.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get existing transcripts
    const existingTranscripts = Array.isArray(clientData.transcripts)
      ? clientData.transcripts
      : [];

    // Filter out the transcript to delete
    const updatedTranscripts = existingTranscripts.filter(
      (t: ClientTranscript) => t.id !== transcriptId
    );

    // Update client document
    await clientRef.update({
      transcripts: updatedTranscripts,
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Error deleting transcript:", error);
    return NextResponse.json(
      { error: "Failed to delete transcript" },
      { status: 500 }
    );
  }
}


