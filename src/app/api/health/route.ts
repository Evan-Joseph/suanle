import { db, hasDb } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  if (hasDb && db) {
    try {
      await db.execute(sql`select 1`);
      return Response.json({ ok: true, db: true });
    } catch {
      return Response.json({ ok: true, db: false, note: "database unreachable, falling back to in-memory store" });
    }
  }
  return Response.json({ ok: true, db: false, note: "running in standalone in-memory mode" });
}
