import { resolveEngine, streamChat, type LLMMessage } from "@/lib/server/llm";
import { buildSystemPrompt, sanitizeProfile, userNow } from "@/lib/server/prompt";
import { allow, clientKey, logUsage } from "@/lib/server/store";
import { extractBirth, extractGender, mockReply, type ChatMsg } from "@/lib/mock";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(messages: unknown): ChatMsg[] {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter((m): m is ChatMsg => !!m && typeof m === "object" && ((m as ChatMsg).role === "user" || (m as ChatMsg).role === "assistant") && typeof (m as ChatMsg).content === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
}

function distillContextSummary(olderMessages: ChatMsg[]): string {
  if (!olderMessages.length) return "";
  const parts: string[] = [];
  for (const m of olderMessages) {
    if (m.role === "user") {
      const line = m.content.replace(/\s+/g, " ").slice(0, 70);
      if (line) parts.push(`对方曾问/提过：${line}`);
    } else if (m.role === "assistant") {
      const letgo = m.content.match(/^>\s?.+$/m);
      if (letgo) {
        parts.push(`曾给出点拨：${letgo[0].replace(/^>\s?/, "").replace(/\*\*/g, "").slice(0, 50)}`);
      } else if (m.content.includes("```suanle")) {
        const wmatch = m.content.match(/"widget":"(\w+)"/);
        if (wmatch) parts.push(`曾进行${wmatch[1]}推演`);
      }
    }
  }
  return parts.slice(-6).join("；");
}

const estimate = (t: string) => Math.ceil(t.length * 0.9);

export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "bad request" }, { status: 400 });
  }
  const allMessages = clean(body.messages);
  if (!allMessages.length || allMessages[allMessages.length - 1].role !== "user") {
    return Response.json({ error: "no user message" }, { status: 400 });
  }

  // 滚动上下文窗口：保留最近活跃对话，较早的轮次提炼为脉络摘要，杜绝健忘与超长断档
  const clientSummary = typeof body.summary === "string" ? body.summary.trim() : "";
  let combinedSummary = clientSummary;
  let messages = allMessages;
  if (allMessages.length > 14) {
    const older = allMessages.slice(0, -10);
    messages = allMessages.slice(-10);
    const autoSummary = distillContextSummary(older);
    combinedSummary = [clientSummary, autoSummary].filter(Boolean).join("；");
  }

  const anonId = typeof body.anonId === "string" ? body.anonId : "";
  const deep = body.deep === true;
  const profile = sanitizeProfile(body.profile);
  // 生辰刚在这句话里出现时，先用它排好盘，免得模型自己推算出错
  const lastUser = messages[messages.length - 1].content;
  if (!profile.birth) {
    const inline = extractBirth(lastUser);
    if (inline) profile.birth = inline;
  }
  if (!profile.gender) {
    const g = extractGender(lastUser);
    if (g) profile.gender = g;
  }
  const engine = resolveEngine(req, "chat");
  const limited = !engine.custom && !allow(clientKey(req, anonId), 24, 60_000);
  const system = buildSystemPrompt(profile, { deep, now: userNow(body.tzOffset), summary: combinedSummary || undefined });
  const llmMessages: LLMMessage[] = [{ role: "system", content: system }, ...messages];
  const enc = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => {
        try {
          controller.enqueue(enc.encode(JSON.stringify(obj) + "\n"));
        } catch {
          /* 客户端已离开 */
        }
      };
      let out = "";
      let usage = 0;
      let model = "local";
      let produced = false;
      if (!limited) {
        try {
          for await (const ev of streamChat(engine, llmMessages, { maxTokens: deep ? 2800 : 1500, signal: req.signal })) {
            if (ev.type === "content") {
              produced = true;
              out += ev.text;
              send({ t: "d", v: ev.text });
            } else if (ev.type === "reasoning") {
              produced = true;
              out += ev.text;
              send({ t: "r", v: ev.text });
            } else if (ev.type === "usage") {
              usage = ev.total;
            } else if (ev.type === "model") {
              model = ev.name;
            }
          }
        } catch {
          /* 走本地兜底 */
        }
      }
      if (!produced && !req.signal.aborted) {
        const text = mockReply(messages, profile, { deep });
        send({ t: "l" });
        const chunks = text.match(/[\s\S]{1,4}/g) ?? [];
        for (const c of chunks) {
          if (req.signal.aborted) break;
          out += c;
          send({ t: "d", v: c });
          await new Promise((r) => setTimeout(r, 16));
        }
      }
      // 「算力」是产品里的统一度量：取上游用量与本地估算中较大的一个，保持口径稳定
      usage = Math.max(usage, estimate(system) + messages.reduce((acc, m) => acc + estimate(m.content), 0) + estimate(out));
      send({ t: "u", v: usage });
      send({ t: "end" });
      try {
        controller.close();
      } catch {
        /* 已关闭 */
      }
      if (produced) await logUsage(anonId, deep ? "deep" : "chat", usage, model);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
