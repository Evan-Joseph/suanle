import { complete, extractJSON, resolveEngine } from "@/lib/server/llm";
import { allow, clientKey } from "@/lib/server/store";
import { localAnalogy, thingText } from "@/lib/meter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LOCAL_LINES = [
  "这些算力，够在小馆里坐一个慢悠悠的下午。",
  "算力花在想通一件事上，挺值。",
  "聊过的每一句，都算数。",
  "比起烦恼，这点开销算轻的了。",
];

/** 把算力换算成贴近对方生活的日常小物：模型挑物件，服务器算数量 */
export async function POST(req: Request) {
  let tokens = 0;
  let hint = "";
  try {
    const body = (await req.json()) as { tokens?: unknown; hint?: unknown };
    tokens = Math.max(0, Math.min(1e9, Number(body.tokens) || 0));
    hint = typeof body.hint === "string" ? body.hint.slice(0, 300) : "";
  } catch {
    return Response.json({ error: "bad request" }, { status: 400 });
  }
  const fallback = { items: localAnalogy(tokens, hint, 3, Math.floor(tokens / 1000)), line: LOCAL_LINES[Math.floor(tokens / 1000) % LOCAL_LINES.length] };
  if (tokens <= 0 || !allow(clientKey(req) + "|analogy", 6, 60_000)) return Response.json(fallback);

  const r = await complete(
    resolveEngine(req, "analogy"),
    [
      {
        role: "system",
        content:
          '你是「算了」小馆的掌柜，说话有烟火气。客人在小馆里用掉了一些"算力"。请根据客人的画像，挑 3 样贴近他生活的日常小物做类比，并给出每样东西"一个单位约等于多少算力"（800 到 60000 之间的整数，要合理：一根猫条约 1500，一个肉包子约 2500，一杯拿铁约 12000，一棵绿植约 20000）。再写一句 25 字以内、俏皮温暖的话，不提"AI"和"token"。只输出 JSON：{"items":[{"emoji":"☕","name":"热拿铁","unit":"杯","per":12000}],"line":"……"}',
      },
      { role: "user", content: `客人画像：${hint || "（还不太了解）"}；累计算力：${tokens}。` },
    ],
    { maxTokens: 220, temperature: 0.9, timeoutMs: 15000 },
  );
  const j = extractJSON<{ items?: { emoji?: string; name?: string; unit?: string; per?: number }[]; line?: string }>(r?.text);
  const items = (j?.items ?? [])
    .filter((it) => it && typeof it.name === "string" && typeof it.unit === "string" && Number(it.per) > 0)
    .slice(0, 3)
    .map((it) => ({
      emoji: typeof it.emoji === "string" ? Array.from(it.emoji)[0] ?? "✦" : "✦",
      text: thingText(tokens, { name: String(it.name).slice(0, 10), unit: String(it.unit).slice(0, 2), per: Math.max(800, Math.min(60000, Math.round(Number(it.per)))) }),
    }));
  if (items.length < 2) return Response.json(fallback);
  const line = typeof j?.line === "string" && j.line.trim() ? j.line.trim().slice(0, 40) : fallback.line;
  return Response.json({ items, line });
}
