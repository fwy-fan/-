"use client";

import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n";

export function LanguageSwitch({ locale }: { locale: Locale }) {
  const router = useRouter();
  const next: Locale = locale === "zh" ? "en" : "zh";
  return (
    <button
      type="button"
      className="text-sm text-muted hover:text-accent"
      onClick={() => {
        document.cookie = `lang=${next}; path=/; max-age=31536000; samesite=lax`;
        router.refresh();
      }}
    >
      {next === "en" ? "English" : "中文"}
    </button>
  );
}
