import { z } from "zod";
import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { createSession, hashPassword } from "@/lib/auth";
import { env } from "@/lib/env";
import { fail } from "@/lib/http/respond";

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(200),
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("invalid_credentials_format", 400);

  const { email, password } = parsed.data;
  const free = env.freeCreditsOnSignup;
  const user = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(schema.users)
      .values({ email, passwordHash: await hashPassword(password), credits: free })
      .onConflictDoNothing({ target: schema.users.email })
      .returning({ id: schema.users.id });
    if (created && free > 0) {
      await tx
        .insert(schema.creditLedger)
        .values({ userId: created.id, delta: free, reason: "signup_bonus" });
    }
    return created;
  });
  if (!user) return fail("email_taken", 409);

  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
