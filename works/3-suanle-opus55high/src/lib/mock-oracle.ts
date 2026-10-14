// 离线小算：断网或模型不可用时的本地决策树 + 推演解读
import type { CastResult } from "./iching";
import { LINE_NAMES } from "./iching";
import type { TarotResult } from "./tarot";
import { SPREADS } from "./tarot";
import { getPersona } from "./personas";
import type { BaziResult, KLineResult } from "./bazi";
import { ELEMENT_CN } from "./bazi";

type Topic = "work" | "love" | "decide" | "sleep" | "money" | "family" | "study" | "vent" | "cast" | "hello" | "general";

const RULES: [Topic, RegExp][] = [
  ["cast", /算一卦|起卦|摇卦|抽牌|塔罗|算算|占卜|帮我算/],
  ["decide", /纠结|要不要|该不该|选择|决定|辞职|离职|跳槽|分手吗|还是/],
  ["work", /工作|加班|老板|领导|同事|上班|绩效|周报|项目|kpi|KPI|裁员/],
  ["love", /感情|喜欢|暗恋|分手|对象|男朋友|女朋友|恋爱|前任|桃花|暧昧|结婚/],
  ["sleep", /睡不着|失眠|焦虑|心慌|好烦|崩溃|emo|难受|压力/],
  ["money", /钱|工资|存款|理财|房贷|基金|股票|穷/],
  ["family", /爸|妈|父母|家里|催婚|亲戚/],
  ["study", /考试|考研|考公|论文|学习|毕业|面试/],
  ["vent", /吐槽|无语|气死|烦死|离谱/],
  ["hello", /^(你好|嗨|hi|hello|在吗|在不在)/i],
];

const REPLIES: Record<Topic, { think: string; body: string[]; cast?: "hexagram" | "tarot" }> = {
  work: {
    think: "又是工作。听起来不是一件事压垮的，是很多小事叠起来的。先接住，再拆一下。",
    body: [
      "*把你的工位想象成一张卦盘，看了一眼*\n\n累是真的累。不是你不行，是事情太多、边界太少。\n\n今晚先做一件事：把明天必须做的列三条，其余的，统统写进「以后再说」。\n\n能做完三条就算赢。剩下的？算了。",
      "上班这件事，本来就是拿时间换钱，不是拿命换。\n\n你可以认真，但不用把老板的情绪也一起扛回家。\n\n下班路上听首歌吧，工作留在工位上，它跑不了。",
    ],
  },
  love: {
    think: "感情的事，先别急着给结论。对方的心算不准，但自己的心可以看清。",
    body: [
      "*轻轻叹了口气*\n\n感情最磨人的不是结果，是悬着。\n\n问问自己一个问题就好：**这段关系让你更像你自己，还是更不像？**\n\n答案你可能已经有了。要是还想看看，可以抽张牌。",
      "喜欢一个人没有错，想得太多也没有错。\n\n只是别把自己的价值，押在对方回不回消息上。\n\n今晚把手机放远一点，好好睡。",
    ],
    cast: "tarot",
  },
  decide: {
    think: "TA 卡在一个选择上。纠结本身说明两边都有分量。可以借一卦，把心里的倾向照出来。",
    body: [
      "纠结的时候，人其实往往心里已经偏向一边了，只是不敢承认。\n\n有个小办法：假装抛硬币，硬币在空中的那一秒，你希望它落哪面？\n\n要不，我们正经摇一卦。亲手摇，心会更静。",
    ],
    cast: "hexagram",
  },
  sleep: {
    think: "TA 现在很难受。不要分析，不要讲道理，先陪着。",
    body: [
      "*把灯调暗了一点*\n\n嗯，我在。\n\n先什么都不用想。跟着我：吸气四秒，停四秒，呼气六秒。来三次。\n\n深夜的脑子很会放大问题，**今晚得出的结论，一律不算数**。明天天亮了再说，好吗？",
      "难受的时候不用硬撑着说「我没事」。\n\n你可以只说一句「好烦」，我就知道了。\n\n要是愿意，说说是什么在脑子里转？不想说也行，就在这儿待一会儿。",
    ],
  },
  money: {
    think: "钱的焦虑很具体，也很普遍。先降温，再给一个小动作。",
    body: [
      "钱这件事，焦虑解决不了，表格可以。\n\n今晚花五分钟，把这个月固定要花的写下来，再写一个「不花也不会死」的清单。\n\n能省的省，省不了的——算了，人总得吃顿好的。",
    ],
  },
  family: {
    think: "家里的事最难，因为有爱也有拉扯。边界感是关键。",
    body: [
      "家人的话，往往是爱用错了方式说出来。\n\n你不用说服他们，也不用被他们说服。\n\n**听着，点头，然后按自己的节奏过。** 这不叫不孝，叫成年。",
    ],
  },
  study: {
    think: "考试/学习的压力。重点是把巨大的焦虑缩小成今天能做的事。",
    body: [
      "备考的焦虑，一半来自「还有好多没看」，一半来自「万一考不上」。\n\n第一半，拆成今天的三页就好。第二半——\n\n考不上的人生也是人生，只是换条路。但你先别急着替未来的自己害怕。",
    ],
  },
  vent: {
    think: "TA 想吐槽，那就让 TA 痛快吐。我只需要站在 TA 这边。",
    body: [
      "*拉了把椅子坐下*\n\n来，尽管骂，我负责点头。\n\n……\n\n骂完了是不是舒服一点？这事确实离谱，不是你的问题。\n\n气完了，就算了吧，别让离谱的人占用你晚上的时间。",
    ],
  },
  cast: {
    think: "TA 想算一算。让 TA 带着问题亲手来，仪式感会让心先定下来。",
    body: [
      "好，那我们正经来。\n\n先在心里默念你想问的事，越具体越好，比如「这周要不要跟领导提调岗」。\n\n准备好了，就点下面亲手摇。",
    ],
    cast: "hexagram",
  },
  hello: {
    think: "TA 来打招呼了。轻松一点回应，顺手问一句近况。",
    body: ["在呢。\n\n今天过得怎么样？是想聊聊，还是想算一算？"],
  },
  general: {
    think: "还不太确定 TA 想聊什么。先接住，轻轻问一句。",
    body: [
      "嗯，我听着呢。\n\n能再多说一点吗？比如这件事最让你卡住的是哪一部分。",
      "*点点头*\n\n明白。有时候说出来，事情就已经轻了一半。\n\n要是想换个角度看看，我们也可以起一卦。",
    ],
  },
};

