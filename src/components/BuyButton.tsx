"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { dictionaries, type Locale } from "@/lib/i18n";

export function BuyButton({
  packId,
  locale,
  loggedIn,
  highlight,
}: {
  packId: string;
  locale: Locale;
  loggedIn: boolean;
  highlight: boolean;
}) {
  const t = dictionaries[locale];
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function buy() {
    if (!loggedIn) {
      router.push("/login?next=/pricing");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packId, locale }),
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok && body.url) {
      window.location.href = body.url;
      return;
    }
    setBusy(false);
    setError(t.errors[body.error] ?? t.errors.checkout_failed);
  }

  return (
    <div className="space-y-2">
      <button type="button" onClick={buy} disabled={busy} className={`${highlight ? "btn-primary" : "btn-ghost"} w-full`}>
        {t.pricing.buy}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
