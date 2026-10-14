import { db } from "@/db";
import { conversations, messages } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { bad, json, validUserId } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const userId = new URL(req.url).searchParams.get("userId");
  if (!validUserId(userId)) return bad("invalid user");
  const rows = await db
    .select({
      id: conversations.id,
      title: conversations.title,
      persona: conversations.persona,
      letGo: conversations.letGo,
      updatedAt: conversations.updatedAt,
      preview: sql<string>`(select left(m.content, 60) from ${messages} m where m.conversation_id = "conversations"."id" and m.role = 'user' and m.content <> '' order by m.created_at asc limit 1)`,
    })
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.updatedAt))
    .limit(100);
  return json({ conversations: rows });
}
