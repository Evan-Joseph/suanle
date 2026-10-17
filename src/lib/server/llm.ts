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

export interface UpstreamProvider {
  name: string;
  bases: string[];
  key: string;
}

export interface Engine {
  base: string;
  key: string;
  providers: UpstreamProvider[];
  models: string[];
  custom: boolean;
}

export type EngineTier = "chat" | "annual" | "title" | "analogy";

// 主服务商 (jiji.cc 高速服务，包含默认、CF、美西三条容灾链路)
const ENV_BASE = (process.env.LLM_BASE_URL || "https://www.jiji.cc/v1").replace(/\/+$/, "");
const ENV_BACKUP_BASES = (process.env.LLM_BACKUP_BASES || "https://api.jiji.cc/v1,https://api-slb.jiji.cc/v1")
  .split(",")
  .map((s) => s.trim().replace(/\/+$/, ""))
  .filter(Boolean);
const ENV_KEY = process.env.LLM_API_KEY || "";

// 备用服务商 (ai-pixel.online 异地容灾兜底)
const ENV_SEC_BASE = (process.env.LLM_SECONDARY_BASE_URL || "https://api.ai-pixel.online/v1").replace(/\/+$/, "");
const ENV_SEC_KEY = process.env.LLM_SECONDARY_API_KEY || "";

// 模型分档
const ENV_MODEL = process.env.LLM_MODEL || "gemini-4-argon"; // 旗舰深度推理（聊天、年度盘）
const ENV_LIGHT_MODEL = process.env.LLM_LIGHT_MODEL || "gemini-3.8-flash"; // 轻量快速（标题提炼、算力类比）
const ENV_FALLBACKS = (process.env.LLM_FALLBACK_MODELS || "gemini-3.8-flash,gemini-3.7-flash,gemini-2.5-flash")
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

export function resolveEngine(req: Request, tier: EngineTier = "chat"): Engine {
  const key = req.headers.get("x-engine-key")?.trim();
  const isLight = tier === "title" || tier === "analogy";

  // 按任务分档路由模型：轻任务优先使用极速 Flash，核心对话与推演使用旗舰 4-argon
  const tierModels = isLight
    ? [ENV_LIGHT_MODEL, ...ENV_FALLBACKS.filter((m) => m !== ENV_LIGHT_MODEL), ENV_MODEL]
    : [ENV_MODEL, ...ENV_FALLBACKS.filter((m) => m !== ENV_MODEL)];

  const defaultProviders: UpstreamProvider[] = [
    {
      name: "jiji",
      bases: [ENV_BASE, ...ENV_BACKUP_BASES.filter((b) => b !== ENV_BASE)],
      key: ENV_KEY,
    },
    ...(ENV_SEC_KEY
      ? [
          {
            name: "ai-pixel",
            bases: [ENV_SEC_BASE],
            key: ENV_SEC_KEY,
          },
        ]
      : []),
  ];

  if (!key) {
    return {
      base: ENV_BASE,
      key: ENV_KEY,
      providers: defaultProviders,
      models: tierModels,
      custom: false,
    };
  }

  const baseRaw = req.headers.get("x-engine-base");
  const base = baseRaw ? safeBase(baseRaw) : ENV_BASE;
  if (!base) {
    return {
      base: ENV_BASE,
      key: ENV_KEY,
      providers: defaultProviders,
      models: tierModels,
      custom: false,
    };
  }
  const customModel = (req.headers.get("x-engine-model") || "").trim().slice(0, 80) || (isLight ? ENV_LIGHT_MODEL : ENV_MODEL);
  return {
    base,
    key: key.slice(0, 400),
    providers: [{ name: "custom", bases: [base], key: key.slice(0, 400) }],
    models: [customModel],
    custom: true,
  };
}

export function hasKey(e: Engine): boolean {
  return e.providers.some((p) => Boolean(p.key));
}

const g = globalThis as typeof globalThis & { __suanleCool?: Map<string, number> };
const cool = g.__suanleCool ?? (g.__suanleCool = new Map<string, number>());
const COOL_MS = 5 * 60 * 1000;

function getHealthyModels(base: string, models: string[]): string[] {
  const now = Date.now();
  const ok = models.filter((m) => now - (cool.get(`${base}|${m}`) ?? 0) > COOL_MS);
  return ok.length ? ok : models;
}

const markBad = (base: string, m: string) => cool.set(`${base}|${m}`, Date.now());

const RETIRED = /no longer available|is unavailable|please switch to|model not found/i;

interface Chunk {
  choices?: { delta?: { content?: string; reasoning_content?: string; reasoning?: string } }[];
  usage?: { total_tokens?: number };
  error?: unknown;
}

