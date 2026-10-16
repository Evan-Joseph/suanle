import { streamChat, hasLLM, type LLMMessage } from "@/lib/llm";
import { buildSystemPrompt, type PromptProfile } from "@/lib/prompt";
import { mockReply, type ChatMsg } from "@/lib/mock";
import { db } from "@/db";
import { usageLogs, profiles } from "@/db/schema";
import { sql } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body { messages?: ChatMsg[]; profile?: PromptProfile; deep?: boolean; anonId?: string; sessionId?: string }

function clean(messages: unknown): ChatMsg[] {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter((m): m is ChatMsg => !!m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-24)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
}

async function logUsage(p: { anonId?: string; sessionId?: string; model: string | null; prompt: number; completion: number; total: number; deep: boolean; offline: boolean }) {
  if (!p.anonId) return;
  try {
    await db.insert(usageLogs).values({
      anonId: p.anonId, sessionId: p.sessionId ?? null, model: p.model,
      promptTokens: p.prompt, completionTokens: p.completion, totalTokens: p.total, deep: p.deep, offline: p.offline,
    });
    await db
      .insert(profiles)
      .values({ anonId: p.anonId, tokensTotal: p.total })
      .onConflictDoUpdate({ target: profiles.anonId, set: { tokensTotal: sql`${profiles.tokensTotal} + ${p.total}`, updatedAt: new Date() } });
  } catch { /* 数据库不可用时静默 */ }
}

export async function POST(req: Request) {
  let body: Body = {};
  try { body = (await req.json()) as Body; } catch { return Response.json({ error: "bad request" }, { status: 400 }); }
  const messages = clean(body.messages);
  if (!messages.length || messages[messages.length - 1].role !== "user") return Response.json({ error: "empty" }, { status: 400 });
  const profile = body.profile ?? {};
  const deep = !!body.deep;
  const enc = new TextEncoder();
  const line = (o: Record<string, unknown>) => enc.encode(JSON.stringify(o) + "\n");

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (o: Record<string, unknown>) => { try { controller.enqueue(line(o)); } catch { /* closed */ } };
      let produced = 0;
      let model: string | null = null;
      let usage = { prompt: 0, completion: 0, total: 0 };
      const sys: LLMMessage = { role: "system", content: buildSystemPrompt(profile, { deep }) };
      if (hasLLM()) {
        try {
          for await (const ev of streamChat([sys, ...messages], { maxTokens: deep ? 2600 : 1600, signal: req.signal })) {
            if (ev.type === "content") { produced += ev.text.length; send({ t: "d", v: ev.text }); }
            else if (ev.type === "reasoning") { produced += ev.text.length; send({ t: "r", v: ev.text }); }
            else if (ev.type === "usage") { usage = { prompt: ev.prompt, completion: ev.completion, total: ev.total }; send({ t: "u", v: ev.total }); }
            else if (ev.type === "model") { model = ev.name; }
          }
        } catch { /* fall through to mock */ }
      }
      if (!produced && !req.signal.aborted) {
        send({ t: "o" });
        const text = mockReply(messages, profile);
        for (const chunk of text.match(/[\s\S]{1,6}/g) ?? []) {
          send({ t: "d", v: chunk });
          await new Promise((r) => setTimeout(r, 14));
        }
        const est = Math.ceil((sys.content.length + JSON.stringify(messages).length) * 0.6) + Math.ceil(text.length * 1.1);
        usage = { prompt: est - Math.ceil(text.length * 1.1), completion: Math.ceil(text.length * 1.1), total: est };
        send({ t: "u", v: est });
      }
      if (produced) {
        // 网关有时只回报补全 token；以提示词+正文估算值兜底
        const estPrompt = Math.ceil((sys.content.length + JSON.stringify(messages).length) * 0.6);
        const est = estPrompt + Math.ceil(produced * 1.1);
        if (usage.total < est * 0.6) {
          usage = { prompt: Math.max(usage.prompt, estPrompt), completion: Math.max(usage.completion, Math.ceil(produced * 1.1)), total: est };
          send({ t: "u", v: usage.total });
        }
      }
      await logUsage({ anonId: body.anonId, sessionId: body.sessionId, model, ...usage, deep, offline: !produced });
      try { controller.close(); } catch { /* closed */ }
    },
  });

  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-cache", "X-Accel-Buffering": "no" } });
}
