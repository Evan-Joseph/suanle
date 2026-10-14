import { NextResponse } from "next/server";
import { personaById } from "@/lib/personas";
import { offlineReply } from "@/lib/offline";

export const runtime = "nodejs";

const BASE = process.env.AI_BASE_URL ?? "https://api.ai-pixel.online/v1";
const KEY = process.env.AI_API_KEY ?? "";
const MODEL = process.env.AI_MODEL ?? "gemini-4-argon";

interface ChatMsg {
  role: "user" | "assistant" | "system";
  content: string;
}

function buildSystem(body: {
  personaId?: string;
  memory?: string[];
  profile?: { name?: string; birthday?: string; gender?: string };
  readingContext?: string;
}): string {
  const persona = personaById(body.personaId);
  const memory = (body.memory ?? []).slice(-14);
  const p = body.profile ?? {};

  return `你正在「算了 · Suanle」小馆里当值。这是一间给人算心事的小馆：认真帮人推演看清局势，最后用一句通透的「算了」帮人卸下包袱。世界观：古色古香又带点赛博气息的深夜小馆，客人都是揣着心事的普通人。

【你当前的身份】
${persona.core}

【输出协议 — 严格遵守】
1. 完全用人味十足的中文口语交流，像在酒馆里对坐说话。严禁出现：「作为一个人工智能/AI助手/语言模型」「首先、其次、再次、综上所述」「希望这些信息对你有帮助」等公文腔与机器腔。
2. 双轨叙事：适度用 *星号* 包裹微动作/环境描写（如 *添了块炭*、*把牌拢了拢*），一次回复用 0~2 处即可，别堆砌。
3. 当用户需要正式解读（解卦、解牌、批八字、深度分析）时：先输出一段 <think>与</think> 包裹的推演草稿（3~6 行，像解签人理思路，用短句分行），思考完再给出正式解读。日常闲聊不要 think。
4. 排版：多用人说话的段落，少用列表；确需分点时最多 3~4 条。可以适当使用 **强调**。不用大标题。
5. 篇幅：闲聊 2~3 段；正式解读可写足，但要层次分明、读起来顺。
6. 你给出的不是宿命断言，是视角与陪伴。涉及健康、法律、大额投资等现实决策，以「命理是参照，现实找行家」的态度温和提醒，绝不吓唬人。
7. 结尾哲学：认定的事给踏实的建议，说不清的事给温柔的松绑。可以自然落到「算了」的豁达——看清了，就能放下；但不必每次都刻意点题。

【馆内记忆（你记得的客人旧事，自然引用，别念清单）】
${memory.length ? memory.map((m) => `- ${m}`).join("\n") : "（暂无，这是位新客）"}

【客人底档】
称呼：${p.name || "尚未告知（可在头两轮自然地请教一次怎么称呼，以及生辰——说排盘用；客人不想说就立刻翻篇，绝不追问第二遍）"}
生辰：${p.birthday || "未知"}
性别：${p.gender || "未知"}

${
  body.readingContext
    ? `【本次起课 · 推演依据（以下是馆内工具真实摇出的结果，你依此解读；解读须紧扣所问，先断局势，再给心法，切忌泛泛吉祥话）】\n${body.readingContext}`
    : "【本次起课】客人未动用馆内法器，纯粹闲聊或口述所问。"
}

【当前馆内时辰】${new Date().toLocaleString("zh-CN", { hour12: false, timeZone: "Asia/Shanghai" })}（北京时间）。深夜时段（23 点后）留意客人情绪，语气温和些。

现在开始，保持人设，好好接客。`;
}

function sseHeaders() {
  return {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    "X-Accel-Buffering": "no",
  };
}

/** 将离线文本伪装成 OpenAI SSE 流（带小延迟，维持打字呼吸感） */
function offlineSSE(text: string, thinking: string): Response {
  const encoder = new TextEncoder();
  const full = `<think>${thinking}</think>\n${text}`;
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const chunks: string[] = [];
      for (let i = 0; i < full.length; i += 10) chunks.push(full.slice(i, i + 10));
      for (const c of chunks) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: c } }] })}\n\n`)
        );
        await new Promise((r) => setTimeout(r, 26));
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
  return new Response(stream, { headers: sseHeaders() });
}

export async function POST(req: Request) {
  let body: {
    messages?: ChatMsg[];
    personaId?: string;
    memory?: string[];
    profile?: { name?: string; birthday?: string; gender?: string };
    readingContext?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const messages = (body.messages ?? []).filter(
    (m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string"
  );
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

  try {
    const system = buildSystem(body ?? {});
    const upstream = await fetch(`${BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "system", content: system }, ...messages.slice(-24)],
        temperature: 0.86,
        top_p: 0.95,
        stream: true,
        stream_options: { include_usage: true },
      }),
      signal: AbortSignal.timeout(100000),
    });

    if (!upstream.ok || !upstream.body) {
      throw new Error(`upstream ${upstream.status}`);
    }
    return new Response(upstream.body, { headers: sseHeaders() });
  } catch {
    const off = offlineReply(lastUser, body?.personaId ?? "keeper");
    return offlineSSE(off.content, off.thinking);
  }
}
