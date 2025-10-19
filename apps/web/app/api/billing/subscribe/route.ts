import { authOptions } from "../../../../lib/auth-options";
import { stripe } from "../../../../lib/billing";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

function absoluteUrl(path: string) {
  if (typeof window !== "undefined") return path;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}${path}`;
  return `http://localhost:${process.env.PORT ?? 3000}${path}`;
}

const returnUrl = absoluteUrl("/downloads");

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const priceId = searchParams.get("priceId");

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!priceId) {
      return new NextResponse("Price ID is required", { status: 400 });
    }

    const stripeSession = await stripe.checkout.sessions.create({
      success_url: returnUrl,
      cancel_url: returnUrl,
      payment_method_types: ["card"],
      mode: "subscription",
      billing_address_collection: "auto",
      customer_email: session.user.email!,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: session.user.id,
      },
    });

    return new NextResponse(JSON.stringify({ url: stripeSession.url }));
  } catch (error) {
    console.log("[STRIPE_SUBSCRIBE_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
