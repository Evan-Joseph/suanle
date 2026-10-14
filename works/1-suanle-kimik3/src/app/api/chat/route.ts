import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

interface ChatBody {
  messages: { role: "user" | "assistant" | "system"; content: string }[];
  config: { baseUrl: string; apiKey: string; model: string };
  persona?: { name: string; title: string; bio: string };
}

export async function POST(req: NextRequest) {
  let body: ChatBody;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "请求格式有误" }, { status: 400 });
  }

  const { messages, config, persona } = body;
  if (!config?.apiKey || !config?.baseUrl || !config?.model) {
    return Response.json({ error: "智囊未配置" }, { status: 400 });
  }

  const system = {
    role: "system" as const,
    content: [
      `你是「${persona?.name ?? "酒馆挚友"}」，${persona?.title ?? ""}。${persona?.bio ?? ""}`,
      "你是深夜小酒馆「宿命酒馆」的坐台挚友，专治当代年轻人的精神内耗。",
      "规则：1) 全程使用双轨叙事——动作、神态、环境微描写用两个星号包裹，如 *给你续上热茶*，单独成行；说话内容自然口语，不用引号。",
      "2) 永远不作居高临下的说教，不喊口号，不熬鸡汤，用具体的比喻和细节回应。",
      "3) 中文回复，单次回复控制在 180 字以内，语气稳定在你的角色里。",
    ].join("\n"),
  };

  const base = config.baseUrl.replace(/\/+$/, "");
  try {
    const upstream = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [system, ...messages.slice(-20)],
        stream: true,
        temperature: 0.8,
      }),
    });

    if (!upstream.ok || !upstream.body) {
      return Response.json({ error: "智囊无应答" }, { status: 502 });
    }
    return new Response(upstream.body, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch {
    return Response.json({ error: "智囊连接失败" }, { status: 502 });
  }
}
