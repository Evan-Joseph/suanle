import { addLetgo, allow, clientKey, letgoCounts } from "@/lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 只记录「又有一件事被算了」，从不记录写了什么 */
export async function GET() {
  const c = await letgoCounts();
  return Response.json(c ?? { today: 0, total: 0 });
}

export async function POST(req: Request) {
  let anonId = "";
  try {
    const body = (await req.json()) as { anonId?: unknown };
    anonId = typeof body.anonId === "string" ? body.anonId : "";
  } catch {
    /* 没带身份也算 */
  }
  if (allow(clientKey(req, anonId) + "|letgo", 30, 60_000)) await addLetgo(anonId);
  const c = await letgoCounts();
  return Response.json(c ?? { today: 0, total: 0 });
}
