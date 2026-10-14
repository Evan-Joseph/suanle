import { Solar } from "lunar-javascript";

/* ───────────────────────── 八卦 / 六十四卦 ───────────────────────── */

export type Trigram = "乾" | "兑" | "离" | "震" | "巽" | "坎" | "艮" | "坤";

// 自下而上，1 = 阳爻
export const TRIGRAM_LINES: Record<Trigram, [number, number, number]> = {
  乾: [1, 1, 1],
  兑: [1, 1, 0],
  离: [1, 0, 1],
  震: [1, 0, 0],
  巽: [0, 1, 1],
  坎: [0, 1, 0],
  艮: [0, 0, 1],
  坤: [0, 0, 0],
};

export const TRIGRAM_IMAGE: Record<Trigram, string> = {
  乾: "天",
  兑: "泽",
  离: "火",
  震: "雷",
  巽: "风",
  坎: "水",
  艮: "山",
  坤: "地",
};

export interface Hexagram {
  no: number;
  name: string; // 短名
  full: string; // 全名
  upper: Trigram;
  lower: Trigram;
  gist: string; // 生活化一句
  letgo: string; // 算了箴言
}

const RAW: [string, Trigram, Trigram, string, string][] = [
  ["乾", "乾", "乾", "势头正盛，适合主动出手，但别把弓拉满。", "冲是要冲的，累了也可以先算了。"],
  ["坤", "坤", "坤", "以柔承事，跟着节奏走反而走得远。", "不抢不争，算了，地自然会托住你。"],
  ["屯", "坎", "震", "万事开头难，乱是正常的，先扎根。", "刚开始都这样，算了，慢慢来。"],
  ["蒙", "艮", "坎", "看不清时多问多学，别急着下结论。", "不懂就不懂，算了，问一句不丢人。"],
  ["需", "坎", "乾", "时机未到，吃好睡好，等云变成雨。", "急也没用，算了，先去吃顿好的。"],
  ["讼", "乾", "坎", "争执容易两败俱伤，见好就收。", "赢了道理输了心情，算了吧。"],
  ["师", "坤", "坎", "需要组织与纪律，找对带头的人。", "一个人扛不动的，算了，喊人帮忙。"],
  ["比", "坎", "坤", "亲近同频的人，抱团取暖是正经事。", "合不来的人，算了，留给合得来的。"],
  ["小畜", "巽", "乾", "小有积蓄，云密未雨，再攒一攒。", "差一口气也是一口气，算了，明天再说。"],
  ["履", "乾", "兑", "如踩虎尾，谨慎有礼就能平安过关。", "小心是对的，怕也正常，算了，走就是了。"],
  ["泰", "坤", "乾", "上下通达，顺风顺水，记得常怀感恩。", "好日子就好好过，算了，别想太多。"],
  ["否", "乾", "坤", "沟通闭塞，此时宜守不宜攻，养精蓄锐。", "说不通就不说了，算了，天会变的。"],
  ["同人", "乾", "离", "志同道合者会出现，敞开一点。", "不是同路人，算了，前面还有人等你。"],
  ["大有", "离", "乾", "收获颇丰，分享出去福气更大。", "拥有的已经很多了，算了，知足即富。"],
  ["谦", "坤", "艮", "低调做人高调做事，谦虚是护身符。", "不争那口气，算了，山在地下也是山。"],
  ["豫", "震", "坤", "心情舒畅，适合筹划与娱乐，但别松懈。", "开心就多开心一会儿，算了，烦恼明天的事。"],
  ["随", "兑", "震", "顺势而为，跟随值得的人与事。", "拧不过的，算了，顺着走也是一种走。"],
  ["蛊", "艮", "巽", "积弊需整顿，旧账该清了。", "过去的烂摊子，收拾完就算了。"],
  ["临", "坤", "兑", "好运将至，以诚待人，抓住窗口期。", "机会来了接住，没接住也算了。"],
  ["观", "巽", "坤", "退一步看全局，先观察再行动。", "看清了，再决定要不要算了。"],
  ["噬嗑", "离", "震", "有阻碍要咬断，该果断就果断。", "咬不动的骨头，算了，换一块。"],
  ["贲", "艮", "离", "注重修饰与体面，但内在更重要。", "装点一下挺好，装不下去就算了。"],
  ["剥", "艮", "坤", "运势剥落，宜静守，别硬撑。", "该掉的叶子让它掉，算了，根还在。"],
  ["复", "坤", "震", "一阳来复，低谷已过，开始回暖。", "最难的已经过去了，算了，往前看。"],
  ["无妄", "乾", "震", "守正不妄为，别抱侥幸心理。", "天意难测，算了，做好自己的事。"],
  ["大畜", "艮", "乾", "厚积薄发，适合学习与储备。", "现在不出手也没关系，算了，先攒着。"],
  ["颐", "艮", "震", "注意饮食与言语，养身也养心。", "少说两句，多吃两口，其他的算了。"],
  ["大过", "兑", "巽", "压力过载，梁要弯了，该减负了。", "扛不住的就放下，算了，你不是承重墙。"],
  ["坎", "坎", "坎", "重重险阻，保持诚信与耐心就能过去。", "水再深也会流走，算了，人在就好。"],
  ["离", "离", "离", "光明依附，找到值得依靠的东西。", "亮一点就够照路了，算了，别要求太多。"],
  ["咸", "兑", "艮", "感应相通，心动是真的，可以靠近。", "有感觉就说，没回应就算了。"],
  ["恒", "震", "巽", "持之以恒，稳定比激情更难得。", "坚持不住的那天，算了，明天接着来。"],
  ["遁", "乾", "艮", "适时退隐，退一步不是输。", "惹不起躲得起，算了。"],
  ["大壮", "震", "乾", "力量强盛，但别用蛮力，守正为上。", "有劲儿也别乱使，算了，留点余地。"],
  ["晋", "离", "坤", "如日东升，晋升有望，大胆展现。", "被看见很好，没被看见也算了，太阳照常升。"],
  ["明夷", "坤", "离", "光明受伤，韬光养晦，保护好自己。", "不被理解，算了，心里的灯别灭就行。"],
  ["家人", "巽", "离", "回归家庭与小圈子，内部和睦最重要。", "家里的事，讲爱不讲理，算了。"],
  ["睽", "离", "兑", "意见相左，求同存异，小事可成。", "想法不同而已，算了，各自安好。"],
  ["蹇", "坎", "艮", "前路艰难，宜止步求援，别硬闯。", "路不通就绕，绕不了就算了。"],
  ["解", "震", "坎", "困境开始松动，该放的放，该原谅的原谅。", "结解开了，就算了吧。"],
  ["损", "艮", "兑", "有舍才有得，减法是一种智慧。", "失去的就让它失去，算了，轻装上阵。"],
  ["益", "巽", "震", "利于进取，帮助别人也在成全自己。", "多给一点没关系，算了，福会回来的。"],
  ["夬", "兑", "乾", "当断则断，果决处理但别结怨。", "该切就切，切完就算了。"],
  ["姤", "乾", "巽", "不期而遇，新的缘分或诱惑，保持清醒。", "来得突然的，走也会突然，算了。"],
  ["萃", "兑", "坤", "人气汇聚，适合聚会合作。", "人多热闹，人散也算了，自己也挺好。"],
  ["升", "坤", "巽", "步步高升，循序渐进最稳。", "一步一步来，慢了也算了，总在往上。"],
  ["困", "兑", "坎", "处境受困，少说多做，守住本心。", "被困住的时候，先算了，喘口气。"],
  ["井", "坎", "巽", "井水不竭，修己利人，回到根本。", "守着自己的井，别人的水，算了。"],
  ["革", "兑", "离", "变革时机成熟，可以换个活法。", "旧的不去新的不来，算了，换！"],
  ["鼎", "离", "巽", "去旧立新，稳定的格局正在形成。", "锅都架好了，过去的，算了。"],
  ["震", "震", "震", "惊雷过后，有惊无险，反而清醒。", "吓一跳而已，算了，笑一笑。"],
  ["艮", "艮", "艮", "知止而止，安静下来，不必再动。", "停下来也是答案，算了。"],
  ["渐", "巽", "艮", "循序渐进，好事多磨，感情尤其如此。", "慢慢来比较快，急的话，算了。"],
  ["归妹", "震", "兑", "名分未定，别越位，量力而为。", "不是你的位置，算了，有更好的。"],
  ["丰", "震", "离", "盛大丰足，趁好时多做事，也记得盛极必衰。", "满了就会溢，算了，七分刚好。"],
  ["旅", "离", "艮", "在路上，客居他乡，低调谨慎。", "漂着也是一种活法，算了，处处是驿站。"],
  ["巽", "巽", "巽", "如风渗透，以柔克刚，反复沟通。", "风吹不动的，算了，绕过去。"],
  ["兑", "兑", "兑", "喜悦交流，说说笑笑就把事办了。", "开心最重要，其他的算了。"],
  ["涣", "巽", "坎", "人心涣散，需要凝聚；也是化解郁结之时。", "散了就散了，算了，风会吹干的。"],
  ["节", "坎", "兑", "有节制才长久，给自己设个边界。", "超出边界的，算了，不归你管。"],
  ["中孚", "巽", "兑", "诚信感人，真心换真心。", "真心给出去了，回不回来，算了。"],
  ["小过", "震", "艮", "小事可为，大事不宜，姿态放低。", "大事先放一放，算了，做好眼前的小事。"],
  ["既济", "坎", "离", "已经办成，守成比开创难，防松懈。", "成了就好，别再较劲了，算了。"],
  ["未济", "离", "坎", "尚未完成，黎明前的黑暗，再坚持一下。", "没完成也没关系，算了，故事还没完。"],
];

