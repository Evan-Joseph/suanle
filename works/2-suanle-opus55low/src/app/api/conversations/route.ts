import { db } from "@/db";
import { conversations } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET(req: Request) {
  const u = new URL(req.url).searchParams.get("uid") || "";
  const list = await db.select().from(conversations).where(eq(conversations.userId, u)).orderBy(desc(conversations.updatedAt)).limit(100);
  return Response.json(list);
}
