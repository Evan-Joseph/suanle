import { streamChat, type LLMMessage } from "@/lib/llm";
import { buildSystemPrompt, type PromptProfile } from "@/lib/prompt";
import { mockReply, type ChatMsg } from "@/lib/mock";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  messages?: ChatMsg[];
  profile?: PromptProfile;
  deep?: boolean;
}

function clean(messages: unknown): ChatMsg[] {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter((m): m is ChatMsg => !!m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-24)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
}

function estimate(text: string) {
  return Math.ceil(text.length * 0.9);
}

export async function POST(req: Request) {
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    return Response.json({ error: "bad request" }, { status: 400 });
  }
  const messages = clean(body.messages);
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return Response.json({ error: "no user message" }, { status: 400 });
  }
  const profile: PromptProfile = typeof body.profile === "object" && body.profile ? body.profile : {};
  const system = buildSystemPrompt(profile, { deep: !!body.deep });
  const llmMessages: LLMMessage[] = [{ role: "system", content: system }, ...messages];
  const enc = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => {
        try {
          controller.enqueue(enc.encode(JSON.stringify(obj) + "\n"));
        } catch {
          /* client gone */
        }
      };
      let out = "";
      let gotUsage = false;
      let produced = false;
      try {
        for await (const ev of streamChat(llmMessages, { maxTokens: body.deep ? 2600 : 1400, signal: req.signal })) {
          if (ev.type === "content") {
            produced = true;
            out += ev.text;
            send({ t: "d", v: ev.text });
          } else if (ev.type === "reasoning") {
            produced = true;
            out += ev.text;
            send({ t: "r", v: ev.text });
          } else if (ev.type === "usage") {
            gotUsage = true;
            send({ t: "u", v: ev.total });
          } else if (ev.type === "model") {
            send({ t: "m", v: ev.name });
          }
        }
      } catch {
        if (!produced && !req.signal.aborted) {
          // 本地兜底：依然流式、依然有人味
          const text = mockReply(messages, profile);
          send({ t: "o", v: true });
          const chunks = text.match(/[\s\S]{1,6}/g) ?? [];
          for (const c of chunks) {
            if (req.signal.aborted) break;
            out += c;
            send({ t: "d", v: c });
            await new Promise((r) => setTimeout(r, 18));
          }
        }
      }
      if (!gotUsage) {
        send({ t: "u", v: estimate(system) + messages.reduce((a, m) => a + estimate(m.content), 0) + estimate(out) });
      }
      send({ t: "end" });
      try {
        controller.close();
      } catch {
        /* closed */
      }
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
