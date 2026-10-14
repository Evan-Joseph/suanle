import {
  ARCHETYPES, COMPAT_MINES, COMPAT_TIPS, COMPAT_TONES, DAILY_QUOTES, DIRECTIONS,
  ELEMENT_META, ELEMENT_ORDER, JI_POOL, LUCKY_COLORS, LOW_WINDOWS, ONE_LINERS,
  PEAK_WINDOWS, SECTIONS, SUANLE_DEALS, WEATHER_BANDS, YI_POOL,
  type Archetype, type CompatTone, type ElementKey, type Section,
} from "./copy";
import { clamp, hashSeed, makeNoise1D, pick, pickN, rngFrom, todayKey } from "./rand";

// ———————————————————————— 档案 ————————————————————————
export type CalType = "solar" | "lunar";
export type Gender = "female" | "male" | "secret";

export interface BirthProfile {
  name: string;
  gender: Gender;
  calType: CalType;
  year: number;
  month: number;
  day: number;
  hour: number; // 0-11 时辰序
  city: string;
}

export const HOURS: { label: string; range: string }[] = [
  { label: "子时", range: "23:00 – 00:59" },
  { label: "丑时", range: "01:00 – 02:59" },
  { label: "寅时", range: "03:00 – 04:59" },
  { label: "卯时", range: "05:00 – 06:59" },
  { label: "辰时", range: "07:00 – 08:59" },
  { label: "巳时", range: "09:00 – 10:59" },
  { label: "午时", range: "11:00 – 12:59" },
  { label: "未时", range: "13:00 – 14:59" },
  { label: "申时", range: "15:00 – 16:59" },
  { label: "酉时", range: "17:00 – 18:59" },
  { label: "戌时", range: "19:00 – 20:59" },
  { label: "亥时", range: "21:00 – 22:59" },
];

export function canonicalKey(p: BirthProfile): string {
  return [p.name.trim() || "旅人", p.gender, p.calType, p.year, p.month, p.day, p.hour, p.city.trim()].join("|");
}

export function readingId(p: BirthProfile): string {
  return "r" + hashSeed("suanle:" + canonicalKey(p)).toString(36);
}

export function ageOf(p: BirthProfile, now = new Date()): number {
  return Math.max(0, now.getFullYear() - p.year);
}

export function birthLabel(p: BirthProfile): string {
  const cal = p.calType === "lunar" ? "农历" : "公历";
  const city = p.city.trim();
  return `${cal} ${p.year} 年 ${p.month} 月 ${p.day} 日 · ${HOURS[p.hour]?.label ?? ""}${city ? ` · ${city}` : ""}`;
}

// ———————————————————————— 五行气流 ————————————————————————
export interface ElementVec { key: ElementKey; pct: number }

export function computeElements(p: BirthProfile) {
  const rng = rngFrom("五行" + canonicalKey(p));
  const raw: Record<ElementKey, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  for (const k of ELEMENT_ORDER) raw[k] = 0.5 + rng() * 1.4;

  // 结构化微调：季节主气 + 日主加成，让"算"有章法
  const seasonBoost: ElementKey[] = ["wood", "fire", "metal", "water"]; // 春夏秋冬
  raw[seasonBoost[Math.floor(((p.month % 12) + 1) / 3) % 4]] += 0.5 + rng() * 0.4;
  const master = ELEMENT_ORDER[(p.year * 3 + p.month * 5 + p.day * 7 + p.hour * 11 + (hashSeed(p.city || "城") % 5)) % 5];
  raw[master] += 0.45 + rng() * 0.5;

  const total = ELEMENT_ORDER.reduce((s, k) => s + raw[k], 0);
  const vec: ElementVec[] = ELEMENT_ORDER.map((k) => ({ key: k, pct: Math.round((raw[k] / total) * 100) }));
  // 修正四舍五入误差
  const drift = 100 - vec.reduce((s, v) => s + v.pct, 0);
  vec[0].pct += drift;
  vec.sort((a, b) => b.pct - a.pct);

  return { master, vec, dom: vec[0].key, second: vec[1].key, weak: vec[vec.length - 1].key };
}

