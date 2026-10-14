import { db } from "@/db";
import { conversations, messages, users } from "@/db/schema";
import { and, asc, eq, sql } from "drizzle-orm";
import { getUser, isMember, llm, persona, today, FREE_DAILY, uid } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const b = await req.json();
  const u = await getUser(String(b.uid || ""));
  if (!u) return Response.json({ error: "bad user" }, { status: 400 });
  const content = String(b.content || "").trim().slice(0, 4000);
  if (!content) return Response.json({ error: "empty" }, { status: 400 });
  const deep = !!b.deep;
  const member = isMember(u);
  const used = u.usedDate === today() ? u.usedCount : 0;

  if (deep && !member && u.credits <= 0) return Response.json({ error: "paywall", reason: "deep" }, { status: 402 });
  if (!deep && !member && used >= FREE_DAILY) return Response.json({ error: "paywall", reason: "quota" }, { status: 402 });

  let convId = String(b.conversationId || "");
  if (convId) {
    const [c] = await db.select().from(conversations).where(and(eq(conversations.id, convId), eq(conversations.userId, u.id)));
    if (!c) convId = "";
  }
  if (!convId) {
    convId = uid();
    await db.insert(conversations).values({ id: convId, userId: u.id });
  }

  const history = await db.select().from(messages).where(eq(messages.conversationId, convId)).orderBy(asc(messages.id));
  await db.insert(messages).values({ conversationId: convId, role: "user", content, deep });

  // consume quota
  if (deep && !member) await db.update(users).set({ credits: sql`${users.credits} - 1` }).where(eq(users.id, u.id));
  else if (!deep && !member) await db.update(users).set({ usedDate: today(), usedCount: used + 1 }).where(eq(users.id, u.id));

  const msgs = [
    { role: "system", content: persona(u, deep) },
    ...history.slice(-24).map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content },
  ];

  let upstream: Response;
  try {
    upstream = await llm(msgs, true, deep ? 2000 : 900);
  } catch {
    upstream = new Response(null, { status: 502 });
  }

  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let full = "";
      try {
        if (!upstream.ok || !upstream.body) throw new Error("upstream " + upstream.status);
        const reader = upstream.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() || "";
          for (const line of lines) {
            const t = line.trim();
            if (!t.startsWith("data:")) continue;
            const data = t.slice(5).trim();
            if (data === "[DONE]") continue;
            try {
              const delta = JSON.parse(data).choices?.[0]?.delta?.content;
              if (delta) {
                full += delta;
                controller.enqueue(enc.encode(delta));
              }
            } catch {}
          }
        }
      } catch {
        if (!full) {
          full = "*揉了揉太阳穴* 刚刚走神了，酒馆信号有点飘。你再说一遍？这次不算你次数。";
          controller.enqueue(enc.encode(full));
          if (deep && !member) await db.update(users).set({ credits: sql`${users.credits} + 1` }).where(eq(users.id, u.id));
          else if (!member) await db.update(users).set({ usedCount: used }).where(eq(users.id, u.id));
        }
      }
      await db.insert(messages).values({ conversationId: convId, role: "assistant", content: full, deep });
      await db.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, convId));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache, no-transform", "X-Conversation-Id": convId },
  });
}
