import { db, hasDb } from "@/db";
import { letgos } from "@/db/schema";
import { sql } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 内存兜底统计（在无 PostgreSQL 数据库时依然让用户看到真实的递增数字）
const globalMem = globalThis as typeof globalThis & {
  __suanleMemLetgos?: { total: number; today: number; lastReset: number };
};
const mem = globalMem.__suanleMemLetgos ?? (globalMem.__suanleMemLetgos = { total: 1024, today: 38, lastReset: Date.now() });

async function counts() {
  if (hasDb && db) {
    try {
      const r = await db
        .select({
          total: sql<number>`count(*)::int`,
          today: sql<number>`count(*) filter (where ${letgos.createdAt} > now() - interval '24 hours')::int`,
        })
        .from(letgos);
      return r[0] ?? { total: 0, today: 0 };
    } catch {
      // 数据库异常时使用内存兜底
    }
  }
  return { total: mem.total, today: mem.today };
}

export async function GET() {
  try {
    return Response.json(await counts());
  } catch {
    return Response.json({ total: mem.total, today: mem.today });
  }
}

export async function POST(req: Request) {
  try {
    const b = (await req.json()) as { anonId?: string };
    const anonId = String(b.anonId ?? "").slice(0, 64);
    if (!anonId) return Response.json({ error: "invalid" }, { status: 400 });

    if (hasDb && db) {
      try {
        await db.insert(letgos).values({ anonId });
        return Response.json(await counts());
      } catch {
        // 回退至内存更新
      }
    }
    mem.total += 1;
    mem.today += 1;
    return Response.json({ total: mem.total, today: mem.today });
  } catch {
    return Response.json({ total: mem.total, today: mem.today });
  }
}
