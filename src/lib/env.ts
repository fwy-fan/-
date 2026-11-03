import "server-only";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  get databaseUrl() {
    return required("DATABASE_URL");
  },
  get authSecret() {
    const secret = required("AUTH_SECRET");
    if (secret.length < 32) {
      throw new Error("AUTH_SECRET must be at least 32 characters long");
    }
    return new TextEncoder().encode(secret);
  },
  get anthropicModel() {
    return process.env.ANTHROPIC_MODEL || "claude-opus-5-5";
  },
  get openaiImageModel() {
    return process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";
  },
  get openaiImageQuality() {
    return (process.env.OPENAI_IMAGE_QUALITY || "medium") as
      | "low"
      | "medium"
      | "high";
  },
  get creemApiKey() {
    return required("CREEM_API_KEY");
  },
  get creemWebhookSecret() {
    return required("CREEM_WEBHOOK_SECRET");
  },
  /** The one-time-payment product every credit pack is sold through. */
  get creemProductId() {
    return required("CREEM_PRODUCT_ID");
  },
  /** True once Creem is configured; until then the pricing page shows "coming soon". */
  get paymentsEnabled() {
    return Boolean(process.env.CREEM_API_KEY && process.env.CREEM_PRODUCT_ID);
  },
  get supportEmail() {
    return process.env.SUPPORT_EMAIL || "support@example.com";
  },
  /** Your name or business name, shown in the terms of service. */
  get operatorName() {
    return process.env.OPERATOR_NAME || "the site operator";
  },
  get creemTestMode() {
    return process.env.CREEM_TEST_MODE === "true";
  },
  get appUrl() {
    return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
      /\/$/,
      "",
    );
  },
  get freeCreditsOnSignup() {
    const n = Number(process.env.FREE_CREDITS_ON_SIGNUP ?? "3");
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 3;
  },
};
