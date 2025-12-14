import { NextRequest, NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";
import {
  refreshTransactionsForAccount,
  upsertBankAccount,
} from "@/lib/financial-connections";
import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

const findUserIdForAccount = async (accountId: string) => {
  const accountSnapshot = await adminDb
    .collectionGroup("bankAccounts")
    .where("stripeAccountId", "==", accountId)
    .limit(1)
    .get();

  if (accountSnapshot.empty) {
    return null;
  }

  const doc = accountSnapshot.docs[0];
  const pathSegments = doc.ref.path.split("/");
  return pathSegments.length >= 2 ? pathSegments[1] : null;
};

export async function POST(request: NextRequest) {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");

  if (!webhookSecret || !signature) {
    return NextResponse.json(
      { error: "Webhook configuration missing" },
      { status: 400 }
    );
  }

  let event: any;
  const payload = await request.text();

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err: any) {
    console.error("Stripe webhook signature verification failed:", err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    if (event.type === "financial_connections.account.created") {
      const account = event.data.object;
      const userId = await findUserIdForAccount(account.id);

      if (userId) {
        await upsertBankAccount({ account, userId, sessionId: null });
      }
    }

    if (event.type === "financial_connections.account.refreshed_balance") {
      const account = event.data.object;
      const userId = await findUserIdForAccount(account.id);

      if (userId) {
        await upsertBankAccount({ account, userId, sessionId: null });
      }
    }

    if (event.type === "financial_connections.account.refreshed_transactions") {
      const account = event.data.object;
      const userId = await findUserIdForAccount(account.id);

      if (userId) {
        await refreshTransactionsForAccount(stripe, account.id, userId);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error handling Stripe webhook:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}




