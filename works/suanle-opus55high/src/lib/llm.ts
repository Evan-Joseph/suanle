export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export type LLMEvent =
  | { type: "content"; text: string }
  | { type: "reasoning"; text: string }
  | { type: "usage"; total: number };

const BASE = "https://api.ai-pixel.online/v1";
const KEY = "";
const MODELS = ["gemini-4-argon", "gemini-3.8-flash", "gemini-2.5-flash"];
const FAST_MODELS = ["gemini-3.8-flash", "gemini-4-argon", "gemini-2.5-flash"];

/** 暂时出问题的模型冷却一会儿，别反复撞墙 */
const cooling = new Map<string, number>();
const COOL_MS = 5 * 60 * 1000;
function pool(list: string[]) {
  const now = Date.now();
  const ok = list.filter((m) => !(cooling.has(m) && now - (cooling.get(m) ?? 0) < COOL_MS));
  return ok.length ? ok : list;
}

function linkAbort(outer: AbortSignal | undefined, ms: number) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), ms);
  const onAbort = () => ctl.abort();
  outer?.addEventListener("abort", onAbort);
  return {
    signal: ctl.signal,
    clear: () => {
      clearTimeout(timer);
      outer?.removeEventListener("abort", onAbort);
    },
  };
}

/** 流式对话：逐模型尝试，第一个吐出内容的模型胜出 */
export async function* streamChat(messages: LLMMessage[], opts: { signal?: AbortSignal; maxTokens?: number } = {}): AsyncGenerator<LLMEvent> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) throw new Error("offline");
  let lastErr: unknown = null;
  for (const model of pool(MODELS)) {
    if (opts.signal?.aborted) return;
    const firstByte = linkAbort(opts.signal, 30000);
    let produced = false;
    try {
      const res = await fetch(`${BASE}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
        body: JSON.stringify({ model, messages, stream: true, temperature: 0.85, max_tokens: opts.maxTokens ?? 2400 }),
        signal: firstByte.signal,
      });
      if (!res.ok || !res.body) {
        const txt = await res.text().catch(() => "");
        throw new Error(`${res.status} ${txt.slice(0, 120)}`);
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let usage = 0;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf("\n")) !== -1) {
          const line = buf.slice(0, idx).trim();
          buf = buf.slice(idx + 1);
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (data === "[DONE]") continue;
          let j: {
            error?: { message?: string };
            choices?: { delta?: { content?: string; reasoning_content?: string; reasoning?: string } }[];
            usage?: { total_tokens?: number };
          };
          try {
            j = JSON.parse(data);
          } catch {
            continue;
          }
          if (j.error && !produced) throw new Error(j.error.message || "upstream");
          const d = j.choices?.[0]?.delta;
          const r = d?.reasoning_content || d?.reasoning;
          if (r) {
            produced = true;
            firstByte.clear();
            yield { type: "reasoning", text: r };
          }
          if (d?.content) {
            produced = true;
            firstByte.clear();
            yield { type: "content", text: d.content };
          }
          if (j.usage?.total_tokens) usage = j.usage.total_tokens;
        }
      }
      firstByte.clear();
      if (!produced) throw new Error("empty");
      if (usage) yield { type: "usage", total: usage };
      return;
    } catch (e) {
      firstByte.clear();
      if (opts.signal?.aborted) return;
      if (produced) return; // 已经说了一半，就不换人重说了
      cooling.set(model, Date.now());
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("all models failed");
}

/** 非流式小任务：标题、类比等 */
export async function complete(messages: LLMMessage[], opts: { maxTokens?: number; temperature?: number; timeout?: number } = {}): Promise<string> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) throw new Error("offline");
  let lastErr: unknown = null;
  for (const model of pool(FAST_MODELS)) {
    const t = linkAbort(undefined, opts.timeout ?? 15000);
    try {
      const res = await fetch(`${BASE}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
        body: JSON.stringify({ model, messages, temperature: opts.temperature ?? 0.7, max_tokens: opts.maxTokens ?? 300 }),
        signal: t.signal,
      });
      t.clear();
      if (!res.ok) throw new Error(String(res.status));
      const j = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const text = j.choices?.[0]?.message?.content?.trim();
      if (!text) throw new Error("empty");
      return text;
    } catch (e) {
      t.clear();
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("failed");
}

export function extractJSON<T>(text: string): T | null {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]) as T;
  } catch {
    return null;
  }
}
