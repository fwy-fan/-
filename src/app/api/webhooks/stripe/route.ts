import type Stripe from "stripe";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { stripe } from "@/lib/stripe";
import { grantPurchasedCredits } from "@/lib/credits";
import { findPack } from "@/lib/pricing";

/**
 * Stripe calls this after payment. Credits are granted here, never on the
 * success redirect, because only the webhook is signed by Stripe.
 *
 * Subscribe the endpoint to:
 *   checkout.session.completed
 *   checkout.session.async_payment_succeeded
 */
export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) return new NextResponse("missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    const body = await req.text();
    event = stripe().webhooks.constructEvent(body, signature, env.stripeWebhookSecret);
  } catch (err) {
    console.error("stripe webhook signature check failed", err);
    return new NextResponse("bad signature", { status: 400 });
  }

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object;
    // For delayed methods, `completed` arrives unpaid; we grant on the later
    // `async_payment_succeeded` event instead.
    if (session.payment_status !== "paid") {
      return NextResponse.json({ received: true, granted: false });
    }

    const userId = session.metadata?.userId ?? session.client_reference_id;
    const pack = findPack(session.metadata?.packId ?? "");
    if (!userId || !pack) {
      console.error("checkout session missing metadata", session.id);
      return NextResponse.json({ received: true, granted: false });
    }

    const granted = await grantPurchasedCredits({
      userId,
      credits: pack.credits,
      ref: session.id,
      amountCents: session.amount_total,
      currency: session.currency,
    });
    return NextResponse.json({ received: true, granted });
  }

  return NextResponse.json({ received: true });
}
