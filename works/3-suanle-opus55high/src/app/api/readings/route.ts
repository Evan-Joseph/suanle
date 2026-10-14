import { db } from "@/db";
import { readings } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { bad, ensureUser, json, newId, validUserId } from "@/lib/server";

export const dynamic = "force-dynamic";

const KINDS = ["hexagram", "tarot", "bazi", "kline"];

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const userId = sp.get("userId");
  if (!validUserId(userId)) return bad("invalid user");
  const kind = sp.get("kind");
  const where = kind && KINDS.includes(kind) ? and(eq(readings.userId, userId), eq(readings.kind, kind)) : eq(readings.userId, userId);
  const rows = await db.select().from(readings).where(where).orderBy(desc(readings.pinned), desc(readings.createdAt)).limit(200);
  return json({ readings: rows });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || !validUserId(body.userId) || !KINDS.includes(body.kind)) return bad("invalid");
  await ensureUser(body.userId);
  const id = newId("r_");
  await db.insert(readings).values({
    id,
    userId: body.userId,
    kind: body.kind,
    title: String(body.title ?? "").slice(0, 40) || "一次推演",
    question: typeof body.question === "string" ? body.question.slice(0, 200) : null,
    data: body.data ?? {},
    pinned: body.kind === "bazi" || body.kind === "kline",
  });
  const [row] = await db.select().from(readings).where(eq(readings.id, id));
  return json({ reading: row });
}
