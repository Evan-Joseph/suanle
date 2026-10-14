import { complete } from "@/lib/server/llm";
import { META_PROMPT } from "@/lib/server/prompt";
import { mockMeta } from "@/lib/mock";
import { analogize } from "@/lib/analogy";
import { recordUsage } from "@/lib/server/usage";
import { TAGS, type Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { deviceId?: string; messages?: { role: string; content: string }[]; tokens?: number; profile?: Profile | null };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad request" }, { status: 400 });
  }
  const msgs = (body.messages || []).slice(-10);
  const tokens = Math.max(0, Number(body.tokens) || 0);
  const transcript = msgs
    .map((m) => `${m.role === "user" ? "用户" : "算了"}：${String(m.content).replace(/<think>[\s\S]*?<\/think>|<profile>[\s\S]*?<\/profile>/g, "").slice(0, 400)}`)
    .join("\n");
  const fallback = mockMeta(msgs.filter((m) => m.role === "user").map((m) => m.content).join(" "), tokens);
  const fallbackAnalogy = "≈ " + analogize(tokens, body.profile || null, transcript.slice(0, 20), 2);

  const likes = body.profile?.likes ? `用户喜欢：${body.profile.likes}` : "";
  const r = await complete(
    [
      { role: "system", content: META_PROMPT },
      { role: "user", content: `${likes}\n本次会话累计消耗算力：${tokens}\n对话：\n${transcript}` },
    ],
    300
  );
  if (r) {
    const m = r.text.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        const j = JSON.parse(m[0]);
        const title = String(j.title || "").replace(/["“”。，,.！!？?]/g, "").slice(0, 14) || fallback.title;
        const tag = (TAGS as readonly string[]).includes(j.tag) ? j.tag : fallback.tag;
        let analogy = String(j.analogy || "").slice(0, 60);
        if (!analogy.startsWith("≈")) analogy = analogy ? "≈ " + analogy : fallbackAnalogy;
        if (body.deviceId) recordUsage(String(body.deviceId).slice(0, 64), "meta", r.model, r.usage, 0).catch(() => {});
        return Response.json({ title, tag, analogy });
      } catch {
        /* fall through */
      }
    }
  }
  return Response.json({ title: fallback.title, tag: fallback.tag, analogy: fallbackAnalogy });
}