// ———————————————————————— 今日气流 ————————————————————————
export interface DailyFortune {
  dateKey: string;
  temp: number;
  weather: { word: string; note: string };
  yi: string[];
  ji: string[];
  color: { name: string; hex: string };
  dir: string;
  num: number;
  quote: string;
  whisper: string;
}

export function dailyFortune(p: BirthProfile | null, dateKey = todayKey()): DailyFortune {
  const basis = p ? canonicalKey(p) : "路过的旅人";
  const rng = rngFrom(`日运${dateKey}${basis}`);
  const temp = Math.round(38 + rng() * 60);
  const band = WEATHER_BANDS.find((b) => temp >= b.min) ?? WEATHER_BANDS[WEATHER_BANDS.length - 1];
  return {
    dateKey,
    temp,
    weather: { word: band.word, note: band.note },
    yi: pickN(rng, YI_POOL, 2),
    ji: pickN(rng, JI_POOL, 2),
    color: pick(rng, LUCKY_COLORS),
    dir: pick(rng, DIRECTIONS),
    num: 1 + Math.floor(rng() * 9),
    quote: pick(rng, DAILY_QUOTES),
    whisper: pick(rng, ONE_LINERS),
  };
}

export function weekOutlook(p: BirthProfile | null, base = new Date()) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const f = dailyFortune(p, todayKey(d));
    return {
      dateKey: f.dateKey,
      week: ["日", "一", "二", "三", "四", "五", "六"][d.getDay()],
      dayNum: d.getDate(),
      temp: f.temp,
      word: f.weather.word,
    };
  });
}

// ———————————————————————— 全景解卦报告 ————————————————————
export interface DeepSection extends Section { deal: string }

export interface ReadingReport {
  id: string;
  master: ElementKey;
  dom: ElementKey;
  second: ElementKey;
  weak: ElementKey;
  vec: ElementVec[];
  archetype: Archetype;
  sections: Record<"career" | "love" | "wealth" | "soul", DeepSection>;
  oneLiner: string;
  colors: { name: string; hex: string }[];
}

export function buildReport(p: BirthProfile): ReadingReport {
  const el = computeElements(p);
  const rng = rngFrom("解卦" + canonicalKey(p));
  const deals = pickN(rng, SUANLE_DEALS, 4);
  const s = SECTIONS[el.dom];
  return {
    id: readingId(p),
    master: el.master,
    dom: el.dom,
    second: el.second,
    weak: el.weak,
    vec: el.vec,
    archetype: ARCHETYPES[el.dom],
    sections: {
      career: { ...s.career, deal: deals[0] },
      love: { ...s.love, deal: deals[1] },
      wealth: { ...s.wealth, deal: deals[2] },
      soul: { ...s.soul, deal: deals[3] },
    },
    oneLiner: pick(rngFrom("金句" + canonicalKey(p)), ONE_LINERS),
    colors: pickN(rng, LUCKY_COLORS, 3),
  };
}

// ———————————————————————— 人生能量波段 ————————————————————
export interface LifeWindow {
  kind: "peak" | "low";
  start: number;
  end: number;
  crest: number;
  label: string;
  desc: string;
}

export interface LifeWave {
  points: number[]; // 年龄 1..100 的能量值 0..100
  windows: LifeWindow[];
  currentAge: number;
}

