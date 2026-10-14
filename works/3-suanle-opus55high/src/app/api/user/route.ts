import { db } from "@/db";
import { users, conversations, readings, usageLogs } from "@/db/schema";
import type { UserProfile } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { bad, ensureUser, isPass, json, today, validUserId } from "@/lib/server";
import { PERSONAS } from "@/lib/personas";

export const dynamic = "force-dynamic";

async function payload(id: string) {
  const u = await ensureUser(id);
  const [convs] = await db.select({ c: sql<number>`count(*)::int` }).from(conversations).where(eq(conversations.userId, id));
  const [reads] = await db.select({ c: sql<number>`count(*)::int` }).from(readings).where(eq(readings.userId, id));
  const [tok] = await db.select({ t: sql<number>`coalesce(sum(tokens),0)::int` }).from(usageLogs).where(eq(usageLogs.userId, id));
  const [tokToday] = await db
    .select({ t: sql<number>`coalesce(sum(tokens),0)::int` })
    .from(usageLogs)
    .where(and(eq(usageLogs.userId, id), eq(usageLogs.day, today())));
  return {
    user: { ...u, pass: isPass(u) },
    stats: { conversations: convs.c, readings: reads.c, tokens: tok.t, tokensToday: tokToday.t, letGo: u.letGoCount },
  };
}

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!validUserId(id)) return bad("invalid id");
  return json(await payload(id));
}

export async function PATCH(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || !validUserId(body.id)) return bad("invalid id");
  const u = await ensureUser(body.id);
  const patch: Partial<typeof users.$inferInsert> = { updatedAt: new Date() };
  if (typeof body.nickname === "string") patch.nickname = body.nickname.slice(0, 20) || null;
  if (typeof body.persona === "string" && body.persona in PERSONAS) patch.persona = body.persona;
  if (typeof body.onboarded === "boolean") patch.onboarded = body.onboarded;
  if (body.profile && typeof body.profile === "object") {
    const p = body.profile as UserProfile;
    const next: UserProfile = { ...u.profile };
    if (p.birthday !== undefined) next.birthday = /^\d{4}-\d{2}-\d{2}$/.test(p.birthday ?? "") ? p.birthday : undefined;
    if (p.birthHour !== undefined) next.birthHour = typeof p.birthHour === "number" && p.birthHour >= 0 && p.birthHour < 24 ? p.birthHour : null;
    if (p.gender !== undefined) next.gender = (p.gender ?? "").slice(0, 8) || undefined;
    if (p.concern !== undefined) next.concern = (p.concern ?? "").slice(0, 80) || undefined;
    if (p.city !== undefined) next.city = (p.city ?? "").slice(0, 20) || undefined;
    patch.profile = next;
  }
  await db.update(users).set(patch).where(eq(users.id, body.id));
  return json(await payload(body.id));
}

/** 清除我的全部数据 */
export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!validUserId(id)) return bad("invalid id");
  await db.execute(sql`delete from messages where conversation_id in (select id from conversations where user_id = ${id})`);
  await db.delete(conversations).where(eq(conversations.userId, id));
  await db.delete(readings).where(eq(readings.userId, id));
  await db.delete(usageLogs).where(eq(usageLogs.userId, id));
  await db.update(users).set({ nickname: null, profile: {}, onboarded: false, analogy: null }).where(eq(users.id, id));
  return json({ ok: true });
}
