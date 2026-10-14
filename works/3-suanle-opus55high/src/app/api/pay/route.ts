import { db } from "@/db";
import { donations, readings, users } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { bad, ensureUser, getSetting, isPass, json, newId, validUserId } from "@/lib/server";
import { PASS_DAYS, PASS_PRICE, TIPS, UNLOCK_PRICE } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const userId = new URL(req.url).searchParams.get("userId");
  const [wechat, alipay, payee] = await Promise.all([getSetting("wechat_qr"), getSetting("alipay_qr"), getSetting("payee")]);
  let history: (typeof donations.$inferSelect)[] = [];
  if (validUserId(userId)) {
    history = await db.select().from(donations).where(eq(donations.userId, userId)).orderBy(desc(donations.createdAt)).limit(50);
  }
  return json({
    qr: { wechat: wechat ?? process.env.PAY_WECHAT_QR ?? null, alipay: alipay ?? process.env.PAY_ALIPAY_QR ?? null },
    payee: payee ?? "算了 · Suanle",
    prices: { tips: TIPS, unlock: UNLOCK_PRICE, pass: PASS_PRICE },
    history,
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || !validUserId(body.userId)) return bad("invalid user");
  const kind = body.kind as string;
  if (!["tip", "unlock", "pass"].includes(kind)) return bad("invalid kind");
  const user = await ensureUser(body.userId);

  let amount = 0;
  let item = "";
  if (kind === "tip") {
    const t = TIPS.find((x) => x.id === body.item);
    amount = t ? t.amount : Math.max(100, Math.min(100000, Math.round(Number(body.amount) || 0)));
    item = t ? t.name : "随心意";
  } else if (kind === "unlock") {
    if (typeof body.readingId !== "string") return bad("missing reading");
    const [r] = await db.select().from(readings).where(and(eq(readings.id, body.readingId), eq(readings.userId, user.id))).limit(1);
    if (!r) return bad("not found", 404);
    await db.update(readings).set({ unlocked: true }).where(eq(readings.id, r.id));
    amount = UNLOCK_PRICE;
    item = `解锁：${r.title}`;
  } else {
    const base = isPass(user) && user.planUntil ? user.planUntil.getTime() : Date.now();
    await db.update(users).set({ plan: "pass", planUntil: new Date(base + PASS_DAYS * 86400000) }).where(eq(users.id, user.id));
    amount = PASS_PRICE;
    item = "松弛月卡 · 30 天";
  }

  await db.insert(donations).values({
    id: newId("d_"),
    userId: user.id,
    kind,
    item,
    amount,
    channel: body.channel === "alipay" ? "alipay" : "wechat",
    note: typeof body.note === "string" ? body.note.slice(0, 100) : null,
  });
  const fresh = await ensureUser(user.id);
  return json({ ok: true, user: { ...fresh, pass: isPass(fresh) } });
}