export function pickTopic(text: string): Topic {
  for (const [t, r] of RULES) if (r.test(text)) return t;
  return "general";
}

export function interpretCast(c: CastResult, question?: string): string {
  const names = LINE_NAMES(c.lines);
  const ch = c.changing.map((p) => names[p - 1]);
  const o = c.original;
  const parts = [
    `*看着六道爻画，安静了一会儿*`,
    `${question ? `你问的是「${question}」。\n\n` : ""}摇出来的是 **${o.full}**。卦辞说：「${o.judgment}」`,
    `说成大白话：${o.modern}`,
    `互卦是${c.nuclear.full}，这是事情里面藏着的那股暗流——${c.nuclear.modern}`,
  ];
  if (c.resulting) {
    parts.push(`${ch.join("、")}动了，卦变成 **${c.resulting.full}**。也就是说，顺着走下去，会慢慢变成：${c.resulting.modern}`);
  } else {
    parts.push("六爻都没动，说明眼下就是这个局面，不会突然大变。别急着改变什么。");
  }
  parts.push(`最后一句：**${(c.resulting ?? o).letgo}**`);
  return parts.join("\n\n");
}

export function interpretTarot(t: TarotResult, question?: string): string {
  const lines = t.cards.map((d) => `**${d.position} · ${d.card.name}${d.reversed ? "（逆位）" : ""}**\n${d.reversed ? d.card.reversed : d.card.upright}`);
  const last = t.cards[t.cards.length - 1];
  return [
    `*把牌一张张翻开*`,
    `${question ? `关于「${question}」，` : ""}这次是${SPREADS[t.spread].name}。`,
    ...lines,
    `牌不替你做决定，它只是把你心里的东西摆到桌面上。\n\n**${last.card.letgo}**`,
  ].join("\n\n");
}

export function interpretBazi(b: BaziResult, k?: KLineResult): string {
  const fav = b.favorable.map((e) => ELEMENT_CN[e]).join("、");
  const parts = [
    `*把四柱一字排开，看了好一会儿*`,
    `你的日元是 **${b.dayMaster}**，${b.strength}。${b.traits}`,
    `五行里最多的是${ELEMENT_CN[(Object.entries(b.elements).sort((a, c) => c[1] - a[1])[0][0]) as keyof typeof ELEMENT_CN]}，喜用在 **${fav}**。平时多接触对应的东西——颜色、方位、做的事——会顺手一些。`,
  ];
  if (k) {
    parts.push(`人生曲线上，**${k.peak.age} 岁（${k.peak.year}）** 前后是一段高点，**${k.trough.age} 岁（${k.trough.year}）** 附近要多照顾自己。`);
    parts.push(`高点别飘，低点别慌。曲线是起伏的，人也是。`);
  }
  parts.push(`命盘是一张地图，不是一张判决书。路怎么走，还是你说了算。剩下的，算了。`);
  return parts.join("\n\n");
}

let rot = 0;
export function mockReply(opts: { text: string; persona?: string | null; castSummary?: { kind: "hexagram"; data: CastResult } | { kind: "tarot"; data: TarotResult } | null }) {
  const p = getPersona(opts.persona);
  if (opts.castSummary) {
    const body = opts.castSummary.kind === "hexagram" ? interpretCast(opts.castSummary.data, opts.castSummary.data.question) : interpretTarot(opts.castSummary.data, opts.castSummary.data.question);
    return `<think>对方亲手起好了。照着卦象/牌面一点点讲，结合 TA 的处境，最后落在放下上。</think>${body}`;
  }
  const topic = pickTopic(opts.text);
  const r = REPLIES[topic];
  const body = r.body[rot++ % r.body.length];
  const tail = r.cast ? `\n\n[[cast:${r.cast}]]` : "";
  const sign = p.id === "junshi" ? "\n\n其他的，算了。" : "";
  return `<think>${r.think}</think>${body}${sign}${tail}`;
}

export async function* chunkText(text: string, signal?: AbortSignal) {
  const chars = Array.from(text);
  let i = 0;
  while (i < chars.length) {
    if (signal?.aborted) return;
    const n = 2 + Math.floor(Math.random() * 4);
    yield chars.slice(i, i + n).join("");
    i += n;
    await new Promise((r) => setTimeout(r, 18 + Math.random() * 30));
  }
}
