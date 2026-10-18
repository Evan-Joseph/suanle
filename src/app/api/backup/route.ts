import { allow, clientIp, createCloudBackup, isAnonMigrated, restoreCloudBackup } from "@/lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!allow(`${ip}|backup`, 20, 60_000)) {
    return Response.json({ ok: false, error: "操作过于频繁，请稍候再试" }, { status: 429 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false, error: "请求格式错误" }, { status: 400 });
  }

  const action = typeof body.action === "string" ? body.action : "";

  // 1. 生成云端备份（生成短同步码）
  if (action === "export") {
    const anonId = typeof body.anonId === "string" ? body.anonId : "";
    const payload = typeof body.payload === "string" ? body.payload : "";
    if (!anonId || !payload) {
      return Response.json({ ok: false, error: "缺少备份数据" }, { status: 400 });
    }
    const res = await createCloudBackup(anonId, payload, ip);
    return Response.json(res);
  }

  // 2. 从短同步码恢复到新设备
  if (action === "restore") {
    const code = typeof body.code === "string" ? body.code : "";
    const newAnonId = typeof body.newAnonId === "string" ? body.newAnonId : "";
    if (!code) {
      return Response.json({ ok: false, error: "请输入云同步码" }, { status: 400 });
    }
    const res = await restoreCloudBackup(code, newAnonId);
    return Response.json(res);
  }

  // 3. 检查当前 anonId 是否已在其他设备恢复（注销旧设备）
  if (action === "check-migrated") {
    const anonId = typeof body.anonId === "string" ? body.anonId : "";
    return Response.json({ ok: true, migrated: await isAnonMigrated(anonId) });
  }

  return Response.json({ ok: false, error: "未知操作" }, { status: 400 });
}
