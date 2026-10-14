import { openStream, type ChatMsg } from "@/lib/server/llm";
import { systemPrompt } from "@/lib/server/prompt";
import { mockReply } from "@/lib/mock";
import { recordUsage } from "@/lib/server/usage";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface Body {
  deviceId?: string;
  messages?: { role: string; content: string }[];
  profile?: Profile | null;
}

const enc = new TextEncoder();
const ev = (o: unknown) => enc.encode(`data: ${JSON.stringify(o)}\n\n`);

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad request" }, { status: 400 });
  }
  const deviceId = String(body.deviceId || "anon").slice(0, 64);
  const profile = body.profile || null;
  const history = (body.messages || [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-24)
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content.slice(0, 6000) }));
  if (!history.length) return Response.json({ error: "empty" }, { status: 400 });

  const messages: ChatMsg[] = [{ role: "system", content: systemPrompt(profile) }, ...history];
  const upstream = await openStream(messages, req.signal);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (o: unknown) => {
        try { controller.enqueue(ev(o)); } catch { /* closed */ }
      };
      if (!upstream) {
        // graceful local fallback
        const text = mockReply(history, profile);
        send({ t: "meta", offline: true });
        const chunks = text.match(/[\s\S]{1,6}/g) || [];
        for (const c of chunks) {
          if (req.signal.aborted) break;
          send({ t: "c", d: c });
          await new Promise((r) => setTimeout(r, 18));
        }
        const est = Math.round(JSON.stringify(messages).length / 1.6 + text.length * 1.2);
        send({ t: "u", d: est });
        send({ t: "done" });
        controller.close();
        return;
      }
      send({ t: "meta", model: upstream.model });
      const reader = upstream.res.body!.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let total = 0;
      let prompt = 0;
      let completion = 0;
      let outLen = 0;
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() || "";
          for (const line of lines) {
            const s = line.trim();
            if (!s.startsWith("data:")) continue;
            const data = s.slice(5).trim();
            if (data === "[DONE]") continue;
            try {
              const j = JSON.parse(data);
              const delta = j?.choices?.[0]?.delta || {};
              const rc = delta.reasoning_content || delta.reasoning;
              if (rc) send({ t: "r", d: rc });
              if (delta.content) {
                outLen += delta.content.length;
                send({ t: "c", d: delta.content });
              }
              if (j?.usage?.total_tokens) {
                total = j.usage.total_tokens;
                prompt = j.usage.prompt_tokens || 0;
                completion = j.usage.completion_tokens || 0;
              }
            } catch { /* partial json */ }
          }
        }
      } catch {
        /* aborted / network */
      }
      if (!outLen && !req.signal.aborted) {
        const text = mockReply(history, profile);
        send({ t: "meta", offline: true });
        send({ t: "c", d: text });
      }
      if (!total) total = Math.round(JSON.stringify(messages).length / 1.6 + outLen * 1.2);
      send({ t: "u", d: total });
      send({ t: "done" });
      try { controller.close(); } catch { /* noop */ }
      recordUsage(deviceId, "chat", upstream.model, prompt || total - completion, completion).catch(() => {});
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
