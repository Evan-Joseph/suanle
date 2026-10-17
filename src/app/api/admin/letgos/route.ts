import { and, count, desc, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { letgoEvents } from "@/db/schema";
import { verifyAdminRequest } from "@/lib/server/admin-auth";
import { batchResolveIpLocations } from "@/lib/server/ip-geo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const isAuthed = await verifyAdminRequest(req);
  if (!isAuthed) {
    return Response.json({ error: "未授权访问" }, { status: 401 });
  }

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
  const offset = (page - 1) * limit;

  try {
    const conditions = [];

    if (q) {
      const term = `%${q}%`;
      conditions.push(
        or(
          ilike(letgoEvents.content, term),
          ilike(letgoEvents.anonId, term),
          ilike(letgoEvents.ip, term)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalRes, items] = await Promise.all([
      db.select({ count: count() }).from(letgoEvents).where(whereClause),
      db
        .select()
        .from(letgoEvents)
        .where(whereClause)
        .orderBy(desc(letgoEvents.createdAt))
        .limit(limit)
        .offset(offset),
    ]);

    const total = Number(totalRes[0]?.count || 0);
    const totalPages = Math.ceil(total / limit) || 1;

    const ips = items.map((i) => i.ip).filter(Boolean);
    const geoMap = await batchResolveIpLocations(ips);

    const itemsWithGeo = items.map((item) => ({
      ...item,
      geo: geoMap[item.ip] || "未知归属",
    }));

    return Response.json({
      items: itemsWithGeo,
      total,
      page,
      limit,
      totalPages,
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: "获取纸篓记录失败: " + msg }, { status: 500 });
  }
}
