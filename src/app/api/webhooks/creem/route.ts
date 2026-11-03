import { NextResponse } from "next/server";
import { constructWebhookEvent } from "creem/webhooks";
import { env } from "@/lib/env";
import { grantPurchasedCredits } from "@/lib/credits";
import { findPack } from "@/lib/pricing";

/** The parts of Creem's `checkout.completed` payload this route reads. */
interface CompletedCheckout {
  id: string;
  status?: string;
  product?: string | { id?: string };
  metadata?: { userId?: string; packId?: string };
  order?: {
    status?: string;
    amount?: number;
    amount_paid?: number;
    currency?: string;
  };
}

/**
 * Creem calls this after payment. Credits are granted here, never on the
 * success redirect, because only the webhook is signed by Creem.
 *
 * Register this URL in the Creem dashboard (Developers → Webhooks) and put
 * its signing secret in CREEM_WEBHOOK_SECRET.
 */
export async function POST(req: Request) {
  const body = await req.text();

  let event;
  try {
    event = await constructWebhookEvent<CompletedCheckout>(
      body,
      req.headers,
      env.creemWebhookSecret,
    );
  } catch (err) {
    console.error("creem webhook verification failed", err);
    return new NextResponse("bad signature", { status: 400 });
  }

  if (event.type !== "checkout.completed") {
    return NextResponse.json({ received: true });
  }

  const checkout = event.data;
  if (checkout.order?.status !== "paid") {
    return NextResponse.json({ received: true, granted: false });
  }

  const productId =
    typeof checkout.product === "string" ? checkout.product : checkout.product?.id;
  const userId = checkout.metadata?.userId;
  const pack = findPack(checkout.metadata?.packId ?? "");
  if (productId !== env.creemProductId || !userId || !pack) {
    // Sales of other products in the same Creem store are not credit packs.
    console.warn("creem checkout ignored", checkout.id, productId);
    return NextResponse.json({ received: true, granted: false });
  }

  const granted = await grantPurchasedCredits({
    userId,
    credits: pack.credits,
    ref: `creem:${checkout.id}`,
    amountCents: checkout.order.amount_paid ?? checkout.order.amount ?? null,
    currency: checkout.order.currency ?? null,
  });
  return NextResponse.json({ received: true, granted });
}
