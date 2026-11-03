import "server-only";
import { Creem } from "creem";
import { env } from "@/lib/env";

let _creem: Creem | null = null;

/** Created lazily so `next build` works without Creem keys present. */
export function creem() {
  return (_creem ??= new Creem({
    apiKey: env.creemApiKey,
    // Test-mode keys only work against Creem's test API.
    server: env.creemTestMode ? "test" : "prod",
  }));
}
