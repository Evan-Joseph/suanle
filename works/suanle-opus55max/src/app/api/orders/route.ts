import { addOrder, allow, clientKey } from "@/lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 收款通道：运营方在环境变量中配置收款码内容或图片 */
export async function GET() {
  return Response.json({
    channels: [
      { id: "wechat", label: "微信", url: process.env.TIP_WECHAT_URL || "wxp://f2f0suanle-tip", image: process.env.TIP_WECHAT_IMAGE || "" },
      { id: "alipay", label: "支付宝", url: process.env.TIP_ALIPAY_URL || "https://qr.alipay.com/suanle-tip", image: process.env.TIP_ALIPAY_IMAGE || "" },
    ],
  });
}

export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "bad request" }, { status: 400 });
  }
  const anonId = typeof body.anonId === "string" ? body.anonId : "";
  const kind = body.kind === "lamp" ? "lamp" : "tip";
  const tier = typeof body.tier === "string" ? body.tier.slice(0, 24) : "custom";
  const channel = body.channel === "alipay" ? "alipay" : "wechat";
  const amountCents = Math.max(0, Math.min(1_000_000, Math.round(Number(body.amountCents) || 0)));
  if (!allow(clientKey(req, anonId) + "|order", 12, 60_000)) return Response.json({ ok: false }, { status: 429 });
  const id = `${kind}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const ok = await addOrder({ id, anonId, kind, tier, amountCents, channel });
  return Response.json({ ok, id });
}
