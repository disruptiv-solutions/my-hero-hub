import { NextRequest, NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";
import { getFirebaseUser } from "@/lib/auth-helpers";
import {
  upsertBankAccount,
  refreshTransactionsForAccount,
} from "@/lib/financial-connections";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const user = await getFirebaseUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId, accountIds, startDate, endDate } = await request.json();

    console.log("[FC SYNC] user", user.uid, {
      sessionId,
      accountIdsCount: Array.isArray(accountIds) ? accountIds.length : 0,
      startDate,
      endDate,
    });

    const transactedAt =
      startDate || endDate
        ? {
            ...(startDate
              ? { gte: Math.floor(new Date(startDate).getTime() / 1000) }
              : {}),
            ...(endDate
              ? { lte: Math.floor(new Date(endDate).getTime() / 1000) }
              : {}),
          }
        : undefined;

    const stripe = getStripeClient();
    let session = null as Awaited<
      ReturnType<(typeof stripe.financialConnections.sessions)["retrieve"]>
    > | null;

    let accounts =
      sessionId && typeof sessionId === "string"
        ? ((session = await stripe.financialConnections.sessions.retrieve(
            sessionId,
            {
              expand: ["accounts"],
            }
          )),
          session.accounts?.data ?? [])
        : [];

    // If no session provided, load linked accounts from Firestore
    if (!sessionId || accounts.length === 0) {
      const bankAccountsSnapshot = await adminDb
        .collection("users")
        .doc(user.uid)
        .collection("bankAccounts")
        .get();

      accounts = bankAccountsSnapshot.docs.map((doc) => ({
        id: doc.id,
        institution_name: doc.data()?.institutionName ?? "Bank",
        last4: doc.data()?.last4 ?? null,
        status: doc.data()?.status ?? "active",
      })) as any[];
    }

    console.log("[FC SYNC] accounts to process", accounts.length);

    // If accountIds specified, filter down
    const filteredAccounts =
      accountIds && Array.isArray(accountIds) && accountIds.length > 0
        ? accounts.filter((acct) => accountIds.includes(acct.id))
        : accounts;

    if (!filteredAccounts.length) {
      return NextResponse.json(
        { error: "No accounts returned from Stripe" },
        { status: 400 }
      );
    }

    for (const account of filteredAccounts) {
      const fullAccount =
        account.balance && account.balance.current
          ? account
          : await stripe.financialConnections.accounts.retrieve(account.id, {
              expand: ["balance"],
            });

      // Request a transactions refresh so listing succeeds; ignore errors
      try {
        await stripe.financialConnections.accounts.refresh(account.id, {
          features: ["transactions"],
        });
      } catch (refreshError) {
        console.warn("Unable to request transaction refresh", refreshError);
      }

      await upsertBankAccount({
        account: fullAccount,
        userId: user.uid,
        sessionId: session?.id ?? null,
      });

      await refreshTransactionsForAccount(stripe, account.id, user.uid, transactedAt);
    }

    console.log("[FC SYNC] completed", {
      accountsProcessed: filteredAccounts.length,
      transactedAt,
    });

    return NextResponse.json({
      accounts: filteredAccounts.map((account) => ({
        id: account.id,
        institutionName: account.institution_name ?? account.institutionName,
        last4: account.last4 ?? account.last4,
        status: account.status ?? "active",
      })),
    });
  } catch (error) {
    console.error("Error syncing Financial Connections accounts:", error);
    return NextResponse.json(
      { error: "Failed to sync Financial Connections accounts" },
      { status: 500 }
    );
  }
}

