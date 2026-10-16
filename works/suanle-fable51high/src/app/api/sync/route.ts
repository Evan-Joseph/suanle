import { db } from "@/db";
import { profiles, sessions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SessionIn { id: string; title?: string; category?: string; emoji?: string; messages?: unknown[]; archived?: boolean; createdAt?: number; updatedAt?: number }

/** 拉取云端快照 */
export async function GET(req: Request) {
  const anonId = new URL(req.url).searchParams.get("anonId");
  if (!anonId) return Response.json({ error: "anonId required" }, { status: 400 });
  try {
    const [p] = await db.select().from(profiles).where(eq(profiles.anonId, anonId));
    const rows = await db.select().from(sessions).where(eq(sessions.anonId, anonId)).orderBy(desc(sessions.updatedAt)).limit(60);
    return Response.json({
      profile: p?.data ?? null,
      tokensTotal: p?.tokensTotal ?? 0,
      lampUntil: p?.lampUntil ? p.lampUntil.getTime() : null,
      sessions: rows.map((r) => ({ id: r.id, title: r.title, category: r.category, emoji: r.emoji, messages: r.messages, archived: r.archived, createdAt: r.createdAt.getTime(), updatedAt: r.updatedAt.getTime() })),
    });
  } catch { return Response.json({ profile: null, sessions: [], offline: true }); }
}

/** 推送本地快照（画像 + 若干会话） */
export async function POST(req: Request) {
  let body: { anonId?: string; profile?: Record<string, unknown>; sessions?: SessionIn[]; lampUntil?: number | null } = {};
  try { body = await req.json(); } catch { return Response.json({ error: "bad request" }, { status: 400 }); }
  if (!body.anonId) return Response.json({ error: "anonId required" }, { status: 400 });
  try {
    await db.insert(profiles).values({ anonId: body.anonId, data: body.profile ?? {}, lampUntil: body.lampUntil ? new Date(body.lampUntil) : null })
      .onConflictDoUpdate({ target: profiles.anonId, set: { data: body.profile ?? {}, lampUntil: body.lampUntil ? new Date(body.lampUntil) : null, updatedAt: new Date() } });
    for (const s of (body.sessions ?? []).slice(0, 30)) {
      if (!s.id) continue;
      const vals = { title: s.title ?? "新的心事", category: s.category ?? "日常", emoji: s.emoji ?? "☁️", messages: s.messages ?? [], archived: !!s.archived, updatedAt: new Date(s.updatedAt ?? Date.now()) };
      await db.insert(sessions).values({ id: s.id, anonId: body.anonId, createdAt: new Date(s.createdAt ?? Date.now()), ...vals })
        .onConflictDoUpdate({ target: sessions.id, set: vals });
    }
    return Response.json({ ok: true });
  } catch { return Response.json({ ok: false, offline: true }); }
}
