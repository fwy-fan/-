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
  get stripeSecretKey() {
    return required("STRIPE_SECRET_KEY");
  },
  get stripeWebhookSecret() {
    return required("STRIPE_WEBHOOK_SECRET");
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
