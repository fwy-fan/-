import "server-only";
import { cookies } from "next/headers";
import { dictionaries, isLocale, type Locale } from "@/lib/i18n";

export async function getLocale(): Promise<Locale> {
  const fromCookie = (await cookies()).get("lang")?.value;
  if (isLocale(fromCookie)) return fromCookie;
  // English by default; Chinese only when the visitor picks it in the switcher.
  return "en";
}

export async function getDict() {
  const locale = await getLocale();
  return { locale, t: dictionaries[locale] };
}
