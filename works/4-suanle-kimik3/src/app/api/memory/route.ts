import { NextResponse } from "next/server";

export const runtime = "nodejs";

const BASE = process.env.AI_BASE_URL ?? "https://api.ai-pixel.online/v1";
const KEY = process.env.AI_API_KEY ?? "";
const MODEL = process.env.AI_MODEL ?? "gemini-4-argon";

/** 从对话中抽取值得记住的客人信息，返回事实清单 */
export async function POST(req: Request) {
  let messages: Array<{ role: string; content: string }> = [];
  let existing: string[] = [];
  try {
    const body = await req.json();
    messages = Array.isArray(body.messages) ? body.messages : [];
    existing = Array.isArray(body.existing) ? body.existing : [];
  } catch {
    return NextResponse.json({ facts: [] });
  }

  const transcript = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-10)
    .map((m) => `${m.role === "user" ? "客人" : "掌柜"}：${m.content.slice(0, 200)}`)
    .join("\n");

  try {
    const res = await fetch(`${BASE}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: `你是「算了」小馆的掌柜，记性极好。读最近的对话，把值得长久记住的客人信息提炼成一句话一条的清单：称呼、生辰、家乡、工作、在意的人、反复出现的烦恼、性格倾向、算过的命盘结论等。只记录对话中真实出现的信息，不臆测。每条不超过 30 字，最多新增 3 条。严格输出 JSON：{"facts":["...", "..."]}，没有新信息就输出 {"facts":[]}。`,
          },
          {
            role: "user",
            content: `已有记忆：\n${existing.join("；") || "（空）"}\n\n最近对话：\n${transcript}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 300,
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const raw = data.choices?.[0]?.message?.content ?? "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("no json");
    const parsed = JSON.parse(match[0]) as { facts?: string[] };
    const facts = (parsed.facts ?? [])
      .filter((f) => typeof f === "string" && f.trim())
      .map((f) => f.trim().slice(0, 40))
      .slice(0, 3);
    return NextResponse.json({ facts });
  } catch {
    return NextResponse.json({ facts: [] });
  }
}