/** 流式对话：多服务商 + 多线路 + 多模型分档级联降级 */
export async function* streamChat(
  e: Engine,
  messages: LLMMessage[],
  opts: { maxTokens: number; temperature?: number; signal?: AbortSignal }
): AsyncGenerator<LLMEvent> {
  let lastErr: unknown = null;
  let anyKey = false;

  for (const provider of e.providers) {
    if (!provider.key) continue;
    anyKey = true;

    for (const base of provider.bases) {
      const models = getHealthyModels(base, e.models);

      for (const model of models) {
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
          arm(15000);
          const res = await fetch(`${base}/chat/completions`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${provider.key}` },
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
            markBad(base, model);
            lastErr = new Error(`upstream ${provider.name} ${res.status}`);
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

          markBad(base, model);
          lastErr = new Error("empty");
        } catch (err) {
          if (produced) throw err;
          if (opts.signal?.aborted) throw err;
          markBad(base, model);
          lastErr = err;
        } finally {
          if (timer) clearTimeout(timer);
          opts.signal?.removeEventListener("abort", onAbort);
        }
      }
    }
  }

  if (!anyKey) throw new Error("NO_KEY");
  throw lastErr ?? new Error("all models failed");
}

/** 一次性补全：按档次多服务商尝试 */
export async function complete(
  e: Engine,
  messages: LLMMessage[],
  opts: { maxTokens?: number; temperature?: number; timeoutMs?: number } = {}
): Promise<{ text: string; tokens: number; model: string } | null> {
  for (const provider of e.providers) {
    if (!provider.key) continue;

    for (const base of provider.bases) {
      const models = getHealthyModels(base, e.models);

      for (const model of models) {
        try {
          const res = await fetch(`${base}/chat/completions`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${provider.key}` },
            body: JSON.stringify({
              model,
              messages,
              stream: false,
              temperature: opts.temperature ?? 0.7,
              max_tokens: opts.maxTokens ?? 400,
            }),
            signal: AbortSignal.timeout(opts.timeoutMs ?? 25000),
          });
          if (!res.ok) {
            markBad(base, model);
            continue;
          }
          const j = (await res.json()) as { choices?: { message?: { content?: string } }[]; usage?: { total_tokens?: number } };
          const text = j.choices?.[0]?.message?.content?.trim();
          if (text && !RETIRED.test(text)) {
            return { text, tokens: j.usage?.total_tokens ?? 0, model };
          }
          markBad(base, model);
        } catch {
          markBad(base, model);
        }
      }
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

export interface LLMTelemetryInfo {
  providers: {
    name: string;
    base: string;
    backupBases: string[];
    isConfigured: boolean;
    pingMs: number | null;
    pingStatus: "ok" | "degraded" | "error" | "unconfigured";
    errorMsg?: string;
  }[];
  activeCoolings: { key: string; remainingSeconds: number }[];
  modelTiers: {
    flagship: string[];
    lightweight: string[];
  };
}

export async function getLLMTelemetry(): Promise<LLMTelemetryInfo> {
  const now = Date.now();
  const activeCoolings: { key: string; remainingSeconds: number }[] = [];
  cool.forEach((timestamp, key) => {
    const elapsed = now - timestamp;
    if (elapsed < COOL_MS) {
      activeCoolings.push({ key, remainingSeconds: Math.ceil((COOL_MS - elapsed) / 1000) });
    }
  });

  const pingEndpoint = async (base: string, key: string) => {
    if (!key || !base) return { ms: null, status: "unconfigured" as const };
    const t0 = Date.now();
    try {
      const res = await fetch(`${base}/models`, {
        method: "GET",
        headers: { Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(3500),
      });
      const ms = Date.now() - t0;
      if (res.ok) return { ms, status: "ok" as const };
      return { ms, status: "degraded" as const, errorMsg: `HTTP ${res.status}` };
    } catch (err: unknown) {
      const ms = Date.now() - t0;
      const msg = err instanceof Error ? err.message : String(err);
      return { ms, status: "error" as const, errorMsg: msg };
    }
  };

  const [p1, p2] = await Promise.allSettled([
    pingEndpoint(ENV_BASE, ENV_KEY),
    pingEndpoint(ENV_SEC_BASE, ENV_SEC_KEY),
  ]);

  const p1Res = p1.status === "fulfilled" ? p1.value : { ms: null, status: "error" as const, errorMsg: "timeout" };
  const p2Res = p2.status === "fulfilled" ? p2.value : { ms: null, status: "error" as const, errorMsg: "timeout" };

  return {
    providers: [
      {
        name: "主服务商 (jiji.cc)",
        base: ENV_BASE,
        backupBases: ENV_BACKUP_BASES,
        isConfigured: Boolean(ENV_KEY),
        pingMs: p1Res.ms,
        pingStatus: p1Res.status,
        errorMsg: p1Res.errorMsg,
      },
      {
        name: "备用服务商 (ai-pixel)",
        base: ENV_SEC_BASE,
        backupBases: [],
        isConfigured: Boolean(ENV_SEC_KEY),
        pingMs: p2Res.ms,
        pingStatus: p2Res.status,
        errorMsg: p2Res.errorMsg,
      },
    ],
    activeCoolings,
    modelTiers: {
      flagship: [ENV_MODEL, ...ENV_FALLBACKS.filter((m) => m !== ENV_MODEL)],
      lightweight: [ENV_LIGHT_MODEL, ...ENV_FALLBACKS.filter((m) => m !== ENV_LIGHT_MODEL), ENV_MODEL],
    },
  };
}

