import { db } from "@/db";
import { conversations, messages, users } from "@/db/schema";
import { and, asc, eq, sql } from "drizzle-orm";
import { bad, json, validUserId } from "@/lib/server";

export const dynamic = "force-dynamic";

async function own(id: string, userId: string | null) {
  if (!validUserId(userId)) return null;
  const r = await db.select().from(conversations).where(and(eq(conversations.id, id), eq(conversations.userId, userId))).limit(1);
  return r[0] ?? null;
}

export async function GET(req: Request, ctx: RouteContext<"/api/conversations/[id]">) {
  const { id } = await ctx.params;
  const conv = await own(id, new URL(req.url).searchParams.get("userId"));
  if (!conv) return bad("not found", 404);
  const msgs = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(asc(messages.createdAt));
  return json({ conversation: conv, messages: msgs });
}

export async function PATCH(req: Request, ctx: RouteContext<"/api/conversations/[id]">) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const conv = await own(id, body.userId);
  if (!conv) return bad("not found", 404);
  const patch: Partial<typeof conversations.$inferInsert> = {};
  if (typeof body.title === "string") patch.title = body.title.slice(0, 30);
  if (typeof body.letGo === "boolean") {
    patch.letGo = body.letGo;
    if (body.letGo && !conv.letGo) {
      await db.update(users).set({ letGoCount: sql`${users.letGoCount} + 1` }).where(eq(users.id, conv.userId));
    }
  }
  await db.update(conversations).set(patch).where(eq(conversations.id, id));
  return json({ ok: true });
}

export async function DELETE(req: Request, ctx: RouteContext<"/api/conversations/[id]">) {
  const { id } = await ctx.params;
  const conv = await own(id, new URL(req.url).searchParams.get("userId"));
  if (!conv) return bad("not found", 404);
  await db.delete(messages).where(eq(messages.conversationId, id));
  await db.delete(conversations).where(eq(conversations.id, id));
  return json({ ok: true });
}
