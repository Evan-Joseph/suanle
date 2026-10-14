import type { Profile } from "./types";
import { hashStr } from "./divination";

export interface Thing { name: string; unit: string; per: number; cents: number; }

// per = 多少算力约等于 1 个单位；cents = 打赏时的参考价
export const THINGS: Thing[] = [
  { name: "热拿铁", unit: "杯", per: 12000, cents: 1800 },
  { name: "清心香", unit: "炷", per: 4000, cents: 600 },
  { name: "刚出锅的肉包子", unit: "个", per: 2500, cents: 300 },
  { name: "虚拟绿植", unit: "棵", per: 20000, cents: 1200 },
  { name: "冰镇橘子汽水", unit: "瓶", per: 3500, cents: 500 },
  { name: "猫条", unit: "根", per: 1500, cents: 200 },
  { name: "烤红薯", unit: "个", per: 5000, cents: 800 },
  { name: "便利店关东煮", unit: "串", per: 2000, cents: 300 },
  { name: "公园长椅上的午后", unit: "个", per: 30000, cents: 0 },
  { name: "热水澡", unit: "次", per: 8000, cents: 0 },
];

export function fmt(n: number) {
  return Math.round(n).toLocaleString("en-US");
}

function amount(x: number) {
  if (x < 0.1) return "一小口";
  if (x < 0.35) return "四分之一";
  if (x < 0.75) return "半";
  if (x < 1.25) return "1";
  const r = Math.round(x * 2) / 2;
  return String(r);
}

export function pickThings(profile: Profile | null, seed: string): Thing[] {
  const likes = (profile?.likes || "") + (profile?.notes || "");
  const prefer = THINGS.filter((t) => likes && (likes.includes(t.name.slice(-2)) || likes.includes(t.name.slice(0, 2))));
  if (/猫/.test(likes)) prefer.push(THINGS[5]);
  if (/咖啡|拿铁/.test(likes)) prefer.push(THINGS[0]);
  const pool = prefer.length ? [...prefer, ...THINGS.slice(0, 4)] : THINGS;
  const h = hashStr(seed);
  return [pool[h % pool.length], pool[(h >> 5) % pool.length]];
}

export function analogize(tokens: number, profile: Profile | null, seed = "x", n = 1): string {
  if (!tokens) return "";
  const things = pickThings(profile, seed).slice(0, n);
  return things
    .filter((t, i, a) => a.findIndex((x) => x.name === t.name) === i)
    .map((t) => {
      const a = amount(tokens / t.per);
      return a === "一小口" ? `一小口${t.name}` : `${a} ${t.unit}${t.name}`;
    })
    .join(" / ");
}

export const TIP_TIERS = [
  { id: "bun", label: "一个肉包子", sub: "热乎乎的心意", cents: 300, icon: "🥟" },
  { id: "incense", label: "一炷清心香", sub: "替你也点一炷", cents: 600, icon: "🪔" },
  { id: "latte", label: "一杯热拿铁", sub: "陪你熬过下午", cents: 1800, icon: "☕" },
  { id: "plant", label: "种一棵绿植", sub: "让小屋多点绿", cents: 3600, icon: "🪴" },
];

export const PLANS = [
  { id: "regular", label: "常来坐坐", price: 1800, period: "月", perks: ["每日畅聊不设限", "年度大盘 · 每月运势长卷", "推演过程完整展开"] },
  { id: "friend", label: "老友 · 年卡", price: 16800, period: "年", perks: ["包含「常来坐坐」全部", "专属头像框与签纸", "新玩法抢先玩"] },
];

export const DAILY_FREE = 60000;
