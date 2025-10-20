import { authOptions } from "../../../../lib/auth-options";
import { listMockPackages, simulateSubscription } from "../../../../lib/billing";
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
    let packageIdFromBody: string | null = null;
    try {
      const body = await req.json();
      if (body && typeof body.packageId === 'string') {
        packageIdFromBody = body.packageId;
      } else if (body && typeof body.priceId === 'string') {
        packageIdFromBody = body.priceId;
      }
    } catch {
      packageIdFromBody = null;
    }

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const packageId = packageIdFromBody ?? (() => {
      const searchParams = new URL(req.url).searchParams;
      const id = searchParams.get('packageId') || searchParams.get('priceId');
      return id && id.length > 0 ? id : null;
    })() ?? (() => {
      const mockPackages = listMockPackages();
      return mockPackages.length > 0 ? mockPackages[0].id : null;
    })();

    if (!packageId) {
      return new NextResponse("No billing packages available", { status: 400 });
    }

    const result = simulateSubscription(packageId);

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
