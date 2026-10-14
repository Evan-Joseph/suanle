// 韦特塔罗 · 大阿卡纳（离线可用）

export type TarotCard = {
  id: string;
  numeral: string;
  name: string;
  en: string;
  glyph: string;
  up: string[];
  rev: string[];
  upright: string;
  reversed: string;
  letgo: string;
};

export type DrawnCard = { card: TarotCard; reversed: boolean; position: string };
export type TarotSpread = "single" | "triangle" | "choice";
export type TarotResult = { spread: TarotSpread; cards: DrawnCard[]; question?: string; at: string };

export const SPREADS: Record<TarotSpread, { name: string; desc: string; positions: string[] }> = {
  single: { name: "今日一张", desc: "一张牌，给今天一个提示", positions: ["此刻"] },
  triangle: { name: "圣三角", desc: "过去的因 · 现在的实 · 接下来的势", positions: ["过去", "现在", "接下来"] },
  choice: { name: "二选一", desc: "纠结两条路的时候", positions: ["选项 A", "选项 B", "你真正在意的"] },
};

export const MAJOR_ARCANA: TarotCard[] = [
  { id: "fool", numeral: "0", name: "愚人", en: "The Fool", glyph: "✦", up: ["出发", "天真", "可能性"], rev: ["莽撞", "迟疑"], upright: "背个小包就上路的勇气。不知道终点也没关系，路会自己展开。", reversed: "要么冲得太猛，要么怕得不敢迈步。先看一眼脚下就好。", letgo: "没准备好也可以出发。" },
  { id: "magician", numeral: "I", name: "魔术师", en: "The Magician", glyph: "∞", up: ["行动", "资源", "显化"], rev: ["空想", "分散"], upright: "桌上四样东西都齐了，差的只是你动手。", reversed: "想法很多，落地很少。挑一件，只做一件。", letgo: "别等万事俱备了。" },
  { id: "priestess", numeral: "II", name: "女祭司", en: "The High Priestess", glyph: "☽", up: ["直觉", "静默", "内在"], rev: ["忽视直觉", "信息不明"], upright: "答案其实你心里有，只是还不想承认。", reversed: "外面的声音太吵了，先关掉一些。", letgo: "安静一会儿，答案自己会浮上来。" },
  { id: "empress", numeral: "III", name: "皇后", en: "The Empress", glyph: "♀", up: ["丰盛", "滋养", "感官"], rev: ["过度付出", "停滞"], upright: "好好照顾自己，花会开的。", reversed: "你一直在给别人浇水，自己快干了。", letgo: "先爱一下你老己。" },
  { id: "emperor", numeral: "IV", name: "皇帝", en: "The Emperor", glyph: "♔", up: ["秩序", "边界", "掌控"], rev: ["控制欲", "僵化"], upright: "立规矩、定边界，事情会稳下来。", reversed: "抓得太紧了，手会酸。", letgo: "控制不了的，就交给时间。" },
  { id: "hierophant", numeral: "V", name: "教皇", en: "The Hierophant", glyph: "⚷", up: ["传统", "指引", "学习"], rev: ["打破常规", "盲从"], upright: "找个前辈聊聊，老办法有老办法的道理。", reversed: "别人的标准答案，不一定是你的。", letgo: "不必活成教科书。" },
  { id: "lovers", numeral: "VI", name: "恋人", en: "The Lovers", glyph: "♡", up: ["选择", "连接", "契合"], rev: ["失衡", "犹豫"], upright: "这是一张关于选择的牌：选你真心想要的。", reversed: "心和脑在吵架，听听两边各自怕什么。", letgo: "选了就别回头比较。" },
  { id: "chariot", numeral: "VII", name: "战车", en: "The Chariot", glyph: "➶", up: ["推进", "意志", "胜利"], rev: ["失控", "方向乱"], upright: "握紧缰绳，往前冲，这一程你能赢。", reversed: "两匹马往不同方向跑，先停车。", letgo: "方向对了，慢点也到。" },
  { id: "strength", numeral: "VIII", name: "力量", en: "Strength", glyph: "∾", up: ["温柔的力量", "耐心", "勇气"], rev: ["自我怀疑", "急躁"], upright: "真正的力量是温柔地摸摸狮子的头。", reversed: "你比你以为的强，只是今天累了。", letgo: "不用硬撑，柔也是力。" },
  { id: "hermit", numeral: "IX", name: "隐士", en: "The Hermit", glyph: "☖", up: ["独处", "内省", "寻找"], rev: ["孤立", "逃避"], upright: "提一盏灯，一个人走一段，也挺好。", reversed: "独处太久会冷，偶尔出来晒晒太阳。", letgo: "不回消息也没关系。" },
  { id: "wheel", numeral: "X", name: "命运之轮", en: "Wheel of Fortune", glyph: "☸", up: ["转机", "周期", "运气"], rev: ["低谷", "抗拒变化"], upright: "轮子在转，好运在来的路上。", reversed: "在轮子底部的时候，记得它还会转上去。", letgo: "运气这事，算不过来，就算了。" },
  { id: "justice", numeral: "XI", name: "正义", en: "Justice", glyph: "⚖", up: ["公平", "因果", "清晰"], rev: ["偏颇", "逃避责任"], upright: "因果自有账本，你只管做对的事。", reversed: "有些不公平，不是你能扳回来的。", letgo: "账交给天算。" },
  { id: "hanged", numeral: "XII", name: "倒吊人", en: "The Hanged Man", glyph: "⟟", up: ["暂停", "换角度", "臣服"], rev: ["拖延", "无谓牺牲"], upright: "倒过来看世界，答案换了个样子。", reversed: "等得太久了，等不到就别等了。", letgo: "卡住的时候，就换个姿势躺着。" },
  { id: "death", numeral: "XIII", name: "死神", en: "Death", glyph: "❀", up: ["结束", "转化", "新生"], rev: ["抗拒结束", "停滞"], upright: "别怕，这张牌说的是：一段结束了，新的要开始。", reversed: "舍不得放手的东西，正在消耗你。", letgo: "结束本身就是一种礼物。" },
  { id: "temperance", numeral: "XIV", name: "节制", en: "Temperance", glyph: "⧖", up: ["平衡", "调和", "疗愈"], rev: ["失衡", "过度"], upright: "两杯水慢慢倒，冷热刚好。", reversed: "最近有点过了，吃喝熬夜情绪都是。", letgo: "七分饱，七分努力。" },
  { id: "devil", numeral: "XV", name: "恶魔", en: "The Devil", glyph: "⛓", up: ["执念", "诱惑", "束缚"], rev: ["挣脱", "觉察"], upright: "锁链其实没锁上，你随时可以走。", reversed: "你已经开始看清那个困住你的东西了。", letgo: "放下执念，链子自己就松了。" },
  { id: "tower", numeral: "XVI", name: "高塔", en: "The Tower", glyph: "⚡", up: ["突变", "崩塌", "觉醒"], rev: ["延迟的崩塌", "侥幸"], upright: "有东西要塌了，但那本来就建在沙子上。", reversed: "你在拼命撑一面快倒的墙。", letgo: "塌了就塌了，地基还在。" },
  { id: "star", numeral: "XVII", name: "星星", en: "The Star", glyph: "★", up: ["希望", "疗愈", "灵感"], rev: ["失望", "信心不足"], upright: "最黑的时候星星最亮。你在慢慢好起来。", reversed: "希望还在，只是被云遮了一下。", letgo: "今晚抬头看看天。" },
  { id: "moon", numeral: "XVIII", name: "月亮", en: "The Moon", glyph: "☾", up: ["不安", "迷雾", "潜意识"], rev: ["迷雾散去", "真相"], upright: "夜里想事情会被放大，天亮再说。", reversed: "雾在散，你快看清了。", letgo: "深夜的结论，一律不算数。" },
  { id: "sun", numeral: "XIX", name: "太阳", en: "The Sun", glyph: "☀", up: ["快乐", "成功", "坦荡"], rev: ["暂时阴天", "过度乐观"], upright: "大大的好牌。晒晒太阳，开心就完事了。", reversed: "太阳还在，只是今天多云。", letgo: "开心不需要理由。" },
  { id: "judgement", numeral: "XX", name: "审判", en: "Judgement", glyph: "♫", up: ["觉醒", "召唤", "复盘"], rev: ["自我苛责", "逃避"], upright: "听见心里那个声音了吗？它在叫你重新开始。", reversed: "复盘可以，审判自己就算了。", letgo: "过去的你已经尽力了。" },
  { id: "world", numeral: "XXI", name: "世界", en: "The World", glyph: "◯", up: ["圆满", "完成", "整合"], rev: ["差一点", "未完成"], upright: "一个圆画完了。恭喜，好好庆祝。", reversed: "差最后一小步，不急，圆总会合上。", letgo: "已经很好了。" },
];

export function drawCards(spread: TarotSpread, question?: string, rand: () => number = Math.random): TarotResult {
  const deck = [...MAJOR_ARCANA];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  const positions = SPREADS[spread].positions;
  return {
    spread,
    question,
    at: new Date().toISOString(),
    cards: positions.map((position, i) => ({ card: deck[i], reversed: rand() < 0.3, position })),
  };
}

export function tarotSummary(t: TarotResult): string {
  return `牌阵：${SPREADS[t.spread].name}\n` +
    t.cards.map((d) => `${d.position}：${d.card.numeral} ${d.card.name}（${d.reversed ? "逆位" : "正位"}）关键词：${(d.reversed ? d.card.rev : d.card.up).join("、")}`).join("\n");
}
