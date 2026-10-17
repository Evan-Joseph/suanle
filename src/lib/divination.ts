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

export const TRIGRAM_IMAGE: Record<Trigram, string> = { 乾: "天", 兑: "泽", 离: "火", 震: "雷", 巽: "风", 坎: "水", 艮: "山", 坤: "地" };

export interface Hexagram {
  no: number;
  name: string;
  full: string;
  upper: Trigram;
  lower: Trigram;
  gist: string;
  letgo: string;
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

/** 一次掷三枚铜钱：字 = 2，背 = 3；和为 6 老阴、7 少阳、8 少阴、9 老阳 */
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
  return { sums, primary, changed, moving, question: question?.trim() || undefined };
}

export const YAO_NAMES = ["初", "二", "三", "四", "五", "上"];

export function castToText(r: CastResult): string {
  const mv = r.moving.length ? `动爻在${r.moving.map((m) => YAO_NAMES[m - 1] + "爻").join("、")}` : "六爻安静，没有动爻";
  return [
    r.question ? `我想问：${r.question}` : "我心里默念了一件事，",
    `摇出来是 **${r.primary.full}**${r.changed ? `，变 **${r.changed.full}**` : ""}（${mv}）。`,
    "帮我解解这一卦？",
  ].join("\n");
}

/* ───────────────────────── 塔罗 · 韦特全牌组 (78张) ───────────────────────── */

export type TarotSuit = "major" | "wands" | "cups" | "swords" | "pentacles";

export interface TarotCard {
  id: number;
  roman: string;
  name: string;
  en: string;
  suit: TarotSuit;
  suitLabel: string;
  suitGlyph: string;
  up: string;
  rev: string;
}

const ROMAN_MAJOR = ["0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI"];

const MAJOR_RAW: [string, string, string, string][] = [
  ["愚者", "The Fool", "新的开始，带着好奇出发", "冲动莽撞，先看清脚下"],
  ["魔术师", "The Magician", "资源齐备，动手就能成", "能力空转，别光说不做"],
  ["女祭司", "The High Priestess", "相信直觉，答案在心里", "想太多，被情绪蒙住眼"],
  ["皇后", "The Empress", "丰盛滋养，好好爱自己", "过度付出，忘了自己"],
  ["皇帝", "The Emperor", "建立秩序，掌握主导", "控制欲强，太过僵硬"],
  ["教皇", "The Hierophant", "遵循传统，向前辈请教", "打破陈规，走自己的路"],
  ["恋人", "The Lovers", "真心的选择与连接", "关系失衡，价值观分歧"],
  ["战车", "The Chariot", "意志坚定，一路向前", "方向混乱，力不从心"],
  ["力量", "Strength", "温柔的坚韧，以柔克刚", "自我怀疑，内耗疲惫"],
  ["隐士", "The Hermit", "独处沉淀，向内寻找", "过度封闭，该出门走走"],
  ["命运之轮", "Wheel of Fortune", "转机到来，顺势而为", "暂时低谷，轮子还会转"],
  ["正义", "Justice", "公平因果，理性决断", "失衡不公，别苛责自己"],
  ["倒吊人", "The Hanged Man", "换个角度，暂停也是前进", "无谓牺牲，及时止损"],
  ["死神", "Death", "结束与新生，旧篇章翻页", "抗拒改变，困在原地"],
  ["节制", "Temperance", "平衡调和，刚刚好就好", "失去节奏，过犹不及"],
  ["恶魔", "The Devil", "欲望与执念的束缚", "挣脱枷锁，看清诱惑"],
  ["高塔", "The Tower", "突变打破幻象，破而后立", "危机缓和，躲过一劫"],
  ["星星", "The Star", "希望与疗愈，慢慢好起来", "暂时失望，光还在"],
  ["月亮", "The Moon", "迷雾与不安，别信焦虑", "真相浮现，雾要散了"],
  ["太阳", "The Sun", "明朗喜悦，一切向好", "小小阴云，晒晒就干"],
  ["审判", "Judgement", "觉醒召唤，重新出发", "自我批判，放过自己"],
  ["世界", "The World", "圆满完成，一个周期落幕", "差最后一步，别泄气"],
];

