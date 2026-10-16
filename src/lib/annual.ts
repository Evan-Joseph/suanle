import { hashSeed, yearGanzhi } from "./divination";

export interface AnnualDim {
  key: "事业" | "财运" | "感情" | "身心";
  score: number;
  text: string;
}

export interface AnnualMonth {
  m: number;
  v: number;
  note: string;
}

export interface AnnualReport {
  year: number;
  ganzhi: string;
  shengxiao: string;
  keyword: string;
  summary: string;
  dims: AnnualDim[];
  months: AnnualMonth[];
  advice: string[];
  letgo: string;
}

const KEYWORDS = ["稳中见光", "慢慢回暖", "破土", "蓄力", "松绑", "换气", "扎根", "开窗", "轻装", "回到自己", "见山", "顺流"];

const DIM_TEXT: Record<AnnualDim["key"], string[]> = {
  事业: [
    "上半年适合打地基，下半年才是出成绩的时候。别急着证明自己。",
    "会有一次换赛道或换方法的机会，看准了就大胆一点。",
    "贵人运不错，多和前辈聊聊，答案常在一顿饭里。",
  ],
  财运: [
    "正财稳，偏财别贪。存钱这件事，今年会让你特别有安全感。",
    "花钱的地方会变多，但多半花在让自己变好的事情上，值得。",
    "适合做减法：取消几个用不上的订阅，比多赚一笔更踏实。",
  ],
  感情: [
    "有人在默默关心你，别只盯着手机里没回的那条消息。",
    "关系里最重要的一件事：把想说的话好好说出来，而不是等对方猜。",
    "单身的话，缘分多在熟人圈；有伴的话，一起做点新鲜事。",
  ],
  身心: [
    "最需要照顾的是睡眠。早睡半小时，比任何开运物都管用。",
    "压力会找出口，肩颈和胃是你的晴雨表，累了就停。",
    "今年适合养一个不为了任何目的的爱好，它会接住你。",
  ],
};

const NOTES = {
  high: ["顺风期，想做的事可以推一把", "有好消息，记得接住", "精力充沛，适合开新局", "人缘旺，多出门走走"],
  mid: ["平稳过渡，按部就班就好", "适合整理与复盘", "小步快跑，别贪多", "留点时间给自己"],
  low: ["节奏放慢，先照顾好自己", "少做决定，多睡觉", "容易想太多，出门晒太阳", "守住边界，学会说不"],
};

const ADVICE = [
  "每个月留一个周末，什么计划都不做",
  "给自己设一个\"今年不再纠结\"的清单",
  "重要的决定，睡一觉再定",
  "少和让你消耗的人比较，多和让你放松的人吃饭",
  "把运动当成对自己的照顾，而不是任务",
  "存下一笔\"算了基金\"，专门用来原谅不完美的自己",
];

const LETGO = [
  "算了，今年不必一路高歌，走稳就很好。",
  "算了，好运不靠抢，靠你把日子过稳。",
  "算了，起起落落都是一年，你已经比去年更会照顾自己了。",
  "算了，没赶上的，明年还有。",
];

export function localAnnual(birth: string, year: number): AnnualReport {
  const rand = hashSeed(`${birth}|${year}`);
  const { gz, shengxiao } = yearGanzhi(year);
  const pickR = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];
  let v = 50 + Math.round((rand() - 0.5) * 20);
  const months: AnnualMonth[] = Array.from({ length: 12 }, (_, i) => {
    v = Math.max(28, Math.min(92, v + Math.round((rand() - 0.47) * 22)));
    const tier = v >= 68 ? NOTES.high : v >= 45 ? NOTES.mid : NOTES.low;
    return { m: i + 1, v, note: pickR(tier) };
  });
  const keys: AnnualDim["key"][] = ["事业", "财运", "感情", "身心"];
  const advice = [...ADVICE].sort(() => rand() - 0.5).slice(0, 3);
  return {
    year,
    ganzhi: gz,
    shengxiao,
    keyword: pickR(KEYWORDS),
    summary: `${gz}年对你来说，是一个\"先安顿、再出发\"的年份。不会每天都顺，但整体是往上走的。最重要的功课，是学会在忙乱里给自己留白。`,
    dims: keys.map((key) => ({ key, score: 55 + Math.round(rand() * 35), text: pickR(DIM_TEXT[key]) })),
    months,
    advice,
    letgo: pickR(LETGO),
  };
}

const clampN = (x: unknown, lo: number, hi: number, d: number) => {
  const n = Number(x);
  return Number.isFinite(n) ? Math.max(lo, Math.min(hi, Math.round(n))) : d;
};
const str = (x: unknown, max: number, d: string) => (typeof x === "string" && x.trim() ? x.trim().slice(0, max) : d);

/** 校验模型给出的年度盘结构，缺什么用本地结果补什么 */
export function sanitizeAnnual(x: unknown, base: AnnualReport): AnnualReport {
  if (!x || typeof x !== "object") return base;
  const o = x as Record<string, unknown>;
  const dimsIn = Array.isArray(o.dims) ? (o.dims as Record<string, unknown>[]) : [];
  const dims = base.dims.map((d) => {
    const hit = dimsIn.find((it) => it && typeof it === "object" && String(it.key ?? "").includes(d.key));
    return hit ? { key: d.key, score: clampN(hit.score, 30, 98, d.score), text: str(hit.text, 90, d.text) } : d;
  });
  const monthsIn = Array.isArray(o.months) ? (o.months as Record<string, unknown>[]) : [];
  const months = base.months.map((mm, i) => {
    const hit = monthsIn.find((it) => it && typeof it === "object" && Number(it.m) === mm.m) ?? monthsIn[i];
    return hit && typeof hit === "object" ? { m: mm.m, v: clampN(hit.v, 15, 98, mm.v), note: str(hit.note, 26, mm.note) } : mm;
  });
  const adviceIn = Array.isArray(o.advice) ? (o.advice as unknown[]).map((a) => str(a, 50, "")).filter(Boolean) : [];
  return {
    ...base,
    keyword: str(o.keyword, 6, base.keyword),
    summary: str(o.summary, 220, base.summary),
    dims,
    months,
    advice: adviceIn.length >= 2 ? adviceIn.slice(0, 4) : base.advice,
    letgo: str(o.letgo, 60, base.letgo),
  };
}

export function annualToText(r: AnnualReport): string {
  return [
    `这是我的${r.year}年（${r.ganzhi}）年度盘：关键词「${r.keyword}」。`,
    r.dims.map((d) => `${d.key}：${d.text}`).join("\n"),
    `低一点的月份：${[...r.months].sort((a, b) => a.v - b.v).slice(0, 2).map((m) => `${m.m}月`).join("、")}。`,
    "这几个月我该怎么过？",
  ].join("\n");
}
