import "server-only";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { ResponseInputItem } from "openai/resources/responses/responses";
import { z } from "zod";
import { env } from "@/lib/env";
import { describePreferences, type Preferences } from "@/lib/styles";

let _openai: OpenAI | null = null;
function openai() {
  // Created lazily so builds succeed without API keys present.
  return (_openai ??= new OpenAI());
}

export class AiRefusalError extends Error {}

// ---------------------------------------------------------------------------
// Hand analysis + recommendations
// ---------------------------------------------------------------------------

const colorSchema = z.object({
  name: z.string().describe("Colour name in the customer's language"),
  hex: z.string().describe("Hex colour such as #A3122F"),
});

export const designSchema = z.object({
  title: z.string().describe("Short design name in the customer's language"),
  description: z
    .string()
    .describe("2-3 sentences describing the look, in the customer's language"),
  whyItSuits: z
    .string()
    .describe(
      "Why it flatters this hand: skin depth/undertone, nail bed, finger shape. Customer's language.",
    ),
  colors: z.array(colorSchema),
  nailShape: z.string().describe("e.g. short squoval, almond, square"),
  nailLength: z.enum(["natural", "short", "medium", "long"]),
  finish: z.string().describe("e.g. glossy, matte, chrome, cat-eye, jelly"),
  maintenance: z.enum(["low", "medium", "high"]),
  tags: z.array(z.string()),
  imagePrompt: z
    .string()
    .describe(
      "Detailed English instruction for an image-editing model that paints exactly this design onto the nails in the customer's photo.",
    ),
});
export type Design = z.infer<typeof designSchema>;

export const analysisSchema = z.object({
  isHandPhoto: z
    .boolean()
    .describe("True only if the photo clearly shows at least one human hand with visible nails"),
  photoProblem: z
    .string()
    .nullable()
    .describe("If the photo is unusable or poor (blurry, nails hidden, not a hand), say why in the customer's language; otherwise null"),
  hand: z.object({
    monkSkinTone: z
      .number()
      .int()
      .describe("Estimated skin depth on the 10-point Monk Skin Tone scale, 1 lightest to 10 deepest"),
    undertone: z.enum(["cool", "warm", "neutral", "olive"]),
    nailBedWidth: z.enum(["narrow", "average", "wide"]),
    nailBedLength: z.enum(["short", "average", "long"]),
    fingerShape: z.enum(["slender", "average", "broad", "short"]),
    currentNailLength: z.enum(["very short", "short", "medium", "long"]),
    currentNailShape: z.string(),
    nailCondition: z
      .string()
      .describe("Brief, kind notes on nail and cuticle condition, in the customer's language"),
  }),
  summary: z
    .string()
    .describe("Friendly 2-4 sentence summary of the hand and the colour/shape strategy, in the customer's language"),
  recommendations: z.array(designSchema).describe("Exactly 4 distinct designs"),
});
export type HandAnalysis = z.infer<typeof analysisSchema>;

const ANALYSIS_SYSTEM = `You are a senior nail artist and colour consultant who serves an international clientele of every gender, age and skin tone.

You look at a photo of a customer's hand and recommend nail designs that will genuinely flatter it.

How you work:
- Judge colour harmony from the skin you can actually see: its depth (Monk Skin Tone scale 1-10) and undertone. Never guess or mention the customer's race, ethnicity or nationality. If the customer states their tone, trust them.
- Know how colours read on different depths. On lighter skin, very pale nudes can wash out and cool pinks, berries and soft neutrals often glow. On medium and olive skin, warm nudes, terracotta, olive and gold are strong. On deep and rich skin, high-contrast brights, jewel tones, metallic gold, true reds and deep nudes chosen to match the wearer's depth (not beige that turns chalky) look striking. Always match "nude" to the wearer's own depth.
- Use the nail bed and finger shape: wide or short nail beds look longer with oval/almond shapes and vertical details; long slender fingers carry almost any shape.
- Respect the customer's chosen style direction, region, occasion and length. A "masculine" direction means real men's nail care and men's nail art, done with the same craft as any other set.
- Regional notes are taste inspiration the customer asked for, not rules.
- Make the 4 recommendations clearly different from each other (e.g. one safe everyday option, one trend-forward option from the chosen region, one that plays to the skin tone, one bolder statement), while all fitting the customer's choices.
- Write customer-facing text in the requested language. Write every imagePrompt in English.

imagePrompt rules (it goes to an image-editing model together with the customer's original photo):
- Start with: "Edit this photo: apply a professional manicure to the fingernails."
- Describe shape, length, base colour(s) with hex codes, finish, and any art placement nail by nail if it varies (e.g. "accent on the ring finger").
- End with: "Keep the hand, fingers, skin tone, skin texture, pose, jewellery, lighting and background exactly as in the original photo. Only the nails change. Photorealistic salon result."
- No text, watermarks or extra hands.`;

