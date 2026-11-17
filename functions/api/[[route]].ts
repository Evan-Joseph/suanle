/**
 * 零依赖 Cloudflare Pages Function (/api/* 边缘全兼容路由)
 * - 默认 0 成本静态兜底模式：无 Key / 零 DB 开销，返回 {"t":"l"} 让前端无报错触发本地古法排盘引擎；
 * - 可选 BYOK 透传模式：当请求头携带合法的公网 x-engine-key 时（或 Pages 环境变量可选配置 LLM_API_KEY），
 *   通过 Edge Fetch 流式转发 OpenAI 兼容 SSE 并转换为前端标准 NDJSON。
 */

interface PagesEnv {
  LLM_BASE_URL?: string;
  LLM_API_KEY?: string;
  LLM_MODEL?: string;
  LLM_LIGHT_MODEL?: string;
}

const DEFAULT_CHANNELS = [
  { id: "wechat", label: "微信", url: "https://payapp.wechatpay.cn/sjt/qr/AQGjGzMYLop8zZDYSTRFCAL2", image: "/pay/wechat.png" },
  { id: "alipay", label: "支付宝", url: "https://qr.alipay.com/2m615723l8cwi3pxfjjdmeb", image: "/pay/alipay.png" },
];

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function safeHttpsBase(raw: string): string | null {
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
    ) {
      return null;
    }
    return u.toString().replace(/\/+$/, "");
  } catch {
    return null;
  }
}

function ndjsonLocalFallback(): Response {
  const body = `${JSON.stringify({ t: "l" })}\n${JSON.stringify({ t: "end" })}\n`;
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}

function resolveByokOrEnv(req: Request, env: PagesEnv, light = false): { base: string; key: string; model: string } | null {
  const customKey = (req.headers.get("x-engine-key") || "").trim().slice(0, 400);
  if (customKey) {
    const rawBase = req.headers.get("x-engine-base") || env.LLM_BASE_URL || "https://api.openai.com/v1";
    const base = safeHttpsBase(rawBase);
    if (!base) return null;
    const model = (req.headers.get("x-engine-model") || "").trim().slice(0, 80) || "gpt-4o-mini";
    return { base, key: customKey, model };
  }
  const envKey = (env.LLM_API_KEY || "").trim();
  const envBase = safeHttpsBase(env.LLM_BASE_URL || "https://www.jiji.cc/v1");
  if (envKey && envBase) {
    const model = light ? env.LLM_LIGHT_MODEL || "gemini-3.8-flash" : env.LLM_MODEL || "gemini-4-argon";
    return { base: envBase, key: envKey, model };
  }
  return null;
}

