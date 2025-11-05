"use client";

import { useQuery } from "@tanstack/react-query";
import { getAuthHeaders } from "@/lib/api-helpers";
import { MarketingCampaign } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  MousePointer,
  Eye,
  Target,
  DollarSign,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const MarketingView = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["marketing"],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/marketing", { headers });
      if (!res.ok) throw new Error("Failed to fetch marketing");
      return res.json();
    },
    refetchInterval: 5 * 60 * 1000,
  });

  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading marketing data...</div>
      </div>
    );
  }

  const ctr = data?.totalClicks && data?.totalImpressions
    ? ((data.totalClicks / data.totalImpressions) * 100).toFixed(2)
    : 0;

  const conversionRate = data?.totalConversions && data?.totalClicks
    ? ((data.totalConversions / data.totalClicks) * 100).toFixed(2)
    : 0;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Marketing Metrics</h2>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 border-purple-700/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-purple-300">Total Spend</div>
            <DollarSign className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            ${(data?.totalSpend || 0).toLocaleString()}
          </div>
          <div className="text-xs text-purple-400 mt-2">This month</div>
        </Card>

        <Card className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 border-blue-700/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-blue-300">Impressions</div>
            <Eye className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {(data?.totalImpressions || 0).toLocaleString()}
          </div>
          <div className="text-xs text-blue-400 mt-2">
            CTR: {ctr}%
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-900/40 to-green-800/20 border-green-700/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-green-300">Clicks</div>
            <MousePointer className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {(data?.totalClicks || 0).toLocaleString()}
          </div>
          <div className="text-xs text-green-400 mt-2">
            From {data?.campaigns?.length || 0} campaigns
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-900/40 to-orange-800/20 border-orange-700/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-orange-300">Conversions</div>
            <Target className="w-5 h-5 text-orange-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {(data?.totalConversions || 0).toLocaleString()}
          </div>
          <div className="text-xs text-orange-400 mt-2">
            Rate: {conversionRate}%
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Sources */}
        <Card className="bg-gray-800 border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Traffic Sources
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data?.trafficSources || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.source}: ${entry.percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="visits"
              >
                {data?.trafficSources?.map((entry: any, index: number) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Campaign Performance */}
        <Card className="bg-gray-800 border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Campaign Performance
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={data?.campaigns || []}
              layout="horizontal"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" stroke="#9CA3AF" />
              <YAxis dataKey="name" type="category" stroke="#9CA3AF" width={120} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="conversions" fill="#10B981" name="Conversions" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Active Campaigns */}
      <Card className="bg-gray-800 border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Active Campaigns
        </h3>
        <div className="space-y-4">
          {data?.campaigns?.map((campaign: MarketingCampaign) => (
            <Card
              key={campaign.id}
              className="bg-gray-900 border-gray-700 p-4 hover:bg-gray-750 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-white">{campaign.name}</h4>
                  <div className="text-sm text-gray-400">{campaign.platform}</div>
                </div>
                <Badge
                  className={
                    campaign.status === "active"
                      ? "bg-green-900/40 text-green-400 border-green-700"
                      : "bg-gray-700/40 text-gray-400 border-gray-600"
                  }
                >
                  {campaign.status}
                </Badge>
              </div>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-xs text-gray-400">Spend</div>
                  <div className="text-sm font-semibold text-white">
                    ${campaign.spend.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Impressions</div>
                  <div className="text-sm font-semibold text-white">
                    {campaign.impressions.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Clicks</div>
                  <div className="text-sm font-semibold text-white">
                    {campaign.clicks.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Conversions</div>
                  <div className="text-sm font-semibold text-white">
                    {campaign.conversions}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default MarketingView;


