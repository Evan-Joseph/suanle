import { completeOnce, hasLLM } from "@/lib/llm";
import { METAPHOR_PROMPT } from "@/lib/prompt";
import { mockMetaphor, type ProfileLite } from "@/lib/mock";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let tokens = 0; let profile: ProfileLite = {};
  try { const b = (await req.json()) as { tokens?: number; profile?: ProfileLite }; tokens = Number(b.tokens) || 0; profile = b.profile ?? {}; } catch { /* ignore */ }
  const fallback = mockMetaphor(tokens, profile);
  if (!hasLLM() || tokens <= 0) return Response.json(fallback);
  try {
    const text = await completeOnce([
      { role: "system", content: METAPHOR_PROMPT },
      { role: "user", content: `算力：${tokens}\n画像：${JSON.stringify({ name: profile.name, tags: profile.tags?.slice(0, 6), facts: profile.facts?.slice(-3) })}` },
    ], 160);
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return Response.json(fallback);
    const j = JSON.parse(m[0]) as Partial<typeof fallback>;
    if (!j.item || !j.count) return Response.json(fallback);
    return Response.json({ item: j.item, count: j.count, emoji: j.emoji ?? fallback.emoji, line: j.line ?? fallback.line });
  } catch { return Response.json(fallback); }
}
