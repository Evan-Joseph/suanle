/* 周易六爻：铜钱摇卦引擎 + 64 卦全表 */

export interface CoinThrow {
  coins: [boolean, boolean, boolean]; // true=背(字面朝上为字) true 记背
  sum: number; // 6 老阴 / 7 少阳 / 8 少阴 / 9 老阳
  name: string; // 老阴 少阳 少阴 老阳
}

export interface YaoLine {
  yang: boolean;
  changing: boolean;
  label: string; // 初九 六二 九三 ……（成卦后填）
}

/* 三枚铜钱：背=3 字=2 → 6老阴(动) 7少阳 8少阴 9老阳(动) */
export function throwCoins(): CoinThrow {
  const coins: [boolean, boolean, boolean] = [
    Math.random() < 0.5,
    Math.random() < 0.5,
    Math.random() < 0.5,
  ];
  const sum = coins.reduce((acc, isBack) => acc + (isBack ? 3 : 2), 0);
  const name = sum === 6 ? "老阴" : sum === 7 ? "少阳" : sum === 8 ? "少阴" : "老阳";
  return { coins, sum, name };
}

export const THROW_META: Record<number, { yang: boolean; changing: boolean }> = {
  6: { yang: false, changing: true },
  7: { yang: true, changing: false },
  8: { yang: false, changing: false },
  9: { yang: true, changing: true },
};

/* 三爻键（自下而上，1=阳 0=阴）→ 卦名 */
export const TRIGRAMS: Record<string, { name: string; nature: string; symbol: string }> = {
  "111": { name: "乾", nature: "天", symbol: "☰" },
  "110": { name: "兑", nature: "泽", symbol: "☱" },
  "101": { name: "离", nature: "火", symbol: "☲" },
  "100": { name: "震", nature: "雷", symbol: "☳" },
  "011": { name: "巽", nature: "风", symbol: "☴" },
  "010": { name: "坎", nature: "水", symbol: "☵" },
  "001": { name: "艮", nature: "山", symbol: "☶" },
  "000": { name: "坤", nature: "地", symbol: "☷" },
};

