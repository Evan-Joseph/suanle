import "server-only";

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export type LLMEvent =
  | { type: "content"; text: string }
  | { type: "reasoning"; text: string }
  | { type: "usage"; total: number }
  | { type: "model"; name: string };

export interface Engine {
  base: string;
  key: string;
  models: string[];
  custom: boolean;
}

const ENV_BASE = (process.env.LLM_BASE_URL || "https://api.ai-pixel.online/v1").replace(/\/+$/, "");
const ENV_KEY = process.env.LLM_API_KEY || "";
const ENV_MODEL = process.env.LLM_MODEL || "gemini-4-argon";
const ENV_FALLBACKS = (process.env.LLM_FALLBACK_MODELS || "gemini-2.5-flash")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/** 只允许公网 https 地址，避免被用来探测内网 */
function safeBase(raw: string): string | null {
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== "https:") return null;
    const h = u.hostname.toLowerCase().replace(/^\[|\]$/g, "");
    if (
      h === "localhost" ||
      h.endsWith(".local") ||
      h.endsWith(".internal") ||
      h === "::1" ||
      /^(127|10|0)\./.test(h) ||
      /^192\.168\./.test(h) ||
      /^169\.254\./.test(h) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(h) ||
      /^(fc|fd|fe80)/.test(h) ||
      /^\d+$/.test(h)
    )
      return null;
    return u.toString().replace(/\/+$/, "");
  } catch {
    return null;
  }
}

export function resolveEngine(req: Request): Engine {
  const key = req.headers.get("x-engine-key")?.trim();
  const fallback: Engine = { base: ENV_BASE, key: ENV_KEY, models: [ENV_MODEL, ...ENV_FALLBACKS.filter((m) => m !== ENV_MODEL)], custom: false };
  if (!key) return fallback;
  const baseRaw = req.headers.get("x-engine-base");
  const base = baseRaw ? safeBase(baseRaw) : ENV_BASE;
  if (!base) return fallback;
  const model = (req.headers.get("x-engine-model") || "").trim().slice(0, 80) || ENV_MODEL;
  return { base, key: key.slice(0, 400), models: [model], custom: true };
}

export function hasKey(e: Engine) {
  return Boolean(e.key);
}

const g = globalThis as typeof globalThis & { __suanleCool?: Map<string, number> };
const cool = g.__suanleCool ?? (g.__suanleCool = new Map<string, number>());
const COOL_MS = 5 * 60 * 1000;

function candidates(e: Engine): string[] {
  const now = Date.now();
  const ok = e.models.filter((m) => now - (cool.get(`${e.base}|${m}`) ?? 0) > COOL_MS);
  return ok.length ? ok : e.models;
}
const markBad = (e: Engine, m: string) => cool.set(`${e.base}|${m}`, Date.now());

const RETIRED = /no longer available|is unavailable|please switch to|model not found/i;

interface Chunk {
  choices?: { delta?: { content?: string; reasoning_content?: string; reasoning?: string } }[];
  usage?: { total_tokens?: number };
  error?: unknown;
}

/** 流式对话：按候选模型依次尝试；首段有效内容出现后才算成功 */
export async function* streamChat(e: Engine, messages: LLMMessage[], opts: { maxTokens: number; temperature?: number; signal?: AbortSignal }): AsyncGenerator<LLMEvent> {
  if (!e.key) throw new Error("NO_KEY");
  let lastErr: unknown = null;
  for (const model of candidates(e)) {
    let produced = false;
    const ctrl = new AbortController();
    const onAbort = () => ctrl.abort();
    opts.signal?.addEventListener("abort", onAbort);
    let timer: ReturnType<typeof setTimeout> | null = null;
    const arm = (ms: number) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => ctrl.abort(), ms);
    };
    try {
      // 首包 15 秒内没动静就换下一个模型，别让人干等
      arm(15000);
      const res = await fetch(`${e.base}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${e.key}` },
        body: JSON.stringify({
          model,
          messages,
          stream: true,
          temperature: opts.temperature ?? 0.85,
          max_tokens: opts.maxTokens,
          stream_options: { include_usage: true },
        }),
        signal: ctrl.signal,
      });
      const ctype = res.headers.get("content-type") || "";
      if (!res.ok || !res.body || ctype.includes("application/json")) {
        await res.text().catch(() => "");
        markBad(e, model);
        lastErr = new Error(`upstream ${res.status}`);
        continue;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let head = "";
      let usage = 0;
      while (true) {
        arm(30000);
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
          try {
            j = JSON.parse(data) as Chunk;
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
              head += d.content;
              if (head.length < 160 && RETIRED.test(head)) throw new Error("model retired");
              if (head.length < 16) continue;
              produced = true;
              yield { type: "model", name: model };
              yield { type: "content", text: head };
            } else {
              yield { type: "content", text: d.content };
            }
          }
          if (j.usage?.total_tokens) usage = j.usage.total_tokens;
        }
      }
      if (!produced && head) {
        if (RETIRED.test(head)) throw new Error("model retired");
        produced = true;
        yield { type: "model", name: model };
        yield { type: "content", text: head };
      }
      if (usage) yield { type: "usage", total: usage };
      if (produced) return;
      markBad(e, model);
      lastErr = new Error("empty");
    } catch (err) {
      if (produced) throw err;
      if (opts.signal?.aborted) throw err;
      markBad(e, model);
      lastErr = err;
    } finally {
      if (timer) clearTimeout(timer);
      opts.signal?.removeEventListener("abort", onAbort);
    }
  }
  throw lastErr ?? new Error("all models failed");
}

/** 一次性补全（标题、类比、年度盘等轻任务） */
export async function complete(e: Engine, messages: LLMMessage[], opts: { maxTokens?: number; temperature?: number; timeoutMs?: number } = {}): Promise<{ text: string; tokens: number; model: string } | null> {
  if (!e.key) return null;
  for (const model of candidates(e)) {
    try {
      const res = await fetch(`${e.base}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${e.key}` },
        body: JSON.stringify({ model, messages, stream: false, temperature: opts.temperature ?? 0.7, max_tokens: opts.maxTokens ?? 400 }),
        signal: AbortSignal.timeout(opts.timeoutMs ?? 25000),
      });
      if (!res.ok) {
        markBad(e, model);
        continue;
      }
      const j = (await res.json()) as { choices?: { message?: { content?: string } }[]; usage?: { total_tokens?: number } };
      const text = j.choices?.[0]?.message?.content?.trim();
      if (text && !RETIRED.test(text)) return { text, tokens: j.usage?.total_tokens ?? 0, model };
      markBad(e, model);
    } catch {
      markBad(e, model);
    }
  }
  return null;
}

export function extractJSON<T>(text: string | null | undefined): T | null {
  if (!text) return null;
  const cleaned = text.replace(/```(?:json)?/g, "");
  const m = cleaned.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]) as T;
  } catch {
    return null;
  }
}