const WANDS_RAW: [string, string, string, string, string][] = [
  ["权杖一", "Ace of Wands", "1", "行动灵感，火热开端", "缺乏动力，延迟停滞"],
  ["权杖二", "Two of Wands", "2", "远见规划，做出选择", "犹豫不决，安于现状"],
  ["权杖三", "Three of Wands", "3", "展望拓展，收获在途", "进展受阻，期待落空"],
  ["权杖四", "Four of Wands", "4", "安定喜庆，阶段成果", "内部不和，短暂休整"],
  ["权杖五", "Five of Wands", "5", "良性竞争，意见交锋", "无谓内耗，冲突升级"],
  ["权杖六", "Six of Wands", "6", "胜利凯旋，获得认可", "自负受挫，光芒暂退"],
  ["权杖七", "Seven of Wands", "7", "坚守阵地，以一当十", "寡不敌众，压力过载"],
  ["权杖八", "Eight of Wands", "8", "迅速推进，消息传来", "仓促延误，节奏失控"],
  ["权杖九", "Nine of Wands", "9", "最后防线，咬牙坚持", "疲惫防备，精神紧绷"],
  ["权杖十", "Ten of Wands", "10", "重任在肩，负责到底", "负担过重，学会放下"],
  ["权杖侍从", "Page of Wands", "Page", "热忱求索，新消息至", "浮躁多变，三分钟热度"],
  ["权杖骑士", "Knight of Wands", "Knight", "雷厉风行，勇往直前", "鲁莽冲动，半途而废"],
  ["权杖王后", "Queen of Wands", "Queen", "热情自信，魅力四射", "情绪多变，强势掌控"],
  ["权杖国王", "King of Wands", "King", "领袖气质，大开大合", "独断专行，要求苛刻"],
];

const CUPS_RAW: [string, string, string, string, string][] = [
  ["圣杯一", "Ace of Cups", "1", "情感涌动，真挚爱意", "情感干涸，压抑感受"],
  ["圣杯二", "Two of Cups", "2", "心意相通，平等合作", "隔阂分歧，沟通不良"],
  ["圣杯三", "Three of Cups", "3", "欢聚庆贺，友谊支持", "过度放纵，小团体是非"],
  ["圣杯四", "Four of Cups", "4", "沉思冷淡，拒绝新机", "走出封闭，重新接纳"],
  ["圣杯五", "Five of Cups", "5", "面对失落，聚焦剩余", "走出悲伤，释怀接纳"],
  ["圣杯六", "Six of Cups", "6", "童真温情，故友重聚", "沉溺过往，抗拒成长"],
  ["圣杯七", "Seven of Cups", "7", "诸多幻想，需明辨真相", "幻象破除，认清现实"],
  ["圣杯八", "Eight of Cups", "8", "毅然转身，寻觅真谛", "徘徊不前，不敢割舍"],
  ["圣杯九", "Nine of Cups", "9", "愿望实现，知足常乐", "表面光鲜，内心空虚"],
  ["圣杯十", "Ten of Cups", "10", "家庭和美，情感归宿", "家庭摩擦，虚伪和谐"],
  ["圣杯侍从", "Page of Cups", "Page", "温柔灵动，心动萌芽", "情绪脆弱，自作多情"],
  ["圣杯骑士", "Knight of Cups", "Knight", "浪漫深情，理想主义", "不切实际，轻诺寡信"],
  ["圣杯王后", "Queen of Cups", "Queen", "慈悲共情，直觉敏锐", "情绪泛滥，过度依赖"],
  ["圣杯国王", "King of Cups", "King", "成熟宽容，情绪稳重", "情感冷漠，情绪操控"],
];

