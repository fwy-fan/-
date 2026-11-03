import "server-only";
import OpenAI, { toFile } from "openai";
import { env } from "@/lib/env";

/**
 * Nail try-on images come from OpenAI's image-editing model. This file is
 * the only place that generates images, so the image provider can be swapped
 * without touching the rest of the app.
 */
let _openai: OpenAI | null = null;
function openai() {
  return (_openai ??= new OpenAI());
}

export class ImageModelRejectedError extends Error {}

export async function paintNails(opts: {
  photoPng: Buffer;
  prompt: string;
}): Promise<{ data: Buffer; mimeType: string }> {
  const model = env.openaiImageModel;
  try {
    const result = await openai().images.edit({
      model,
      image: await toFile(opts.photoPng, "hand.png", { type: "image/png" }),
      prompt: opts.prompt,
      n: 1,
      size: "auto",
      quality: env.openaiImageQuality,
      output_format: "jpeg",
      output_compression: 90,
      // gpt-image-1 needs this to keep the original hand intact; newer models
      // preserve input detail by default.
      ...(model.startsWith("gpt-image-1") ? { input_fidelity: "high" as const } : {}),
    });
    const b64 = result.data?.[0]?.b64_json;
    if (!b64) throw new Error("image model returned no image");
    return { data: Buffer.from(b64, "base64"), mimeType: "image/jpeg" };
  } catch (err) {
    // A 400 from the image API here almost always means its content filter
    // declined the prompt or photo.
    if (err instanceof OpenAI.BadRequestError) {
      throw new ImageModelRejectedError(err.message);
    }
    throw err;
  }
}
