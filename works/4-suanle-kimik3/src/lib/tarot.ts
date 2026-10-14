/* 韦特塔罗 · 22 大阿卡纳数据库与抽牌逻辑 */

export interface TarotCard {
  id: string;
  num: string; // 罗马数字
  name: string;
  en: string;
  up: { keywords: string[]; line: string };
  rev: { keywords: string[]; line: string };
}

export const MAJORS: TarotCard[] = [
  { id: "fool", num: "0", name: "愚者", en: "The Fool", up: { keywords: ["启程", "赤子之心", "纵身一跃"], line: "两手空空，恰恰是拥有全世界的开始。" }, rev: { keywords: ["鲁莽", "逃避", "不计后果"], line: "脚步比脑子快的时候，先系好鞋带。" } },
  { id: "magician", num: "I", name: "魔术师", en: "The Magician", up: { keywords: ["显化", "资源就位", "行动力"], line: "桌上四要素俱全，缺的只是你开口。" }, rev: { keywords: ["花招", "意志涣散", "纸上谈兵"], line: "戏法人人会变，心诚才是关键。" } },
  { id: "priestess", num: "II", name: "女祭司", en: "The High Priestess", up: { keywords: ["直觉", "静观其变", "潜意识"], line: "答案早已在你心里，只是还没安静到能听见。" }, rev: { keywords: ["自我封闭", "忽视内心", "表面平静"], line: "听不见自己的声音，多半是心太吵。" } },
  { id: "empress", num: "III", name: "女皇", en: "The Empress", up: { keywords: ["丰盛", "滋养", "感官之美"], line: "先把自己喂饱的人，才有余粮温柔世界。" }, rev: { keywords: ["过度付出", "依赖", "耗竭"], line: "水都给了别人，自己的花就蔫了。" } },
  { id: "emperor", num: "IV", name: "皇帝", en: "The Emperor", up: { keywords: ["秩序", "担当", "立边界"], line: "真正的稳，是给自己立下不倒的规矩。" }, rev: { keywords: ["控制欲", "固执", "硬碰硬"], line: "抓得越紧的江山，越容易从指缝漏走。" } },
  { id: "hierophant", num: "V", name: "教皇", en: "The Hierophant", up: { keywords: ["传承", "寻求指引", "信其所信"], line: "站在前人的肩膀上看路，不丢人。" }, rev: { keywords: ["教条", "随波逐流", "伪权威"], line: "人人都念的那本经，未必适合你这一页。" } },
  { id: "lovers", num: "VI", name: "恋人", en: "The Lovers", up: { keywords: ["契合", "真心", "关键选择"], line: "好的关系，是两个人都敢做真实的自己。" }, rev: { keywords: ["错位", "价值观分歧", "患得患失"], line: "需要踮脚才能够着的爱，站不久。" } },
  { id: "chariot", num: "VII", name: "战车", en: "The Chariot", up: { keywords: ["意志", "推进", "掌控方向"], line: "两匹马往两处使劲时，握紧缰绳的是你。" }, rev: { keywords: ["失控", "方向摇摆", "硬闯"], line: "油门踩到底之前，先看看路对不对。" } },
  { id: "strength", num: "VIII", name: "力量", en: "Strength", up: { keywords: ["柔韧", "勇气", "驯服内心"], line: "真正的力量从不嘶吼，它只是温柔地不松手。" }, rev: { keywords: ["自我怀疑", "硬撑", "外强中干"], line: "累了就说累，那不叫输，叫诚实。" } },
  { id: "hermit", num: "IX", name: "隐士", en: "The Hermit", up: { keywords: ["独处", "内省", "提灯寻路"], line: "一盏灯照不远，但足以照亮下一步。" }, rev: { keywords: ["孤立", "钻牛角尖", "拒绝援手"], line: "山洞躲久了，别忘了自己还会说话。" } },
  { id: "wheel", num: "X", name: "命运之轮", en: "Wheel of Fortune", up: { keywords: ["转机", "周期", "时来运转"], line: "轮子一直在转，低谷只是转到背面而已。" }, rev: { keywords: ["抗拒变化", "时运低谷", "原地打转"], line: "逆水行舟累的时候，试试先顺着漂一会儿。" } },
  { id: "justice", num: "XI", name: "正义", en: "Justice", up: { keywords: ["公允", "因果", "清醒决断"], line: "种过什么就收什么，秤从来不骗人。" }, rev: { keywords: ["偏执", "回避责任", "得失心重"], line: "只称别人不称自己的秤，早就歪了。" } },
  { id: "hanged", num: "XII", name: "倒吊人", en: "The Hanged Man", up: { keywords: ["换角度看", "主动暂停", "取舍"], line: "倒过来看世界，很多事忽然就顺了。" }, rev: { keywords: ["无谓僵持", "内耗", "自我感动式牺牲"], line: "挂在那里感动自己，不如下来走两步。" } },
  { id: "death", num: "XIII", name: "死神", en: "Death", up: { keywords: ["终结", "蜕变", "辞旧迎新"], line: "一个阶段的死亡，是下一个阶段的出生证明。" }, rev: { keywords: ["滞留过去", "恐惧改变", "拖着不翻篇"], line: "门已经开了，是你还攥着旧钥匙不放。" } },
  { id: "temperance", num: "XIV", name: "节制", en: "Temperance", up: { keywords: ["平衡", "调和", "细水长流"], line: "把水慢慢兑到刚好能入口的温度，是功夫。" }, rev: { keywords: ["失衡", "急功近利", "过满则溢"], line: "一口气想吃成胖子，往往先把胃伤了。" } },
  { id: "devil", num: "XV", name: "恶魔", en: "The Devil", up: { keywords: ["照见执念", "欲望", "隐形束缚"], line: "先看清拴住你的绳子，才谈得上解开。" }, rev: { keywords: ["松绑", "觉醒", "戒断"], line: "锁链其实没上锁，推开那一下最难也最爽。" } },
  { id: "tower", num: "XVI", name: "高塔", en: "The Tower", up: { keywords: ["崩塌", "真相", "破而后立"], line: "摇摇晃晃的塔塌了，地基建错层这件事终于不用再装。" }, rev: { keywords: ["延迟的清算", "勉强支撑", "侥幸"], line: "裂缝不会自己长好，早修早安心。" } },
  { id: "star", num: "XVII", name: "星星", en: "The Star", up: { keywords: ["希望", "疗愈", "被宇宙接住"], line: "废墟上已有甘泉，你比想象中恢复得快。" }, rev: { keywords: ["信心缺失", "不敢许愿", "自我设限"], line: "星星一直在，是你忘了抬头。" } },
  { id: "moon", num: "XVIII", name: "月亮", en: "The Moon", up: { keywords: ["迷雾", "情绪潮汐", "梦的密语"], line: "雾里看不清的不是路，是被放大的担忧。" }, rev: { keywords: ["雾散", "真相浮现", "疑云退潮"], line: "月亮让位的时候，影子自然就短了。" } },
  { id: "sun", num: "XIX", name: "太阳", en: "The Sun", up: { keywords: ["明朗", "生命力", "坦然的快乐"], line: "把脸转向太阳，阴影只能跟在身后。" }, rev: { keywords: ["短暂的阴云", "孩子气受挫", "乐极忘形"], line: "太阳只是被云借走了，没辞呈，会回来的。" } },
  { id: "judgement", num: "XX", name: "审判", en: "Judgement", up: { keywords: ["唤醒", "复盘", "第二次机会"], line: "旧篇章回信到了：过去的努力，宇宙都签收了。" }, rev: { keywords: ["自我审判过重", "迟迟不翻篇", "听不见召唤"], line: "法官锤都落了，你还想把自己关上几年？" } },
  { id: "world", num: "XXI", name: "世界", en: "The World", up: { keywords: ["圆满", "抵达", "阶段性完成"], line: "该给你的掌声一阵都不会少，谢幕然后上新戏。" }, rev: { keywords: ["差临门一脚", "未完成感", "迟迟不收官"], line: "最后一块拼图往往在你自己的口袋里。" } },
];

export type SpreadType = "single" | "triangle";

export interface DrawnCard {
  card: TarotCard;
  reversed: boolean;
  position: string;
}

export const SPREADS: Record<SpreadType, { name: string; positions: string[] }> = {
  single: { name: "单牌指引", positions: ["当下启示"] },
  triangle: { name: "圣三角", positions: ["过去的因", "现在的实", "未来的势"] },
};

export function drawCards(spread: SpreadType): DrawnCard[] {
  const deck = [...MAJORS];
  // Fisher–Yates
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return SPREADS[spread].positions.map((pos, i) => ({
    card: deck[i],
    reversed: Math.random() < 0.32,
    position: pos,
  }));
}

export function tarotContext(question: string, spread: SpreadType, drawn: DrawnCard[]): string {
  const lines = drawn.map((d) => {
    const face = d.reversed ? d.card.rev : d.card.up;
    return `【${d.position}】${d.card.num} ${d.card.name}${d.reversed ? "（逆位）" : "（正位）"}｜关键词：${face.keywords.join("、")}`;
  });
  return `求问者心头所问：「${question || "（未明言，请引导）"}」\n牌阵：${SPREADS[spread].name}\n已抽出之牌：\n${lines.join("\n")}`;
}
