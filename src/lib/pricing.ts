/**
 * Credit packs sold through Stripe Checkout. Prices are in the smallest
 * currency unit (cents). Change them here; Checkout uses these values
 * directly, so no products need to be created in the Stripe dashboard.
 */
export const CURRENCY = "usd";

export const CREDIT_PACKS = [
  { id: "starter", credits: 10, priceCents: 499, highlight: false },
  { id: "popular", credits: 30, priceCents: 1199, highlight: true },
  { id: "pro", credits: 100, priceCents: 2999, highlight: false },
] as const;

export type CreditPackId = (typeof CREDIT_PACKS)[number]["id"];

export function findPack(id: string) {
  return CREDIT_PACKS.find((p) => p.id === id);
}

export function formatPrice(cents: number, locale: string) {
  return new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-US", {
    style: "currency",
    currency: CURRENCY.toUpperCase(),
  }).format(cents / 100);
}
