import { verifyAdminRequest } from "@/lib/server/admin-auth";
import { getSystemTelemetry } from "@/lib/server/telemetry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const isAuthed = await verifyAdminRequest(req);
  if (!isAuthed) {
    return Response.json({ error: "未授权访问" }, { status: 401 });
  }

  try {
    const data = await getSystemTelemetry();
    return Response.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: "遥测数据获取失败: " + msg }, { status: 500 });
  }
}
