import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";

/** Errors carry a stable `code` the client translates into the user's language. */
export function fail(code: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: code, ...extra }, { status });
}

export function parsePreferencesField<T extends z.ZodTypeAny>(
  schema: T,
  raw: FormDataEntryValue | null,
): z.infer<T> | null {
  try {
    const value = typeof raw === "string" && raw ? JSON.parse(raw) : {};
    const parsed = schema.safeParse(value);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
