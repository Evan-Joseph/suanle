import { completeOnce, hasLLM } from "@/lib/llm";
import { TITLE_PROMPT } from "@/lib/prompt";
import { mockTitle, type ChatMsg } from "@/lib/mock";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CATS = ["感情", "事业", "家庭", "自我", "财运", "日常"];

export async function POST(req: Request) {
  let messages: ChatMsg[] = [];
  try { messages = ((await req.json()) as { messages?: ChatMsg[] }).messages ?? []; } catch { /* ignore */ }
  const fallback = mockTitle(messages);
  if (!hasLLM() || !messages.length) return Response.json(fallback);
  try {
    const text = await completeOnce([
      { role: "system", content: TITLE_PROMPT },
      { role: "user", content: messages.slice(-8).map((m) => `${m.role === "user" ? "用户" : "算了"}：${m.content.slice(0, 300)}`).join("\n") },
    ], 120);
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return Response.json(fallback);
    const j = JSON.parse(m[0]) as { title?: string; category?: string; emoji?: string };
    return Response.json({
      title: (j.title ?? fallback.title).replace(/[「」""]/g, "").slice(0, 12),
      category: CATS.includes(j.category ?? "") ? j.category : fallback.category,
      emoji: j.emoji && j.emoji.length <= 4 ? j.emoji : fallback.emoji,
    });
  } catch { return Response.json(fallback); }
}