/** One user turn holding the hand photo followed by the text request. */
function userInput(photoJpeg: Buffer, text: string): ResponseInputItem[] {
  return [
    {
      role: "user",
      content: [
        {
          type: "input_image",
          detail: "high",
          image_url: `data:image/jpeg;base64,${photoJpeg.toString("base64")}`,
        },
        { type: "input_text", text },
      ],
    },
  ];
}

/** True when the model declined instead of answering. */
function refused(output: OpenAI.Responses.ResponseOutputItem[]) {
  return output.some(
    (item) =>
      item.type === "message" && item.content.some((c) => c.type === "refusal"),
  );
}

function localeName(locale: Preferences["locale"]) {
  return locale === "zh" ? "Simplified Chinese" : "English";
}

export async function analyzeHand(opts: {
  photoJpeg: Buffer;
  prefs: Preferences;
  description?: string;
}): Promise<HandAnalysis> {
  const userText = [
    `Customer's language: ${localeName(opts.prefs.locale)}.`,
    describePreferences(opts.prefs),
    opts.description
      ? `Customer's own wishes (may be in any language):\n<wishes>\n${opts.description}\n</wishes>`
      : "The customer has not described any wishes; recommend freely within their choices.",
    "Analyse the hand in the photo and give exactly 4 recommendations.",
  ].join("\n\n");

  const response = await openai().responses.parse({
    model: env.openaiModel,
    reasoning: { effort: "medium" },
    instructions: ANALYSIS_SYSTEM,
    input: userInput(opts.photoJpeg, userText),
    text: { format: zodTextFormat(analysisSchema, "hand_analysis") },
  });

  if (refused(response.output)) throw new AiRefusalError("analysis_refused");
  if (!response.output_parsed) {
    throw new Error(`analysis_unparsed (status=${response.status})`);
  }
  // The SDK has already validated this against the schema; re-parsing gives
  // TypeScript the concrete type, which the SDK's inference loses here.
  const result = analysisSchema.parse(response.output_parsed);
  result.hand.monkSkinTone = Math.min(10, Math.max(1, result.hand.monkSkinTone));
  result.recommendations = result.recommendations.slice(0, 4);
  return result;
}

// ---------------------------------------------------------------------------
// Customer description -> image-edit prompt
// ---------------------------------------------------------------------------

const customDesignSchema = z.object({
  feasible: z
    .boolean()
    .describe("False if the request is not a nail design or cannot be shown on nails"),
  problem: z
    .string()
    .nullable()
    .describe("If not feasible, explain briefly in the customer's language; otherwise null"),
  design: designSchema,
});

const CUSTOM_SYSTEM = `You are a senior nail artist. A customer has described the nail design they want, sometimes vaguely and in any language. Turn it into a precise design that matches what they asked for as closely as possible — their wishes come first; only fill in details they left open, using the photo (skin depth and undertone, nail beds) and their chosen style direction, region and occasion.

Never guess or mention the customer's race, ethnicity or nationality. Customer-facing fields go in the requested language; imagePrompt is always English and follows these rules:
- Start with: "Edit this photo: apply a professional manicure to the fingernails."
- Describe shape, length, base colour(s) with hex codes, finish, and art placement nail by nail where it varies.
- End with: "Keep the hand, fingers, skin tone, skin texture, pose, jewellery, lighting and background exactly as in the original photo. Only the nails change. Photorealistic salon result."
- No text, watermarks or extra hands.`;

export async function designFromDescription(opts: {
  photoJpeg: Buffer;
  prefs: Preferences;
  description: string;
}): Promise<{ design: Design } | { problem: string }> {
  const response = await openai().responses.parse({
    model: env.openaiModel,
    reasoning: { effort: "low" },
    instructions: CUSTOM_SYSTEM,
    input: userInput(
      opts.photoJpeg,
      [
        `Customer's language: ${localeName(opts.prefs.locale)}.`,
        describePreferences(opts.prefs),
        `The customer wants:\n<wishes>\n${opts.description}\n</wishes>`,
      ].join("\n\n"),
    ),
    text: { format: zodTextFormat(customDesignSchema, "custom_design") },
  });

  if (refused(response.output)) throw new AiRefusalError("design_refused");
  if (!response.output_parsed) {
    throw new Error(`design_unparsed (status=${response.status})`);
  }
  const out = customDesignSchema.parse(response.output_parsed);
  if (!out.feasible) return { problem: out.problem ?? "" };
  return { design: out.design };
}
