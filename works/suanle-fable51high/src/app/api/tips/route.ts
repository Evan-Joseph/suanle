import { db } from "@/db";
import { tips, profiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { anonId?: string; kind?: "tip" | "lamp"; amount?: number; note?: string; days?: number } = {};
  try { body = await req.json(); } catch { return Response.json({ error: "bad request" }, { status: 400 }); }
  if (!body.anonId || !body.kind) return Response.json({ error: "missing" }, { status: 400 });
  const lampUntil = body.kind === "lamp" ? Date.now() + (body.days ?? 30) * 86400000 : null;
  try {
    await db.insert(tips).values({ anonId: body.anonId, kind: body.kind, amount: Math.round((body.amount ?? 0) * 100), note: body.note?.slice(0, 200) });
    if (lampUntil) {
      await db.insert(profiles).values({ anonId: body.anonId, lampUntil: new Date(lampUntil) })
        .onConflictDoUpdate({ target: profiles.anonId, set: { lampUntil: new Date(lampUntil), updatedAt: new Date() } });
    }
    const [p] = await db.select({ total: profiles.tokensTotal }).from(profiles).where(eq(profiles.anonId, body.anonId));
    return Response.json({ ok: true, lampUntil, tokensTotal: p?.total ?? 0 });
  } catch { return Response.json({ ok: true, lampUntil, offline: true }); }
}
