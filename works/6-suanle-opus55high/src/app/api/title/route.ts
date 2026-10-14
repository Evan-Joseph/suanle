import { complete, extractJSON } from "@/lib/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CATS = ["心事", "感情", "事业", "学业", "财运", "健康", "卦象", "命盘", "日常"] as const;
const EMOJI: Record<string, string> = { 心事: "🌙", 感情: "🌷", 事业: "🧭", 学业: "📖", 财运: "🪙", 健康: "🍵", 卦象: "☯️", 命盘: "🧿", 日常: "☁️" };

function local(text: string) {
  const t = text.replace(/\s+/g, "");
  let category: string = "日常";
  if (/卦|六爻|摇/.test(t)) category = "卦象";
  else if (/八字|命盘|生辰|紫微|星盘/.test(t)) category = "命盘";
  else if (/喜欢|恋|分手|对象|男朋友|女朋友|暧昧|前任|结婚/.test(t)) category = "感情";
  else if (/工作|老板|同事|跳槽|面试|加班|升职|项目/.test(t)) category = "事业";
  else if (/考试|学习|论文|考研|毕业|作业/.test(t)) category = "学业";
  else if (/钱|财|投资|基金|股票|工资/.test(t)) category = "财运";
  else if (/睡|身体|病|累|健康/.test(t)) category = "健康";
  else if (/烦|焦虑|难过|内耗|emo|压力|委屈/.test(t)) category = "心事";
  const title = (t.replace(/[，。！？,.!?~～]/g, " ").trim().split(" ")[0] || "随便聊聊").slice(0, 12);
  return { title, category, emoji: EMOJI[category] };
}

export async function POST(req: Request) {
  let messages: { role: string; content: string }[] = [];
  try {
    const b = (await req.json()) as { messages?: { role: string; content: string }[] };
    messages = Array.isArray(b.messages) ? b.messages.slice(-10) : [];
  } catch {
    /* ignore */
  }
  const userText = messages.filter((m) => m.role === "user").map((m) => String(m.content)).join("\n");
  const fallback = local(userText);
  const transcript = messages.map((m) => `${m.role === "user" ? "用户" : "算了"}：${String(m.content).slice(0, 300)}`).join("\n");
  const out = await complete(
    [
      {
        role: "system",
        content: `你为对话起标题。输出严格 JSON：{"title":"不超过10个汉字，洗练、有画面感，不要标点和引号","category":"从 ${CATS.join("/")} 中选一个","emoji":"一个贴切的emoji"}。只输出 JSON。`,
      },
      { role: "user", content: transcript || "随便聊聊" },
    ],
    120,
  );
  const j = extractJSON<{ title?: string; category?: string; emoji?: string }>(out);
  if (!j?.title) return Response.json(fallback);
  const category = CATS.includes(j.category as (typeof CATS)[number]) ? (j.category as string) : fallback.category;
  return Response.json({
    title: j.title.replace(/["“”《》。，]/g, "").slice(0, 14),
    category,
    emoji: j.emoji && [...j.emoji].length <= 3 ? j.emoji : EMOJI[category],
  });
}
