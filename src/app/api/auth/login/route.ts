import { z } from "zod";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { createSession, verifyPassword } from "@/lib/auth";
import { fail } from "@/lib/http/respond";

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(200),
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("wrong_credentials", 401);

  const user = await db.query.users.findFirst({
    where: eq(schema.users.email, parsed.data.email),
  });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return fail("wrong_credentials", 401);
  }
  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