const SWORDS_RAW: [string, string, string, string, string][] = [
  ["宝剑一", "Ace of Swords", "1", "清醒洞察，切开迷思", "逻辑混乱，言语伤人"],
  ["宝剑二", "Two of Swords", "2", "僵局权衡，封闭内心", "做出决断，打破沉默"],
  ["宝剑三", "Three of Swords", "3", "直面心碎，痛过即愈", "执念旧痛，反复自责"],
  ["宝剑四", "Four of Swords", "4", "静养休整，退思补过", "重新出发，休整结束"],
  ["宝剑五", "Five of Swords", "5", "各怀心事，赢也是输", "放下争执，及时止损"],
  ["宝剑六", "Six of Swords", "6", "渡过难关，渐入平稳", "旅途多阻，负重前行"],
  ["宝剑七", "Seven of Swords", "7", "智取规避，谋定后动", "掩耳盗铃，东窗事发"],
  ["宝剑八", "Eight of Swords", "8", "自我设限，并非绝境", "挣脱束缚，看清生路"],
  ["宝剑九", "Nine of Swords", "9", "深夜焦虑，杞人忧天", "噩梦醒来，曙光初现"],
  ["宝剑十", "Ten of Swords", "10", "触底反弹，至暗时刻过去", "苦尽甘来，彻底解脱"],
  ["宝剑侍从", "Page of Swords", "Page", "机敏好奇，洞察求真", "疑神疑鬼，刺探八卦"],
  ["宝剑骑士", "Knight of Swords", "Knight", "锐不可当，直言直行", "尖刻刻薄，盲目冒进"],
  ["宝剑王后", "Queen of Swords", "Queen", "独立理智，界限清晰", "苛刻冷酷，防备太深"],
  ["宝剑国王", "King of Swords", "King", "公正理智，专业权威", "冷血教条，强词夺理"],
];

const PENTACLES_RAW: [string, string, string, string, string][] = [
  ["星币一", "Ace of Pentacles", "1", "物质机缘，务实起步", "错失良机，急功近利"],
  ["星币二", "Two of Pentacles", "2", "灵活平衡，收放自如", "顾此失彼，周转不灵"],
  ["星币三", "Three of Pentacles", "3", "团队协作，精益求精", "缺乏配合，粗制滥造"],
  ["星币四", "Four of Pentacles", "4", "稳固积累，守住底线", "守财吝啬，墨守成规"],
  ["星币五", "Five of Pentacles", "5", "暂时匮乏，转机在旁", "走出低谷，迎来温暖"],
  ["星币六", "Six of Pentacles", "6", "互惠共赢，适度给予", "权力失衡，不平等待遇"],
  ["星币七", "Seven of Pentacles", "7", "审视成果，耐心等待", "焦虑回报，中途放弃"],
  ["星币八", "Eight of Pentacles", "8", "精雕细琢，专注当下", "机械重复，欠缺长远"],
  ["星币九", "Nine of Pentacles", "9", "自给自足，优雅丰盛", "依赖他人，过度攀比"],
  ["星币十", "Ten of Pentacles", "10", "长久基业，福泽传承", "家族纷扰，财务漏洞"],
  ["星币侍从", "Page of Pentacles", "Page", "踏实好学，脚踏实地", "好高骛远，眼高手低"],
  ["星币骑士", "Knight of Pentacles", "Knight", "勤恳可靠，稳步推进", "呆板拖沓，墨守成规"],
  ["星币王后", "Queen of Pentacles", "Queen", "贤惠慷慨，生活丰盛", "挥霍无度，忽略健康"],
  ["星币国王", "King of Pentacles", "King", "商业才干，坚实依靠", "唯利是图，贪婪固执"],
];

export const MAJOR_TAROT: TarotCard[] = MAJOR_RAW.map(([name, en, up, rev], id) => ({
  id,
  roman: ROMAN_MAJOR[id],
  name,
  en,
  suit: "major",
  suitLabel: "大阿卡那",
  suitGlyph: "✦",
  up,
  rev,
}));

let curId = 22;
const wandsCards: TarotCard[] = WANDS_RAW.map(([name, en, roman, up, rev]) => ({
  id: curId++,
  roman,
  name,
  en,
  suit: "wands",
  suitLabel: "权杖组",
  suitGlyph: "🪓",
  up,
  rev,
}));

const cupsCards: TarotCard[] = CUPS_RAW.map(([name, en, roman, up, rev]) => ({
  id: curId++,
  roman,
  name,
  en,
  suit: "cups",
  suitLabel: "圣杯组",
  suitGlyph: "🏆",
  up,
  rev,
}));

const swordsCards: TarotCard[] = SWORDS_RAW.map(([name, en, roman, up, rev]) => ({
  id: curId++,
  roman,
  name,
  en,
  suit: "swords",
  suitLabel: "宝剑组",
  suitGlyph: "⚔️",
  up,
  rev,
}));

const pentaclesCards: TarotCard[] = PENTACLES_RAW.map(([name, en, roman, up, rev]) => ({
  id: curId++,
  roman,
  name,
  en,
  suit: "pentacles",
  suitLabel: "星币组",
  suitGlyph: "🪙",
  up,
  rev,
}));

