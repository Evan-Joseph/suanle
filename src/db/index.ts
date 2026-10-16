import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool | null;
  __arenaNextJsPostgresqlDb?: ReturnType<typeof drizzle> | null;
};

export const pool = databaseUrl
  ? globalForDb.__arenaNextJsPostgresqlPool ?? new Pool({ connectionString: databaseUrl })
  : null;

if (process.env.NODE_ENV !== "production" && pool) {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db: ReturnType<typeof drizzle> = pool
  ? (globalForDb.__arenaNextJsPostgresqlDb ?? (globalForDb.__arenaNextJsPostgresqlDb = drizzle(pool)))
  : (new Proxy({}, {
      get(_target, _prop) {
        return () => {
          throw new Error("DATABASE_URL is not configured");
        };
      },
    }) as unknown as ReturnType<typeof drizzle>);
