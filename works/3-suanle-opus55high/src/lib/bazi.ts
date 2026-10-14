// 子平八字 · 本地排盘 + 人生波动 K 线（离线可用）

export const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
export const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
export const ZODIAC = ["鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊", "猴", "鸡", "狗", "猪"];
export type Element = "wood" | "fire" | "earth" | "metal" | "water";
export const ELEMENTS: Element[] = ["wood", "fire", "earth", "metal", "water"];
export const ELEMENT_CN: Record<Element, string> = { wood: "木", fire: "火", earth: "土", metal: "金", water: "水" };
export const ELEMENT_COLOR: Record<Element, string> = {
  wood: "#7E9A7A", fire: "#C0705A", earth: "#B8955E", metal: "#9A9A94", water: "#6E8BA6",
};
const STEM_EL: Element[] = ["wood", "wood", "fire", "fire", "earth", "earth", "metal", "metal", "water", "water"];
const BRANCH_EL: Element[] = ["water", "earth", "wood", "wood", "earth", "fire", "fire", "earth", "metal", "metal", "earth", "water"];
// 藏干（主气在前）
const HIDDEN: number[][] = [[9], [5, 9, 7], [0, 2, 4], [1], [4, 1, 9], [2, 6, 4], [3, 5], [5, 3, 1], [6, 8, 4], [7], [4, 7, 3], [8, 0]];

export type Pillar = { stem: number; branch: number; label: string };
export type BaziResult = {
  birthday: string;
  hour: number | null;
  pillars: { year: Pillar; month: Pillar; day: Pillar; hour: Pillar | null };
  zodiac: string;
  dayMaster: string;
  dayMasterElement: Element;
  elements: Record<Element, number>;
  strength: "偏强" | "偏弱" | "中和";
  favorable: Element[];
  unfavorable: Element[];
  tenGods: { pos: string; stem: string; god: string }[];
  traits: string;
};

const mk = (s: number, b: number): Pillar => ({ stem: s, branch: b, label: STEMS[s] + BRANCHES[b] });
const mod = (a: number, n: number) => ((a % n) + n) % n;

// 节气近似起点（月, 日）：寅月立春起
const JIE: [number, number][] = [[2, 4], [3, 6], [4, 5], [5, 6], [6, 6], [7, 7], [8, 8], [9, 8], [10, 8], [11, 7], [12, 7], [1, 6]];

export function computeBazi(birthday: string, hour: number | null): BaziResult {
  const [y, m, d] = birthday.split("-").map(Number);
  const md = m * 100 + d;
  const lunarYear = md < 204 ? y - 1 : y;
  const ys = mod(lunarYear - 4, 10);
  const yb = mod(lunarYear - 4, 12);

  // month index: 0 = 寅
  let mi = 11;
  for (let i = 0; i < 11; i++) {
    const [jm, jd] = JIE[i];
    const [nm, nd] = JIE[i + 1];
    const start = jm * 100 + jd;
    const end = nm === 1 ? 1300 : nm * 100 + nd;
    if (md >= start && md < end) { mi = i; break; }
  }
  if (md < 106) mi = 10; // 子月 (Dec 7 - Jan 5)
  else if (md < 204 && md >= 106) mi = 11; // 丑月
  const mb = mod(mi + 2, 12);
  const ms = mod((ys % 5) * 2 + 2 + mi, 10);

  // day pillar: 1900-01-01 = 甲戌 (index 10)
  const days = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(1900, 0, 1)) / 86400000);
  let dayIdx = mod(10 + days, 60);
  if (hour !== null && hour >= 23) dayIdx = mod(dayIdx + 1, 60);
  const ds = dayIdx % 10;
  const db = dayIdx % 12;

  let hourP: Pillar | null = null;
  if (hour !== null) {
    const hb = Math.floor((hour + 1) / 2) % 12;
    const hs = mod((ds % 5) * 2 + hb, 10);
    hourP = mk(hs, hb);
  }

  const pillars = { year: mk(ys, yb), month: mk(ms, mb), day: mk(ds, db), hour: hourP };
  const scores: Record<Element, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  const list = [pillars.year, pillars.month, pillars.day, pillars.hour].filter(Boolean) as Pillar[];
  list.forEach((p, idx) => {
    scores[STEM_EL[p.stem]] += 1;
    const monthBoost = idx === 1 ? 1.6 : 1;
    HIDDEN[p.branch].forEach((h, k) => {
      scores[STEM_EL[h]] += (k === 0 ? 1.2 : 0.35) * monthBoost;
    });
  });
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const elements = Object.fromEntries(ELEMENTS.map((e) => [e, Math.round((scores[e] / total) * 100)])) as Record<Element, number>;

  const dmEl = STEM_EL[ds];
  const idx = ELEMENTS.indexOf(dmEl);
  const gen = ELEMENTS[mod(idx - 1, 5)]; // 生我
  const out = ELEMENTS[mod(idx + 1, 5)]; // 我生
  const wealth = ELEMENTS[mod(idx + 2, 5)]; // 我克
  const officer = ELEMENTS[mod(idx + 3, 5)]; // 克我
  const support = elements[dmEl] + elements[gen];
  const strength = support >= 52 ? "偏强" : support <= 38 ? "偏弱" : "中和";
  const favorable = strength === "偏强" ? [out, wealth] : strength === "偏弱" ? [gen, dmEl] : [out, gen];
  const unfavorable = strength === "偏强" ? [gen, dmEl] : strength === "偏弱" ? [officer, wealth] : [officer];

  const godOf = (s: number) => {
    const rel = mod(ELEMENTS.indexOf(STEM_EL[s]) - idx, 5);
    const same = s % 2 === ds % 2;
    return [same ? "比肩" : "劫财", same ? "食神" : "伤官", same ? "偏财" : "正财", same ? "七杀" : "正官", same ? "偏印" : "正印"][rel];
  };
  const tenGods = [
    { pos: "年干", p: pillars.year },
    { pos: "月干", p: pillars.month },
    ...(pillars.hour ? [{ pos: "时干", p: pillars.hour }] : []),
  ].map(({ pos, p }) => ({ pos, stem: STEMS[p.stem], god: godOf(p.stem) }));

  const TRAITS: Record<Element, string> = {
    wood: "像一棵树，向上长，有主见，也容易跟自己较劲。",
    fire: "像一团火，热情、表达欲强，烧得快也需要歇。",
    earth: "像一片地，靠谱、能扛，就是容易什么都往自己身上揽。",
    metal: "像一块金，干脆、有原则，偶尔对自己太狠。",
    water: "像一汪水，灵活、聪明、想得多，夜里尤其多。",
  };

  return {
    birthday, hour, pillars,
    zodiac: ZODIAC[yb],
    dayMaster: STEMS[ds] + ELEMENT_CN[dmEl],
    dayMasterElement: dmEl,
    elements, strength, favorable, unfavorable, tenGods,
    traits: TRAITS[dmEl],
  };
}

