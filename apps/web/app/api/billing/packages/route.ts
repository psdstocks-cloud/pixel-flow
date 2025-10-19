import { authOptions } from "../../../../lib/auth-options";
import { stripe } from "../../../../lib/billing";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const prices = await stripe.prices.list({
      lookup_keys: ["premium_monthly", "premium_yearly"],
      expand: ["data.product"],
    });

    return NextResponse.json(prices.data);
  } catch (error) {
    console.error("[BILLING_PACKAGES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
