import { db } from "@/db";
import { conversations, messages } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { llm } from "@/lib/server";

const CATS = ["工作", "感情", "钱", "家人", "自己", "闲聊"];

export async function POST(req: Request) {
  const { uid, conversationId } = await req.json();
  const [c] = await db.select().from(conversations).where(and(eq(conversations.id, String(conversationId)), eq(conversations.userId, String(uid))));
  if (!c) return Response.json({ error: "nf" }, { status: 404 });
  const msgs = await db.select().from(messages).where(eq(messages.conversationId, c.id)).orderBy(asc(messages.id)).limit(6);
  const text = msgs.map((m) => `${m.role === "user" ? "用户" : "老算"}：${m.content.slice(0, 300)}`).join("\n");
  let title = msgs.find((m) => m.role === "user")?.content.slice(0, 12) || "一段闲聊";
  let category = "闲聊";
  try {
    const r = await llm(
      [
        { role: "system", content: `给下面这段对话起一个简短传神的中文标题（4~10字，像日记标签，可以带点幽默，不要标点和引号），并从[${CATS.join("、")}]中选一个分类。只输出JSON：{"title":"...","category":"..."}` },
        { role: "user", content: text },
      ],
      false,
      80,
    );
    const j = await r.json();
    const raw: string = j.choices?.[0]?.message?.content || "";
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) {
      const p = JSON.parse(m[0]);
      if (p.title) title = String(p.title).replace(/["“”。，！]/g, "").slice(0, 14);
      if (CATS.includes(p.category)) category = p.category;
    }
  } catch {}
  await db.update(conversations).set({ title, category }).where(eq(conversations.id, c.id));
  return Response.json({ title, category });
}
