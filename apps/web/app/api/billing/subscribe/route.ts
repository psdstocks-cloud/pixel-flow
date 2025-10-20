import { authOptions } from "../../../../lib/auth-options";
import { findMockPaymentMethod, findMockPackage } from "../../../../lib/billing";
import {
  creditBalance,
  getOrCreateBalance,
} from "@pixel-flow/database";
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
    const body = await req.json().catch(() => ({}));
    const sessionId = typeof body?.sessionId === 'string' ? body.sessionId : null;
    const paymentMethodId = typeof body?.paymentMethodId === 'string' ? body.paymentMethodId : null;
    const packageId = typeof body?.packageId === 'string' ? body.packageId : null;

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!sessionId) {
      return new NextResponse("Payment session is required", { status: 400 });
    }

    if (!packageId) {
      return new NextResponse("Package selection is required", { status: 400 });
    }

    const selectedPackage = findMockPackage(packageId);
    if (!selectedPackage) {
      return new NextResponse("Selected package is no longer available", { status: 404 });
    }

    if (!paymentMethodId || !findMockPaymentMethod(paymentMethodId)) {
      return new NextResponse("Payment method is required", { status: 400 });
    }

    const balance = await creditBalance(session.user.id, selectedPackage.points);
    const now = new Date();
    const nextPaymentDue = new Date(now);
    if (selectedPackage.interval === 'year') {
      nextPaymentDue.setFullYear(now.getFullYear() + 1);
    } else {
      nextPaymentDue.setMonth(now.getMonth() + 1);
    }

    await getOrCreateBalance(session.user.id);

    return NextResponse.json({
      success: true,
      message: `Payment confirmed via mock gateway. ${selectedPackage.points} points added to your account.`,
      pointsAwarded: selectedPackage.points,
      package: selectedPackage,
      balance: {
        userId: balance.userId,
        points: balance.points,
      },
      nextPaymentDue: nextPaymentDue.toISOString(),
      redirectUrl: returnUrl,
    });
  } catch (error) {
    console.log("[MOCK_SUBSCRIBE_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
