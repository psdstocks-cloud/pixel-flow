import { authOptions } from "../../../../lib/auth-options";
import { simulateSubscription } from "../../../../lib/billing";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

function absoluteUrl(path: string) {
  if (typeof window !== "undefined") return path;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}${path}`;
  return `http://localhost:${process.env.PORT ?? 3000}${path}`;
}

const returnUrl = absoluteUrl("/downloads");

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const priceId = typeof body?.priceId === 'string' ? body.priceId : null;

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!priceId) {
      return new NextResponse("Price ID is required", { status: 400 });
    }

    const result = simulateSubscription(priceId);

    return NextResponse.json({
      success: result.success,
      message: result.message,
      pointsAwarded: result.pointsAwarded,
      packageId: result.packageId,
      redirectUrl: returnUrl,
    });
  } catch (error) {
    console.log("[MOCK_SUBSCRIBE_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
