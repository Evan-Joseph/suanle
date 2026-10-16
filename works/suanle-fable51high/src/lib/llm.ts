export interface LLMMessage { role: "system" | "user" | "assistant"; content: string }

export type LLMEvent =
  | { type: "content"; text: string }
  | { type: "reasoning"; text: string }
  | { type: "usage"; total: number; prompt: number; completion: number }
  | { type: "model"; name: string };

const BASE = (process.env.LLM_BASE_URL || "https://api.ai-pixel.online/v1").replace(/\/$/, "");
const KEY = process.env.LLM_API_KEY || "sk-fD6BC3ofOyAjzSe8uKdbkqVDMXBqPWl4SbdT0a9sVG65UPtM";
const PRIMARY = process.env.LLM_MODEL || "gemini-4-argon";
const FALLBACKS = (process.env.LLM_FALLBACK_MODELS || "gemini-2.5-flash,gemini-2.5-pro,gemini-3.5-flash")
  .split(",").map((s) => s.trim()).filter(Boolean);

const g = globalThis as typeof globalThis & { __suanleBad?: Map<string, number> };
const bad = g.__suanleBad ?? (g.__suanleBad = new Map<string, number>());
const COOL_MS = 5 * 60 * 1000;

export function hasLLM() { return Boolean(KEY); }

function candidates(): string[] {
  const all = [PRIMARY, ...FALLBACKS.filter((m) => m !== PRIMARY)];
  const now = Date.now();
  const ok = all.filter((m) => !(bad.has(m) && now - (bad.get(m) ?? 0) < COOL_MS));
  return ok.length ? ok : all;
}

async function open(model: string, messages: LLMMessage[], stream: boolean, maxTokens: number, signal?: AbortSignal) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), stream ? 30000 : 20000);
  signal?.addEventListener("abort", () => ctrl.abort());
  try {
    const res = await fetch(`${BASE}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
      body: JSON.stringify({
        model, messages, stream, temperature: 0.85, max_tokens: maxTokens,
        ...(stream ? { stream_options: { include_usage: true } } : {}),
      }),
      signal: ctrl.signal,
    });
    return { res, clear: () => clearTimeout(timer) };
  } catch (e) { clearTimeout(timer); throw e; }
}

interface Delta { content?: string; reasoning_content?: string; reasoning?: string }
interface Chunk { choices?: { delta?: Delta }[]; usage?: { total_tokens?: number; prompt_tokens?: number; completion_tokens?: number } }

/** 流式对话：按候选模型依次尝试，首个产出内容的模型视为成功 */
export async function* streamChat(messages: LLMMessage[], opts: { maxTokens?: number; signal?: AbortSignal } = {}): AsyncGenerator<LLMEvent> {
  if (!KEY) throw new Error("NO_KEY");
  let lastErr: unknown = null;
  for (const model of candidates()) {
    let produced = false;
    try {
      const { res, clear } = await open(model, messages, true, opts.maxTokens ?? 1800, opts.signal);
      const ctype = res.headers.get("content-type") || "";
      if (!res.ok || !res.body || ctype.includes("application/json")) {
        const txt = await res.text().catch(() => "");
        clear();
        bad.set(model, Date.now());
        lastErr = new Error(`upstream ${res.status} ${txt.slice(0, 160)}`);
        continue;
      }
      yield { type: "model", name: model };
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let usage: LLMEvent | null = null;
      try {
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
            if (!data || data === "[DONE]") continue;
            let j: Chunk;
            try { j = JSON.parse(data) as Chunk; } catch { continue; }
            const d = j.choices?.[0]?.delta;
            const r = d?.reasoning_content ?? d?.reasoning;
            if (r) { produced = true; yield { type: "reasoning", text: r }; }
            if (d?.content) { produced = true; yield { type: "content", text: d.content }; }
            if (j.usage?.total_tokens) {
              usage = { type: "usage", total: j.usage.total_tokens, prompt: j.usage.prompt_tokens ?? 0, completion: j.usage.completion_tokens ?? 0 };
            }
          }
        }
      } finally { clear(); }
      if (usage) yield usage;
      if (produced) return;
      bad.set(model, Date.now());
      lastErr = new Error("empty stream");
    } catch (e) {
      if (opts.signal?.aborted) return;
      if (produced) return;
      bad.set(model, Date.now());
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("no model");
}

/** 非流式小任务（起标题、隐喻） */
export async function completeOnce(messages: LLMMessage[], maxTokens = 200): Promise<string> {
  if (!KEY) throw new Error("NO_KEY");
  let lastErr: unknown = null;
  for (const model of candidates()) {
    try {
      const { res, clear } = await open(model, messages, false, maxTokens);
      const j = (await res.json().catch(() => null)) as { choices?: { message?: { content?: string } }[]; error?: unknown } | null;
      clear();
      const text = j?.choices?.[0]?.message?.content;
      if (!res.ok || !text) { bad.set(model, Date.now()); lastErr = new Error("bad"); continue; }
      return text;
    } catch (e) { bad.set(model, Date.now()); lastErr = e; }
  }
  throw lastErr ?? new Error("no model");
}
