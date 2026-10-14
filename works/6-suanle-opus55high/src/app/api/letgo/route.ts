import { db } from "@/db";
import { letgos } from "@/db/schema";
import { sql } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function counts() {
  const r = await db
    .select({
      total: sql<number>`count(*)::int`,
      today: sql<number>`count(*) filter (where ${letgos.createdAt} > now() - interval '24 hours')::int`,
    })
    .from(letgos);
  return r[0] ?? { total: 0, today: 0 };
}

export async function GET() {
  try {
    return Response.json(await counts());
  } catch {
    return Response.json({ total: 0, today: 0 });
  }
}

export async function POST(req: Request) {
  try {
    const b = (await req.json()) as { anonId?: string };
    const anonId = String(b.anonId ?? "").slice(0, 64);
    if (!anonId) return Response.json({ error: "invalid" }, { status: 400 });
    await db.insert(letgos).values({ anonId });
    return Response.json(await counts());
  } catch {
    return Response.json({ total: 0, today: 0 }, { status: 500 });
  }
}