export const HEXAGRAMS: Hexagram[] = RAW.map(([name, upper, lower, gist, letgo], i) => ({
  no: i + 1,
  name,
  upper,
  lower,
  full: upper === lower ? `${name}为${TRIGRAM_IMAGE[upper]}` : `${TRIGRAM_IMAGE[upper]}${TRIGRAM_IMAGE[lower]}${name}`,
  gist,
  letgo,
}));

function trigramOf(lines: number[]): Trigram {
  const key = lines.join("");
  return (Object.keys(TRIGRAM_LINES) as Trigram[]).find((t) => TRIGRAM_LINES[t].join("") === key) ?? "坤";
}

export function hexagramFromLines(lines: number[]): Hexagram {
  const lower = trigramOf(lines.slice(0, 3));
  const upper = trigramOf(lines.slice(3, 6));
  return HEXAGRAMS.find((h) => h.lower === lower && h.upper === upper) ?? HEXAGRAMS[1];
}

export function hexLines(h: Hexagram): number[] {
  return [...TRIGRAM_LINES[h.lower], ...TRIGRAM_LINES[h.upper]];
}

/** 一次掷三枚铜钱：字=2，背=3；6 老阴 7 少阳 8 少阴 9 老阳 */
export function tossThree(): { coins: number[]; sum: number } {
  const coins = [0, 1, 2].map(() => (Math.random() < 0.5 ? 2 : 3));
  return { coins, sum: coins.reduce((a, b) => a + b, 0) };
}

