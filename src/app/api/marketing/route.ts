import { NextRequest, NextResponse } from "next/server";
import { getFirebaseUser } from "@/lib/auth-helpers";
import { adminDb } from "@/lib/firebase-admin";
import { MarketingMetrics, MarketingCampaign } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const user = await getFirebaseUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Query all marketing campaigns for this user
    const campaignsSnapshot = await adminDb
      .collection("marketingCampaigns")
      .where("userId", "==", user.uid)
      .get();

    const campaigns: MarketingCampaign[] = [];
    campaignsSnapshot.forEach((doc) => {
      const data = doc.data();
      campaigns.push({
        id: doc.id,
        name: data.name,
        platform: data.platform,
        status: data.status,
        spend: data.spend,
        impressions: data.impressions,
        clicks: data.clicks,
        conversions: data.conversions,
        startDate: data.startDate,
        endDate: data.endDate || undefined,
      });
    });

    // Calculate totals
    const totalSpend = campaigns.reduce((sum, c) => sum + c.spend, 0);
    const totalImpressions = campaigns.reduce(
      (sum, c) => sum + c.impressions,
      0
    );
    const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
    const totalConversions = campaigns.reduce(
      (sum, c) => sum + c.conversions,
      0
    );

    // Calculate traffic sources (this could be enhanced with actual analytics data)
    // For now, using mock data structure - can be replaced with real analytics integration
    const totalVisits = 12820; // Mock total - replace with real analytics
    const trafficSources = [
      { source: "Organic Search", visits: 5420, percentage: 42 },
      { source: "Paid Ads", visits: 3200, percentage: 25 },
      { source: "Social Media", visits: 2800, percentage: 22 },
      { source: "Direct", visits: 1400, percentage: 11 },
    ];

    const metrics: MarketingMetrics = {
      totalSpend,
      totalImpressions,
      totalClicks,
      totalConversions,
      campaigns,
      trafficSources,
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Error fetching marketing data:", error);
    return NextResponse.json(
      { error: "Failed to fetch marketing data" },
      { status: 500 }
    );
  }
}

