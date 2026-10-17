import { and, count, desc, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { usersRegistry } from "@/db/schema";
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
          ilike(usersRegistry.anonId, term),
          ilike(usersRegistry.lastIp, term),
          ilike(usersRegistry.firstIp, term)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalRes, items] = await Promise.all([
      db.select({ count: count() }).from(usersRegistry).where(whereClause),
      db
        .select()
        .from(usersRegistry)
        .where(whereClause)
        .orderBy(desc(usersRegistry.lastActiveAt))
        .limit(limit)
        .offset(offset),
    ]);

    const total = Number(totalRes[0]?.count || 0);
    const totalPages = Math.ceil(total / limit) || 1;

    const ips = Array.from(new Set([...items.map((i) => i.lastIp), ...items.map((i) => i.firstIp)])).filter(Boolean);
    const geoMap = await batchResolveIpLocations(ips);

    const itemsWithGeo = items.map((item) => ({
      ...item,
      lastGeo: geoMap[item.lastIp] || "未知归属",
      firstGeo: geoMap[item.firstIp] || "未知归属",
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
    return Response.json({ error: "获取缘友台账失败: " + msg }, { status: 500 });
  }
}
