import { db } from "@/db";
import { orders, users } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getUser, isMember, publicUser, SKUS, Sku, uid } from "@/lib/server";

// Create order
export async function POST(req: Request) {
  const b = await req.json();
  const u = await getUser(String(b.uid || ""));
  const sku = b.sku as Sku;
  if (!u || !SKUS[sku]) return Response.json({ error: "bad" }, { status: 400 });
  const id = "SL" + Date.now().toString(36).toUpperCase() + uid().slice(0, 4).toUpperCase();
  await db.insert(orders).values({ id, userId: u.id, sku, amount: SKUS[sku].amount, channel: String(b.channel || "wechat") });
  return Response.json({ orderId: id, amount: SKUS[sku].amount, name: SKUS[sku].name });
}

// Confirm payment (payment-gateway callback stand-in)
export async function PUT(req: Request) {
  const b = await req.json();
  const [o] = await db.select().from(orders).where(and(eq(orders.id, String(b.orderId)), eq(orders.userId, String(b.uid))));
  if (!o) return Response.json({ error: "nf" }, { status: 404 });
  const u = await getUser(o.userId);
  if (!u) return Response.json({ error: "nf" }, { status: 404 });
  if (o.status === "paid") return Response.json(publicUser(u));
  const s = SKUS[o.sku as Sku];
  const patch: Partial<typeof users.$inferInsert> = {};
  if (s.credits) patch.credits = u.credits + s.credits;
  if (s.days) {
    const base = isMember(u) && u.planExpires ? u.planExpires.getTime() : Date.now();
    patch.plan = o.sku;
    patch.planExpires = new Date(base + s.days * 86400e3);
  }
  await db.update(orders).set({ status: "paid" }).where(eq(orders.id, o.id));
  const [n] = await db.update(users).set(patch).where(eq(users.id, u.id)).returning();
  return Response.json(publicUser(n));
}
