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


