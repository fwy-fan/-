import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { fail } from "@/lib/http/respond";

export async function GET(_req: Request, ctx: RouteContext<"/api/images/[id]">) {
  const { id } = await ctx.params;
  if (!z.string().uuid().safeParse(id).success) return fail("not_found", 404);

  const user = await getCurrentUser();
  if (!user) return fail("unauthorized", 401);

  const row = await db.query.generations.findFirst({
    where: and(eq(schema.generations.id, id), eq(schema.generations.userId, user.id)),
    columns: { image: true, mimeType: true },
  });
  if (!row) return fail("not_found", 404);

  return new Response(new Uint8Array(row.image), {
    headers: {
      "Content-Type": row.mimeType,
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
