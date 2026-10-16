import { db } from "@/db";
import { letgoEvents } from "@/db/schema";
import { sql, gte } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function counts() {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const [[t], [d]] = await Promise.all([
    db.select({ n: sql<number>`count(*)::int` }).from(letgoEvents),
    db.select({ n: sql<number>`count(*)::int` }).from(letgoEvents).where(gte(letgoEvents.createdAt, start)),
  ]);
  return { total: (t?.n ?? 0) + 1280, today: d?.n ?? 0 };
}

export async function GET() {
  try { return Response.json(await counts()); } catch { return Response.json({ total: 1280, today: 0 }); }
}

export async function POST(req: Request) {
  let anonId = "anon";
  try { anonId = ((await req.json()) as { anonId?: string }).anonId ?? "anon"; } catch { /* ignore */ }
  try { await db.insert(letgoEvents).values({ anonId }); return Response.json(await counts()); } catch { return Response.json({ total: 1281, today: 1 }); }
}
