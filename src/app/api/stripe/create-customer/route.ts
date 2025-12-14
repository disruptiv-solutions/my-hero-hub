import { NextRequest, NextResponse } from "next/server";
import { getFirebaseUser } from "@/lib/auth-helpers";
import { getStripeClient } from "@/lib/stripe";
import { adminDb } from "@/lib/firebase-admin";
import { removeUndefined } from "@/lib/utils";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await getFirebaseUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email, name, metadata } = body;

    const stripe = getStripeClient();

    // Check if customer already exists
    const userRef = adminDb.collection("users").doc(user.uid);
    const userSnap = await userRef.get();
    const existingStripeCustomerId = userSnap.exists
      ? (userSnap.data()?.stripeCustomerId as string | undefined)
      : undefined;

    if (existingStripeCustomerId) {
      return NextResponse.json({
        customerId: existingStripeCustomerId,
        created: false,
      });
    }

    // Create Stripe customer
    const customer = await stripe.customers.create({
      email: email || user.email || undefined,
      name: name || user.name || undefined,
      metadata: {
        firebase_uid: user.uid,
        ...(metadata || {}),
      },
    });

    // Save customer ID to user document (remove undefined values)
    const updateData = removeUndefined({
      stripeCustomerId: customer.id,
      updatedAt: new Date().toISOString(),
    });

    await userRef.set(updateData, { merge: true });

    return NextResponse.json({
      customerId: customer.id,
      created: true,
    });
  } catch (error) {
    console.error("Error creating Stripe customer:", error);
    return NextResponse.json(
      { error: "Failed to create Stripe customer" },
      { status: 500 }
    );
  }
}

