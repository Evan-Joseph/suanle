import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { chatLogs } from "@/db/schema";
import { verifyAdminRequest } from "@/lib/server/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const isAuthed = await verifyAdminRequest(req);
  if (!isAuthed) {
    return Response.json({ error: "未授权访问" }, { status: 401 });
  }

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  const model = (url.searchParams.get("model") || "").trim();
  const anonId = (url.searchParams.get("anonId") || "").trim();
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
  const offset = (page - 1) * limit;

  try {
    const conditions = [];

    if (q) {
      const term = `%${q}%`;
      conditions.push(
        or(
          ilike(chatLogs.userPrompt, term),
          ilike(chatLogs.assistantReply, term),
          ilike(chatLogs.anonId, term),
          ilike(chatLogs.ip, term)
        )
      );
    }

    if (model) {
      conditions.push(eq(chatLogs.model, model));
    }

    if (anonId) {
      conditions.push(eq(chatLogs.anonId, anonId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalRes, items] = await Promise.all([
      db.select({ count: count() }).from(chatLogs).where(whereClause),
      db
        .select()
        .from(chatLogs)
        .where(whereClause)
        .orderBy(desc(chatLogs.createdAt))
        .limit(limit)
        .offset(offset),
    ]);

    const total = Number(totalRes[0]?.count || 0);
    const totalPages = Math.ceil(total / limit) || 1;

    return Response.json({
      items,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: "获取对话记录失败: " + msg }, { status: 500 });
  }
}
