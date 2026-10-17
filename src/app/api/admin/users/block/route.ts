import { eq } from "drizzle-orm";
import { db } from "@/db";
import { usersRegistry } from "@/db/schema";
import { verifyAdminRequest } from "@/lib/server/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const isAuthed = await verifyAdminRequest(req);
  if (!isAuthed) {
    return Response.json({ error: "未授权访问" }, { status: 401 });
  }

  let body: { anonId?: string; isBlocked?: boolean; reason?: string } = {};
  try {
    body = (await req.json()) as { anonId?: string; isBlocked?: boolean; reason?: string };
  } catch {
    return Response.json({ error: "请求格式错误" }, { status: 400 });
  }

  const anonId = (body.anonId || "").trim();
  if (!anonId) {
    return Response.json({ error: "缺少 anonId" }, { status: 400 });
  }

  const isBlocked = Boolean(body.isBlocked);
  const blockedReason = (body.reason || "").trim().slice(0, 200);

  try {
    await db
      .update(usersRegistry)
      .set({
        isBlocked,
        blockedReason,
      })
      .where(eq(usersRegistry.anonId, anonId));

    return Response.json({
      ok: true,
      message: isBlocked ? "已对该缘友执行风控封禁" : "已解除该缘友的风控限制",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: "更新风控状态失败: " + msg }, { status: 500 });
  }
}
