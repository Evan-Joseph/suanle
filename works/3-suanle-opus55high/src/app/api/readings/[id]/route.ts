import { db } from "@/db";
import { readings } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { bad, json, validUserId } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: RouteContext<"/api/readings/[id]">) {
  const { id } = await ctx.params;
  const userId = new URL(req.url).searchParams.get("userId");
  if (!validUserId(userId)) return bad("invalid user");
  const [row] = await db.select().from(readings).where(and(eq(readings.id, id), eq(readings.userId, userId))).limit(1);
  if (!row) return bad("not found", 404);
  return json({ reading: row });
}

export async function PATCH(req: Request, ctx: RouteContext<"/api/readings/[id]">) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  if (!validUserId(body.userId)) return bad("invalid user");
  const patch: Partial<typeof readings.$inferInsert> = {};
  if (typeof body.pinned === "boolean") patch.pinned = body.pinned;
  if (typeof body.title === "string" && body.title.trim()) patch.title = body.title.slice(0, 40);
  await db.update(readings).set(patch).where(and(eq(readings.id, id), eq(readings.userId, body.userId)));
  return json({ ok: true });
}

export async function DELETE(req: Request, ctx: RouteContext<"/api/readings/[id]">) {
  const { id } = await ctx.params;
  const userId = new URL(req.url).searchParams.get("userId");
  if (!validUserId(userId)) return bad("invalid user");
  await db.delete(readings).where(and(eq(readings.id, id), eq(readings.userId, userId)));
  return json({ ok: true });
}
