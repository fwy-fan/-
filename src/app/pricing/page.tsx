import { getDict } from "@/lib/locale";
import { getCurrentUser } from "@/lib/auth";
import { CREDIT_PACKS, formatPrice } from "@/lib/pricing";
import { COSTS } from "@/lib/credits";
import { env } from "@/lib/env";
import { BuyButton } from "@/components/BuyButton";

export default async function PricingPage(props: PageProps<"/pricing">) {
  const { locale, t } = await getDict();
  const user = await getCurrentUser();
  const { checkout } = await props.searchParams;

  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold">{t.pricing.title}</h1>
        <p className="text-muted">{t.pricing.subtitle}</p>
        <p className="text-sm text-muted">{t.pricing.costs(COSTS.analyze, COSTS.generate)}</p>
        {!user && <p className="text-sm font-medium text-accent">{t.pricing.free(env.freeCreditsOnSignup)}</p>}
      </div>
      {checkout === "cancelled" && (
        <p className="card mx-auto max-w-md text-center text-sm">{t.pricing.cancelled}</p>
      )}
      <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-3">
        {CREDIT_PACKS.map((pack) => (
          <div key={pack.id} className={`card relative space-y-4 ${pack.highlight ? "border-accent ring-1 ring-accent" : ""}`}>
            {pack.highlight && (
              <span className="absolute -top-3 left-5 rounded-full bg-accent px-3 py-0.5 text-xs font-medium text-accent-contrast">
                {t.pricing.popular}
              </span>
            )}
            <p className="text-lg font-semibold">{t.pricing.packCredits(pack.credits)}</p>
            <p className="text-3xl font-semibold">{formatPrice(pack.priceCents, locale)}</p>
            <p className="text-sm text-muted">
              {formatPrice(Math.round(pack.priceCents / pack.credits), locale)} / {locale === "zh" ? "点" : "credit"}
            </p>
            <BuyButton packId={pack.id} locale={locale} loggedIn={!!user} highlight={pack.highlight} />
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-muted">{t.pricing.secure}</p>
    </div>
  );
}