export function buildWave(p: BirthProfile): LifeWave {
  const key = canonicalKey(p);
  const noise = makeNoise1D("波段" + key, 4);
  const rng = rngFrom("窗口" + key);

  const raw: number[] = [];
  for (let age = 1; age <= 100; age++) {
    const t = age / 100;
    // 生命周期大势 + 个体噪声
    const shape = 0.16 * Math.sin(t * Math.PI * 2.6 + rng() * 0.02) + 0.1 * Math.sin(t * Math.PI * 6.3);
    raw.push(noise(t) * 0.72 + 0.14 + shape);
  }
  // 平滑
  const points = raw.map((v, i) => {
    const a = raw[Math.max(0, i - 1)];
    const b = raw[Math.min(99, i + 1)];
    return clamp(Math.round(((a + v * 2 + b) / 4) * 100), 6, 99);
  });

  const sorted = [...points].sort((a, b) => a - b);
  const hiLine = sorted[Math.floor(sorted.length * 0.66)];
  const loLine = sorted[Math.floor(sorted.length * 0.3)];

  const segs: { kind: "peak" | "low"; start: number; end: number; crest: number; ex: number }[] = [];
  let i = 0;
  while (i < points.length) {
    const isPeak = points[i] >= hiLine;
    const isLow = points[i] <= loLine;
    if (!isPeak && !isLow) { i++; continue; }
    const kind = isPeak ? "peak" : "low";
    const start = i;
    let ex = points[i];
    let crest = i;
    while (i < points.length && (kind === "peak" ? points[i] >= hiLine - 3 : points[i] <= loLine + 3)) {
      if (kind === "peak" ? points[i] > ex : points[i] < ex) { ex = points[i]; crest = i; }
      i++;
    }
    if (i - start >= 4) segs.push({ kind, start: start + 1, end: i, crest: crest + 1, ex });
  }

  const chosen: typeof segs = [];
  for (const k of ["peak", "low"] as const) {
    const cands = segs
      .filter((s) => s.kind === k && (k === "peak" ? s.crest >= 16 : s.crest >= 14) && s.crest <= 92)
      .sort((a, b) => (k === "peak" ? b.ex - a.ex : a.ex - b.ex))
      .slice(0, 2)
      .sort((a, b) => a.start - b.start);
    chosen.push(...cands);
  }
  chosen.sort((a, b) => a.start - b.start);

  const labelsRng = rngFrom("命名" + key);
  const peakLabels = pickN(labelsRng, PEAK_WINDOWS.labels, 3);
  const lowLabels = pickN(labelsRng, LOW_WINDOWS.labels, 3);
  let pi = 0, li = 0;
  const windows: LifeWindow[] = chosen.map((s) => ({
    kind: s.kind,
    start: s.start,
    end: s.end,
    crest: s.crest,
    label: s.kind === "peak" ? peakLabels[pi++] : lowLabels[li++],
    desc: pick(labelsRng, s.kind === "peak" ? PEAK_WINDOWS.descs : LOW_WINDOWS.descs),
  })).slice(0, 4);

  return { points, windows, currentAge: ageOf(p) };
}

// ———————————————————————— 双人合盘 ————————————————————————
export interface CompatResult {
  score: number;
  tier: "high" | "mid" | "grow";
  tone: CompatTone;
  harmony: { a: string; b: string };
  tips: string[];
  mines: string[];
  line: string;
}

const GENERATES: Record<ElementKey, ElementKey> = { wood: "fire", fire: "earth", earth: "metal", metal: "water", water: "wood" };
const RESTRAINS: Record<ElementKey, ElementKey> = { wood: "earth", earth: "water", water: "fire", fire: "metal", metal: "wood" };

export function buildCompat(a: BirthProfile, b: BirthProfile): CompatResult {
  const ea = computeElements(a);
  const eb = computeElements(b);
  let score = 66 + rngFrom("缘分" + canonicalKey(a) + canonicalKey(b))() * 18;

  if (GENERATES[ea.master] === eb.master || GENERATES[eb.master] === ea.master) score += 9;
  if (ea.dom === eb.weak || eb.dom === ea.weak) score += 6; // 互补
  if (RESTRAINS[ea.master] === eb.master || RESTRAINS[eb.master] === ea.master) score -= 8;
  if (ea.dom === eb.dom) score += 2;
  score = clamp(Math.round(score), 58, 99);

  const tier: CompatResult["tier"] = score >= 86 ? "high" : score >= 72 ? "mid" : "grow";
  const rng = rngFrom("合盘" + canonicalKey(a) + canonicalKey(b));
  return {
    score,
    tier,
    tone: COMPAT_TONES[tier],
    harmony: {
      a: `${a.name || "你"}是${ELEMENT_META[ea.dom].cn}性气场，${ELEMENT_META[ea.dom].nature}，擅长${ELEMENT_META[ea.dom].gift}`,
      b: `${b.name || "TA"}是${ELEMENT_META[eb.dom].cn}性气场，${ELEMENT_META[eb.dom].nature}，擅长${ELEMENT_META[eb.dom].gift}`,
    },
    tips: pickN(rng, COMPAT_TIPS, 3),
    mines: pickN(rng, COMPAT_MINES, 2),
    line: pick(rng, ONE_LINERS),
  };
}

export function elementCn(k: ElementKey) { return ELEMENT_META[k].cn; }
