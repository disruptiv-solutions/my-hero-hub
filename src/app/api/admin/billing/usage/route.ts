import { NextRequest, NextResponse } from "next/server";
import { getFirebaseUser } from "@/lib/auth-helpers";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getFirebaseUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get("tenantId");
    const period = searchParams.get("period") || "current";

    // Return a basic usage response
    // This can be enhanced to fetch actual usage data from your billing system
    return NextResponse.json({
      period,
      tenantId: tenantId || null,
      usage: {
        requests: 0,
        storage: 0,
        users: 0,
      },
      limits: {
        requests: 10000,
        storage: 1000000,
        users: 100,
      },
    });
  } catch (error) {
    console.error("Error fetching billing usage:", error);
    return NextResponse.json(
      { error: "Failed to fetch billing usage" },
      { status: 500 }
    );
  }
}

