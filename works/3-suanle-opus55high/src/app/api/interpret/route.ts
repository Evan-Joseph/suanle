import { db } from "@/db";
import { readings } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { bad, ensureUser, isPass, logUsage, splitOutput, sseStream, validUserId } from "@/lib/server";
import { buildSystemPrompt } from "@/lib/prompts";
import { estimateTokens, streamChat } from "@/lib/llm";
import { chunkText, interpretBazi, interpretCast, interpretTarot } from "@/lib/mock-oracle";
import { castSummary, type CastResult } from "@/lib/iching";
import { tarotSummary, type TarotResult } from "@/lib/tarot";
import { baziSummary, computeBazi, computeKLine, type BaziResult } from "@/lib/bazi";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || !validUserId(body.userId) || typeof body.readingId !== "string") return bad("invalid");
  const user = await ensureUser(body.userId);
  const [reading] = await db.select().from(readings).where(and(eq(readings.id, body.readingId), eq(readings.userId, user.id))).limit(1);
  if (!reading) return bad("not found", 404);

  const deep = reading.kind === "kline" || reading.kind === "bazi";
  if (reading.kind === "kline" && !reading.unlocked && !isPass(user)) return bad("locked", 402);

  let context = "";
  let local = "";
  const q = reading.question ?? "";
  if (reading.kind === "hexagram") {
    const c = reading.data as CastResult;
    context = `【卦象】${q ? `所问：${q}\n` : ""}${castSummary(c)}\n请完整解这一卦：本卦现状、互卦暗流、变卦走势（若有动爻，点出动爻含义），结合所问，给出一个具体的小行动，最后落在"算了"的松弛上。`;
    local = interpretCast(c, q);
  } else if (reading.kind === "tarot") {
    const t = reading.data as TarotResult;
    context = `【牌面】${q ? `所问：${q}\n` : ""}${tarotSummary(t)}\n请逐张解读并串成一个故事，联系所问，最后给一个温柔的落点。`;
    local = interpretTarot(t, q);
  } else {
    const d = reading.data as { birthday: string; hour: number | null };
    const b: BaziResult = computeBazi(d.birthday, d.hour);
    const k = reading.kind === "kline" ? computeKLine(b) : undefined;
    const kText = k
      ? `\n人生波动曲线：高点 ${k.peak.age}岁(${k.peak.year}) ${k.peak.high}，低点 ${k.trough.age}岁(${k.trough.year}) ${k.trough.low}；大运：${k.luckPillars.map((l) => `${l.startAge}岁${l.label}${l.score > 4 ? "顺" : l.score < -4 ? "磨" : "平"}`).join("，")}`
      : "";
    context = `【命盘】${baziSummary(b)}${kText}\n${k ? "请做一份人生长线详批：性格底色、每步大运的主题（挑重点说）、高点和低点该怎么过、接下来三年的提醒。" : "请解读这张命盘：性格底色、五行喜忌在生活里怎么用、适合的节奏。"}语气温和，不恐吓，像老朋友给的私人笔记，可以用小标题。最后落在"命是地图，不是判决书"的松弛感上。`;
    local = interpretBazi(b, k);
  }

  const system = buildSystemPrompt({ persona: user.persona, nickname: user.nickname, profile: user.profile });
  return sseStream(async (send, signal) => {
    let raw = "";
    let tokens = 0;
    let offline = false;
    try {
      for await (const ev of streamChat([{ role: "system", content: system }, { role: "user", content: context }], { signal, maxTokens: deep ? 2400 : 1600 })) {
        if (ev.type === "delta") { raw += ev.text; send("delta", { t: ev.text }); }
        else if (ev.type === "reasoning") send("reasoning", { t: ev.text });
        else if (ev.type === "usage") tokens = ev.total;
      }
    } catch {
      if (!raw) {
        offline = true;
        const text = `<think>照着本地的推演，把要点讲清楚。</think>${local}`;
        for await (const p of chunkText(text, signal)) { raw += p; send("delta", { t: p }); }
      }
    }
    const { body: content } = splitOutput(raw);
    if (!tokens) tokens = estimateTokens(system) / 3 + estimateTokens(raw);
    tokens = Math.round(tokens);
    await db.update(readings).set({ interpretation: content }).where(eq(readings.id, reading.id));
    if (!offline) await logUsage(user.id, tokens, reading.kind);
    send("done", { tokens: offline ? 0 : tokens, offline });
  }, req);
}
