import { db } from "@/db";
import { conversations, messages, users } from "@/db/schema";
import type { MessageMeta, UserProfile } from "@/db/schema";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { bad, ensureUser, logUsage, newId, splitOutput, sseStream, validUserId } from "@/lib/server";
import { buildSystemPrompt, TITLE_PROMPT } from "@/lib/prompts";
import { completeChat, estimateTokens, streamChat, type ChatMsg } from "@/lib/llm";
import { chunkText, mockReply } from "@/lib/mock-oracle";
import { castSummary, type CastResult } from "@/lib/iching";
import { tarotSummary, type TarotResult } from "@/lib/tarot";
import { getPersona } from "@/lib/personas";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Cast = { kind: "hexagram"; data: CastResult } | { kind: "tarot"; data: TarotResult };

function castToText(c: Cast) {
  if (c.kind === "hexagram") return `【卦象】${c.data.question ? `所问：${c.data.question}\n` : ""}${castSummary(c.data)}`;
  return `【牌面】${c.data.question ? `所问：${c.data.question}\n` : ""}${tarotSummary(c.data)}`;
}

function historyToLLM(rows: (typeof messages.$inferSelect)[]): ChatMsg[] {
  return rows.map((m) => {
    const meta = (m.meta ?? {}) as MessageMeta;
    let content = m.content;
    if (m.role === "user" && meta.cast) content = `${content ? content + "\n" : ""}${castToText(meta.cast as Cast)}`;
    return { role: m.role === "user" ? "user" : "assistant", content: content || "…" } as ChatMsg;
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || !validUserId(body.userId)) return bad("invalid user");
  const text: string = typeof body.content === "string" ? body.content.slice(0, 4000) : "";
  const cast: Cast | null = body.cast && (body.cast.kind === "hexagram" || body.cast.kind === "tarot") ? body.cast : null;
  if (!text.trim() && !cast) return bad("empty");

  const user = await ensureUser(body.userId);
  let convId: string | null = typeof body.conversationId === "string" ? body.conversationId : null;
  let conv = convId
    ? (await db.select().from(conversations).where(and(eq(conversations.id, convId), eq(conversations.userId, user.id))).limit(1))[0]
    : undefined;

  if (!conv) {
    convId = newId("c_");
    const persona = getPersona(body.persona ?? user.persona);
    await db.insert(conversations).values({ id: convId, userId: user.id, persona: persona.id });
    await db.insert(messages).values({
      id: newId("m_"),
      conversationId: convId,
      role: "assistant",
      content: persona.greeting.join("\n\n"),
      createdAt: new Date(Date.now() - 1000),
    });
    conv = (await db.select().from(conversations).where(eq(conversations.id, convId)).limit(1))[0];
  }
  const conversationId = conv.id;

  const userMsgId = newId("m_");
  await db.insert(messages).values({
    id: userMsgId,
    conversationId,
    role: "user",
    content: text,
    meta: cast ? { cast } : {},
  });

  const recent = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(28);
  recent.reverse();

  const system = buildSystemPrompt({ persona: conv.persona, nickname: user.nickname, profile: user.profile });
  const llmMessages: ChatMsg[] = [{ role: "system", content: system }, ...historyToLLM(recent)];
  const assistantId = newId("m_");

  return sseStream(async (send, signal) => {
    send("meta", { conversationId, userMessageId: userMsgId, assistantMessageId: assistantId });
    const started = Date.now();
    let raw = "";
    let reasoning = "";
    let tokens = 0;
    let offline = false;

    try {
      for await (const ev of streamChat(llmMessages, { signal })) {
        if (ev.type === "delta") { raw += ev.text; send("delta", { t: ev.text }); }
        else if (ev.type === "reasoning") { reasoning += ev.text; send("reasoning", { t: ev.text }); }
        else if (ev.type === "usage") tokens = ev.total;
      }
    } catch {
      if (signal.aborted && raw) {
        // client went away; keep partial
      } else if (!raw) {
        offline = true;
        const reply = mockReply({ text, persona: conv!.persona, castSummary: cast });
        for await (const piece of chunkText(reply, signal)) { raw += piece; send("delta", { t: piece }); }
      }
    }

    const split = splitOutput(raw);
    const { thinking, body: content } = split;
    let memo = split.memo;
    // 兜底：从用户原话里识别称呼与生日
    if (text) {
      const extra: Record<string, unknown> = {};
      const nm = text.match(/(?:我叫|叫我)([\u4e00-\u9fa5A-Za-z0-9]{1,6})(?:[，,。.!！\s]|$)/);
      const nick = nm?.[1].replace(/(就行了?|就好了?|就可以|就成|好了|吧|啦|呀|哦|哈|呢)+$/, "");
      if (nick && !user.nickname && !/一个|个|人|在|有点|真的|不是/.test(nick)) extra.nickname = nick;
      const bd = text.match(/(19\d{2}|20\d{2})[年\-/.](\d{1,2})[月\-/.](\d{1,2})/);
      if (bd && !user.profile.birthday) extra.birthday = `${bd[1]}-${bd[2].padStart(2, "0")}-${bd[3].padStart(2, "0")}`;
      if (Object.keys(extra).length) memo = { ...extra, ...(memo ?? {}) };
    }
    if (!tokens) tokens = estimateTokens(system) / 3 + estimateTokens(raw) + estimateTokens(text);
    tokens = Math.round(tokens);

    await db.insert(messages).values({
      id: assistantId,
      conversationId,
      role: "assistant",
      content,
      thinking: [reasoning.trim(), thinking].filter(Boolean).join("\n") || null,
      meta: { offline, thinkMs: Date.now() - started },
      tokens: offline ? 0 : tokens,
    });
    await db.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, conversationId));
    if (!offline) await logUsage(user.id, tokens, "chat");

    if (memo) {
      const prof: UserProfile = { ...user.profile };
      const s = (v: unknown, n: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, n) : undefined);
      const bd = s(memo.birthday, 10);
      if (bd && /^\d{4}-\d{2}-\d{2}$/.test(bd)) prof.birthday = bd;
      if (typeof memo.birthHour === "number" && memo.birthHour >= 0 && memo.birthHour < 24) prof.birthHour = memo.birthHour;
      if (s(memo.gender, 8)) prof.gender = s(memo.gender, 8);
      if (s(memo.concern, 80)) prof.concern = s(memo.concern, 80);
      if (s(memo.mood, 40)) prof.mood = s(memo.mood, 40);
      const nick = s(memo.nickname, 20);
      await db.update(users).set({ profile: prof, onboarded: true, ...(nick ? { nickname: nick } : {}), updatedAt: new Date() }).where(eq(users.id, user.id));
      send("profile", { nickname: nick ?? user.nickname, profile: prof });
    }

    send("done", { tokens: offline ? 0 : tokens, offline, assistantMessageId: assistantId });

    // 第 2~3 轮自动起标题
    if (!conv!.title && !signal.aborted) {
      const [{ c }] = await db
        .select({ c: sql<number>`count(*)::int` })
        .from(messages)
        .where(and(eq(messages.conversationId, conversationId), eq(messages.role, "user")));
      if (c >= 2) {
        let title = "";
        if (!offline) {
          try {
            const all = await db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(asc(messages.createdAt)).limit(10);
            const transcript = all.map((m) => `${m.role === "user" ? "我" : "TA"}：${(m.content || ((m.meta as MessageMeta)?.cast ? "（起了一卦）" : "")).slice(0, 160)}`).join("\n");
            const r = await completeChat([{ role: "system", content: TITLE_PROMPT }, { role: "user", content: transcript }], { temperature: 0.7, maxTokens: 60 });
            title = r.text.replace(/["“”「」《》。！!？?]/g, "").split("\n")[0].trim().slice(0, 16);
            await logUsage(user.id, r.total, "title");
          } catch {}
        }
        if (!title) {
          const first = recent.find((m) => m.role === "user" && m.content)?.content ?? text;
          title = first.replace(/\s+/g, " ").slice(0, 12) || "一次起卦";
        }
        await db.update(conversations).set({ title }).where(eq(conversations.id, conversationId));
        send("title", { title, conversationId });
      }
    }
  }, req);
}
