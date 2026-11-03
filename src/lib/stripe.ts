import "server-only";
import Stripe from "stripe";
import { env } from "@/lib/env";

let _stripe: Stripe | null = null;

/** Created lazily so `next build` works without Stripe keys present. */
export function stripe() {
  return (_stripe ??= new Stripe(env.stripeSecretKey));
}
