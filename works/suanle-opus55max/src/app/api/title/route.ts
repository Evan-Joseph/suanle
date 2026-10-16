import { complete, extractJSON, resolveEngine } from "@/lib/server/llm";
import { allow, clientKey } from "@/lib/server/store";
import { CATEGORIES, localTitle } from "@/lib/mock";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let messages: { role: string; content: string }[] = [];
  try {
    const body = (await req.json()) as { messages?: unknown };
    if (Array.isArray(body.messages)) {
      messages = body.messages
        .filter((m): m is { role: string; content: string } => !!m && typeof (m as { content?: unknown }).content === "string")
        .slice(-10)
        .map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content.slice(0, 600) }));
    }
  } catch {
    return Response.json({ error: "bad request" }, { status: 400 });
  }
  const firstUser = messages.find((m) => m.role === "user")?.content ?? "";
  const fallback = localTitle(firstUser);
  const engine = resolveEngine(req);
  if (!messages.length || !allow(clientKey(req) + "|title", 20, 60_000)) return Response.json(fallback);

  const transcript = messages.map((m) => `${m.role === "user" ? "我" : "算了"}：${m.content}`).join("\n");
  const r = await complete(
    engine,
    [
      {
        role: "system",
        content: `你负责给一段对话起标题并归类。只输出 JSON：{"title":"不超过10个字","category":"${CATEGORIES.join("|")} 之一"}。标题要具体，像朋友随手记的备忘，例如"要不要换工作""和妈妈吵架之后""周三摇的那一卦"，不带标点和引号。`,
      },
      { role: "user", content: transcript },
    ],
    { maxTokens: 120, temperature: 0.4, timeoutMs: 15000 },
  );
  const j = extractJSON<{ title?: string; category?: string }>(r?.text);
  const title = (j?.title ?? "").replace(/[「」"'“”《》。，！？!?.,]/g, "").trim().slice(0, 12);
  const category = CATEGORIES.find((c) => c === j?.category) ?? fallback.category;
  return Response.json({ title: title || fallback.title, category });
}