async function handleChat(req: Request, env: PagesEnv): Promise<Response> {
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
  const contentLen = Number(req.headers.get("content-length") || 0);
  if (contentLen > 65536) return json({ error: "payload too large" }, 413);

  let body: { messages?: unknown; deep?: boolean; profile?: Record<string, unknown>; summary?: string } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return json({ error: "bad request" }, 400);
  }

  const rawMsgs = Array.isArray(body.messages) ? body.messages.slice(-14) : [];
  const messages = rawMsgs
    .filter(
      (m): m is { role: "user" | "assistant"; content: string } =>
        Boolean(m) &&
        typeof m === "object" &&
        ((m as { role?: unknown }).role === "user" || (m as { role?: unknown }).role === "assistant") &&
        typeof (m as { content?: unknown }).content === "string"
    )
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1800) }));

  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return json({ error: "no user message" }, 400);
  }

  const upstream = resolveByokOrEnv(req, env, false);
  if (!upstream) {
    return ndjsonLocalFallback();
  }

  const profile = body.profile && typeof body.profile === "object" ? body.profile : {};
  const pSummary = [
    typeof profile.name === "string" && profile.name ? `称呼：${profile.name.slice(0, 16)}` : "",
    typeof profile.gender === "string" && profile.gender ? `性别：${profile.gender.slice(0, 4)}` : "",
    typeof profile.birth === "string" && profile.birth ? `生辰：${profile.birth.slice(0, 20)}` : "",
    typeof profile.city === "string" && profile.city ? `所在：${profile.city.slice(0, 20)}` : "",
    typeof body.summary === "string" && body.summary ? `前情：${body.summary.slice(0, 500)}` : "",
  ]
    .filter(Boolean)
    .join("；");

  const systemPrompt = `你是「算了」，一个懂八字、紫微斗数、六爻与塔罗的市井老朋友，口头禅是「算一算，然后，算了」。用温和、有烟火气的大白话与人交谈，认真开解后可用独立引用块「> 算了，……」收尾。${pSummary ? `\n【对方信息】${pSummary}` : ""}`;

  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => {
        try {
          controller.enqueue(enc.encode(JSON.stringify(obj) + "\n"));
        } catch {
          /* client closed */
        }
      };

      let produced = false;
      let usage = 0;
      try {
        const res = await fetch(`${upstream.base}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${upstream.key}`,
          },
          body: JSON.stringify({
            model: upstream.model,
            messages: [{ role: "system", content: systemPrompt }, ...messages],
            stream: true,
            temperature: 0.85,
            max_tokens: body.deep ? 2600 : 1400,
            stream_options: { include_usage: true },
          }),
          signal: req.signal,
        });

        if (res.ok && res.body && !(res.headers.get("content-type") || "").includes("application/json")) {
          const reader = res.body.getReader();
          const dec = new TextDecoder();
          let buf = "";
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
              try {
                const j = JSON.parse(data) as {
                  choices?: { delta?: { content?: string; reasoning_content?: string; reasoning?: string } }[];
                  usage?: { total_tokens?: number };
                };
                const d = j.choices?.[0]?.delta;
                const r = d?.reasoning_content || d?.reasoning;
                if (r) {
                  produced = true;
                  send({ t: "r", v: r });
                }
                if (d?.content) {
                  produced = true;
                  send({ t: "d", v: d.content });
                }
                if (j.usage?.total_tokens) usage = j.usage.total_tokens;
              } catch {
                /* ignore malformed SSE chunk */
              }
            }
          }
        }
      } catch {
        /* fallback below */
      }

      if (!produced) {
        send({ t: "l" });
      } else if (usage > 0) {
        send({ t: "u", v: usage });
      }
      send({ t: "end" });
      try {
        controller.close();
      } catch {
        /* ignore */
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}

export async function onRequest(context: {
  request: Request;
  env: PagesEnv;
  params: { route?: string | string[] };
}): Promise<Response> {
  const { request, env, params } = context;
  const parts = Array.isArray(params.route)
    ? params.route
    : typeof params.route === "string" && params.route
      ? params.route.split("/")
      : [];
  const route = parts.join("/").replace(/^\/+|\/+$/g, "");

  if (route === "health") {
    return json({ ok: true, mode: "cloudflare-pages-zero-cost" });
  }
  if (route === "chat") {
    return handleChat(request, env);
  }
  if (route === "letgo") {
    return json({ today: 6, total: 94 });
  }
  if (route === "orders") {
    if (request.method === "POST") {
      return json({ ok: true, id: `edge_${Date.now().toString(36)}` });
    }
    return json({ channels: DEFAULT_CHANNELS });
  }
  if (route === "profile") {
    return json({ ok: true });
  }
  if (route === "backup") {
    try {
      const body = (await request.json()) as { action?: unknown };
      if (body?.action === "check-migrated") {
        return json({ ok: true, migrated: false });
      }
    } catch {
      /* ignore */
    }
    return json({ ok: false, error: "当前为轻量静态节点，请使用上方「导出备份文件 (.json)」保存本地档案" });
  }
  if (route === "title" || route === "analogy" || route === "annual") {
    return json({});
  }

  return json({ ok: false, error: "not found" }, 404);
}
