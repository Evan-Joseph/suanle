import "server-only";

export interface ChatMsg { role: "system" | "user" | "assistant"; content: string }

const BASE = (process.env.LLM_BASE_URL || "").replace(/\/$/, "");
const KEY = process.env.LLM_API_KEY || "";
const MODELS = (process.env.LLM_MODELS || "gemini-4-argon,gemini-3.5-flash,gemini-2.5-flash")
  .split(",").map((s) => s.trim()).filter(Boolean);

// remember models that recently failed so we don't keep hitting them
const bad = new Map<string, number>();

export function llmConfigured() {
  return Boolean(BASE && KEY);
}

function candidates() {
  const now = Date.now();
  const ok = MODELS.filter((m) => (bad.get(m) || 0) < now);
  return ok.length ? ok : MODELS;
}

export async function openStream(messages: ChatMsg[], signal?: AbortSignal): Promise<{ res: Response; model: string } | null> {
  if (!llmConfigured()) return null;
  for (const model of candidates()) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 25000);
      signal?.addEventListener("abort", () => ctrl.abort());
      const res = await fetch(`${BASE}/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages, stream: true, temperature: 0.85, stream_options: { include_usage: true } }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      const ct = res.headers.get("content-type") || "";
      if (res.ok && res.body && ct.includes("event-stream")) return { res, model };
      bad.set(model, Date.now() + 10 * 60 * 1000);
      try { await res.text(); } catch { /* noop */ }
    } catch {
      if (signal?.aborted) return null;
      bad.set(model, Date.now() + 3 * 60 * 1000);
    }
  }
  return null;
}

export async function complete(messages: ChatMsg[], maxTokens = 400): Promise<{ text: string; model: string; usage: number } | null> {
  if (!llmConfigured()) return null;
  for (const model of candidates()) {
    try {
      const res = await fetch(`${BASE}/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: maxTokens }),
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) { bad.set(model, Date.now() + 10 * 60 * 1000); continue; }
      const j = await res.json();
      const text: string = j?.choices?.[0]?.message?.content || "";
      if (!text) { bad.set(model, Date.now() + 5 * 60 * 1000); continue; }
      return { text, model, usage: j?.usage?.total_tokens || 0 };
    } catch {
      bad.set(model, Date.now() + 3 * 60 * 1000);
    }
  }
  return null;
}
