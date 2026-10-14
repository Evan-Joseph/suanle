import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { bad, ensureUser, getSetting, json, setSetting, today, validUserId } from "@/lib/server";

export const dynamic = "force-dynamic";

// 揉掉的心事只计数，不保存内容。
export async function GET(req: Request) {
  const userId = new URL(req.url).searchParams.get("userId");
  const key = `letgo_${today()}`;
  const todayAll = Number((await getSetting(key)) ?? 0);
  let mine = 0;
  if (validUserId(userId)) mine = (await ensureUser(userId)).letGoCount;
  return json({ today: todayAll, mine });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || !validUserId(body.userId)) return bad("invalid user");
  await ensureUser(body.userId);
  await db.update(users).set({ letGoCount: sql`${users.letGoCount} + 1` }).where(eq(users.id, body.userId));
  const key = `letgo_${today()}`;
  const n = Number((await getSetting(key)) ?? 0) + 1;
  await setSetting(key, String(n));
  const u = await ensureUser(body.userId);
  return json({ today: n, mine: u.letGoCount });
}
