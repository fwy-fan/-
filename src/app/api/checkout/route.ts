import { z } from "zod";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { env } from "@/lib/env";
import { CURRENCY, findPack } from "@/lib/pricing";
import { stripe } from "@/lib/stripe";
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

  // Reuse one Stripe customer per user so receipts and history stay together.
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe().customers.create({
      email: user.email,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await db
      .update(schema.users)
      .set({ stripeCustomerId: customerId })
      .where(eq(schema.users.id, user.id));
  }

  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    client_reference_id: user.id,
    locale: parsed.data.locale === "zh" ? "zh" : "en",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: CURRENCY,
          unit_amount: pack.priceCents,
          product_data: {
            name:
              parsed.data.locale === "zh"
                ? `${pack.credits} 次美甲设计点数`
                : `${pack.credits} nail design credits`,
          },
        },
      },
    ],
    // The webhook reads these to know what to grant.
    metadata: { userId: user.id, packId: pack.id, credits: String(pack.credits) },
    success_url: `${env.appUrl}/account?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.appUrl}/pricing?checkout=cancelled`,
  });

  if (!session.url) return fail("checkout_failed", 502);
  return NextResponse.json({ url: session.url });
}
