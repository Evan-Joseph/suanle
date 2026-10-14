import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getUser, publicUser } from "@/lib/server";

export async function POST(req: Request) {
  const { id } = await req.json();
  const u = await getUser(String(id || ""));
  if (!u) return Response.json({ error: "bad id" }, { status: 400 });
  return Response.json(publicUser(u));
}

export async function PATCH(req: Request) {
  const b = await req.json();
  const u = await getUser(String(b.id || ""));
  if (!u) return Response.json({ error: "bad id" }, { status: 400 });
  const patch: Partial<typeof users.$inferInsert> = {};
  for (const k of ["nickname", "birth", "concern"] as const)
    if (k in b) patch[k] = b[k] ? String(b[k]).slice(0, 80) : null;
  if ("onboarded" in b) patch.onboarded = !!b.onboarded;
  const [n] = await db.update(users).set(patch).where(eq(users.id, u.id)).returning();
  return Response.json(publicUser(n));
}
