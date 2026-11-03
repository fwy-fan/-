import "server-only";
import sharp from "sharp";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

export class BadImageError extends Error {}

export interface PreparedPhoto {
  /** JPEG, longest side ≤ 1568px — the size Claude reads best. */
  forVision: Buffer;
  /** PNG, longest side ≤ 1536px — sent to the image model as the edit source. */
  forEdit: Buffer;
}

export async function preparePhoto(file: File | null): Promise<PreparedPhoto> {
  if (!file || typeof file === "string") throw new BadImageError("missing_photo");
  if (file.size > MAX_UPLOAD_BYTES) throw new BadImageError("photo_too_large");
  if (file.type && !ALLOWED.has(file.type)) throw new BadImageError("photo_type");

  const input = Buffer.from(await file.arrayBuffer());
  try {
    // .rotate() applies the EXIF orientation from phone cameras, and
    // re-encoding drops EXIF metadata such as GPS location.
    const base = sharp(input, { failOn: "error" }).rotate();
    const forVision = await base
      .clone()
      .resize(1568, 1568, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 88 })
      .toBuffer();
    const forEdit = await base
      .clone()
      .resize(1536, 1536, { fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer();
    return { forVision, forEdit };
  } catch {
    throw new BadImageError("photo_unreadable");
  }
}