export interface CastResult {
  sums: number[]; // 自下而上
  primary: Hexagram;
  changed: Hexagram | null;
  moving: number[]; // 1-6
  question?: string;
}

export function resolveCast(sums: number[], question?: string): CastResult {
  const lines = sums.map((s) => (s === 7 || s === 9 ? 1 : 0));
  const moving = sums.map((s, i) => (s === 6 || s === 9 ? i + 1 : 0)).filter(Boolean);
  const changedLines = sums.map((s) => (s === 9 ? 0 : s === 6 ? 1 : s === 7 ? 1 : 0));
  const primary = hexagramFromLines(lines);
  const changed = moving.length ? hexagramFromLines(changedLines) : null;
  return { sums, primary, changed, moving, question };
}

const YAO_NAMES = ["初", "二", "三", "四", "五", "上"];
export function castToText(r: CastResult): string {
  const mv = r.moving.length ? `动爻：${r.moving.map((m) => YAO_NAMES[m - 1] + "爻").join("、")}` : "六爻安静，无动爻";
  return [
    r.question ? `我想问：${r.question}` : "我心里默念了一件事，",
    `摇出来是 **${r.primary.full}**${r.changed ? ` → 变 **${r.changed.full}**` : ""}（${mv}）。`,
    "帮我解解这一卦？",
  ].join("\n");
}

/* ───────────────────────── 塔罗 · 大阿卡纳 ───────────────────────── */

export interface TarotCard {
  id: number;
  name: string;
  en: string;
  glyph: string;
  up: string;
  rev: string;
}

