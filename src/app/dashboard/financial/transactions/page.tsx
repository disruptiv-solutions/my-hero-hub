"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useState } from "react";
import Link from "next/link";
import { Transaction } from "@/types";
import { getAuthHeaders } from "@/lib/api-helpers";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const currencyFormatter = (value: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);

const TransactionsPage = () => {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["transactions", startDate, endDate],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      const res = await fetch(`/api/finances/transactions?${params.toString()}`, {
        headers,
      });
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return res.json();
    },
    refetchInterval: false,
  });

  const transactions: Transaction[] = data?.transactions || [];
  const total = data?.total || transactions.length;

  return (
    <div className="space-y-6 px-4 pb-10 pt-4 md:px-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Transactions</h1>
          <p className="text-sm text-gray-400">View and filter all synced transactions.</p>
        </div>
        <Link href="/dashboard/financial" className="text-sm text-emerald-300 hover:text-emerald-200">
          ← Back to overview
        </Link>
      </div>

      <Card className="bg-gray-800 border-gray-700 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
          <div className="flex flex-col">
            <label className="text-xs text-gray-400" htmlFor="startDate">
              Start date
            </label>
            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-400" htmlFor="endDate">
              End date
            </label>
            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>
          <Button
            aria-label="Apply date range"
            disabled={isFetching}
            onClick={() => refetch()}
            className="bg-sky-500 text-black hover:bg-sky-400"
          >
            {isFetching ? "Loading..." : "Apply range"}
          </Button>
          <div className="text-sm text-gray-300 md:ml-auto">
            Total: <span className="font-semibold text-white">{total}</span>
          </div>
        </div>
      </Card>

      <Card className="bg-gray-800 border-gray-700 p-4">
        {isLoading ? (
          <div className="text-gray-400">Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="text-gray-400">No transactions found for this range.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-gray-200">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Date</th>
                  <th className="px-3 py-2 text-left font-semibold">Description</th>
                  <th className="px-3 py-2 text-left font-semibold">Type</th>
                  <th className="px-3 py-2 text-left font-semibold">Status</th>
                  <th className="px-3 py-2 text-left font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const isIncome = tx.type === "income";
                  const currency = tx.currency || "USD";
                  return (
                    <tr
                      key={tx.id}
                      className="border-b border-gray-700/60 last:border-none hover:bg-gray-900/70"
                    >
                      <td className="px-3 py-2">{format(new Date(tx.date), "MMM d, yyyy")}</td>
                      <td className="px-3 py-2">{tx.description}</td>
                      <td className="px-3 py-2 capitalize">{tx.type}</td>
                      <td className="px-3 py-2 capitalize">{tx.status}</td>
                      <td className="px-3 py-2 text-right font-semibold">
                        <span className={isIncome ? "text-green-400" : "text-red-400"}>
                          {isIncome ? "+" : "-"}
                          {currencyFormatter(Math.abs(tx.amount), currency)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default TransactionsPage;





