import { NextRequest, NextResponse } from "next/server";
import { getFirebaseUser } from "@/lib/auth-helpers";
import { adminDb } from "@/lib/firebase-admin";
import { Transaction, FinancialMetrics } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const user = await getFirebaseUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Query all transactions for this user
    const transactionsSnapshot = await adminDb
      .collection("transactions")
      .where("userId", "==", user.uid)
      .get();

    const transactions: Transaction[] = [];
    transactionsSnapshot.forEach((doc) => {
      const data = doc.data();
      transactions.push({
        id: doc.id,
        clientId: data.clientId || undefined,
        amount: data.amount,
        date: data.date,
        type: data.type,
        status: data.status,
        description: data.description,
        category: data.category || undefined,
      });
    });

    // Calculate date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Calculate metrics
    const completedTransactions = transactions.filter(
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

    const pipelineValue = transactions
      .filter((t) => t.status === "pending" && t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const recentTransactions = [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    const metrics: FinancialMetrics = {
      dailyRevenue,
      weeklyRevenue,
      monthlyRevenue,
      pipelineValue,
      recentTransactions,
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

