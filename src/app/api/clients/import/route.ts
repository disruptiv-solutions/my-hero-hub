import { NextRequest, NextResponse } from "next/server";
import { getFirebaseUser } from "@/lib/auth-helpers";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

type IncomingContact = {
  name?: string;
  email?: string;
  phone?: string | null;
  status?: "lead" | "active" | "closed";
  newsletterSubscribed?: boolean;
  notes?: string | null;
  events?: string[];
  eventName?: string;
};

export async function POST(request: NextRequest) {
  try {
    const user = await getFirebaseUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body || !Array.isArray(body.contacts)) {
      return NextResponse.json(
        { error: "Invalid payload. Expected { contacts: [...] }" },
        { status: 400 }
      );
    }

    const contacts: IncomingContact[] = body.contacts;
    if (contacts.length === 0) {
      return NextResponse.json({ created: 0 });
    }

    const batch = adminDb.batch();
    let created = 0;
    let updated = 0;

    for (const contact of contacts) {
      const name = (contact.name || "").trim();
      const email = (contact.email || "").trim();
      if (!name || !email) {
        continue;
      }

      // Normalize events array
      const events =
        Array.isArray(contact.events) && contact.events.length > 0
          ? contact.events
              .filter((e) => typeof e === "string" && e.trim())
              .map((e) => e.trim())
          : contact.eventName
          ? [String(contact.eventName).trim()]
          : [];

      // Check if client already exists by email for this user
      const existingSnap = await adminDb
        .collection("clients")
        .where("userId", "==", user.uid)
        .where("email", "==", email)
        .limit(1)
        .get();

      if (!existingSnap.empty) {
        const existingDoc = existingSnap.docs[0];
        const ref = adminDb.collection("clients").doc(existingDoc.id);
        const updateData: any = {};
        if (events.length > 0) {
          updateData.events = FieldValue.arrayUnion(...events);
        }
        if (contact.phone) updateData.phone = String(contact.phone);
        if (typeof contact.newsletterSubscribed === "boolean") {
          updateData.newsletterSubscribed = contact.newsletterSubscribed;
        }
        batch.update(ref, updateData);
        updated += 1;
        continue;
      }

      const docRef = adminDb.collection("clients").doc();
      batch.set(docRef, {
        userId: user.uid,
        name,
        email,
        phone: contact.phone ? String(contact.phone) : null,
        status: contact.status || "lead",
        value: null,
        createdDate: new Date().toISOString(),
        notes: contact.notes || null,
        projectCount: 0,
        newsletterSubscribed: Boolean(contact.newsletterSubscribed) || false,
        events,
      });
      created += 1;
    }

    if (created === 0) {
      return NextResponse.json(
        { error: "No valid rows (name and email required)" },
        { status: 400 }
      );
    }

    await batch.commit();
    return NextResponse.json({ created, updated });
  } catch (error) {
    console.error("Error importing clients:", error);
    return NextResponse.json(
      { error: "Failed to import clients" },
      { status: 500 }
    );
  }
}


