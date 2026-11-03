import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { COSTS, InsufficientCreditsError, refundCredits, spendCredits } from "@/lib/credits";
import { BadImageError, preparePhoto } from "@/lib/image";
import { AiRefusalError, analyzeHand } from "@/lib/ai/analysis";
import { preferencesSchema } from "@/lib/styles";
import { fail, parsePreferencesField } from "@/lib/http/respond";

export const maxDuration = 120;

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return fail("unauthorized", 401);

  const form = await req.formData().catch(() => null);
  if (!form) return fail("bad_request", 400);
  const prefs = parsePreferencesField(preferencesSchema, form.get("prefs"));
  if (!prefs) return fail("bad_request", 400);
  const description = String(form.get("description") ?? "").slice(0, 2000).trim();

  let photo;
  try {
    photo = await preparePhoto(form.get("photo") as File | null);
  } catch (err) {
    if (err instanceof BadImageError) return fail(err.message, 400);
    throw err;
  }

  let credits: number;
  try {
    credits = await spendCredits(user.id, COSTS.analyze, "analyze");
  } catch (err) {
    if (err instanceof InsufficientCreditsError) return fail("no_credits", 402);
    throw err;
  }

  try {
    const analysis = await analyzeHand({
      photoJpeg: photo.forVision,
      prefs,
      description: description || undefined,
    });
    if (!analysis.isHandPhoto) {
      await refundCredits(user.id, COSTS.analyze, "refund_not_a_hand");
      return fail("not_a_hand", 422, { detail: analysis.photoProblem });
    }
    return NextResponse.json({ analysis, credits });
  } catch (err) {
    await refundCredits(user.id, COSTS.analyze, "refund_analyze_failed");
    if (err instanceof AiRefusalError) return fail("ai_refused", 422);
    console.error("analyze failed", err);
    return fail("ai_failed", 502);
  }
}
