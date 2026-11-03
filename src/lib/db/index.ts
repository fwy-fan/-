import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  pgClient?: ReturnType<typeof postgres>;
};

function client() {
  if (!globalForDb.pgClient) {
    globalForDb.pgClient = postgres(env.databaseUrl, { max: 10 });
  }
  return globalForDb.pgClient;
}

export const db = drizzle(client(), { schema });
export { schema };
