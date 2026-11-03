import { randomUUID } from "node:crypto";
import { z } from "zod";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { findPack } from "@/lib/pricing";
import { creem } from "@/lib/creem";
import { fail } from "@/lib/http/respond";

const bodySchema = z.object({
  packId: z.string(),
  locale: z.enum(["zh", "en"]).default("en"),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return fail("unauthorized", 401);

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  const pack = parsed.success ? findPack(parsed.data.packId) : undefined;
  if (!parsed.success || !pack) return fail("bad_request", 400);
  if (!env.paymentsEnabled) return fail("payments_unavailable", 503);

  try {
    const checkout = await creem().checkouts.create({
      productId: env.creemProductId,
      units: 1,
      // The pack price overrides the product's own price for this checkout.
      customPrice: pack.priceCents,
      requestId: `${user.id}:${pack.id}:${randomUUID()}`,
      customer: { email: user.email },
      // The webhook reads these to know whom to credit and how much.
      metadata: { userId: user.id, packId: pack.id, credits: String(pack.credits) },
      successUrl: `${env.appUrl}/account?checkout=success`,
    });
    if (!checkout.checkoutUrl) return fail("checkout_failed", 502);
    return NextResponse.json({ url: checkout.checkoutUrl });
  } catch (err) {
    console.error("creem checkout failed", err);
    return fail("checkout_failed", 502);
  }
}
