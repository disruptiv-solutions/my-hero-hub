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

    // Return an empty list of coupons
    // This can be enhanced to fetch actual coupons from Stripe if needed
    return NextResponse.json({
      coupons: [],
      tenantId: tenantId || null,
    });
  } catch (error) {
    console.error("Error fetching Stripe coupons:", error);
    return NextResponse.json(
      { error: "Failed to fetch Stripe coupons" },
      { status: 500 }
    );
  }
}

