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

    // Return a basic billing status response
    // This can be enhanced to fetch actual billing status from your system
    return NextResponse.json({
      tenantId: tenantId || null,
      status: "active",
      plan: "free",
      billingCycle: "monthly",
      nextBillingDate: null,
      amountDue: 0,
    });
  } catch (error) {
    console.error("Error fetching platform billing status:", error);
    return NextResponse.json(
      { error: "Failed to fetch platform billing status" },
      { status: 500 }
    );
  }
}

