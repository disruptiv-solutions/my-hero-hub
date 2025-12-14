import { NextRequest, NextResponse } from "next/server";
import { getFirebaseUser } from "@/lib/auth-helpers";
import { adminDb } from "@/lib/firebase-admin";
import { Transaction, FinancialMetrics, BankAccount } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const user = await getFirebaseUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const startDate = startDateParam ? new Date(startDateParam) : null;
    const endDate = endDateParam ? new Date(endDateParam) : null;
    console.log("[FINANCES] fetch", {
      userId: user.uid,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
    });

    const userTransactionsSnapshot = await adminDb
      .collection("users")
      .doc(user.uid)
      .collection("transactions")
      .get();

    const legacyTransactionsSnapshot = await adminDb
      .collection("transactions")
      .where("userId", "==", user.uid)
      .get();

    const transactions: Transaction[] = [];
    const seen = new Set<string>();

    const addTransaction = (id: string, data: any) => {
      if (seen.has(id)) return;
      seen.add(id);
      transactions.push({
        id,
        accountId: data.accountId || undefined,
        clientId: data.clientId || undefined,
        amount: data.amount,
        currency: data.currency || undefined,
        date: data.date,
        type: data.type,
        status: data.status,
        description: data.description,
        category: data.category || undefined,
      });
    };

    userTransactionsSnapshot.forEach((doc) => addTransaction(doc.id, doc.data()));
    legacyTransactionsSnapshot.forEach((doc) => addTransaction(doc.id, doc.data()));
    const inRange = (dateString: string) => {
      const d = new Date(dateString);
      if (Number.isNaN(d.getTime())) return false;
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    };

    const filteredTransactions =
      startDate || endDate ? transactions.filter((t) => inRange(t.date)) : transactions;

    const bankAccountsSnapshot = await adminDb
      .collection("users")
      .doc(user.uid)
      .collection("bankAccounts")
      .get();

    const bankAccounts: BankAccount[] = bankAccountsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<BankAccount, "id">),
    }));

    // Calculate date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Calculate metrics
    const completedTransactions = filteredTransactions.filter(
      (t) => t.status === "completed" && t.type === "income"
    );

    const dailyRevenue = completedTransactions
      .filter((t) => new Date(t.date) >= today)
      .reduce((sum, t) => sum + t.amount, 0);

    const weeklyRevenue = completedTransactions
      .filter((t) => new Date(t.date) >= weekAgo)
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyRevenue = completedTransactions
      .filter((t) => new Date(t.date) >= monthStart)
      .reduce((sum, t) => sum + t.amount, 0);

    const pipelineValue = filteredTransactions
      .filter((t) => t.status === "pending" && t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalIncome = filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const recentTransactions = [...filteredTransactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 50);

    const metrics: FinancialMetrics & {
      bankAccounts: BankAccount[];
      totalTransactions: number;
      totalIncome: number;
      totalExpenses: number;
    } = {
      dailyRevenue,
      weeklyRevenue,
      monthlyRevenue,
      pipelineValue,
      recentTransactions,
      bankAccounts,
      totalTransactions: filteredTransactions.length,
      totalIncome,
      totalExpenses,
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Error fetching financial data:", error);
    return NextResponse.json(
      { error: "Failed to fetch financial data" },
      { status: 500 }
    );
  }
}

