import { db } from "@/db";
import { usageLogs, users } from "@/db/schema";
import { and, eq, gte, sql } from "drizzle-orm";
import { bad, ensureUser, json, logUsage, today, validUserId } from "@/lib/server";
import { completeChat } from "@/lib/llm";
import { FALLBACK_ANALOGIES, tokensToYuan } from "@/lib/pricing";

export const dynamic = "force-dynamic";

type Analogy = { emoji: string; verb: string; unit: string; item: string; price: number };

function compose(a: Analogy, tokens: number) {
  const yuanCost = tokensToYuan(tokens);
  const raw = yuanCost / Math.max(0.01, a.price);
  const count = raw >= 10 ? Math.round(raw) : Math.max(0.1, Math.round(raw * 10) / 10);
  return { emoji: a.emoji, unit: a.unit, count, text: `${a.verb} ${count} ${a.unit}${a.item}` };
}

export async function GET(req: Request) {
  const userId = new URL(req.url).searchParams.get("userId");
  if (!validUserId(userId)) return bad("invalid user");
  const user = await ensureUser(userId);
  const day = today();
  const since = new Date(Date.now() - 6 * 86400000).toLocaleDateString("sv-SE", { timeZone: "Asia/Shanghai" });

  const week = await db
    .select({ day: usageLogs.day, tokens: sql<number>`sum(tokens)::int` })
    .from(usageLogs)
    .where(and(eq(usageLogs.userId, userId), gte(usageLogs.day, since)))
    .groupBy(usageLogs.day);
  const [{ total }] = await db.select({ total: sql<number>`coalesce(sum(tokens),0)::int` }).from(usageLogs).where(eq(usageLogs.userId, userId));
  const todayTokens = week.find((w) => w.day === day)?.tokens ?? 0;

  const days: { day: string; tokens: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toLocaleDateString("sv-SE", { timeZone: "Asia/Shanghai" });
    days.push({ day: d, tokens: week.find((w) => w.day === d)?.tokens ?? 0 });
  }

  let analogy = user.analogy;
  const stale = !analogy || analogy.date !== day || (todayTokens > 0 && Math.abs(todayTokens - analogy.tokens) / Math.max(1, analogy.tokens) > 0.3);
  if (stale && todayTokens > 0) {
    let a: Analogy = FALLBACK_ANALOGIES[Math.floor(Math.random() * FALLBACK_ANALOGIES.length)];
    try {
      const prof = [user.nickname && `称呼${user.nickname}`, user.profile.concern && `最近在意：${user.profile.concern}`, user.profile.mood && `状态：${user.profile.mood}`].filter(Boolean).join("，") || "暂无画像";
      const r = await completeChat(
        [
          { role: "system", content: `你给一个解忧 App 挑一个"今日算力消耗"的趣味类比物。要贴合用户近况、温柔好笑、生活化（比如香火、燕麦拿铁、砂糖橘、电子木鱼、猫条、热汤面、一页日记），给出合理的人民币单价。只输出 JSON：{"emoji":"单个emoji","verb":"动词短语，不含数字和量词，如 请小算喝了/为赛博宇宙供了/给你的猫开了","unit":"量词，如 杯/炷/根/个","item":"物品名，不含数量","price":数字}` },
          { role: "user", content: `用户：${prof}。今天消耗 ${todayTokens} token，约合 ¥${tokensToYuan(todayTokens).toFixed(2)}。` },
        ],
        { temperature: 1, maxTokens: 120 },
      );
      const m = r.text.match(/\{[\s\S]*\}/);
      if (m) {
        const j = JSON.parse(m[0]);
        if (j.emoji && j.verb && j.unit && j.item && Number(j.price) > 0) {
          const unit = String(j.unit).replace(/[\d\s]/g, "").slice(0, 3) || "份";
          const verb = String(j.verb).replace(new RegExp(`[\\d一二两三四五半几]+\\s*${unit}?\\s*$`), "").replace(/[\d\s]+$/, "").slice(0, 14);
          const item = String(j.item).replace(new RegExp(`^[\\d一二两三四五半几]+\\s*${unit}?`), "").slice(0, 10);
          if (verb && item) a = { emoji: Array.from(String(j.emoji))[0] ?? "✨", verb, unit, item, price: Number(j.price) };
        }
      }
      await logUsage(userId, r.total, "analogy");
    } catch {}
    const c = compose(a, todayTokens);
    analogy = { date: day, tokens: todayTokens, text: c.text, emoji: c.emoji, unit: c.unit, count: c.count };
    await db.update(users).set({ analogy }).where(eq(users.id, userId));
  }

  return json({ today: todayTokens, total, days, analogy: analogy && analogy.date === day ? analogy : null, yuanToday: tokensToYuan(todayTokens) });
}
