import { db } from "@/db";
import { donations, users, conversations, readings } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { bad, getSetting, json, setSetting } from "@/lib/server";

export const dynamic = "force-dynamic";

function authed(req: Request, bodyToken?: string) {
  const token = bodyToken ?? req.headers.get("x-admin-token") ?? "";
  const expected = process.env.ADMIN_TOKEN;
  return Boolean(expected && token && token === expected);
}

export async function GET(req: Request) {
  if (!authed(req)) return bad("unauthorized", 401);
  const list = await db.select().from(donations).orderBy(desc(donations.createdAt)).limit(200);
  const [u] = await db.select({ c: sql<number>`count(*)::int` }).from(users);
  const [c] = await db.select({ c: sql<number>`count(*)::int` }).from(conversations);
  const [r] = await db.select({ c: sql<number>`count(*)::int` }).from(readings);
  const [s] = await db.select({ sum: sql<number>`coalesce(sum(amount),0)::int` }).from(donations).where(sql`status <> 'rejected'`);
  return json({
    donations: list,
    stats: { users: u.c, conversations: c.c, readings: r.c, revenue: s.sum },
    settings: { wechat: await getSetting("wechat_qr"), alipay: await getSetting("alipay_qr"), payee: await getSetting("payee") },
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (!authed(req, body.token)) return bad("unauthorized", 401);
  for (const k of ["wechat", "alipay"] as const) {
    const v = body[k];
    if (typeof v === "string") {
      if (v && !/^(data:image\/(png|jpe?g|webp);base64,|https?:\/\/)/.test(v)) return bad("invalid image");
      if (v.length > 1_500_000) return bad("image too large");
      await setSetting(`${k}_qr`, v);
    }
  }
  if (typeof body.payee === "string") await setSetting("payee", body.payee.slice(0, 30));
  return json({ ok: true });
}

export async function PATCH(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (!authed(req, body.token)) return bad("unauthorized", 401);
  if (typeof body.id !== "string" || !["claimed", "confirmed", "rejected"].includes(body.status)) return bad("invalid");
  await db.update(donations).set({ status: body.status }).where(eq(donations.id, body.id));
  return json({ ok: true });
}
