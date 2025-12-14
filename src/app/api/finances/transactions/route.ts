import { NextRequest, NextResponse } from "next/server";
import { getFirebaseUser } from "@/lib/auth-helpers";
import { adminDb } from "@/lib/firebase-admin";
import { Transaction } from "@/types";

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

    const filtered =
      startDate || endDate ? transactions.filter((t) => inRange(t.date)) : transactions;

    const sorted = filtered.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return NextResponse.json({
      total: sorted.length,
      transactions: sorted,
    });
  } catch (error) {
    console.error("Error fetching transactions list:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}