export function baziSummary(b: BaziResult): string {
  const p = b.pillars;
  return `八字：${p.year.label} ${p.month.label} ${p.day.label} ${p.hour?.label ?? "（时辰不详）"}；日元 ${b.dayMaster}，${b.strength}；五行占比 ${ELEMENTS.map((e) => ELEMENT_CN[e] + b.elements[e] + "%").join(" ")}；喜 ${b.favorable.map((e) => ELEMENT_CN[e]).join("")}，忌 ${b.unfavorable.map((e) => ELEMENT_CN[e]).join("")}；十神 ${b.tenGods.map((t) => t.pos + t.stem + t.god).join("、")}`;
}

// ---------- 人生波动 K 线 ----------
export type Candle = { age: number; year: number; open: number; high: number; low: number; close: number; pillar: string; tag?: string };
export type KLineResult = { candles: Candle[]; luckPillars: { startAge: number; label: string; score: number }[]; peak: Candle; trough: Candle };

function seeded(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export function computeKLine(b: BaziResult, maxAge = 90): KLineResult {
  const [by] = b.birthday.split("-").map(Number);
  const rand = seeded(b.birthday + (b.hour ?? "x"));
  const elScore = (e: Element) => (b.favorable.includes(e) ? 1 : b.unfavorable.includes(e) ? -1 : 0);
  const ys = b.pillars.year.stem;
  const forward = ys % 2 === 0; // 阳年顺排（简化，不分男女）
  const startAge = 1 + Math.floor(rand() * 9);
  const luckPillars: KLineResult["luckPillars"] = [];
  for (let k = 0; k < 10; k++) {
    const step = forward ? k + 1 : -(k + 1);
    const s = mod(b.pillars.month.stem + step, 10);
    const br = mod(b.pillars.month.branch + step, 12);
    const score = elScore(STEM_EL[s]) * 9 + elScore(BRANCH_EL[br]) * 7 + (rand() - 0.5) * 6;
    luckPillars.push({ startAge: startAge + k * 10, label: STEMS[s] + BRANCHES[br], score });
  }
  const candles: Candle[] = [];
  let prev = 50 + (rand() - 0.5) * 8;
  for (let age = 1; age <= maxAge; age++) {
    const year = by + age - 1;
    const lp = luckPillars.find((l, i) => age >= l.startAge && (i === 9 || age < luckPillars[i + 1].startAge));
    const s = mod(year - 4, 10);
    const br = mod(year - 4, 12);
    const flow = elScore(STEM_EL[s]) * 5 + elScore(BRANCH_EL[br]) * 4;
    const clash = mod(br - b.pillars.day.branch, 12) === 6 ? -7 : 0;
    const target = 50 + (lp?.score ?? 0) + flow + clash + Math.sin(age / 7) * 4;
    const open = prev;
    const close = Math.max(8, Math.min(95, open + (target - open) * 0.45 + (rand() - 0.5) * 10));
    const high = Math.min(99, Math.max(open, close) + rand() * 9);
    const low = Math.max(2, Math.min(open, close) - rand() * 9);
    let tag: string | undefined;
    if (lp && age === lp.startAge) tag = `换运 ${lp.label}`;
    else if (clash) tag = "日支逢冲";
    else if (flow >= 9) tag = "流年得助";
    candles.push({ age, year, open: +open.toFixed(1), high: +high.toFixed(1), low: +low.toFixed(1), close: +close.toFixed(1), pillar: STEMS[s] + BRANCHES[br], tag });
    prev = close;
  }
  const peak = candles.reduce((a, c) => (c.high > a.high ? c : a), candles[0]);
  const trough = candles.reduce((a, c) => (c.low < a.low ? c : a), candles[0]);
  return { candles, luckPillars, peak, trough };
}
