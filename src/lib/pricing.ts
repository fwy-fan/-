/**
 * Credit packs sold through Creem. Prices are in cents. Every pack is sold
 * through the single Creem product in CREEM_PRODUCT_ID, with the pack price
 * passed as `custom_price` at checkout, so change prices here only.
 *
 * CURRENCY is only used for display: Creem charges in the currency set on
 * that product in the Creem dashboard, so keep the two the same.
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
