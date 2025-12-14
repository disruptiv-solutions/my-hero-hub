"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { loadStripe } from "@stripe/stripe-js";
import { format } from "date-fns";
import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, DollarSign, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BankAccount, Transaction } from "@/types";
import { getAuthHeaders } from "@/lib/api-helpers";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/hooks/use-toast";
import Link from "next/link";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

const timeframeOptions = [
  { id: "30d", label: "Last 30 days" },
  { id: "90d", label: "Last 90 days" },
  { id: "ytd", label: "Year to date" },
  { id: "1y", label: "Last 12 months" },
  { id: "all", label: "All time" },
];

const getRangeForTimeframe = (timeframe: string) => {
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  if (timeframe === "30d") {
    const start = new Date(today);
    start.setUTCDate(start.getUTCDate() - 29);
    return { startDate: start.toISOString(), endDate: today.toISOString() };
  }
  if (timeframe === "90d") {
    const start = new Date(today);
    start.setUTCDate(start.getUTCDate() - 89);
    return { startDate: start.toISOString(), endDate: today.toISOString() };
  }
  if (timeframe === "ytd") {
    const start = new Date(Date.UTC(today.getUTCFullYear(), 0, 1));
    return { startDate: start.toISOString(), endDate: today.toISOString() };
  }
  if (timeframe === "1y") {
    const start = new Date(today);
    start.setUTCFullYear(start.getUTCFullYear() - 1);
    return { startDate: start.toISOString(), endDate: today.toISOString() };
  }
  return { startDate: undefined, endDate: undefined };
};

const currencyFormatter = (value: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);

