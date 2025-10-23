import { authOptions } from "../../../../lib/auth-options";
import {
  createMockPaymentSession,
  findMockPackage,
  listMockPackages,
} from "../../../../lib/billing";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const packageId = typeof body?.packageId === "string" ? body.packageId : null;

    const selectedPackage = packageId
      ? findMockPackage(packageId)
      : listMockPackages()[0];

    if (!selectedPackage) {
      return new NextResponse("No billing packages available", { status: 404 });
    }

    const paymentSession = createMockPaymentSession(session.user.id, selectedPackage.id);

    return NextResponse.json({
      session: paymentSession,
      package: selectedPackage,
    });
  } catch (error) {
    console.error("[MOCK_CREATE_PAYMENT_SESSION]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
