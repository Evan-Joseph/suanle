import { complete, extractJSON, resolveEngine } from "@/lib/server/llm";
import { chartContext, sanitizeProfile } from "@/lib/server/prompt";
import { allow, clientKey, logUsage } from "@/lib/server/store";
import { localAnnual, sanitizeAnnual } from "@/lib/annual";
import { parseBirth } from "@/lib/divination";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "bad request" }, { status: 400 });
  }
  const profile = sanitizeProfile(body.profile);
  const year = Math.max(1950, Math.min(2100, Number(body.year) || new Date().getFullYear()));
  const anonId = typeof body.anonId === "string" ? body.anonId : "";
  if (!profile.birth || !parseBirth(profile.birth)) return Response.json({ error: "need birth" }, { status: 400 });

  const base = localAnnual(profile.birth, year);
  if (!allow(clientKey(req, anonId) + "|annual", 4, 60_000)) return Response.json({ report: base, source: "local" });

  const r = await complete(
    resolveEngine(req),
    [
      {
        role: "system",
        content: `你是「算了」，精通子平八字与紫微斗数，说话像温和通透的老朋友。请为对方写 ${year} 年（${base.ganzhi}年）的年度盘：以下方已精确排出的命盘为依据，结合流年干支与命局的生克、大运和紫微宫位来判断；输出用大白话，不吓人、不绝对化，给具体可执行的生活建议。
只输出 JSON，不要任何解释：
{"keyword":"四字以内的年度关键词","summary":"90字以内的总览","dims":[{"key":"事业","score":30到98,"text":"45字以内"},{"key":"财运","score":0,"text":""},{"key":"感情","score":0,"text":""},{"key":"身心","score":0,"text":""}],"months":[{"m":1,"v":15到98,"note":"10字以内"}],"advice":["三条，每条22字以内"],"letgo":"一句以"算了，"开头的箴言，28字以内"}
months 必须给满 12 个月。字数宁少勿多，直接输出 JSON。`,
      },
      {
        role: "user",
        content: `称呼：${profile.name ?? "朋友"}；性别：${profile.gender ?? "未知"}；生辰：${profile.birth}${chartContext(profile)}`,
      },
    ],
    { maxTokens: 1200, temperature: 0.75, timeoutMs: 30000 },
  );
  const parsed = extractJSON<unknown>(r?.text);
  if (!r || !parsed) return Response.json({ report: base, source: "local" });
  await logUsage(anonId, "annual", r.tokens || 2400, r.model);
  return Response.json({ report: sanitizeAnnual(parsed, base), source: "ai", tokens: r.tokens || 2400 });
}
