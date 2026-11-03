import "server-only";
import { cookies, headers } from "next/headers";
import { dictionaries, isLocale, type Locale } from "@/lib/i18n";

export async function getLocale(): Promise<Locale> {
  const fromCookie = (await cookies()).get("lang")?.value;
  if (isLocale(fromCookie)) return fromCookie;
  const accept = (await headers()).get("accept-language") ?? "";
  return /^zh|,\s*zh/i.test(accept) ? "zh" : "en";
}

export async function getDict() {
  const locale = await getLocale();
  return { locale, t: dictionaries[locale] };
}
