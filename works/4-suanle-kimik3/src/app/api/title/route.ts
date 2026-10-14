import { NextResponse } from "next/server";
import { localTitle } from "@/lib/offline";

export const runtime = "nodejs";

const BASE = process.env.AI_BASE_URL ?? "https://api.ai-pixel.online/v1";
const KEY = process.env.AI_API_KEY ?? "";
const MODEL = process.env.AI_MODEL ?? "gemini-4-argon";

export async function POST(req: Request) {
  let messages: Array<{ role: string; content: string }> = [];
  try {
    const body = await req.json();
    messages = Array.isArray(body.messages) ? body.messages : [];
  } catch {
    return NextResponse.json({ title: localTitle("") });
  }

  const transcript = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(0, 6)
    .map((m) => `${m.role === "user" ? "客" : "馆"}：${m.content.slice(0, 120)}`)
    .join("\n");

  const firstUser = messages.find((m) => m.role === "user")?.content ?? "";

  try {
    const res = await fetch(`${BASE}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content:
              "你是「算了」小馆的账房先生，给每段对话记一笔传神的账。读对话，起一个 4~12 字的中文小标题：要像朋友间提起这件事时的说法，有画面感、口语化，例如「关于离职的深夜纠结」「今年夏天的桃花」「和老妈的那通电话」。只输出标题本身，不加引号、不加标点结尾。",
          },
          { role: "user", content: transcript },
        ],
        temperature: 0.7,
        max_tokens: 40,
      }),
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    let title = data.choices?.[0]?.message?.content?.trim() ?? "";
    title = title.replace(/^["「『]+|["」』。.,，]+$/g, "").slice(0, 18);
    if (!title) throw new Error("empty");
    return NextResponse.json({ title });
  } catch {
    return NextResponse.json({ title: localTitle(firstUser) });
  }
}
