import { db } from "@/db";
import { tips } from "@/db/schema";
import { sql, gte } from "drizzle-orm";
import { touchDevice } from "@/lib/server/usage";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const since = new Date(Date.now() - 24 * 3600 * 1000);
    const [today] = await db.select({ n: sql<number>`count(*)::int` }).from(tips).where(gte(tips.createdAt, since));
    const [all] = await db.select({ n: sql<number>`count(distinct ${tips.deviceId})::int` }).from(tips);
    const recent = await db
      .select({ item: tips.item, message: tips.message, createdAt: tips.createdAt })
      .from(tips)
      .orderBy(sql`${tips.createdAt} desc`)
      .limit(6);
    return Response.json({ today: today?.n || 0, supporters: all?.n || 0, recent });
  } catch {
    return Response.json({ today: 0, supporters: 0, recent: [] });
  }
}

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const deviceId = String(b.deviceId || "").slice(0, 64);
    const amountCents = Math.max(0, Math.min(100000, Math.round(Number(b.amountCents) || 0)));
    const item = String(b.item || "随喜").slice(0, 40);
    const plan = ["tip", "regular", "friend"].includes(b.plan) ? b.plan : "tip";
    const message = b.message ? String(b.message).slice(0, 80) : null;
    if (!deviceId || !amountCents) return Response.json({ ok: false }, { status: 400 });
    await touchDevice(deviceId);
    await db.insert(tips).values({ deviceId, amountCents, item, plan, message });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
