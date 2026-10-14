/* 子平八字排盘引擎（节气近似，真太阳时可扩展） */

export const GAN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
export const ZHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
export const ZHI_ANIMALS = ["鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊", "猴", "鸡", "狗", "猪"];

export type WuXing = "木" | "火" | "土" | "金" | "水";

const GAN_WUXING: WuXing[] = ["木", "木", "火", "火", "土", "土", "金", "金", "水", "水"];
const ZHI_WUXING: WuXing[] = ["水", "土", "木", "木", "土", "火", "火", "土", "金", "金", "土", "水"];

export const WX_COLOR: Record<WuXing, string> = {
  木: "#4a7a5c",
  火: "#b5402a",
  土: "#9c7a3c",
  金: "#b89844",
  水: "#3f6d8e",
};

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

function gregorianJDN(y: number, m: number, d: number): number {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}

export interface Pillar {
  gan: string;
  zhi: string;
  ganWx: WuXing;
  zhiWx: WuXing;
  god: string; // 天干十神（以日干为太极）
}

export interface BaZiChart {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar | null;
  dayMaster: { gan: string; wx: WuXing; yinyang: "阳" | "阴" };
  zodiac: string;
  wxCount: Record<WuXing, number>;
  wxPercent: Record<WuXing, number>;
  dominant: WuXing;
  lacking: WuXing[];
  shichen: string | null;
  blurb: string;
}

/* 十神映射 */
function tenGod(dayGan: number, otherGan: number): string {
  const dWx = Math.floor(dayGan / 2); // 0木1火2土3金4水
  const oWx = Math.floor(otherGan / 2);
  const samePolarity = dayGan % 2 === otherGan % 2;
  const rel = mod(oWx - dWx, 5);
  switch (rel) {
    case 0: return samePolarity ? "比肩" : "劫财";
    case 1: return samePolarity ? "食神" : "伤官";
    case 2: return samePolarity ? "偏财" : "正财";
    case 3: return samePolarity ? "七杀" : "正官";
    default: return samePolarity ? "偏印" : "正印";
  }
}

const DAY_MASTER_BLURBS: Record<string, string> = {
  甲: "参天甲木，笔直向上。有担当、不拐弯，认定的事九头牛拉不回；偶尔固执得像一棵树。",
  乙: "藤蔓乙木，柔中带韧。看似随风，实则处处能生根；懂得借力，最擅长以柔克刚。",
  丙: "太阳丙火，坦坦荡荡。热情外放、照人不藏私，情绪来得快去得也快，像六月的日头。",
  丁: "灯烛丁火，温而有光。细腻持久，黑暗中尤其可靠；只是偶尔多虑，火苗容易被风吹晃。",
  戊: "城墙戊土，厚重可靠。答应的事就是刻进石头里；只是转身慢，容易把心事也一块囤着。",
  己: "田园己土，滋养万物。包容、细腻、会照顾人，是一块好田；别忘了田也需要休耕。",
  庚: "刀剑庚金，利落干脆。嫉恶如仇、执行力拉满；锋芒太盛时，记得给刀配个鞘。",
  辛: "珠玉辛金，精致敏锐。审美与直觉双高，容不得粗糙；只是太在意瑕疵，容易划伤自己。",
  壬: "江河壬水，奔涌辽阔。脑子快、格局大、闲不住；河道若没修好，容易冲了自己和别人。",
  癸: "雨露癸水，润泽无声。敏感通透、润物细无声，最擅长察觉人心；阴天时请记得晒晒自己。",
};

export interface BaZiInput {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hour: number | null; // 0-23 or null 未知
  gender?: "male" | "female" | null;
}

