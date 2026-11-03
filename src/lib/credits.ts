import "server-only";
import { and, eq, gte, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export const COSTS = {
  analyze: 1,
  generate: 2,
} as const;

export class InsufficientCreditsError extends Error {
  constructor(public needed: number) {
    super("Not enough credits");
  }
}

/** Atomically takes `amount` credits, or throws if the balance is too low. */
export async function spendCredits(
  userId: string,
  amount: number,
  reason: string,
): Promise<number> {
  return db.transaction(async (tx) => {
    const rows = await tx
      .update(schema.users)
      .set({ credits: sql`${schema.users.credits} - ${amount}` })
      .where(and(eq(schema.users.id, userId), gte(schema.users.credits, amount)))
      .returning({ credits: schema.users.credits });
    if (rows.length === 0) throw new InsufficientCreditsError(amount);
    await tx
      .insert(schema.creditLedger)
      .values({ userId, delta: -amount, reason });
    return rows[0].credits;
  });
}

/** Gives back credits taken for a request that then failed. */
export async function refundCredits(
  userId: string,
  amount: number,
  reason: string,
) {
  await db.transaction(async (tx) => {
    await tx
      .update(schema.users)
      .set({ credits: sql`${schema.users.credits} + ${amount}` })
      .where(eq(schema.users.id, userId));
    await tx
      .insert(schema.creditLedger)
      .values({ userId, delta: amount, reason });
  });
}

/**
 * Adds purchased credits exactly once per `ref` (the Creem checkout id). Returns false when this ref was already granted.
 */
export async function grantPurchasedCredits(opts: {
  userId: string;
  credits: number;
  ref: string;
  amountCents: number | null;
  currency: string | null;
}): Promise<boolean> {
  return db.transaction(async (tx) => {
    const inserted = await tx
      .insert(schema.creditLedger)
      .values({
        userId: opts.userId,
        delta: opts.credits,
        reason: "purchase",
        ref: opts.ref,
        amountCents: opts.amountCents,
        currency: opts.currency,
      })
      .onConflictDoNothing({ target: schema.creditLedger.ref })
      .returning({ id: schema.creditLedger.id });
    if (inserted.length === 0) return false;
    await tx
      .update(schema.users)
      .set({ credits: sql`${schema.users.credits} + ${opts.credits}` })
      .where(eq(schema.users.id, opts.userId));
    return true;
  });
}