export const TAROT: TarotCard[] = [
  { id: 0, name: "愚者", en: "The Fool", glyph: "🎒", up: "新的开始，带着好奇出发", rev: "冲动莽撞，先看清脚下" },
  { id: 1, name: "魔术师", en: "The Magician", glyph: "✦", up: "资源齐备，动手就能成", rev: "能力空转，别光说不做" },
  { id: 2, name: "女祭司", en: "The High Priestess", glyph: "☾", up: "相信直觉，答案在心里", rev: "想太多，被情绪蒙住眼" },
  { id: 3, name: "皇后", en: "The Empress", glyph: "❀", up: "丰盛滋养，好好爱自己", rev: "过度付出，忘了自己" },
  { id: 4, name: "皇帝", en: "The Emperor", glyph: "♜", up: "建立秩序，掌握主导", rev: "控制欲强，太过僵硬" },
  { id: 5, name: "教皇", en: "The Hierophant", glyph: "⚿", up: "遵循传统，向前辈请教", rev: "打破陈规，走自己的路" },
  { id: 6, name: "恋人", en: "The Lovers", glyph: "♡", up: "真心的选择与连接", rev: "关系失衡，价值观分歧" },
  { id: 7, name: "战车", en: "The Chariot", glyph: "➶", up: "意志坚定，一路向前", rev: "方向混乱，力不从心" },
  { id: 8, name: "力量", en: "Strength", glyph: "∞", up: "温柔的坚韧，以柔克刚", rev: "自我怀疑，内耗疲惫" },
  { id: 9, name: "隐士", en: "The Hermit", glyph: "🕯", up: "独处沉淀，向内寻找", rev: "过度封闭，该出门走走" },
  { id: 10, name: "命运之轮", en: "Wheel of Fortune", glyph: "☸", up: "转机到来，顺势而为", rev: "暂时低谷，轮子还会转" },
  { id: 11, name: "正义", en: "Justice", glyph: "⚖", up: "公平因果，理性决断", rev: "失衡不公，别苛责自己" },
  { id: 12, name: "倒吊人", en: "The Hanged Man", glyph: "⟟", up: "换个角度，暂停也是前进", rev: "无谓牺牲，及时止损" },
  { id: 13, name: "死神", en: "Death", glyph: "❋", up: "结束与新生，旧篇章翻页", rev: "抗拒改变，困在原地" },
  { id: 14, name: "节制", en: "Temperance", glyph: "⚱", up: "平衡调和，刚刚好就好", rev: "失去节奏，过犹不及" },
  { id: 15, name: "恶魔", en: "The Devil", glyph: "⛓", up: "欲望与执念的束缚", rev: "挣脱枷锁，看清诱惑" },
  { id: 16, name: "高塔", en: "The Tower", glyph: "⚡", up: "突变打破幻象，破而后立", rev: "危机缓和，躲过一劫" },
  { id: 17, name: "星星", en: "The Star", glyph: "✧", up: "希望与疗愈，慢慢好起来", rev: "暂时失望，光还在" },
  { id: 18, name: "月亮", en: "The Moon", glyph: "☽", up: "迷雾与不安，别信焦虑", rev: "真相浮现，雾要散了" },
  { id: 19, name: "太阳", en: "The Sun", glyph: "☀", up: "明朗喜悦，一切向好", rev: "小小阴云，晒晒就干" },
  { id: 20, name: "审判", en: "Judgement", glyph: "♫", up: "觉醒召唤，重新出发", rev: "自我批判，放过自己" },
  { id: 21, name: "世界", en: "The World", glyph: "◯", up: "圆满完成，一个周期落幕", rev: "差最后一步，别泄气" },
];

export const TAROT_POSITIONS = ["此刻的你", "卡住你的", "可以试试"];

export interface TarotDraw {
  cards: { id: number; reversed: boolean }[];
  question?: string;
}