/** 完整 78 张韦特塔罗牌库 */
export const TAROT: TarotCard[] = [
  ...MAJOR_TAROT,
  ...wandsCards,
  ...cupsCards,
  ...swordsCards,
  ...pentaclesCards,
];

export const TAROT_POSITIONS = ["此刻的你", "卡住你的", "可以试试"];

export interface TarotDraw {
  cards: { id: number; reversed: boolean }[];
  question?: string;
  deckMode?: "all" | "major";
}

export function shuffledDeck(mode: "all" | "major" = "all"): number[] {
  const source = mode === "major" ? MAJOR_TAROT : TAROT;
  const arr = source.map((c) => c.id);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function tarotToText(d: TarotDraw): string {
  const lines = d.cards.map((c, i) => {
    const card = TAROT[c.id] ?? MAJOR_TAROT[c.id] ?? TAROT[0];
    return `${TAROT_POSITIONS[i]}：**${card.name}** [${card.suitLabel}]${c.reversed ? "（逆位）" : "（正位）"}`;
  });
  return [d.question ? `我想问：${d.question}` : "我抽了三张塔罗，", ...lines, "你帮我解解这三张牌的深层含义？"].join("\n");
}

/* ───────────────────────── 生辰 / 八字 ───────────────────────── */

export const GAN_WX: Record<string, string> = { 甲: "木", 乙: "木", 丙: "火", 丁: "火", 戊: "土", 己: "土", 庚: "金", 辛: "金", 壬: "水", 癸: "水" };
export const ZHI_WX: Record<string, string> = { 子: "水", 丑: "土", 寅: "木", 卯: "木", 辰: "土", 巳: "火", 午: "火", 未: "土", 申: "金", 酉: "金", 戌: "土", 亥: "水" };
export const WX_COLOR: Record<string, string> = { 木: "#6f8f5e", 火: "#c4553a", 土: "#a9844a", 金: "#8a9099", 水: "#4f6d86" };
export const WX_ORDER = ["木", "火", "土", "金", "水"];

export const SHICHEN = [
  { label: "子时", range: "23:00–00:59", hour: 0 },
  { label: "丑时", range: "01:00–02:59", hour: 2 },
  { label: "寅时", range: "03:00–04:59", hour: 4 },
  { label: "卯时", range: "05:00–06:59", hour: 6 },
  { label: "辰时", range: "07:00–08:59", hour: 8 },
  { label: "巳时", range: "09:00–10:59", hour: 10 },
  { label: "午时", range: "11:00–12:59", hour: 12 },
  { label: "未时", range: "13:00–14:59", hour: 14 },
  { label: "申时", range: "15:00–16:59", hour: 16 },
  { label: "酉时", range: "17:00–18:59", hour: 18 },
  { label: "戌时", range: "19:00–20:59", hour: 20 },
  { label: "亥时", range: "21:00–22:59", hour: 22 },
];

export function normalizeGender(g?: string | null): "男" | "女" | undefined {
  if (!g) return undefined;
  if (/女|female|^f$/i.test(g)) return "女";
  if (/男|male|^m$/i.test(g)) return "男";
  return undefined;
}

export interface SolarCalibration {
  city: string;
  longitude: number;
  offsetMinutes: number;
  originalBirth: string;
  calibratedBirth: string;
  applied: boolean;
}

/** 常见城市经度（用于真太阳时换算，东经120度为基准） */
export const CITY_LONGITUDES: Record<string, number> = {
  北京: 116.4,
  上海: 121.47,
  广州: 113.26,
  深圳: 114.05,
  成都: 104.06,
  重庆: 106.55,
  杭州: 120.15,
  南京: 118.8,
  武汉: 114.31,
  西安: 108.94,
  天津: 117.2,
  苏州: 120.58,
  郑州: 113.62,
  长沙: 112.93,
  东莞: 113.75,
  佛山: 113.12,
  宁波: 121.55,
  青岛: 120.38,
  沈阳: 123.43,
  合肥: 117.23,
  昆明: 102.71,
  福州: 119.3,
  厦门: 118.08,
  哈尔滨: 126.63,
  济南: 117.0,
  大连: 121.62,
  长春: 125.32,
  温州: 120.7,
  石家庄: 114.51,
  贵阳: 106.71,
  南宁: 108.37,
  常州: 119.97,
  泉州: 118.68,
  南昌: 115.86,
  金华: 119.65,
  无锡: 120.31,
  烟台: 121.45,
  海口: 110.32,
  三亚: 109.51,
  乌鲁木齐: 87.62,
  兰州: 103.82,
  呼和浩特: 111.67,
  银川: 106.23,
  西宁: 101.78,
  拉萨: 91.13,
  香港: 114.17,
  澳门: 113.54,
  台北: 121.56,
  高雄: 120.31,
};

export function findCityLongitude(name?: string | null): { name: string; longitude: number } | null {
  if (!name || typeof name !== "string") return null;
  const clean = name.trim().replace(/[省市特别行政区县区]/g, "");
  if (!clean) return null;
  for (const [k, v] of Object.entries(CITY_LONGITUDES)) {
    if (clean.includes(k) || k.includes(clean)) return { name: k, longitude: v };
  }
  return null;
}

/** 计算真太阳时偏差（经度时差 + 均时差 Equation of Time） */
export function calculateSolarTimeOffset(
  longitude: number,
  month = 6,
  day = 15,
): { longitudeOffsetMin: number; equationOfTimeMin: number; totalOffsetMin: number } {
  const longitudeOffsetMin = (longitude - 120) * 4;
  const daysBeforeMonth = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const dayOfYear = (daysBeforeMonth[Math.max(0, Math.min(11, month - 1))] ?? 0) + day;
  const b = (2 * Math.PI * (dayOfYear - 81)) / 365;
  const equationOfTimeMin = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
  const totalOffsetMin = Math.round(longitudeOffsetMin + equationOfTimeMin);
  return {
    longitudeOffsetMin: Math.round(longitudeOffsetMin * 10) / 10,
    equationOfTimeMin: Math.round(equationOfTimeMin * 10) / 10,
    totalOffsetMin,
  };
}

export interface ParsedBirth {
  y: number;
  m: number;
  d: number;
  h: number;
  mi: number;
  hourKnown: boolean;
  solarCalibration?: SolarCalibration;
}

/** birth: "YYYY-MM-DD" 或 "YYYY-MM-DD HH:mm"；可选城市名校准真太阳时 */
export function parseBirth(birth?: string | null, city?: string | null): ParsedBirth | null {
  if (!birth) return null;
  const mt = String(birth).match(/(\d{4})\D(\d{1,2})\D(\d{1,2})(?:\D+(\d{1,2})(?::(\d{1,2}))?)?/);
  if (!mt) return null;
  const y = +mt[1];
  const m = +mt[2];
  const d = +mt[3];
  if (y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const hourKnown = mt[4] !== undefined;
  const rawH = hourKnown ? Math.min(23, +mt[4]) : 12;
  const rawMi = mt[5] ? Math.min(59, +mt[5]) : 0;

  const pad = (n: number) => String(n).padStart(2, "0");
  const rawStr = `${y}-${pad(m)}-${pad(d)}${hourKnown ? ` ${pad(rawH)}:${pad(rawMi)}` : ""}`;

  const cityInfo = findCityLongitude(city);
  if (hourKnown && cityInfo) {
    const { totalOffsetMin } = calculateSolarTimeOffset(cityInfo.longitude, m, d);
    const dObj = new Date(Date.UTC(y, m - 1, d, rawH, rawMi, 0));
    const calObj = new Date(dObj.getTime() + totalOffsetMin * 60000);
    const cy = calObj.getUTCFullYear();
    const cm = calObj.getUTCMonth() + 1;
    const cd = calObj.getUTCDate();
    const ch = calObj.getUTCHours();
    const cmi = calObj.getUTCMinutes();
    const calStr = `${cy}-${pad(cm)}-${pad(cd)} ${pad(ch)}:${pad(cmi)}`;
    return {
      y: cy,
      m: cm,
      d: cd,
      h: ch,
      mi: cmi,
      hourKnown,
      solarCalibration: {
        city: cityInfo.name,
        longitude: cityInfo.longitude,
        offsetMinutes: totalOffsetMin,
        originalBirth: rawStr,
        calibratedBirth: calStr,
        applied: true,
      },
    };
  }

  return { y, m, d, h: rawH, mi: rawMi, hourKnown };
}

/** 紫微排盘的时辰序号：0 早子 … 11 亥 · 12 晚子 */
export function timeIndexOf(hour: number, known: boolean): number {
  if (!known) return 6;
  if (hour === 23) return 12;
  if (hour === 0) return 0;
  return Math.floor((hour + 1) / 2);
}

export function zodiacOf(m: number, d: number): string {
  const signs = ["摩羯座", "水瓶座", "双鱼座", "白羊座", "金牛座", "双子座", "巨蟹座", "狮子座", "处女座", "天秤座", "天蝎座", "射手座", "摩羯座"];
  const edges = [20, 19, 21, 20, 21, 22, 23, 23, 23, 24, 23, 22];
  return d < edges[m - 1] ? signs[m - 1] : signs[m];
}

export interface Pillar {
  label: string;
  gz: string;
  gan: string;
  zhi: string;
  wx: string;
  shishen: string;
  nayin: string;
}

export interface DaYunStep {
  gz: string;
  startYear: number;
  startAge: number;
}

export interface BaziResult {
  pillars: Pillar[];
  dayMaster: string;
  dayMasterWx: string;
  wuxing: Record<string, number>;
  strongest: string;
  weakest: string;
  shengxiao: string;
  lunarText: string;
  zodiac: string;
  nayin: string;
  hourKnown: boolean;
  dayun: DaYunStep[];
  solarCalibration?: SolarCalibration;
}

export function computeBazi(birth?: string | null, gender?: string | null, city?: string | null): BaziResult | null {
  const p = parseBirth(birth, city);
  if (!p) return null;
  try {
    const lunar = Solar.fromYmdHms(p.y, p.m, p.d, p.h, p.mi, 0).getLunar();
    const e = lunar.getEightChar();
    const mk = (label: string, gz: string, wx: string, shishen: string, nayin: string): Pillar => ({ label, gz, gan: gz.charAt(0), zhi: gz.charAt(1), wx, shishen, nayin });
    const pillars: Pillar[] = [
      mk("年柱", e.getYear(), e.getYearWuXing(), e.getYearShiShenGan(), e.getYearNaYin()),
      mk("月柱", e.getMonth(), e.getMonthWuXing(), e.getMonthShiShenGan(), e.getMonthNaYin()),
      mk("日柱", e.getDay(), e.getDayWuXing(), "日主", e.getDayNaYin()),
      p.hourKnown ? mk("时柱", e.getTime(), e.getTimeWuXing(), e.getTimeShiShenGan(), e.getTimeNaYin()) : { label: "时柱", gz: "", gan: "", zhi: "", wx: "", shishen: "", nayin: "" },
    ];
    const wuxing: Record<string, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
    pillars.forEach((pl) => {
      for (const ch of pl.wx) if (ch in wuxing) wuxing[ch] += 1;
    });
    const sorted = [...WX_ORDER].sort((a, b) => wuxing[b] - wuxing[a]);
    let dayun: DaYunStep[] = [];
    try {
      dayun = e
        .getYun(normalizeGender(gender) === "男" ? 1 : 0)
        .getDaYun()
        .filter((d) => d.getGanZhi())
        .slice(0, 8)
        .map((d) => ({ gz: d.getGanZhi(), startYear: d.getStartYear(), startAge: d.getStartAge() }));
    } catch {
      dayun = [];
    }
    const dayMaster = e.getDayGan();
    return {
      pillars,
      dayMaster,
      dayMasterWx: GAN_WX[dayMaster] ?? "",
      wuxing,
      strongest: sorted[0],
      weakest: sorted[sorted.length - 1],
      shengxiao: lunar.getYearShengXiao(),
      lunarText: `农历${lunar.getYearInGanZhi()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
      zodiac: zodiacOf(p.m, p.d),
      nayin: e.getYearNaYin(),
      hourKnown: p.hourKnown,
      dayun,
      solarCalibration: p.solarCalibration,
    };
  } catch {
    return null;
  }
}

export function baziBrief(b: BaziResult): string {
  return `四柱 ${b.pillars.map((p) => `${p.label}${p.gz || "未知"}`).join(" ")}；日主${b.dayMaster}（${b.dayMasterWx}）；十神 ${b.pillars
    .filter((p) => p.gz)
    .map((p) => `${p.label.charAt(0)}${p.shishen}`)
    .join(" ")}；五行 ${WX_ORDER.map((k) => k + b.wuxing[k]).join(" ")}（${b.strongest}最旺、${b.weakest}偏弱）；生肖${b.shengxiao}；${b.zodiac}；年柱纳音${b.nayin}${
    b.dayun.length ? `；大运 ${b.dayun.map((d) => `${d.startAge}岁${d.gz}`).join(" ")}` : ""
  }${b.hourKnown ? "" : "；时辰不详"}${b.solarCalibration ? `；真太阳时校准[${b.solarCalibration.city} ${b.solarCalibration.offsetMinutes >= 0 ? "+" : ""}${b.solarCalibration.offsetMinutes}分]` : ""}`;
}

export function baziToText(b: BaziResult, birth: string): string {
  return [
    `这是我的生辰：${birth}`,
    `四柱：${b.pillars.map((p) => p.gz || "时辰不详").join(" · ")}，日主 ${b.dayMaster}${b.dayMasterWx}`,
    `五行：${WX_ORDER.map((k) => `${k}${b.wuxing[k]}`).join(" ")}`,
    "帮我看看我是个什么样的人，最近该注意点什么？",
  ].join("\n");
}

/* ───────────────────────── 今日黄历 ───────────────────────── */

const LUCKY_COLOR: Record<string, { name: string; hex: string }> = {
  木: { name: "竹青", hex: "#7d9a6f" },
  火: { name: "朱砂", hex: "#c4553a" },
  土: { name: "杏黄", hex: "#d4a35a" },
  金: { name: "月白", hex: "#c9d3dc" },
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

const SMALL_THINGS = [
  "把桌面收拾出一小块空地",
  "给自己泡一杯热的",
  "十一点前放下手机",
  "走路去买一次早饭",
  "给很久没联系的人发个表情",
  "换一首没听过的歌",
  "做完一件拖了很久的小事",
  "晒十分钟太阳",
  "认真吃一顿午饭，不看手机",
  "开窗通风，深呼吸三次",
  "洗个热水澡，什么都不想",
  "写下今天一件小小的好事",
  "开一小时勿扰模式",
  "下楼转一圈再回来",
];

export interface Almanac {
  dateText: string;
  weekday: string;
  lunarText: string;
  ganzhi: string;
  dayGz: string;
  yi: string[];
  ji: string[];
  jieqi: string;
  chong: string;
  sha: string;
  color: { name: string; hex: string };
  line: string;
  small: string;
  dayWx: string;
}

export function todayAlmanac(date = new Date()): Almanac {
  const lunar = Solar.fromDate(date).getLunar();
  const dayGan = lunar.getDayGan();
  const dayWx = GAN_WX[dayGan] ?? "土";
  const seed = date.getFullYear() * 400 + (date.getMonth() + 1) * 31 + date.getDate();
  let jieqi = "";
  try {
    jieqi = lunar.getPrevJieQi(true)?.getName() ?? "";
  } catch {
    jieqi = "";
  }
  return {
    dateText: `${date.getMonth() + 1}月${date.getDate()}日`,
    weekday: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][date.getDay()],
    lunarText: `${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
    ganzhi: `${lunar.getYearInGanZhi()}年 ${lunar.getMonthInGanZhi()}月 ${lunar.getDayInGanZhi()}日`,
    dayGz: lunar.getDayInGanZhi(),
    yi: lunar.getDayYi().slice(0, 5),
    ji: lunar.getDayJi().slice(0, 5),
    jieqi,
    chong: lunar.getDayChongDesc(),
    sha: lunar.getDaySha(),
    color: LUCKY_COLOR[dayWx],
    line: DAILY_LINES[seed % DAILY_LINES.length],
    small: SMALL_THINGS[(seed * 7) % SMALL_THINGS.length],
    dayWx,
  };
}

export function yearGanzhi(year: number): { gz: string; shengxiao: string } {
  const lunar = Solar.fromYmdHms(year, 7, 1, 12, 0, 0).getLunar();
  return { gz: lunar.getYearInGanZhi(), shengxiao: lunar.getYearShengXiao() };
}

/* ───────────────────────── 工具 ───────────────────────── */

export function hashSeed(str: string): () => number {
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
