import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { COSTS, InsufficientCreditsError, refundCredits, spendCredits } from "@/lib/credits";
import { BadImageError, preparePhoto } from "@/lib/image";
import { AiRefusalError, designFromDescription, designSchema, type Design } from "@/lib/ai/claude";
import { ImageModelRejectedError, paintNails } from "@/lib/ai/image-model";
import { preferencesSchema } from "@/lib/styles";
import { fail, parsePreferencesField } from "@/lib/http/respond";

export const maxDuration = 300;

/**
 * Two modes:
 * - mode=design: paint one of the designs returned by /api/analyze.
 * - mode=custom: the customer described what they want; Claude turns the
 *   description into a precise design first, then it is painted.
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return fail("unauthorized", 401);

  const form = await req.formData().catch(() => null);
  if (!form) return fail("bad_request", 400);
  const prefs = parsePreferencesField(preferencesSchema, form.get("prefs"));
  if (!prefs) return fail("bad_request", 400);
  const mode = form.get("mode");
  const description = String(form.get("description") ?? "").slice(0, 2000).trim();

  let chosenDesign: Design | null = null;
  if (mode === "design") {
    chosenDesign = parsePreferencesField(designSchema, form.get("design"));
    if (!chosenDesign || chosenDesign.imagePrompt.length > 4000) {
      return fail("bad_request", 400);
    }
  } else if (mode === "custom") {
    if (description.length < 2) return fail("description_required", 400);
  } else {
    return fail("bad_request", 400);
  }

  let photo;
  try {
    photo = await preparePhoto(form.get("photo") as File | null);
  } catch (err) {
    if (err instanceof BadImageError) return fail(err.message, 400);
    throw err;
  }

  let credits: number;
  try {
    credits = await spendCredits(user.id, COSTS.generate, "generate");
  } catch (err) {
    if (err instanceof InsufficientCreditsError) return fail("no_credits", 402);
    throw err;
  }

  try {
    let design = chosenDesign;
    if (!design) {
      const result = await designFromDescription({
        photoJpeg: photo.forVision,
        prefs,
        description,
      });
      if ("problem" in result) {
        await refundCredits(user.id, COSTS.generate, "refund_infeasible");
        return fail("infeasible", 422, { detail: result.problem });
      }
      design = result.design;
    }

    const image = await paintNails({ photoPng: photo.forEdit, prompt: design.imagePrompt });
    const [row] = await db
      .insert(schema.generations)
      .values({
        userId: user.id,
        title: design.title,
        userDescription: description || null,
        imagePrompt: design.imagePrompt,
        design,
        image: image.data,
        mimeType: image.mimeType,
      })
      .returning({ id: schema.generations.id });

    return NextResponse.json({
      id: row.id,
      imageUrl: `/api/images/${row.id}`,
      design,
      credits,
    });
  } catch (err) {
    await refundCredits(user.id, COSTS.generate, "refund_generate_failed");
    if (err instanceof AiRefusalError || err instanceof ImageModelRejectedError) {
      return fail("ai_refused", 422);
    }
    console.error("generate failed", err);
    return fail("ai_failed", 502);
  }
}
