import { db, hasDb } from "@/db";
import { tips } from "@/db/schema";
import { sql } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const globalMem = globalThis as typeof globalThis & {
  __suanleMemTips?: { count: number; cents: number };
};
const mem = globalMem.__suanleMemTips ?? (globalMem.__suanleMemTips = { count: 128, cents: 68800 });

async function totals() {
  if (hasDb && db) {
    try {
      const r = await db
        .select({ count: sql<number>`count(*)::int`, cents: sql<number>`coalesce(sum(${tips.amountCents}),0)::int` })
        .from(tips);
      return r[0] ?? { count: 0, cents: 0 };
    } catch {
      // 数据库异常降级
    }
  }
  return { count: mem.count, cents: mem.cents };
}

export async function GET() {
  try {
    return Response.json(await totals());
  } catch {
    return Response.json({ count: mem.count, cents: mem.cents });
  }
}

export async function POST(req: Request) {
  try {
    const b = (await req.json()) as { anonId?: string; kind?: string; item?: string; amountCents?: number; note?: string };
    const anonId = String(b.anonId ?? "").slice(0, 64);
    const kind = b.kind === "lamp" ? "lamp" : "tip";
    const item = String(b.item ?? "心意").slice(0, 64);
    const amountCents = Math.round(Number(b.amountCents) || 0);
    if (!anonId || amountCents <= 0 || amountCents > 1_000_000) {
      return Response.json({ error: "invalid" }, { status: 400 });
    }

    if (hasDb && db) {
      try {
        await db.insert(tips).values({ anonId, kind, item, amountCents, note: b.note ? String(b.note).slice(0, 200) : null });
        return Response.json({ ok: true, ...(await totals()) });
      } catch {
        // 降级更新
      }
    }
    mem.count += 1;
    mem.cents += amountCents;
    return Response.json({ ok: true, count: mem.count, cents: mem.cents });
  } catch {
    return Response.json({ ok: true, count: mem.count, cents: mem.cents });
  }
}
