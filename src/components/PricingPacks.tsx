"use client";

import { useState } from "react";
import { dictionaries, type Locale } from "@/lib/i18n";
import { BuyButton } from "@/components/BuyButton";

export interface PackView {
  id: string;
  credits: number;
  price: string;
  perCredit: string;
  highlight: boolean;
}

/** Credit packs as selectable cards: clicking a card makes it the active choice. */
export function PricingPacks({
  packs,
  locale,
  loggedIn,
  paymentsEnabled,
}: {
  packs: PackView[];
  locale: Locale;
  loggedIn: boolean;
  paymentsEnabled: boolean;
}) {
  const t = dictionaries[locale];
  const [selected, setSelected] = useState(packs.find((p) => p.highlight)?.id ?? packs[0]?.id);

  return (
    <div role="radiogroup" aria-label={t.pricing.title} className="mx-auto grid max-w-4xl gap-5 md:grid-cols-3">
      {packs.map((pack) => {
        const active = pack.id === selected;
        return (
          <div
            key={pack.id}
            role="radio"
            aria-checked={active}
            tabIndex={0}
            onClick={() => setSelected(pack.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSelected(pack.id);
              }
            }}
            className={`card relative cursor-pointer space-y-4 transition hover:border-accent focus-visible:outline-2 focus-visible:outline-accent ${
              active ? "border-accent ring-2 ring-accent" : ""
            }`}
          >
            {pack.highlight && (
              <span className="absolute -top-3 left-5 rounded-full bg-accent px-3 py-0.5 text-xs font-medium text-accent-contrast">
                {t.pricing.popular}
              </span>
            )}
            <p className="text-lg font-semibold">{t.pricing.packCredits(pack.credits)}</p>
            <p className="text-3xl font-semibold">{pack.price}</p>
            <p className="text-sm text-muted">
              {pack.perCredit} / {locale === "zh" ? "点" : "credit"}
            </p>
            <BuyButton
              packId={pack.id}
              locale={locale}
              loggedIn={loggedIn}
              highlight={active}
              disabled={!paymentsEnabled}
            />
          </div>
        );
      })}
    </div>
  );
}
