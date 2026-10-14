export type ChatMsg = { role: "system" | "user" | "assistant"; content: string };
export type StreamEvent =
  | { type: "delta"; text: string }
  | { type: "reasoning"; text: string }
  | { type: "usage"; total: number };

const BASE = (process.env.LLM_BASE_URL || "").replace(/\/$/, "");
const KEY = process.env.LLM_API_KEY || "";

const badModels = new Map<string, number>();

export const llmConfigured = () => Boolean(BASE && KEY);

function modelChain(): string[] {
  const primary = process.env.LLM_MODEL || "gemini-2.5-flash";
  const fallbacks = (process.env.LLM_FALLBACK_MODELS || "").split(",").map((s) => s.trim()).filter(Boolean);
  const all = [primary, ...fallbacks.filter((f) => f !== primary)];
  const now = Date.now();
  const healthy = all.filter((m) => (badModels.get(m) ?? 0) < now);
  return healthy.length ? healthy : all;
}

async function openStream(messages: ChatMsg[], opts: { temperature?: number; maxTokens?: number; signal?: AbortSignal }) {
  let lastErr: unknown = null;
  for (const model of modelChain()) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 25000);
      opts.signal?.addEventListener("abort", () => ctrl.abort());
      const res = await fetch(`${BASE}/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          stream: true,
          stream_options: { include_usage: true },
          temperature: opts.temperature ?? 0.85,
          max_tokens: opts.maxTokens ?? 1600,
          messages,
        }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      const ct = res.headers.get("content-type") || "";
      if (!res.ok || !res.body || !ct.includes("event-stream")) {
        const txt = await res.text().catch(() => "");
        badModels.set(model, Date.now() + 10 * 60 * 1000);
        lastErr = new Error(`model ${model} failed: ${res.status} ${txt.slice(0, 200)}`);
        continue;
      }
      return res.body;
    } catch (e) {
      lastErr = e;
      if (opts.signal?.aborted) throw e;
    }
  }
  throw lastErr ?? new Error("no model available");
}

export async function* streamChat(
  messages: ChatMsg[],
  opts: { temperature?: number; maxTokens?: number; signal?: AbortSignal } = {},
): AsyncGenerator<StreamEvent> {
  if (!llmConfigured()) throw new Error("LLM not configured");
  const body = await openStream(messages, opts);
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let gotAny = false;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 1);
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") continue;
      try {
        const j = JSON.parse(data);
        if (j.error) throw new Error(j.error.message || "upstream error");
        const delta = j.choices?.[0]?.delta;
        const r = delta?.reasoning_content || delta?.reasoning;
        if (r) yield { type: "reasoning", text: r };
        if (delta?.content) { gotAny = true; yield { type: "delta", text: delta.content }; }
        if (j.usage?.total_tokens) yield { type: "usage", total: j.usage.total_tokens };
      } catch (e) {
        if (e instanceof SyntaxError) continue;
        throw e;
      }
    }
  }
  if (!gotAny) throw new Error("empty response");
}

export async function completeChat(messages: ChatMsg[], opts: { temperature?: number; maxTokens?: number } = {}) {
  let text = "";
  let total = 0;
  for await (const ev of streamChat(messages, { ...opts, maxTokens: opts.maxTokens ?? 200 })) {
    if (ev.type === "delta") text += ev.text;
    if (ev.type === "usage") total = ev.total;
  }
  return { text: text.trim(), total };
}

export const estimateTokens = (s: string) => Math.ceil(s.length * 1.4);
