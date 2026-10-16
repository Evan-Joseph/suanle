/** 把抽象的“算力”换成具体的生活小物 —— 让消耗变得有温度 */

export interface Basis {
  emoji: string;
  name: string;
  unit: string;
  yuan: number;
}

export interface AnalogyItem {
  emoji: string;
  name: string;
  unit: string;
  qty: number;
}

/** 约 1 元 ≈ 1,100 算力 */
export const TOKENS_PER_YUAN = 1100;

export const POOL: (Basis & { tags: string[] })[] = [
  { emoji: "☕", name: "热拿铁", unit: "杯", yuan: 16, tags: ["加班", "工作", "咖啡", "上班", "熬夜", "职场"] },
  { emoji: "🪔", name: "清香", unit: "炷", yuan: 3, tags: ["焦虑", "失眠", "求签", "佛系", "运势"] },
  { emoji: "🥟", name: "热腾腾的包子", unit: "个", yuan: 2.5, tags: ["早起", "吃", "饿", "家", "通勤"] },
  { emoji: "🧋", name: "三分糖奶茶", unit: "杯", yuan: 15, tags: ["学生", "考试", "恋爱", "朋友", "感情"] },
  { emoji: "🍜", name: "深夜热汤面", unit: "碗", yuan: 18, tags: ["深夜", "熬夜", "加班", "独居"] },
  { emoji: "🍊", name: "剥好的橘子", unit: "个", yuan: 1.5, tags: ["家人", "冬天", "温暖", "父母"] },
  { emoji: "🚇", name: "地铁通勤", unit: "趟", yuan: 4, tags: ["通勤", "上班", "城市"] },
  { emoji: "🐟", name: "猫罐头", unit: "罐", yuan: 8, tags: ["猫", "宠物", "独居"] },
  { emoji: "🌷", name: "路边的小花", unit: "束", yuan: 10, tags: ["恋爱", "治愈", "女生", "感情"] },
  { emoji: "📚", name: "二手旧书", unit: "本", yuan: 12, tags: ["学习", "考研", "考试", "读书"] },
  { emoji: "🍠", name: "烤红薯", unit: "个", yuan: 6, tags: ["冬天", "温暖", "街头"] },
];

export const DEFAULT_BASIS: Basis[] = [POOL[0], POOL[1], POOL[2]].map(({ emoji, name, unit, yuan }) => ({ emoji, name, unit, yuan }));

export function round1(n: number) {
  if (n >= 10) return Math.round(n);
  return Math.max(0.1, Math.round(n * 10) / 10);
}

export function pickLocalBasis(tags: string[] = [], seed = 0): Basis[] {
  return POOL.map((p, i) => ({
    p,
    s: p.tags.filter((t) => tags.some((x) => x.includes(t) || t.includes(x))).length * 10 + ((i * 7 + seed) % 5),
  }))
    .sort((a, b) => b.s - a.s)
    .slice(0, 3)
    .map(({ p }) => ({ emoji: p.emoji, name: p.name, unit: p.unit, yuan: p.yuan }));
}

export function analogize(tokens: number, basis: Basis[]): AnalogyItem[] {
  const yuan = tokens / TOKENS_PER_YUAN;
  return basis.slice(0, 3).map((b) => ({ emoji: b.emoji, name: b.name, unit: b.unit, qty: round1(yuan / Math.max(0.5, b.yuan)) }));
}

/** 挑最“顺口”的一项：数量在 0.5~20 之间最直观 */
export function bestItem(tokens: number, basis: Basis[]): AnalogyItem {
  const items = analogize(tokens, basis);
  const scored = items.map((it) => ({ it, s: it.qty >= 0.5 && it.qty <= 20 ? Math.abs(Math.log(it.qty / 2)) : 99 }));
  scored.sort((a, b) => a.s - b.s);
  return scored[0]?.it ?? items[0];
}

export function fmt(n: number) {
  return Math.round(n).toLocaleString("en-US");
}

export function yuanOf(tokens: number) {
  return tokens / TOKENS_PER_YUAN;
}
