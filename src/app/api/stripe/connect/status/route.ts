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

    // Return a basic status response
    // This can be enhanced to check actual Stripe Connect status if needed
    return NextResponse.json({
      connected: false,
      accountId: null,
      tenantId: tenantId || null,
    });
  } catch (error) {
    console.error("Error fetching Stripe Connect status:", error);
    return NextResponse.json(
      { error: "Failed to fetch Stripe Connect status" },
      { status: 500 }
    );
  }
}

