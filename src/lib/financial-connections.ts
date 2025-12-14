import Stripe from "stripe";
import { adminDb } from "./firebase-admin";
import { Transaction } from "@/types";

type BalanceInfo = {
  currency?: string;
  current?: number;
  available?: number;
  asOf?: string;
};

type UpsertBankAccountParams = {
  account: Stripe.FinancialConnections.Account;
  userId: string;
  sessionId?: string;
};

type UpsertTransactionsParams = {
  transactions: Stripe.FinancialConnections.Transaction[];
  userId: string;
  accountId: string;
};

const centsToDollars = (value?: number | null) =>
  typeof value === "number" ? Number((value / 100).toFixed(2)) : undefined;

const mapBalance = (
  balance?: Stripe.FinancialConnections.Account.Balance
): BalanceInfo => {
  if (!balance) {
    return {};
  }

  const currency =
    balance.current && Object.keys(balance.current).length > 0
      ? Object.keys(balance.current)[0]
      : balance.available && Object.keys(balance.available).length > 0
      ? Object.keys(balance.available)[0]
      : undefined;

  const currentValue =
    currency && balance.current ? balance.current[currency] : undefined;
  const availableValue =
    currency && balance.available ? balance.available[currency] : undefined;

  return {
    currency: currency ?? null ?? undefined,
    current:
      currentValue === undefined ? 0 : centsToDollars(currentValue) ?? 0,
    available:
      availableValue === undefined ? 0 : centsToDollars(availableValue) ?? 0,
    asOf: balance.as_of
      ? new Date(balance.as_of * 1000).toISOString()
      : null ?? undefined,
  };
};

export const upsertBankAccount = async ({
  account,
  userId,
  sessionId,
}: UpsertBankAccountParams) => {
  const balance = mapBalance(account.balance);
  const bankAccountRef = adminDb
    .collection("users")
    .doc(userId)
    .collection("bankAccounts")
    .doc(account.id);

  await bankAccountRef.set(
    {
      stripeAccountId: account.id,
      userId,
      sessionId: sessionId ?? null,
      institutionName: account.institution_name || "Connected account",
      last4: account.last4 || null,
      category: account.category || null,
      status: account.status,
      permissions: account.permissions,
      supportedPaymentMethodTypes: account.supported_payment_method_types,
      balance: {
        currency: balance.currency ?? null,
        current: balance.current ?? 0,
        available: balance.available ?? 0,
        asOf: balance.asOf ?? null,
      },
      linkedAt: new Date().toISOString(),
      livemode: account.livemode,
    },
    { merge: true }
  );
};

const toAppTransaction = (
  transaction: Stripe.FinancialConnections.Transaction,
  accountId: string
): Transaction => {
  const amount = centsToDollars(transaction.amount) ?? 0;
  const transactionDate =
    transaction.status_transitions?.posted_at ||
    transaction.transacted_at ||
    transaction.updated;
  const postedDate = new Date((transactionDate ?? Date.now() / 1000) * 1000).toISOString();

  return {
    id: transaction.id,
    accountId,
    amount,
    currency: transaction.currency,
    date: postedDate,
    type: amount >= 0 ? "income" : "expense",
    status:
      transaction.status === "pending"
        ? "pending"
        : transaction.status === "posted"
        ? "completed"
        : "cancelled",
    description: transaction.description || "Bank transaction",
  };
};

export const upsertTransactions = async ({
  transactions,
  userId,
  accountId,
}: UpsertTransactionsParams) => {
  if (!transactions?.length) {
    return;
  }

  const batch = adminDb.batch();

  transactions.forEach((transaction) => {
    const txRef = adminDb
      .collection("users")
      .doc(userId)
      .collection("transactions")
      .doc(transaction.id);

    const appTx = toAppTransaction(transaction, accountId);

    batch.set(
      txRef,
      {
        ...appTx,
        userId,
        accountId,
        raw: {
          amount: transaction.amount,
          currency: transaction.currency,
          status: transaction.status,
        },
      },
      { merge: true }
    );
  });

  await batch.commit();
};

export const refreshTransactionsForAccount = async (
  stripe: Stripe,
  accountId: string,
  userId: string,
  transactedAt?: { gte?: number; lte?: number }
) => {
  const allTransactions: Stripe.FinancialConnections.Transaction[] = [];
  let startingAfter: string | undefined;

  try {
    while (true) {
      const page = await stripe.financialConnections.transactions.list({
        account: accountId,
        limit: 100,
        ...(transactedAt ? { transacted_at: transactedAt } : {}),
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      });

      allTransactions.push(...page.data);

      console.log("[FC TX] list", {
        accountId,
        pageCount: page.data.length,
        accumulated: allTransactions.length,
        hasMore: page.has_more,
        transactedAt,
      });

      if (!page.has_more || page.data.length === 0) {
        break;
      }
      startingAfter = page.data[page.data.length - 1].id;
    }
  } catch (error: any) {
    if (error?.code === "financial_connections_no_successful_transaction_refresh") {
      // No transactions yet; safe to skip
      return;
    }
    throw error;
  }

  if (allTransactions.length === 0) {
    console.log("[FC TX] no transactions to upsert", { accountId, transactedAt });
    return;
  }

  await upsertTransactions({
    transactions: allTransactions,
    userId,
    accountId,
  });

  console.log("[FC TX] upserted", {
    accountId,
    count: allTransactions.length,
  });
};