/* 64 卦名表：HEX[上卦键][下卦键] */
const HEX: Record<string, Record<string, [string, string]>> = {
  "111": {
    "111": ["乾为天", "六龙御天，刚健中正。行当行处，莫问前程。"],
    "110": ["天泽履", "如履虎尾，谨慎前行。守礼自持，化险为夷。"],
    "101": ["天火同人", "志同道合，光明磊落。结伴而行，其利断金。"],
    "100": ["天雷无妄", "不妄为则无忧。顺其自然，反得正果。"],
    "011": ["天风姤", "不期而遇的缘起，珍重但莫沉溺。"],
    "010": ["天水讼", "争则两伤，和为贵。退一步自有公断。"],
    "001": ["天山遁", "急流勇退，保存实力。退场也是高明的落子。"],
    "000": ["天地否", "上下不通，闭塞之期。隐忍守拙，静待转机。"],
  },
  "110": {
    "111": ["泽天夬", "当断则断，果决除弊。快刀斩乱麻。"],
    "110": ["兑为泽", "两泽相悦，欢欣交流。以和为贵，喜事将近。"],
    "101": ["泽火革", "变革之时已至。顺天应人，去故取新。"],
    "100": ["泽雷随", "随缘而动，顺势而随。跟对人与时，事事从容。"],
    "011": ["泽风大过", "负重过载，非常之时宜用非常之举。"],
    "010": ["泽水困", "泽水干涸，身处困境。守住心气，困极则通。"],
    "001": ["泽山咸", "山泽通气，两心相感。情愫与缘分正悄悄发生。"],
    "000": ["泽地萃", "群贤汇聚，人气聚拢。借众人之力成一己之事。"],
  },
  "101": {
    "111": ["火天大有", "如日中天，大有所获。谦以处盈，方保长久。"],
    "110": ["火泽睽", "志不同道不合，求同存异为上。"],
    "101": ["离为火", "光明相继，依附正道。心明眼亮，前路自远。"],
    "100": ["火雷噬嗑", "如咬合坚物，须排除梗阻方能和合。"],
    "011": ["火风鼎", "鼎新之象，稳重图成。三分火候已到。"],
    "010": ["火水未济", "事将成而未成。慎终如始，则无败事。"],
    "001": ["火山旅", "羁旅在外，谦柔自守。客居者以安稳为上。"],
    "000": ["火地晋", "旭日东升，步步晋升。附丽于明主与时势。"],
  },
  "100": {
    "111": ["雷天大壮", "声势正壮，切忌恃强。守正方能久大。"],
    "110": ["雷泽归妹", "情之所动，或有不适之位。慎始方可善终。"],
    "101": ["雷火丰", "丰盛至极，正当盛时。防骄防满，未雨绸缪。"],
    "100": ["震为雷", "惊雷震动，临危不乱。震撼之后更见定力。"],
    "011": ["雷风恒", "恒久之道，贵在有常。守常而不僵化。"],
    "010": ["雷水解", "冰释之象，险难化解。宜速不宜迟。"],
    "001": ["雷山小过", "小有逾越，可小不可大。谨小慎微则无咎。"],
    "000": ["雷地豫", "春雷动而万物悦。顺势而为，得意勿忘形。"],
  },
  "011": {
    "111": ["风天小畜", "密云不雨，蓄势待发。小有所蓄，静待时机。"],
    "110": ["风泽中孚", "信及豚鱼，以诚感人。内心诚信，无往不利。"],
    "101": ["风火家人", "家和万事兴。各安其位，各司其职。"],
    "100": ["风雷益", "风雷相助，损上益下。利有攸往，大胆前行。"],
    "011": ["巽为风", "随风潜入，谦逊渗透。柔而不弱，无孔不入。"],
    "010": ["风水涣", "涣散之象，先散后聚。收拾人心，化解离散。"],
    "001": ["风山渐", "循序渐进，如雁南飞。欲速不达，稳中求进。"],
    "000": ["风地观", "观人观己，仰观俯察。看清局势再出手。"],
  },
  "010": {
    "111": ["水天需", "云上于天，需待时雨。耐心等待，切勿躁进。"],
    "110": ["水泽节", "节制有度，苦节不可持久。宽严相济。"],
    "101": ["水火既济", "水火相济，功德圆满。守成不易，防患未然。"],
    "100": ["水雷屯", "万事开头难。草创维艰，广结善缘。"],
    "011": ["水风井", "井养而不穷。修身自洁，惠人不倦。"],
    "010": ["坎为水", "重重险陷，以心为舟。持诚守信，行险而不失。"],
    "001": ["水山蹇", "前有险山阻挡。知难而退，反身修德。"],
    "000": ["水地比", "亲密比辅，众星拱月。择善而从，及早归附。"],
  },
  "001": {
    "111": ["山天大畜", "大蓄其德，厚积薄发。养精蓄锐，方可远行。"],
    "110": ["山泽损", "损下益上，先损后益。舍得之间见格局。"],
    "101": ["山火贲", "文饰之美，恰到好处。本色之外，略施粉黛。"],
    "100": ["山雷颐", "颐养之道，慎言语节饮食。先养自己再养人。"],
    "011": ["山风蛊", "积弊已久，整治革新。收拾旧山河，正当其时。"],
    "010": ["山水蒙", "山下出泉，启蒙发智。虚心求教，蒙以养正。"],
    "001": ["艮为山", "两山并立，当止则止。止于其所，心不外驰。"],
    "000": ["山地剥", "剥落之象，硕果仅存。守其本真，硕果将再萌。"],
  },
  "000": {
    "111": ["地天泰", "天地交泰，小往大来。通泰之时，更需用心经营。"],
    "110": ["地泽临", "居高临下，敦厚临人。把握当下好时光。"],
    "101": ["地火明夷", "明入地中，光而不耀。韬光养晦，外愚内慧。"],
    "100": ["地雷复", "一阳来复，否极泰来。勿急勿躁，生机自现。"],
    "011": ["地风升", "柔以时升，积小成大。步步高升，顺势而为。"],
    "010": ["地水师", "兴师动众，需老成持重。正名之师，所向披靡。"],
    "001": ["地山谦", "地中有山，谦谦君子。满招损，谦受益。"],
    "000": ["坤为地", "厚德载物，柔顺包容。不争而善胜，承载万物。"],
  },
};

