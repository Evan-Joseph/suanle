import { db } from "@/db";
import { conversations, messages } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const u = new URL(req.url).searchParams.get("uid") || "";
  const [c] = await db.select().from(conversations).where(and(eq(conversations.id, id), eq(conversations.userId, u)));
  if (!c) return Response.json({ error: "not found" }, { status: 404 });
  const msgs = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(asc(messages.id));
  return Response.json({ conversation: c, messages: msgs });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const b = await req.json();
  await db.update(conversations).set({ title: String(b.title || "").slice(0, 30) }).where(and(eq(conversations.id, id), eq(conversations.userId, String(b.uid))));
  return Response.json({ ok: true });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const u = new URL(req.url).searchParams.get("uid") || "";
  const r = await db.delete(conversations).where(and(eq(conversations.id, id), eq(conversations.userId, u))).returning();
  if (r.length) await db.delete(messages).where(eq(messages.conversationId, id));
  return Response.json({ ok: true });
}
