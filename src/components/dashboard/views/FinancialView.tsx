"use client";

import { useQuery } from "@tanstack/react-query";
import { getAuthHeaders } from "@/lib/api-helpers";
import { format } from "date-fns";
import { Transaction } from "@/types";
import { Card } from "@/components/ui/card";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const FinancialView = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["finances"],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/finances", { headers });
      if (!res.ok) throw new Error("Failed to fetch finances");
      return res.json();
    },
    refetchInterval: 5 * 60 * 1000,
  });

  // Mock chart data
  const revenueData = [
    { name: "Week 1", revenue: 12000, expenses: 3000 },
    { name: "Week 2", revenue: 15000, expenses: 3500 },
    { name: "Week 3", revenue: 18000, expenses: 4000 },
    { name: "Week 4", revenue: 20000, expenses: 4200 },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading financial data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Financial Overview</h2>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-900/40 to-green-800/20 border-green-700/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-green-300">Daily Revenue</div>
            <DollarSign className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            ${(data?.dailyRevenue || 0).toLocaleString()}
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs text-green-400">
            <ArrowUpRight className="w-3 h-3" />
            <span>+12% from yesterday</span>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 border-blue-700/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-blue-300">Weekly Revenue</div>
            <TrendingUp className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            ${(data?.weeklyRevenue || 0).toLocaleString()}
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs text-blue-400">
            <ArrowUpRight className="w-3 h-3" />
            <span>+8% from last week</span>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 border-purple-700/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-purple-300">Monthly Revenue</div>
            <TrendingUp className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            ${(data?.monthlyRevenue || 0).toLocaleString()}
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs text-purple-400">
            <ArrowUpRight className="w-3 h-3" />
            <span>+15% from last month</span>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-900/40 to-yellow-800/20 border-yellow-700/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-yellow-300">Pipeline Value</div>
            <DollarSign className="w-5 h-5 text-yellow-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            ${(data?.pipelineValue || 0).toLocaleString()}
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs text-yellow-400">
            <span>Pending revenue</span>
          </div>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card className="bg-gray-800 border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Revenue vs Expenses
        </h3>
        <ResponsiveContainer width="100%" height={300}>
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

      {/* Recent Transactions */}
      <Card className="bg-gray-800 border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Recent Transactions
        </h3>
        <div className="space-y-3">
          {data?.recentTransactions?.map((transaction: Transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-3 bg-gray-900 rounded-lg hover:bg-gray-750 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    transaction.type === "income"
                      ? "bg-green-900/40"
                      : "bg-red-900/40"
                  }`}
                >
                  {transaction.type === "income" ? (
                    <ArrowUpRight className="w-5 h-5 text-green-400" />
                  ) : (
                    <ArrowDownRight className="w-5 h-5 text-red-400" />
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
                    transaction.type === "income"
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {transaction.type === "income" ? "+" : "-"}$
                  {transaction.amount.toLocaleString()}
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
          ))}
        </div>
      </Card>
    </div>
  );
};

export default FinancialView;


