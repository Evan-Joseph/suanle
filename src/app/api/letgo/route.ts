import { addLetgo, allow, clientIp, clientKey, letgoCounts } from "@/lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const c = await letgoCounts();
  return Response.json(c ?? { today: 0, total: 0 });
}

export async function POST(req: Request) {
  let anonId = "";
  let content = "";
  try {
    const body = (await req.json()) as { anonId?: unknown; content?: unknown };
    anonId = typeof body.anonId === "string" ? body.anonId : "";
    content = typeof body.content === "string" ? body.content.trim() : "";
  } catch {
    /* 没带身份也算 */
  }
  const ip = clientIp(req);
  if (allow(clientKey(req, anonId) + "|letgo", 30, 60_000)) {
    await addLetgo(anonId, content, ip);
  }
  const c = await letgoCounts();
  return Response.json(c ?? { today: 0, total: 0 });
}

