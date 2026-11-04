import { getDict } from "@/lib/locale";
import { getCurrentUser } from "@/lib/auth";
import { CREDIT_PACKS, formatPrice } from "@/lib/pricing";
import { COSTS } from "@/lib/credits";
import { env } from "@/lib/env";
import { PricingPacks } from "@/components/PricingPacks";

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
      {!env.paymentsEnabled && (
        <p className="card mx-auto max-w-md text-center text-sm font-medium">{t.pricing.comingSoon}</p>
      )}
      {checkout === "cancelled" && (
        <p className="card mx-auto max-w-md text-center text-sm">{t.pricing.cancelled}</p>
      )}
      <PricingPacks
        packs={CREDIT_PACKS.map((pack) => ({
          id: pack.id,
          credits: pack.credits,
          price: formatPrice(pack.priceCents, locale),
          perCredit: formatPrice(Math.round(pack.priceCents / pack.credits), locale),
          highlight: pack.highlight,
        }))}
        locale={locale}
        loggedIn={!!user}
        paymentsEnabled={env.paymentsEnabled}
      />
      <p className="text-center text-xs text-muted">{t.pricing.secure}</p>
    </div>
  );
}
