import { NextResponse } from "next/server";
import { metaphorForTokens } from "@/lib/brand";

export const runtime = "nodejs";

const BASE = process.env.AI_BASE_URL ?? "https://api.ai-pixel.online/v1";
const KEY = process.env.AI_API_KEY ?? "";
const MODEL = process.env.AI_MODEL ?? "gemini-4-argon";

/** 把 token 消耗翻译成一句有生活情趣的比喻 */
export async function POST(req: Request) {
  let tokens = 0;
  let name = "";
  let topics: string[] = [];
  try {
    const body = await req.json();
    tokens = Number(body.tokens) || 0;
    name = typeof body.name === "string" ? body.name : "";
    topics = Array.isArray(body.topics) ? body.topics.slice(0, 5) : [];
  } catch {
    return NextResponse.json({ metaphor: metaphorForTokens(0) });
  }

  try {
    const res = await fetch(`${BASE}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: `你是「算了」小馆的掌柜，说话有烟火气、会打趣。客人今天在小馆消耗了若干「字符柴米」（AI token），你要把它换算成一句生动贴切的比喻，例如「约当供了 1.5 炷檀香」「快够请大师喝一杯手冲瑰夏」「攒下的字能铺满半张八仙桌」。可以结合客人最近聊的话题开玩笑。30 字以内，只输出这一句，不加引号。`,
          },
          {
            role: "user",
            content: `客人${name ? `（称呼：${name}）` : ""}今日累计消耗 ${tokens} token。最近聊过：${topics.join("、") || "（闲聊）"}。`,
          },
        ],
        temperature: 0.9,
        max_tokens: 80,
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    let text = data.choices?.[0]?.message?.content?.trim() ?? "";
    text = text.replace(/^["「『]+|["」』。！!]+$/g, "").slice(0, 40);
    if (!text) throw new Error("empty");
    return NextResponse.json({ metaphor: text });
  } catch {
    return NextResponse.json({ metaphor: metaphorForTokens(tokens) });
  }
}