export function shuffledDeck(): number[] {
  const arr = TAROT.map((c) => c.id);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function tarotToText(d: TarotDraw): string {
  const lines = d.cards.map((c, i) => {
    const card = TAROT[c.id];
    return `${TAROT_POSITIONS[i]}：**${card.name}**${c.reversed ? "（逆位）" : "（正位）"}`;
  });
  return [d.question ? `我想问：${d.question}` : "我抽了三张塔罗，", ...lines, "你帮我看看？"].join("\n");
}

/* ───────────────────────── 八字 / 星座 ───────────────────────── */

export interface BaziResult {
  pillars: { label: string; gz: string; wx: string }[];
  dayMaster: string;
  dayMasterWx: string;
  wuxing: Record<string, number>;
  shengxiao: string;
  lunarText: string;
  zodiac: string;
  nayin: string;
  hourKnown: boolean;
}

const GAN_WX: Record<string, string> = { 甲: "木", 乙: "木", 丙: "火", 丁: "火", 戊: "土", 己: "土", 庚: "金", 辛: "金", 壬: "水", 癸: "水" };

export function zodiacOf(m: number, d: number): string {
  const signs = ["摩羯座", "水瓶座", "双鱼座", "白羊座", "金牛座", "双子座", "巨蟹座", "狮子座", "处女座", "天秤座", "天蝎座", "射手座", "摩羯座"];
  const edges = [20, 19, 21, 20, 21, 22, 23, 23, 23, 24, 23, 22];
  return d < edges[m - 1] ? signs[m - 1] : signs[m];
}

/** birth: "YYYY-MM-DD" 或 "YYYY-MM-DD HH:mm" */
export function parseBirth(birth?: string | null): { y: number; m: number; d: number; h: number; mi: number; hourKnown: boolean } | null {
  if (!birth) return null;
  const mt = birth.match(/(\d{4})\D(\d{1,2})\D(\d{1,2})(?:\D+(\d{1,2})(?::(\d{1,2}))?)?/);
  if (!mt) return null;
  const y = +mt[1], m = +mt[2], d = +mt[3];
  if (y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const hourKnown = mt[4] !== undefined;
  return { y, m, d, h: hourKnown ? Math.min(23, +mt[4]) : 12, mi: mt[5] ? Math.min(59, +mt[5]) : 0, hourKnown };
}

export function computeBazi(birth?: string | null): BaziResult | null {
  const p = parseBirth(birth);
  if (!p) return null;
  try {
    const lunar = Solar.fromYmdHms(p.y, p.m, p.d, p.h, p.mi, 0).getLunar();
    const e = lunar.getEightChar();
    const pillars = [
      { label: "年柱", gz: e.getYear(), wx: e.getYearWuXing() },
      { label: "月柱", gz: e.getMonth(), wx: e.getMonthWuXing() },
      { label: "日柱", gz: e.getDay(), wx: e.getDayWuXing() },
      { label: "时柱", gz: p.hourKnown ? e.getTime() : "未知", wx: p.hourKnown ? e.getTimeWuXing() : "" },
    ];
    const wuxing: Record<string, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
    pillars.forEach((pl) => {
      for (const ch of String(pl.wx)) if (ch in wuxing) wuxing[ch] += 1;
    });
    const dayMaster: string = e.getDayGan();
    return {
      pillars,
      dayMaster,
      dayMasterWx: GAN_WX[dayMaster] ?? "",
      wuxing,
      shengxiao: lunar.getYearShengXiao(),
      lunarText: `农历${lunar.getYearInGanZhi()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
      zodiac: zodiacOf(p.m, p.d),
      nayin: e.getYearNaYin(),
      hourKnown: p.hourKnown,
    };
  } catch {
    return null;
  }
}

export function baziToText(b: BaziResult, birth: string): string {
  return [
    `这是我的生辰：${birth}`,
    `四柱：${b.pillars.map((p) => p.gz).join(" · ")}，日主 ${b.dayMaster}${b.dayMasterWx}`,
    `五行：${Object.entries(b.wuxing).map(([k, v]) => `${k}${v}`).join(" ")}`,
    "帮我看看我是个什么样的人，最近该注意点什么？",
  ].join("\n");
}

/* ───────────────────────── 人生量化 K 线 ───────────────────────── */

export interface Candle {
  age: number;
  year: number;
  open: number;
  high: number;
  low: number;
  close: number;
  pillar: string;
  tag?: string;
}

export interface KLineResult {
  candles: Candle[];
  currentAge: number;
  peak: Candle;
  trough: Candle;
}

function hashSeed(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export function computeKLine(b: BaziResult, birthStr: string, maxAge = 88): KLineResult {
  const p = parseBirth(birthStr) ?? { y: 1996, m: 6, d: 18, h: 12, mi: 0, hourKnown: false };
  const rand = hashSeed(`${birthStr}:${b.dayMaster}`);
  const thisYear = new Date().getFullYear();
  const currentAge = Math.max(1, Math.min(maxAge, thisYear - p.y + 1));

  const stems = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  const branches = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

  const TAGS: Record<number, string> = {
    18: "步入成人",
    22: "初入世事",
    25: "能量积聚",
    30: "三十而立",
    35: "事业转折",
    40: "不惑自持",
    48: "知天命前",
    50: "知天命",
    60: "耳顺花甲",
  };

  const candles: Candle[] = [];
  let prevClose = 50 + Math.round((rand() - 0.5) * 12);

  for (let age = 1; age <= maxAge; age++) {
    const yr = p.y + age - 1;
    const sIdx = (yr - 4) % 10;
    const bIdx = (yr - 4) % 12;
    const gz = stems[((sIdx % 10) + 10) % 10] + branches[((bIdx % 12) + 12) % 12];

    const open = Math.max(15, Math.min(90, prevClose + Math.round((rand() - 0.5) * 6)));
    const delta = Math.round((rand() - 0.48) * 16);
    const close = Math.max(12, Math.min(95, open + delta));
    const high = Math.min(98, Math.max(open, close) + Math.round(rand() * 8));
    const low = Math.max(10, Math.min(open, close) - Math.round(rand() * 8));

    let tag = TAGS[age];
    if (!tag) {
      if (close - open > 12) tag = "主升浪";
      else if (open - close > 12) tag = "休整期";
    }

    candles.push({ age, year: yr, open, high, low, close, pillar: gz, tag });
    prevClose = close;
  }

  let peak = candles[0];
  let trough = candles[0];
  for (const c of candles) {
    if (c.high > peak.high) peak = c;
    if (c.low < trough.low) trough = c;
  }

  return { candles, currentAge, peak, trough };
}

/* ───────────────────────── 今日黄历 ───────────────────────── */

const LUCKY_COLOR: Record<string, { name: string; hex: string }> = {
  木: { name: "竹青", hex: "#7d9a6f" },
  火: { name: "朱砂", hex: "#c4553a" },
  土: { name: "杏黄", hex: "#d4a35a" },
  金: { name: "月白", hex: "#d6dde3" },
  水: { name: "黛蓝", hex: "#3f5a73" },
};

const DAILY_LINES = [
  "今天不用赢，今天只要过得去。",
  "把手机放下五分钟，世界不会塌。",
  "该回的消息回了，不想回的，算了。",
  "允许自己今天只完成一件事。",
  "吃顿热乎的，比想通任何道理都管用。",
  "别人怎么看，是别人的功课。",
  "今天的烦恼，留一半给明天。",
  "累了就是累了，不用找理由。",
  "做不完的事，本来就做不完。",
  "风往哪边吹，你先站稳。",
  "有些门不必推，绕过去也是路。",
  "给自己的耐心，也要像给朋友那样多。",
  "晒晒太阳，是今天最大的正经事。",
  "不想社交的日子，就当给灵魂充电。",
];

export interface Almanac {
  dateText: string;
  weekday: string;
  lunarText: string;
  ganzhi: string;
  yi: string[];
  ji: string[];
  jieqi: string;
  color: { name: string; hex: string };
  line: string;
  dayWx: string;
}

export function todayAlmanac(date = new Date()): Almanac {
  const solar = Solar.fromDate(date);
  const lunar = solar.getLunar();
  const dayGan: string = lunar.getDayGan();
  const dayWx = GAN_WX[dayGan] ?? "土";
  const seed = date.getFullYear() * 400 + (date.getMonth() + 1) * 31 + date.getDate();
  let jieqi = "";
  try {
    const prev = lunar.getPrevJieQi(true);
    jieqi = prev ? prev.getName() : "";
  } catch {
    jieqi = "";
  }
  return {
    dateText: `${date.getMonth() + 1}月${date.getDate()}日`,
    weekday: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][date.getDay()],
    lunarText: `${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
    ganzhi: `${lunar.getYearInGanZhi()}年 ${lunar.getMonthInGanZhi()}月 ${lunar.getDayInGanZhi()}日`,
    yi: (lunar.getDayYi() as string[]).slice(0, 4),
    ji: (lunar.getDayJi() as string[]).slice(0, 4),
    jieqi,
    color: LUCKY_COLOR[dayWx],
    line: DAILY_LINES[seed % DAILY_LINES.length],
    dayWx,
  };
}