export interface HexagramInfo {
  key: string; // 自下而上 6 bit
  name: string;
  gloss: string;
  upper: { name: string; nature: string; symbol: string };
  lower: { name: string; nature: string; symbol: string };
}

export function hexagramFromLines(lines: YaoLine[]): HexagramInfo {
  const key = lines.map((l) => (l.yang ? "1" : "0")).join("");
  const lowerKey = key.slice(0, 3);
  const upperKey = key.slice(3, 6);
  const [name, gloss] = HEX[upperKey][lowerKey];
  return { key, name, gloss, upper: TRIGRAMS[upperKey], lower: TRIGRAMS[lowerKey] };
}

export function changedLines(lines: YaoLine[]): YaoLine[] {
  return lines.map((l) => ({
    yang: l.changing ? !l.yang : l.yang,
    changing: false,
    label: l.label,
  }));
}

/** 互卦：二三四爻为下互，三四五爻为上互 */
export function nuclearLines(lines: YaoLine[]): YaoLine[] {
  const idx = [1, 2, 3, 2, 3, 4];
  return idx.map((i) => ({ yang: lines[i].yang, changing: false, label: lines[i].label }));
}

const YAO_MING_YANG = ["初九", "九二", "九三", "九四", "九五", "上九"];
const YAO_MING_YIN = ["初六", "六二", "六三", "六四", "六五", "上六"];

export function labelLines(lines: YaoLine[]): YaoLine[] {
  return lines.map((l, i) => ({
    ...l,
    label: l.yang ? YAO_MING_YANG[i] : YAO_MING_YIN[i],
  }));
}

export interface LiuYaoResult {
  throws: CoinThrow[];
  lines: YaoLine[];
  original: HexagramInfo;
  changed: HexagramInfo | null;
  nuclear: HexagramInfo;
  changingYao: string[]; // 变爻名
}

export function buildResult(throws: CoinThrow[]): LiuYaoResult {
  const lines = labelLines(
    throws.map((t) => ({ yang: THROW_META[t.sum].yang, changing: THROW_META[t.sum].changing, label: "" }))
  );
  const original = hexagramFromLines(lines);
  const hasChange = lines.some((l) => l.changing);
  const changed = hasChange ? hexagramFromLines(changedLines(lines)) : null;
  const nuclear = hexagramFromLines(nuclearLines(lines));
  const changingYao = lines.filter((l) => l.changing).map((l) => l.label);
  return { throws, lines, original, changed, nuclear, changingYao };
}

export function liuyaoContext(question: string, r: LiuYaoResult): string {
  const lines = r.lines
    .map((l) => `${l.label}${l.yang ? "（阳）" : "（阴）"}${l.changing ? " ⚡动爻" : ""}`)
    .join("、");
  return `求问者心头所问：「${question || "（未明言，请引导）"}」
起卦方式：铜钱摇卦六次（自下而上）
六爻：${lines}
本卦：${r.original.name}（${r.original.upper.name}${r.original.upper.nature}上${r.original.lower.name}${r.original.lower.nature}下）— ${r.original.gloss}
互卦：${r.nuclear.name}
${r.changed ? `变卦：${r.changed.name}（动爻：${r.changingYao.join("、")}）— ${r.changed.gloss}` : "六爻安静，无动爻，以本卦卦辞断之。"}`;
}
