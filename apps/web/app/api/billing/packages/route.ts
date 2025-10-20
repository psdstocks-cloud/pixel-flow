import { authOptions } from "../../../../lib/auth-options";
import { listMockPackages } from "../../../../lib/billing";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const packages = listMockPackages();
    return NextResponse.json(packages);
  } catch (error) {
    console.error("[BILLING_PACKAGES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
