/** 算力的生活化度量、随喜档位与长明灯方案 */

export interface Thing {
  name: string;
  unit: string;
  per: number; // 多少算力约等于 1 个单位
  emoji: string;
  hint?: RegExp;
}

export const THINGS: Thing[] = [
  { name: "热拿铁", unit: "杯", per: 12000, emoji: "☕", hint: /咖啡|拿铁|加班|熬夜|上班|通勤/ },
  { name: "清心香", unit: "炷", per: 4000, emoji: "🪔", hint: /焦虑|失眠|烦|静|佛|庙/ },
  { name: "刚出锅的肉包子", unit: "个", per: 2500, emoji: "🥟", hint: /饿|吃|早饭|包子|北方/ },
  { name: "虚拟绿植", unit: "棵", per: 20000, emoji: "🪴", hint: /植物|花|绿|种/ },
  { name: "冰镇橘子汽水", unit: "瓶", per: 3500, emoji: "🍊", hint: /夏|热|汽水|运动/ },
  { name: "猫条", unit: "根", per: 1500, emoji: "🐟", hint: /猫/ },
  { name: "烤红薯", unit: "个", per: 5000, emoji: "🍠", hint: /冬|冷|暖|红薯/ },
  { name: "关东煮", unit: "串", per: 2000, emoji: "🍢", hint: /便利店|深夜|夜宵/ },
  { name: "奶茶", unit: "杯", per: 10000, emoji: "🧋", hint: /奶茶|甜|下午茶/ },
  { name: "煎饼果子", unit: "套", per: 6000, emoji: "🌯", hint: /早餐|天津|北京|煎饼/ },
];

export interface AnalogyItem {
  emoji: string;
  text: string;
}

export const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

export function compact(n: number): string {
  if (n >= 100000000) return `${(n / 100000000).toFixed(1).replace(/\.0$/, "")} 亿`;
  if (n >= 10000) return `${(n / 10000).toFixed(1).replace(/\.0$/, "")} 万`;
  return fmt(n);
}

export function qtyText(x: number): string {
  if (x < 0.12) return "一小口";
  if (x < 0.35) return "小半";
  if (x < 0.7) return "半";
  if (x < 1.25) return "1";
  if (x < 10) return String(Math.round(x * 2) / 2);
  return String(Math.round(x));
}

export function thingText(tokens: number, t: { name: string; unit: string; per: number }): string {
  const q = qtyText(tokens / Math.max(1, t.per));
  if (q === "一小口") return `一小口${t.name}`;
  if (q === "小半" || q === "半") return `${q}${t.unit}${t.name}`;
  return `${q} ${t.unit}${t.name}`;
}

function pickThings(hint: string, n: number, seed: number): Thing[] {
  const prefer = THINGS.filter((t) => t.hint && t.hint.test(hint));
  const rest = THINGS.filter((t) => !prefer.includes(t));
  const rotated = [...rest.slice(seed % rest.length), ...rest.slice(0, seed % rest.length)];
  return [...prefer, ...rotated].slice(0, n);
}

/** 本地类比：根据画像关键词挑选贴切的日常事物 */
export function localAnalogy(tokens: number, hint = "", n = 3, seed = 0): AnalogyItem[] {
  if (tokens <= 0) return [];
  return pickThings(hint, n, seed).map((t) => ({ emoji: t.emoji, text: thingText(tokens, t) }));
}

const SHORT: Record<string, string> = { 刚出锅的肉包子: "肉包子", 虚拟绿植: "绿植", 冰镇橘子汽水: "橘子汽水" };

/** 一条消息下的小字：≈ 半个肉包子 */
export function shortAnalogy(tokens: number, hint = ""): string {
  if (tokens <= 0) return "";
  const t = pickThings(hint, 1, Math.floor(tokens / 997))[0];
  return t ? thingText(tokens, { ...t, name: SHORT[t.name] ?? t.name }).replace(/\s/g, "") : "";
}

export const TIP_TIERS = [
  { id: "bun", emoji: "🥟", label: "一个肉包子", sub: "热乎乎的心意", cents: 300 },
  { id: "incense", emoji: "🪔", label: "一炷清心香", sub: "也替你点一炷", cents: 600 },
  { id: "latte", emoji: "☕", label: "一杯热拿铁", sub: "陪你熬过下午", cents: 1800 },
  { id: "plant", emoji: "🪴", label: "一盆绿植", sub: "让小馆多点绿", cents: 3600 },
] as const;

export const LAMP_PLANS = [
  { id: "week", label: "七日灯", days: 7, cents: 600, sub: "先试试看" },
  { id: "month", label: "月灯", days: 30, cents: 1800, sub: "多数人的选择", hot: true },
  { id: "year", label: "年灯", days: 365, cents: 12800, sub: "一年都亮着" },
] as const;

export const FREE_DEEP_PER_DAY = 3;
export const NUDGE_TOKENS = 40000;

export const yuan = (cents: number) => `¥${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`;