export function computeBaZi(input: BaZiInput): BaZiChart {
  const { year, month, day, hour } = input;

  // —— 年柱（立春为界）——
  const beforeLichun = month < 2 || (month === 2 && day < 4);
  const yYear = beforeLichun ? year - 1 : year;
  const yearIdx = mod(yYear - 4, 60);
  const yearGan = yearIdx % 10;
  const yearZhi = yearIdx % 12;

  // —— 月柱（节气近似，按年内时序取最近已过的节气）——
  const CHRONO_TERMS: Array<[number, number, number]> = [
    [1, 6, 11], // 小寒 → 丑
    [2, 4, 0], // 立春 → 寅
    [3, 6, 1], // 惊蛰 → 卯
    [4, 5, 2], // 清明 → 辰
    [5, 6, 3], // 立夏 → 巳
    [6, 6, 4], // 芒种 → 午
    [7, 7, 5], // 小暑 → 未
    [8, 8, 6], // 立秋 → 申
    [9, 8, 7], // 白露 → 酉
    [10, 8, 8], // 寒露 → 戌
    [11, 7, 9], // 立冬 → 亥
    [12, 7, 10], // 大雪 → 子
  ];
  let mOffset = 10; // 1月6日前仍属上年子月
  for (const [tm, td, off] of CHRONO_TERMS) {
    if (month > tm || (month === tm && day >= td)) mOffset = off;
  }
  const monthZhi = mod(2 + mOffset, 12); // 寅=2
  const yearStemGroup = yearGan % 5; // 0甲/己 1乙/庚 2丙/辛 3丁/壬 4戊/癸
  const yinStemStart = [2, 4, 6, 8, 0][yearStemGroup]; // 甲己丙寅起…
  const monthGan = mod(yinStemStart + mOffset, 10);

  // —— 日柱（儒略日精确）——
  const jdn = gregorianJDN(year, month, day);
  const dayIdx = mod(jdn + 49, 60);
  const dayGan = dayIdx % 10;
  const dayZhi = dayIdx % 12;

  // —— 时柱 ——
  let hourPillar: Pillar | null = null;
  let shichen: string | null = null;
  if (hour !== null && hour !== undefined) {
    const hZhi = Math.floor(((hour + 1) % 24) / 2);
    const dayStemGroup = dayGan % 5;
    const ziStemStart = [0, 2, 4, 6, 8][dayStemGroup]; // 甲己还加甲…
    const hGan = mod(ziStemStart + hZhi, 10);
    shichen = `${ZHI[hZhi]}时`;
    hourPillar = {
      gan: GAN[hGan],
      zhi: ZHI[hZhi],
      ganWx: GAN_WUXING[hGan],
      zhiWx: ZHI_WUXING[hZhi],
      god: tenGod(dayGan, hGan),
    };
  }

  const mk = (g: number, z: number, godSelf = false): Pillar => ({
    gan: GAN[g],
    zhi: ZHI[z],
    ganWx: GAN_WUXING[g],
    zhiWx: ZHI_WUXING[z],
    god: godSelf ? "日主" : tenGod(dayGan, g),
  });

  const yearP = mk(yearGan, yearZhi);
  const monthP = mk(monthGan, monthZhi);
  const dayP = mk(dayGan, dayZhi, true);

  // —— 五行统计 ——
  const wxCount: Record<WuXing, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  const pillars = [yearP, monthP, dayP, ...(hourPillar ? [hourPillar] : [])];
  for (const p of pillars) {
    wxCount[p.ganWx] += 1;
    wxCount[p.zhiWx] += 1;
  }
  const total = pillars.length * 2;
  const wxPercent = Object.fromEntries(
    (Object.keys(wxCount) as WuXing[]).map((k) => [k, Math.round((wxCount[k] / total) * 100)])
  ) as Record<WuXing, number>;
  const dominant = (Object.keys(wxCount) as WuXing[]).reduce((a, b) => (wxCount[a] >= wxCount[b] ? a : b));
  const lacking = (Object.keys(wxCount) as WuXing[]).filter((k) => wxCount[k] === 0);

  const dayWx = GAN_WUXING[dayGan];

  return {
    year: yearP,
    month: monthP,
    day: dayP,
    hour: hourPillar,
    dayMaster: { gan: GAN[dayGan], wx: dayWx, yinyang: dayGan % 2 === 0 ? "阳" : "阴" },
    zodiac: ZHI_ANIMALS[yearZhi],
    wxCount,
    wxPercent,
    dominant,
    lacking,
    shichen,
    blurb: DAY_MASTER_BLURBS[GAN[dayGan]],
  };
}

export function baziContext(chart: BaZiChart, inputLabel: string): string {
  const p = (pl: Pillar) => `${pl.gan}${pl.zhi}`;
  return `求问者生辰：${inputLabel}
四柱：年柱 ${p(chart.year)}（${chart.year.god}）｜月柱 ${p(chart.month)}（${chart.month.god}）｜日柱 ${p(chart.day)}（日主）｜时柱 ${chart.hour ? `${p(chart.hour)}（${chart.hour.god}）` : "未知"}
日主：${chart.dayMaster.gan}${chart.dayMaster.wx}（${chart.dayMaster.yinyang}），生肖属${chart.zodiac}
五行分布：木${chart.wxPercent.木}% 火${chart.wxPercent.火}% 土${chart.wxPercent.土}% 金${chart.wxPercent.金}% 水${chart.wxPercent.水}%（${chart.lacking.length ? `缺${chart.lacking.join("、")}` : "五行俱全"}）
（节气近似排盘，精确推演请以万年历校时为准）`;
}
