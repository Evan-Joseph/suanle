export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export type LLMEvent =
  | { type: "content"; text: string }
  | { type: "reasoning"; text: string }
  | { type: "usage"; total: number; prompt: number; completion: number }
  | { type: "model"; name: string };

const BASE = (process.env.LLM_BASE_URL || "https://api.ai-pixel.online/v1").replace(/\/$/, "");
const KEY = process.env.LLM_API_KEY || "sk-fD6BC3ofOyAjzSe8uKdbkqVDMXBqPWl4SbdT0a9sVG65UPtM";
const PRIMARY = process.env.LLM_MODEL || "gemini-4-argon";
const FALLBACKS = (process.env.LLM_FALLBACK_MODELS || "gemini-2.5-flash")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const g = globalThis as typeof globalThis & { __suanleBadModels?: Map<string, number> };
const bad = g.__suanleBadModels ?? (g.__suanleBadModels = new Map<string, number>());
const COOL_MS = 10 * 60 * 1000;

export function hasLLM() {
  return Boolean(KEY);
}

function candidates(): string[] {
  const all = [PRIMARY, ...FALLBACKS.filter((m) => m !== PRIMARY)];
  const now = Date.now();
  const ok = all.filter((m) => !(bad.has(m) && now - (bad.get(m) ?? 0) < COOL_MS));
  return ok.length ? ok : all;
}

const BROKEN_HINTS = /no longer available|is unavailable|please switch to/i;

async function open(model: string, messages: LLMMessage[], stream: boolean, maxTokens: number, signal?: AbortSignal) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), stream ? 25000 : 20000);
  signal?.addEventListener("abort", () => ctrl.abort());
  try {
    const res = await fetch(`${BASE}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
      body: JSON.stringify({
        model,
        messages,
        stream,
        temperature: 0.85,
        max_tokens: maxTokens,
        ...(stream ? { stream_options: { include_usage: true } } : {}),
      }),
      signal: ctrl.signal,
    });
    return { res, clear: () => clearTimeout(timer) };
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

/** 流式对话：按候选模型依次尝试；首个有效内容出现后才算成功 */
export async function* streamChat(messages: LLMMessage[], opts: { maxTokens?: number; signal?: AbortSignal } = {}): AsyncGenerator<LLMEvent> {
  if (!KEY) throw new Error("NO_KEY");
  let lastErr: unknown = null;
  for (const model of candidates()) {
    let produced = false;
    try {
      const { res, clear } = await open(model, messages, true, opts.maxTokens ?? 1600, opts.signal);
      const ctype = res.headers.get("content-type") || "";
      if (!res.ok || !res.body || ctype.includes("application/json")) {
        const txt = await res.text().catch(() => "");
        clear();
        bad.set(model, Date.now());
        lastErr = new Error(`upstream ${res.status} ${txt.slice(0, 200)}`);
        continue;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let firstCheck = "";
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
            if (data === "[DONE]") continue;
            let j: {
              choices?: { delta?: { content?: string; reasoning_content?: string; reasoning?: string } }[];
              usage?: { total_tokens?: number; prompt_tokens?: number; completion_tokens?: number };
              error?: unknown;
            };
            try {
              j = JSON.parse(data);
            } catch {
              continue;
            }
            if (j.error && !produced) throw new Error("stream error");
            const d = j.choices?.[0]?.delta;
            const r = d?.reasoning_content || d?.reasoning;
            if (r) {
              if (!produced) yield { type: "model", name: model };
              produced = true;
              yield { type: "reasoning", text: r };
            }
            if (d?.content) {
              if (!produced) {
                firstCheck += d.content;
                if (firstCheck.length < 160 && BROKEN_HINTS.test(firstCheck)) throw new Error("model retired");
                if (firstCheck.length < 24) continue; // 攒一点再判断
                yield { type: "model", name: model };
                produced = true;
                yield { type: "content", text: firstCheck };
              } else {
                yield { type: "content", text: d.content };
              }
            }
            if (j.usage?.total_tokens) {
              usage = {
                type: "usage",
                total: j.usage.total_tokens,
                prompt: j.usage.prompt_tokens ?? 0,
                completion: j.usage.completion_tokens ?? 0,
              };
            }
          }
        }
      } finally {
        clear();
      }
      if (!produced && firstCheck) {
        if (BROKEN_HINTS.test(firstCheck)) throw new Error("model retired");
        yield { type: "model", name: model };
        produced = true;
        yield { type: "content", text: firstCheck };
      }
      if (usage) yield usage;
      if (produced) return;
      lastErr = new Error("empty");
      bad.set(model, Date.now());
    } catch (e) {
      if (produced) throw e;
      if (opts.signal?.aborted) throw e;
      bad.set(model, Date.now());
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("all models failed");
}

/** 一次性补全（标题、类比等轻任务） */
export async function complete(messages: LLMMessage[], maxTokens = 300): Promise<string | null> {
  if (!KEY) return null;
  for (const model of candidates()) {
    try {
      const { res, clear } = await open(model, messages, false, maxTokens);
      clear();
      if (!res.ok) {
        bad.set(model, Date.now());
        continue;
      }
      const j = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const text = j.choices?.[0]?.message?.content?.trim();
      if (text && !BROKEN_HINTS.test(text)) return text;
      bad.set(model, Date.now());
    } catch {
      bad.set(model, Date.now());
    }
  }
  return null;
}

export function extractJSON<T>(text: string | null): T | null {
  if (!text) return null;
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]) as T;
  } catch {
    return null;
  }
}
