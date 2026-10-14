export interface AnalogyItem {
  emoji: string;
  name: string;
  unit: string;
  qty: number;
}

export interface Analogy {
  items: AnalogyItem[];
  line: string;
}

/** 1 元 ≈ 800 算力，用于把抽象的消耗换成具体的日常小物 */
export const TOKENS_PER_YUAN = 800;

const POOL: { emoji: string; name: string; unit: string; yuan: number; tags: string[] }[] = [
  { emoji: "☕", name: "热拿铁", unit: "杯", yuan: 15, tags: ["加班", "工作", "咖啡", "上班", "熬夜"] },
  { emoji: "🪔", name: "清心香", unit: "炷", yuan: 3, tags: ["焦虑", "失眠", "求签", "佛系"] },
  { emoji: "🥟", name: "刚出锅的肉包子", unit: "个", yuan: 3.5, tags: ["早起", "吃", "饿", "家"] },
  { emoji: "🪴", name: "虚拟绿植", unit: "棵", yuan: 30, tags: ["独处", "安静", "治愈"] },
  { emoji: "🧋", name: "三分糖奶茶", unit: "杯", yuan: 16, tags: ["学生", "考试", "恋爱", "朋友"] },
  { emoji: "🍜", name: "深夜的热汤面", unit: "碗", yuan: 18, tags: ["深夜", "熬夜", "加班"] },
  { emoji: "🍊", name: "剥好的橘子", unit: "个", yuan: 1.5, tags: ["家人", "冬天", "温暖"] },
  { emoji: "🚇", name: "地铁通勤", unit: "趟", yuan: 4, tags: ["通勤", "上班", "城市"] },
  { emoji: "🐟", name: "猫罐头", unit: "罐", yuan: 8, tags: ["猫", "宠物", "独居"] },
  { emoji: "🧧", name: "红包里的一块钱", unit: "枚", yuan: 1, tags: ["财运", "过年"] },
];

const LINES = [
  "这点算力，换你少内耗一晚，划算。",
  "算力是花了，心里的那块石头也轻了一点。",
  "想得多的人，连算力都比别人香。",
  "比起想不通，这点消耗可以算了。",
];

export function round1(n: number) {
  return n >= 10 ? Math.round(n) : Math.round(n * 10) / 10;
}

export function localAnalogy(tokens: number, tags: string[] = [], seed = 0): Analogy {
  const yuan = tokens / TOKENS_PER_YUAN;
  const scored = POOL.map((p, i) => ({
    p,
    s: p.tags.filter((t) => tags.some((x) => x.includes(t) || t.includes(x))).length * 10 + ((i * 7 + seed) % 5),
  }))
    .sort((a, b) => b.s - a.s)
    .slice(0, 3)
    .map(({ p }) => ({ emoji: p.emoji, name: p.name, unit: p.unit, qty: Math.max(0.1, round1(yuan / p.yuan)) }));
  return { items: scored, line: LINES[(seed + Math.floor(tokens / 997)) % LINES.length] };
}

export function fmt(n: number) {
  return Math.round(n).toLocaleString("en-US");
}
