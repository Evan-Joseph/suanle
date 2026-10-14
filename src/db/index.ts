import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

export const hasDb = Boolean(databaseUrl);

const globalForDb = globalThis as typeof globalThis & {
  __suanlePgPool?: Pool;
};

export const pool = hasDb
  ? (globalForDb.__suanlePgPool ??
    new Pool({
      connectionString: databaseUrl,
    }))
  : null;

if (hasDb && pool && process.env.NODE_ENV !== "production") {
  globalForDb.__suanlePgPool = pool;
}

export const db = (hasDb && pool ? drizzle(pool) : null) as unknown as ReturnType<typeof drizzle>;
