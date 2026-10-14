/* ---------- 基础：天干地支 ---------- */
export const STEMS = "甲乙丙丁戊己庚辛壬癸".split("");
export const BRANCHES = "子丑寅卯辰巳午未申酉戌亥".split("");
export const ZODIAC = "鼠牛虎兔龙蛇马羊猴鸡狗猪".split("");
const STEM_EL = ["木", "木", "火", "火", "土", "土", "金", "金", "水", "水"];
const BRANCH_EL = ["水", "土", "木", "木", "土", "火", "火", "土", "金", "金", "土", "水"];

export function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function seeded(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function jdn(y: number, m: number, d: number) {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}

// 节气近似日（以“节”定月）：小寒 1/6 起丑月 …
const JIE = [6, 4, 6, 5, 6, 6, 7, 8, 8, 8, 7, 7];

export interface Pillar { stem: string; branch: string; }
export interface Bazi {
  year: Pillar; month: Pillar; day: Pillar; hour: Pillar | null;
  zodiac: string; elements: Record<string, number>; dayMaster: string; dayEl: string;
  sign: string; lack: string[]; strong: string;
}

export function westernSign(m: number, d: number) {
  const signs = [
    ["摩羯", 20], ["水瓶", 19], ["双鱼", 20], ["白羊", 20], ["金牛", 21], ["双子", 21],
    ["巨蟹", 22], ["狮子", 23], ["处女", 23], ["天秤", 23], ["天蝎", 22], ["射手", 22],
  ] as const;
  const [name, cut] = signs[m - 1];
  if (d < cut) return name + "座";
  return signs[m % 12][0] + "座";
}

export function computeBazi(date: string, time: string): Bazi | null {
  const mt = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!mt) return null;
  const y = +mt[1], m = +mt[2], d = +mt[3];
  if (y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  // 年柱以立春(约2/4)为界
  const beforeSpring = m < 2 || (m === 2 && d < 4);
  const ly = beforeSpring ? y - 1 : y;
  const yi = (((ly - 4) % 60) + 60) % 60;
  const year = { stem: STEMS[yi % 10], branch: BRANCHES[yi % 12] };
  // 月支
  let mb: number; // branch index
  const afterJie = d >= JIE[m - 1];
  // month m (1..12) after jie -> branch: Jan->丑(1), Feb->寅(2)...
  mb = afterJie ? m % 12 : (m - 1) % 12;
  if (mb < 0) mb += 12;
  const yearStemIdx = yi % 10;
  const yinStem = ((yearStemIdx % 5) * 2 + 2) % 10; // 五虎遁
  const offset = (mb - 2 + 12) % 12;
  const month = { stem: STEMS[(yinStem + offset) % 10], branch: BRANCHES[mb] };
  // 日柱
  const di = (jdn(y, m, d) + 49) % 60;
  const day = { stem: STEMS[di % 10], branch: BRANCHES[di % 12] };
  // 时柱
  let hour: Pillar | null = null;
  const tm = /^(\d{1,2}):(\d{2})$/.exec(time || "");
  if (tm) {
    const h = +tm[1];
    const hb = Math.floor((h + 1) / 2) % 12;
    const hs = (((di % 10) % 5) * 2 + hb) % 10;
    hour = { stem: STEMS[hs], branch: BRANCHES[hb] };
  }
  const elements: Record<string, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  [year, month, day, hour].forEach((p) => {
    if (!p) return;
    elements[STEM_EL[STEMS.indexOf(p.stem)]]++;
    elements[BRANCH_EL[BRANCHES.indexOf(p.branch)]]++;
  });
  const lack = Object.keys(elements).filter((k) => elements[k] === 0);
  const strong = Object.keys(elements).sort((a, b) => elements[b] - elements[a])[0];
  return {
    year, month, day, hour,
    zodiac: ZODIAC[yi % 12],
    elements,
    dayMaster: day.stem,
    dayEl: STEM_EL[STEMS.indexOf(day.stem)],
    sign: westernSign(m, d),
    lack, strong,
  };
}

export const DAY_MASTER_TEXT: Record<string, string> = {
  甲: "像一棵往上长的树，认准了方向就不太愿意弯腰。",
  乙: "像藤蔓和花草，柔软但韧，懂得绕开石头继续长。",
  丙: "像正午的太阳，热络、坦荡，就是偶尔晒得自己也有点累。",
  丁: "像一盏灯，不刺眼，但能把身边人的夜照亮一块。",
  戊: "像一座山，稳当、可靠，是朋友们心里的‘兜底的人’。",
  己: "像一片田，包容、细致，默默把好多事情种出了结果。",
  庚: "像一块铁，直来直去，讲义气，也容易硬碰硬。",
  辛: "像一枚首饰，精致敏感，对美和分寸都很讲究。",
  壬: "像江河，脑子转得快、点子多，就是不太喜欢被框住。",
  癸: "像雨露，安静、敏锐，能察觉到别人察觉不到的情绪。",
};

export const EL_ADVICE: Record<string, string> = {
  木: "多去有树的地方走走，绿色和清晨对你是加分项。",
  火: "多晒太阳、多跟喜欢的人见面，热闹一点也没关系。",
  土: "规律作息、好好吃饭，脚踏实地本身就是补。",
  金: "给生活一点秩序感，收拾屋子、断舍离会让你神清气爽。",
  水: "多喝水、多听雨、给自己留一点发呆的空白。",
};

/* ---------- 六爻 ---------- */
// 卦序 [上卦][下卦]，卦顺序：乾兑离震巽坎艮坤
const TRIGRAM_ORDER = ["乾", "兑", "离", "震", "巽", "坎", "艮", "坤"];
const TRIGRAM_BITS: Record<string, string> = { 乾: "111", 兑: "110", 离: "101", 震: "100", 巽: "011", 坎: "010", 艮: "001", 坤: "000" };
export const TRIGRAM_IMAGE: Record<string, string> = { 乾: "天", 兑: "泽", 离: "火", 震: "雷", 巽: "风", 坎: "水", 艮: "山", 坤: "地" };
const KW = [
  [1, 10, 13, 25, 44, 6, 33, 12],
  [43, 58, 49, 17, 28, 47, 31, 45],
  [14, 38, 30, 21, 50, 64, 56, 35],
  [34, 54, 55, 51, 32, 40, 62, 16],
  [9, 61, 37, 42, 57, 59, 53, 20],
  [5, 60, 63, 3, 48, 29, 39, 8],
  [26, 41, 22, 27, 18, 4, 52, 23],
  [11, 19, 36, 24, 46, 7, 15, 2],
];

export const HEXAGRAMS: [string, string][] = [
  ["乾", "天行健。劲头正足，但别一个人扛所有事。"],
  ["坤", "厚德载物。顺势、包容，慢一点反而走得稳。"],
  ["屯", "万事开头难。乱是正常的，先把根扎下去。"],
  ["蒙", "还在摸索期。不懂就问，不丢人。"],
  ["需", "等待的卦。饭要一口口吃，时机还在路上。"],
  ["讼", "有争执。能退一步就退一步，赢了道理输了心情不划算。"],
  ["师", "需要组织和纪律。找对帮手，比单打独斗强。"],
  ["比", "亲近与合作。身边的人，就是你的福气。"],
  ["小畜", "小有积蓄，还差一点火候。云已经聚了，雨会来的。"],
  ["履", "踩着老虎尾巴走路。谨慎有礼，就能化险为夷。"],
  ["泰", "天地交泰，顺风顺水。好日子要记得享受。"],
  ["否", "暂时不通。不是你不行，是时候没到，先养精蓄锐。"],
  ["同人", "志同道合。找到同频的人，事情就成了一半。"],
  ["大有", "收获满满。分享出去，福气会更大。"],
  ["谦", "谦虚的卦，六爻皆吉。低头的稻穗最饱满。"],
  ["豫", "愉悦安乐。可以开心，也别玩过头。"],
  ["随", "随缘随势。别太较劲，跟着节奏走。"],
  ["蛊", "积弊要清理。旧问题拖不得，动手收拾就好。"],
  ["临", "好运临门。主动一点，机会在敲门。"],
  ["观", "静观其变。先看清楚，再做决定。"],
  ["噬嗑", "有障碍要咬断。该硬气的时候别心软。"],
  ["贲", "修饰与美。好看很重要，但别只剩好看。"],
  ["剥", "层层剥落。该放的放掉，留下的才是真的。"],
  ["复", "一阳来复。低谷见底了，接下来是往上走。"],
  ["无妄", "不妄为。别耍小聪明，真诚就是最好的策略。"],
  ["大畜", "厚积薄发。现在多攒点，以后用得上。"],
  ["颐", "颐养。好好吃饭，好好说话，身体是本钱。"],
  ["大过", "担子有点重。别硬撑，适当卸一点。"],
  ["坎", "重重险阻。像水一样，绕着走也是走。"],
  ["离", "光明依附。找到你能依靠、也能照亮的东西。"],
  ["咸", "感应之卦。心动是真的，好好感受。"],
  ["恒", "持之以恒。长久的事，靠的是细水长流。"],
  ["遁", "退避。有时候走开不是认输，是保全。"],
  ["大壮", "势头强劲。有力气，但别用蛮力。"],
  ["晋", "晋升，旭日东升。努力会被看见。"],
  ["明夷", "光被遮住了。先低调保护好自己，天会亮的。"],
  ["家人", "家和万事兴。回家吃顿饭，比什么都强。"],
  ["睽", "意见相左。求同存异，不必人人都懂你。"],
  ["蹇", "行路难。停下来想想，换条路也行。"],
  ["解", "困境解除。松口气吧，难关过去了。"],
  ["损", "减损。舍掉一些，反而得到更多。"],
  ["益", "增益。帮别人也是帮自己，适合行动。"],
  ["夬", "决断。该做的决定，别再拖了。"],
  ["姤", "不期而遇。有新的人和事闯进来，留个心眼。"],
  ["萃", "聚集。人气旺，适合聚会和合作。"],
  ["升", "步步高升。一步一个台阶，稳着来。"],
  ["困", "困顿。资源有限时，先保住心气。"],
  ["井", "井水养人。把自己的本事打磨好，自然有人来。"],
  ["革", "变革。旧的不去新的不来，可以动一动了。"],
  ["鼎", "鼎新。新局面已经立起来，好好经营。"],
  ["震", "雷声阵阵。受了惊，但笑着走过去就好。"],
  ["艮", "止。知道什么时候停，是大智慧。"],
  ["渐", "循序渐进。像大雁一样，一站一站飞。"],
  ["归妹", "名分未定。别急着要结果，先看清楚。"],
  ["丰", "丰盛。正当时，好好享受这份热闹。"],
  ["旅", "在路上。漂着也没关系，带好自己就行。"],
  ["巽", "如风入隙。柔和地渗透，比硬推有效。"],
  ["兑", "喜悦。多笑一笑，好事会被你笑来。"],
  ["涣", "涣散。心散了就收一收，人散了就聚一聚。"],
  ["节", "节制。适度就好，别对自己太狠也别太纵。"],
  ["中孚", "诚信。真心换真心，不用演。"],
  ["小过", "小有过越。小事可以，大事先缓缓。"],
  ["既济", "已经完成。守成比开创更考验人。"],
  ["未济", "尚未完成。还差最后一步，别泄气。"],
];

export interface Hexagram { no: number; name: string; gist: string; upper: string; lower: string; }

export function hexFromLines(lines: number[]): Hexagram {
  // lines: bottom->top, 1 yang 0 yin
  const lowerBits = lines.slice(0, 3).join("");
  const upperBits = lines.slice(3, 6).join("");
  const lower = Object.keys(TRIGRAM_BITS).find((k) => TRIGRAM_BITS[k] === lowerBits)!;
  const upper = Object.keys(TRIGRAM_BITS).find((k) => TRIGRAM_BITS[k] === upperBits)!;
  const no = KW[TRIGRAM_ORDER.indexOf(upper)][TRIGRAM_ORDER.indexOf(lower)];
  const [name, gist] = HEXAGRAMS[no - 1];
  return { no, name, gist, upper, lower };
}

/** 三枚铜钱：正面(字)=3，反面(背)=2；6老阴 7少阳 8少阴 9老阳 */
export function tossCoins(): { coins: number[]; value: number } {
  const coins = [0, 1, 2].map(() => (Math.random() < 0.5 ? 3 : 2));
  return { coins, value: coins.reduce((a, b) => a + b, 0) };
}

export function describeLiuyao(values: number[], question: string) {
  const base = values.map((v) => (v === 7 || v === 9 ? 1 : 0));
  const changed = values.map((v) => (v === 6 ? 1 : v === 9 ? 0 : v === 7 ? 1 : 0));
  const main = hexFromLines(base);
  const moving = values.map((v, i) => (v === 6 || v === 9 ? i + 1 : 0)).filter(Boolean);
  const after = moving.length ? hexFromLines(changed) : null;
  const pos = ["初", "二", "三", "四", "五", "上"];
  const text =
    `【六爻】所问：${question || "心中所想"}\n本卦：第${main.no}卦「${main.name}」（${TRIGRAM_IMAGE[main.upper]}${TRIGRAM_IMAGE[main.lower]}·上${main.upper}下${main.lower}）——${main.gist}\n` +
    (moving.length ? `动爻：${moving.map((m) => pos[m - 1] + "爻").join("、")}\n变卦：第${after!.no}卦「${after!.name}」——${after!.gist}` : "六爻安静，无动爻。");
  return { main, after, moving, text };
}

/* ---------- 塔罗（大阿卡纳） ---------- */
export const TAROT: { n: string; en: string; up: string; rev: string; glyph: string }[] = [
  { n: "愚者", en: "The Fool", up: "新的开始，带着好奇心出发", rev: "冲动冒失，先看看脚下", glyph: "○" },
  { n: "魔术师", en: "The Magician", up: "资源都在手上，可以动手了", rev: "想得多做得少，或者有人在耍花样", glyph: "∞" },
  { n: "女祭司", en: "The High Priestess", up: "相信直觉，答案在安静里", rev: "忽视了内心的声音", glyph: "☾" },
  { n: "皇后", en: "The Empress", up: "丰盛、滋养，好好爱自己", rev: "过度付出，忘了照顾自己", glyph: "♀" },
  { n: "皇帝", en: "The Emperor", up: "建立秩序，拿出主见", rev: "控制欲太强，或者被控制", glyph: "♔" },
  { n: "教皇", en: "The Hierophant", up: "向有经验的人请教，守规矩有好处", rev: "不想被条条框框束缚", glyph: "⚿" },
  { n: "恋人", en: "The Lovers", up: "真心的连接，也是一次选择", rev: "关系失衡，或者犹豫不决", glyph: "♡" },
  { n: "战车", en: "The Chariot", up: "意志坚定，一路向前", rev: "方向乱了，力气使不到一处", glyph: "⛉" },
  { n: "力量", en: "Strength", up: "温柔的力量，以柔克刚", rev: "自我怀疑，对自己太凶", glyph: "∾" },
  { n: "隐士", en: "The Hermit", up: "独处、沉淀，向内找答案", rev: "把自己关得太久了", glyph: "✦" },
  { n: "命运之轮", en: "Wheel of Fortune", up: "转机来了，顺势而为", rev: "暂时的低谷，轮子还会转", glyph: "☸" },
  { n: "正义", en: "Justice", up: "公平、因果，诚实面对", rev: "失衡，或者不愿面对真相", glyph: "⚖" },
  { n: "倒吊人", en: "The Hanged Man", up: "换个角度看，暂停也是一种前进", rev: "无谓的牺牲，别再耗着了", glyph: "⟟" },
  { n: "死神", en: "Death", up: "结束与新生，旧篇章翻过去", rev: "抗拒改变，抓着不放", glyph: "✧" },
  { n: "节制", en: "Temperance", up: "平衡、调和，刚刚好", rev: "失衡过度，需要缓一缓", glyph: "⚱" },
  { n: "恶魔", en: "The Devil", up: "执念与诱惑，看清什么在绑着你", rev: "正在挣脱束缚", glyph: "⛓" },
  { n: "高塔", en: "The Tower", up: "突变，推倒重来未必是坏事", rev: "危机在缓和，或者在拖延", glyph: "⚡" },
  { n: "星星", en: "The Star", up: "希望与疗愈，一切会好起来", rev: "暂时失去信心，但星星一直都在", glyph: "★" },
  { n: "月亮", en: "The Moon", up: "迷雾与不安，别被想象吓到", rev: "迷雾散去，真相渐明", glyph: "☽" },
  { n: "太阳", en: "The Sun", up: "明朗、快乐、成功", rev: "快乐被推迟了一点点", glyph: "☀" },
  { n: "审判", en: "Judgement", up: "觉醒与召唤，给自己一次重来", rev: "对自己太苛刻", glyph: "♫" },
  { n: "世界", en: "The World", up: "圆满完成，一个阶段画上句号", rev: "差一点点就圆满", glyph: "◎" },
];

export function drawTarot(count = 3) {
  const pool = TAROT.map((_, i) => i);
  const res: { idx: number; reversed: boolean }[] = [];
  for (let i = 0; i < count; i++) {
    const k = Math.floor(Math.random() * pool.length);
    res.push({ idx: pool.splice(k, 1)[0], reversed: Math.random() < 0.3 });
  }
  return res;
}

export const TAROT_POS = ["过去 · 来处", "现在 · 此刻", "建议 · 去向"];

/* ---------- 算了签 ---------- */
export const QIAN: { level: string; poem: string; say: string }[] = [
  { level: "上上", poem: "春风不问来时路，一路花开到柴门。", say: "别回头算旧账了，往前走就是花。" },
  { level: "上上", poem: "云开月出照庭前，旧事随风散似烟。", say: "那件事，其实已经过去了。" },
  { level: "上吉", poem: "井深自有清泉在，不必临渊苦羡鱼。", say: "你要的东西，你自己身上就有。" },
  { level: "上吉", poem: "一叶扁舟顺水行，何须两岸听猿声。", say: "别人的评价，听听就好。" },
  { level: "上吉", poem: "种瓜得瓜春雨后，耕耘自有好收成。", say: "你的努力没白费，再等一场雨。" },
  { level: "中吉", poem: "山重水复疑无路，转过弯来又一村。", say: "卡住的地方，换个方向就通了。" },
  { level: "中吉", poem: "半盏清茶半卷书，半晴半雨半糊涂。", say: "人生难得糊涂，凡事半分就好。" },
  { level: "中吉", poem: "莫嫌灯火微如豆，照见归途便足矣。", say: "小小的确定，也足够你回家。" },
  { level: "中吉", poem: "檐下燕子衔泥忙，一口一口筑新房。", say: "慢慢来，一点点攒，房子会有的。" },
  { level: "中平", poem: "风来疏竹不留声，雁过寒潭不留影。", say: "事情过了，就让它过吧。" },
  { level: "中平", poem: "落子无悔休长叹，满盘输赢一局棋。", say: "选了就选了，别在脑子里重下一万遍。" },
  { level: "中平", poem: "明月几时有，把酒问青天。", say: "答案不急，先喝口热的。" },
  { level: "中平", poem: "行到水穷处，坐看云起时。", say: "走不动了就坐下，云会自己飘过来。" },
  { level: "中平", poem: "且将新火试新茶，诗酒趁年华。", say: "别等以后，今天就对自己好一点。" },
  { level: "小吉", poem: "墙角数枝梅，凌寒独自开。", say: "没人看见也没关系，你开你的。" },
  { level: "小吉", poem: "竹杖芒鞋轻胜马，谁怕？一蓑烟雨任平生。", say: "下雨就下雨吧，你又不是纸做的。" },
  { level: "小吉", poem: "千淘万漉虽辛苦，吹尽狂沙始到金。", say: "辛苦是真的，金子也是真的。" },
  { level: "平", poem: "也无风雨也无晴。", say: "今天就是普通的一天，普通就很好。" },
  { level: "平", poem: "人间有味是清欢。", say: "去吃点清淡的好东西，比算命管用。" },
  { level: "平", poem: "此心安处是吾乡。", say: "在哪不重要，心安就好。" },
  { level: "需缓", poem: "欲渡黄河冰塞川，将登太行雪满山。", say: "现在不是硬闯的时候，等冰化。" },
  { level: "需缓", poem: "长风破浪会有时，直挂云帆济沧海。", say: "会有那一天的，不是今天也没关系。" },
  { level: "需缓", poem: "沉舟侧畔千帆过，病树前头万木春。", say: "眼前的不顺，不代表全部。" },
  { level: "需缓", poem: "莫听穿林打叶声，何妨吟啸且徐行。", say: "噪音太多，戴上耳机慢慢走。" },
];

export function drawQian() {
  const i = Math.floor(Math.random() * QIAN.length);
  return { no: i + 1, ...QIAN[i] };
}

/* ---------- 今日小黄历 ---------- */
const YI = ["早点睡", "喝热水", "删掉一个群", "晒太阳", "吃顿好的", "给老朋友发消息", "整理桌面", "散步二十分钟", "已读不回", "说一次‘不’", "听一张老专辑", "买束花", "摸鱼十分钟", "夸夸自己", "准时下班", "做一件小事", "发呆", "关掉通知"];
const JI = ["深夜做决定", "和傻子争论", "翻前任朋友圈", "报复性熬夜", "自我否定", "比较", "空腹喝咖啡", "替别人焦虑", "揽下不属于你的活", "看评论区", "预支明天的烦恼", "把话憋在心里"];

export function todayAlmanac(date = new Date(), seedExtra = "") {
  const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${seedExtra}`;
  const r = seeded(hashStr(key));
  const pick = (arr: string[], n: number) => {
    const a = [...arr];
    const out: string[] = [];
    for (let i = 0; i < n; i++) out.push(a.splice(Math.floor(r() * a.length), 1)[0]);
    return out;
  };
  const di = (jdn(date.getFullYear(), date.getMonth() + 1, date.getDate()) + 49) % 60;
  const energy = 60 + Math.floor(r() * 40);
  return { yi: pick(YI, 3), ji: pick(JI, 2), ganzhi: STEMS[di % 10] + BRANCHES[di % 12] + "日", energy };
}
