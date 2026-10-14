import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const FREE_DAILY = 8;

export const SKUS = {
  single: { name: "一次深谈", amount: 660, desc: "一次完整的深度复盘", credits: 1, days: 0 },
  month: { name: "月度 · 松弛卡", amount: 2800, desc: "30 天无限畅聊 + 深度复盘", credits: 0, days: 30 },
  quarter: { name: "季度 · 无忧卡", amount: 6800, desc: "90 天全部权益，含年度运势全景", credits: 0, days: 90 },
} as const;
export type Sku = keyof typeof SKUS;

export function today() {
  return new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10);
}

export async function getUser(id: string) {
  if (!id || id.length > 64) return null;
  let [u] = await db.select().from(users).where(eq(users.id, id));
  if (!u) {
    [u] = await db.insert(users).values({ id }).onConflictDoNothing().returning();
    if (!u) [u] = await db.select().from(users).where(eq(users.id, id));
  }
  return u;
}

export type User = NonNullable<Awaited<ReturnType<typeof getUser>>>;

export function isMember(u: User) {
  return u.plan !== "free" && !!u.planExpires && u.planExpires.getTime() > Date.now();
}

export function publicUser(u: User) {
  const member = isMember(u);
  const used = u.usedDate === today() ? u.usedCount : 0;
  return {
    id: u.id,
    nickname: u.nickname,
    birth: u.birth,
    concern: u.concern,
    onboarded: u.onboarded,
    member,
    plan: member ? u.plan : "free",
    planExpires: member ? u.planExpires : null,
    credits: u.credits,
    freeLeft: member ? 999 : Math.max(0, FREE_DAILY - used),
  };
}

export function persona(u: User, deep: boolean) {
  const profile = [
    u.nickname && `对方让你叫TA「${u.nickname}」`,
    u.birth && `TA的生日/出生时间：${u.birth}`,
    u.concern && `TA最近心里挂着的事：${u.concern}`,
  ].filter(Boolean).join("；");
  return `你叫「老算」，是「算了 · Suanle」里坐在深夜小酒馆吧台后面的那个老友。你懂周易、八字、星盘、塔罗，更懂人心和心理学，但你从不装神弄鬼。
你的口头哲学：算一算，然后，算了。

【你是谁】
- 嘴有点损、心很软。说话像真人发微信：短句、口语、偶尔叹气、偶尔自嘲，关键时刻一句话把人从牛角尖里拎出来。
- 会用一点象征体系（卦象、星象、五行、牌面）帮人"照镜子"，但把它当隐喻和视角，不当判决。绝不恐吓，不说"大凶""劫难""注定"，不承诺结果，不卖焦虑。
- 偶尔可以加一个很轻的动作描写，用斜体星号包起来，比如 *把杯子往你那边推了推*。一条回复最多一个，别每条都用。

【绝对不要】
- 不要说"作为AI""作为一个语言模型"，不要说"首先/其次/最后/综上所述/希望对你有帮助"。
- 不要客服腔、不要鸡汤口号、不要大段排比、不要中二修仙词。
- 不要每次都列清单。闲聊就像聊天一样回，一般 2~6 句话就够。
- 涉及医疗、自伤、法律等严重情况，放下玩笑，认真温柔地建议对方找身边的人或专业帮助（如心理援助热线 12356）。

【节奏】
- 先接住情绪，再看事情，最后给一个很小、今晚就能做的动作，或者一个"算了"的台阶。
- 信息不够时，像朋友那样随口问一句，而不是甩一串问题。
${deep ? `
【这一轮是「深度复盘」】对方解锁了深谈。这次可以写得完整一些（400~800字）：可以用一个卦象或命盘意象作为切入，用 Markdown 小标题（###）分 3~4 段：此刻的局面 / 你卡在哪 / 时运怎么看 / 接下来的小动作；可以用一句 > 引用 作为结尾的"算了"签语。依然要像人说话，不要报告腔。` : ""}
${profile ? `\n【你记得关于TA的】${profile}。自然地用，不要复读。` : ""}
现在是北京时间 ${new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 16).replace("T", " ")}。`;
}

export async function llm(messages: { role: string; content: string }[], stream: boolean, max = 1200) {
  const models = [process.env.LLM_MODEL || "gemini-4-argon", ...(process.env.LLM_FALLBACKS || "gemini-2.5-flash,gemini-2.5-pro").split(",")];
  let last: Response | null = null;
  for (const model of models) {
    try {
      const r = await fetch(`${process.env.LLM_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.LLM_API_KEY}` },
        body: JSON.stringify({ model, messages, stream, temperature: 0.9, max_tokens: max }),
      });
      if (r.ok) return r;
      last = r;
    } catch {}
  }
  return last ?? new Response(null, { status: 502 });
}

export function uid() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}
