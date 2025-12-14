import { NextRequest, NextResponse } from "next/server";
import { getFirebaseUser } from "@/lib/auth-helpers";
import { getStripeClient } from "@/lib/stripe";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const user = await getFirebaseUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stripe = getStripeClient();

    const userRef = adminDb.collection("users").doc(user.uid);
    const userSnap = await userRef.get();
    const existingStripeCustomerId = userSnap.exists
      ? (userSnap.data()?.stripeCustomerId as string | undefined)
      : undefined;

    const stripeCustomer =
      existingStripeCustomerId ||
      (
        await stripe.customers.create({
          email: user.email ?? undefined,
          metadata: { firebase_uid: user.uid },
        })
      ).id;

    if (!existingStripeCustomerId) {
      await userRef.set(
        {
          stripeCustomerId: stripeCustomer,
        },
        { merge: true }
      );
    }

    const session = await stripe.financialConnections.sessions.create({
      permissions: ["balances", "ownership", "transactions"],
      prefetch: ["balances", "transactions"],
      filters: { countries: ["US"] },
      account_holder: {
        type: "customer",
        customer: stripeCustomer,
      },
    });

    if (!session.client_secret) {
      return NextResponse.json(
        { error: "Stripe did not return a client secret" },
        { status: 500 }
      );
    }

    await adminDb
      .collection("users")
      .doc(user.uid)
      .collection("financialConnectionsSessions")
      .doc(session.id)
      .set(
        {
          sessionId: session.id,
          clientSecret: session.client_secret,
          permissions: session.permissions,
          livemode: session.livemode,
          createdAt: new Date().toISOString(),
          status: session.status ?? "created",
        },
        { merge: true }
      );

    return NextResponse.json({
      clientSecret: session.client_secret,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("Error creating Financial Connections session:", error);
    return NextResponse.json(
      { error: "Unable to create Financial Connections session" },
      { status: 500 }
    );
  }
}

