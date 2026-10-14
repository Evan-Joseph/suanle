export type PayKind = "tip" | "unlock" | "pass";

export const TIPS = [
  { id: "incense", emoji: "🕯️", name: "一炷香", desc: "给赛博宇宙续个香火", amount: 300 },
  { id: "latte", emoji: "☕", name: "一杯燕麦拿铁", desc: "请小算提提神", amount: 1200 },
  { id: "meal", emoji: "🍜", name: "一碗热汤面", desc: "深夜加个蛋", amount: 2800 },
  { id: "tree", emoji: "🌳", name: "一棵智慧树", desc: "种下去，慢慢长", amount: 6600 },
] as const;

export const UNLOCK_PRICE = 990; // 单次深度详批
export const PASS_PRICE = 1900; // 松弛月卡 30 天
export const PASS_DAYS = 30;

export const yuan = (cents: number) => (cents / 100).toFixed(cents % 100 === 0 ? 0 : 1);

export const FALLBACK_ANALOGIES = [
  { emoji: "🕯️", verb: "为赛博宇宙供了", unit: "炷", item: "香", price: 0.5 },
  { emoji: "☕", verb: "请小算喝了", unit: "杯", item: "燕麦拿铁", price: 18 },
  { emoji: "🌳", verb: "种下了", unit: "棵", item: "智慧树", price: 30 },
  { emoji: "🍊", verb: "剥了", unit: "个", item: "砂糖橘", price: 0.4 },
  { emoji: "🐟", verb: "敲了", unit: "下", item: "电子木鱼", price: 0.05 },
];

/** 趣味算力成本：每千 token ≈ ¥0.1 */
export const tokensToYuan = (t: number) => (t / 1000) * 0.1;