const FinancialView = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [timeframe, setTimeframe] = useState<string>("30d");

  const { data, isLoading } = useQuery({
    queryKey: ["finances", timeframe],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const { startDate, endDate } = getRangeForTimeframe(timeframe);
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      const res = await fetch(`/api/finances?${params.toString()}`, { headers });
      if (!res.ok) throw new Error("Failed to fetch finances");
      return res.json();
    },
    refetchInterval: 5 * 60 * 1000,
  });

  const { mutateAsync: handleConnectBank, isPending: isConnecting } =
    useMutation({
      mutationFn: async () => {
        const headers = await getAuthHeaders();
        const sessionResponse = await fetch(
          "/api/financial-connections/create-session",
          { method: "POST", headers }
        );

        if (!sessionResponse.ok) {
          throw new Error("Unable to start bank connection");
        }

        const sessionData = await sessionResponse.json();
        const { clientSecret, sessionId } = sessionData;

        if (!clientSecret || !sessionId) {
          throw new Error("Missing Stripe session details");
        }

        const stripe = await stripePromise;
        if (!stripe) {
          throw new Error("Stripe failed to load");
        }

        const result = await stripe.collectFinancialConnectionsAccounts({
          clientSecret,
        });

        if (result.error) {
          throw new Error(result.error.message || "Bank connection failed");
        }

        const syncResponse = await fetch(
          "/api/financial-connections/sync",
          {
            method: "POST",
            headers: {
              ...headers,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ sessionId }),
          }
        );

        if (!syncResponse.ok) {
          throw new Error("Unable to save linked account");
        }

        await queryClient.invalidateQueries({ queryKey: ["finances"] });
      },
      onSuccess: () => {
        toast({
          title: "Bank linked",
          description: "Balances and transactions will stay in sync.",
        });
      },
      onError: (error: unknown) => {
        const message =
          error instanceof Error ? error.message : "Bank connection failed";
        toast({
          title: "Connection issue",
          description: message,
          variant: "destructive",
        });
      },
    });

  const { mutateAsync: handleSyncRange, isPending: isSyncingRange } = useMutation({
    mutationFn: async () => {
      const headers = await getAuthHeaders();
      const { startDate, endDate } = getRangeForTimeframe(timeframe);
      const res = await fetch("/api/financial-connections/sync", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate,
          endDate,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to sync range");
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["finances"] });
      toast({
        title: "Transactions refreshed",
        description: "Your selected timeframe has been synced.",
      });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Sync failed";
      toast({
        title: "Sync issue",
        description: message,
        variant: "destructive",
      });
    },
  });

  const bankAccounts: BankAccount[] = data?.bankAccounts || [];
  const totalTransactions = data?.totalTransactions ?? (data?.recentTransactions?.length || 0);
  const totalIncome = data?.totalIncome ?? 0;
  const totalExpenses = data?.totalExpenses ?? 0;
  const net = totalIncome - totalExpenses;
  const revenueData = [
    { name: "Week 1", revenue: data?.weeklyRevenue || 0, expenses: (data?.weeklyRevenue || 0) * 0.25 },
    { name: "Week 2", revenue: (data?.weeklyRevenue || 0) * 1.05, expenses: (data?.weeklyRevenue || 0) * 0.3 },
    { name: "Week 3", revenue: (data?.weeklyRevenue || 0) * 1.15, expenses: (data?.weeklyRevenue || 0) * 0.33 },
    { name: "Week 4", revenue: (data?.weeklyRevenue || 0) * 1.2, expenses: (data?.weeklyRevenue || 0) * 0.36 },
  ];

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-400">Loading financial data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <h2 className="text-2xl font-bold text-white">Financial Overview</h2>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="timeframe" className="text-sm text-gray-300">
              Timeframe
            </label>
            <select
              id="timeframe"
              className="rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
              value={timeframe}
              onChange={(event) => setTimeframe(event.target.value)}
            >
              {timeframeOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              aria-label="Sync selected timeframe"
              disabled={isSyncingRange}
              onClick={() => handleSyncRange()}
              className="bg-sky-500 text-black hover:bg-sky-400"
            >
              {isSyncingRange ? "Syncing..." : "Sync timeframe"}
            </Button>
            <Button
              aria-label="Connect bank account"
              disabled={isConnecting}
              onClick={() => handleConnectBank()}
              className="bg-emerald-500 text-black hover:bg-emerald-400"
            >
              {isConnecting ? "Connecting..." : "Connect bank account"}
            </Button>
            <Link
              href="/dashboard/financial/transactions"
              className="rounded-md bg-gray-700 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-600"
            >
              View all transactions
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-green-900/40 to-green-800/20 border-green-700/50 p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm text-green-300">Daily Revenue</div>
            <DollarSign className="h-5 w-5 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {currencyFormatter(data?.dailyRevenue || 0)}
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-green-400">
            <ArrowUpRight className="h-3 w-3" />
            <span>Auto-updated</span>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 border-blue-700/50 p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm text-blue-300">Weekly Revenue</div>
            <TrendingUp className="h-5 w-5 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {currencyFormatter(data?.weeklyRevenue || 0)}
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-blue-400">
            <ArrowUpRight className="h-3 w-3" />
            <span>Last 7 days</span>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 border-purple-700/50 p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm text-purple-300">Monthly Revenue</div>
            <TrendingUp className="h-5 w-5 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {currencyFormatter(data?.monthlyRevenue || 0)}
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-purple-400">
            <ArrowUpRight className="h-3 w-3" />
            <span>Month to date</span>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-900/40 to-yellow-800/20 border-yellow-700/50 p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm text-yellow-300">Pipeline Value</div>
            <DollarSign className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {currencyFormatter(data?.pipelineValue || 0)}
          </div>
          <div className="mt-2 text-xs text-yellow-300">Pending revenue</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="bg-gray-800 border-gray-700 p-4">
          <div className="text-sm text-gray-300">Range Income</div>
          <div className="text-2xl font-bold text-white">
            {currencyFormatter(totalIncome)}
          </div>
        </Card>
        <Card className="bg-gray-800 border-gray-700 p-4">
          <div className="text-sm text-gray-300">Range Expenses</div>
          <div className="text-2xl font-bold text-white">
            {currencyFormatter(totalExpenses)}
          </div>
        </Card>
        <Card className="bg-gray-800 border-gray-700 p-4">
          <div className="text-sm text-gray-300">Net (Income - Expenses)</div>
          <div
            className={`text-2xl font-bold ${
              net >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {currencyFormatter(net)}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="bg-gray-800 border-gray-700 p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">
            Linked Accounts
          </h3>
          <div className="space-y-3">
            {bankAccounts.length === 0 && (
              <div className="rounded-md border border-dashed border-gray-700 p-4 text-sm text-gray-400">
                No bank accounts linked yet. Connect a bank to view balances and
                transactions.
              </div>
            )}
            {bankAccounts.map((account) => (
              <div
                key={account.id}
                className="flex items-start justify-between rounded-lg border border-gray-700 bg-gray-900 p-3"
                tabIndex={0}
                aria-label={`Bank account ${account.institutionName || "bank"} ending in ${account.last4 || "unknown"}`}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                  }
                }}
              >
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-white">
                    {account.institutionName || "Bank account"}
                  </div>
                  <div className="text-xs text-gray-400">
                    {account.last4 ? `•••• ${account.last4}` : "Account linked"}
                  </div>
                  <div className="text-xs text-gray-400">
                    Status: {account.status ?? "active"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-white">
                    {currencyFormatter(
                      account.balance?.current || 0,
                      account.balance?.currency || "USD"
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    Available:{" "}
                    {currencyFormatter(
                      account.balance?.available || 0,
                      account.balance?.currency || "USD"
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="bg-gray-800 border-gray-700 p-6 lg:col-span-2">
          <h3 className="mb-4 text-lg font-semibold text-white">
          Revenue vs Expenses
        </h3>
          <ResponsiveContainer width="100%" height={280}>
          <BarChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1F2937",
                border: "1px solid #374151",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Bar dataKey="revenue" fill="#10B981" name="Revenue" />
            <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
      </div>

      <Card className="bg-gray-800 border-gray-700 p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">
          Recent Transactions
          {totalTransactions > 50 && (
            <span className="ml-2 text-xs text-gray-400">
              Showing 50 of {totalTransactions}
            </span>
          )}
        </h3>
        <div className="space-y-3">
          {data?.recentTransactions?.map((transaction: Transaction) => {
            const currency = transaction.currency || "USD";
            const isIncome = transaction.type === "income";
            return (
            <div
              key={transaction.id}
                className="flex items-center justify-between rounded-lg bg-gray-900 p-3 transition-colors hover:bg-gray-750"
            >
              <div className="flex items-center gap-3">
                <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      isIncome ? "bg-green-900/40" : "bg-red-900/40"
                  }`}
                >
                    {isIncome ? (
                      <ArrowUpRight className="h-5 w-5 text-green-400" />
                  ) : (
                      <ArrowDownRight className="h-5 w-5 text-red-400" />
                  )}
                </div>
                <div>
                  <div className="font-medium text-white">
                    {transaction.description}
                  </div>
                  <div className="text-xs text-gray-400">
                    {format(new Date(transaction.date), "MMM d, yyyy")}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`text-lg font-semibold ${
                      isIncome ? "text-green-400" : "text-red-400"
                  }`}
                >
                    {isIncome ? "+" : "-"}
                    {currencyFormatter(Math.abs(transaction.amount), currency)}
                </div>
                <div
                  className={`text-xs ${
                    transaction.status === "completed"
                      ? "text-green-400"
                      : transaction.status === "pending"
                      ? "text-yellow-400"
                      : "text-gray-400"
                  }`}
                >
                  {transaction.status}
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

export default FinancialView;



