import { complete, extractJSON } from "@/lib/llm";
import { localAnalogy, TOKENS_PER_YUAN, type Analogy } from "@/lib/meter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let tokens = 0;
  let tags: string[] = [];
  let facts: string[] = [];
  try {
    const b = (await req.json()) as { tokens?: number; tags?: string[]; facts?: string[] };
    tokens = Math.max(0, Math.min(1e9, Number(b.tokens) || 0));
    tags = Array.isArray(b.tags) ? b.tags.slice(0, 10).map(String) : [];
    facts = Array.isArray(b.facts) ? b.facts.slice(-6).map(String) : [];
  } catch {
    /* ignore */
  }
  const fallback = localAnalogy(tokens, tags, new Date().getDate());
  const yuan = tokens / TOKENS_PER_YUAN;
  const out = await complete(
    [
      {
        role: "system",
        content:
          '把“算力消耗”换算成贴合用户生活的日常小物，幽默温暖。换算基准：价值约 ' +
          yuan.toFixed(2) +
          ' 元人民币（按真实市价换算数量，可以是小数，保留1位）。根据用户画像挑3样最贴切的东西（如热拿铁、清心香、肉包子、绿植、猫罐头、地铁票……也可以自己想，越具体越好）。输出严格JSON：{"items":[{"emoji":"☕","name":"热拿铁","unit":"杯","qty":1.5}],"line":"一句不超过20字的俏皮话"}',
      },
      { role: "user", content: `算力：${tokens}。用户关键词：${tags.join("、") || "未知"}。近况：${facts.join("；") || "未知"}` },
    ],
    220,
  );
  const j = extractJSON<Analogy>(out);
  if (!j || !Array.isArray(j.items) || !j.items.length) return Response.json(fallback);
  const items = j.items
    .slice(0, 3)
    .map((i) => ({
      emoji: String(i.emoji ?? "✨").slice(0, 4),
      name: String(i.name ?? "").slice(0, 10),
      unit: String(i.unit ?? "份").slice(0, 2),
      qty: Math.max(0.1, Math.round((Number(i.qty) || 0.1) * 10) / 10),
    }))
    .filter((i) => i.name);
  return Response.json({ items: items.length ? items : fallback.items, line: String(j.line ?? fallback.line).slice(0, 30) });
}
