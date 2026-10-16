import { HEXAGRAMS, TAROT, todayAlmanac, computeBazi } from "./divination";

export interface ChatMsg { role: "user" | "assistant"; content: string }
export interface ProfileLite { name?: string; birth?: string; facts?: string[]; tags?: string[] }

export const WELCOME_NEW = `嘿，来了。

这里不赶时间。你可以先随便说说——最近在忙什么，或者有什么事在心里绕来绕去。

想算的，咱们认真算；算完了，该放的也就放了。`;

export const welcomeBack = (name: string) => `${name}，又见面了。

今天是想算点什么，还是就坐一会儿，随便聊聊？`;

export const LETGO_LINES = [
  "想不通的事，就先放在想不通那一格。算了。",
  "你已经尽力了，剩下的交给时间。算了。",
  "别人的嘴管不住，自己的心可以先放过。算了。",
  "不是所有的门都要敲开。算了，前面还有路。",
  "今天先到这儿，明天的事明天的你会处理。算了。",
  "追不上的公交，等下一班就好。算了。",
  "执念像握紧的沙，松手反而留得住。算了。",
  "你不欠任何人一个完美的自己。算了。",
];

function pick<T>(arr: T[], seed?: number): T {
  const i = seed === undefined ? Math.floor(Math.random() * arr.length) : seed % arr.length;
  return arr[i];
}
function widget(obj: Record<string, unknown>): string {
  return "\n\n```suanle\n" + JSON.stringify(obj) + "\n```";
}
export function extractName(t: string): string | null {
  const m = t.match(/(?:叫我|我叫|我是|喊我|称呼我)\s*([\u4e00-\u9fa5A-Za-z]{1,6})/);
  if (!m) return null;
  const n = m[1].replace(/(吧|就好|就行|啊|呀|哈)$/, "");
  if (/^(谁|什么|一个|有点|不是|很|好|最近|真的)/.test(n)) return null;
  return n || null;
}
export function extractBirth(t: string): string | null {
  const m = t.match(/((?:19|20)\d{2})[年\-/.](\d{1,2})[月\-/.](\d{1,2})日?(?:\s*(\d{1,2})[点:：时](\d{1,2})?)?/);
  if (!m) return null;
  const pad = (x: string | number) => String(x).padStart(2, "0");
  return `${m[1]}-${pad(m[2])}-${pad(m[3])}${m[4] ? ` ${pad(m[4])}:${pad(m[5] ?? 0)}` : ""}`;
}

/** 离线时的本地回应：保证旅程不断裂，依旧有人味 */
export function mockReply(messages: ChatMsg[], profile: ProfileLite = {}): string {
  const last = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const t = last.trim();
  const call = profile.name ? profile.name : "朋友";
  const memo: Record<string, unknown> = {};
  const name = !profile.name ? extractName(t) : null;
  if (name) memo.name = name;
  const birth = extractBirth(t);
  if (birth) memo.birth = birth;
  const memoStr = Object.keys(memo).length ? `\n<memo>${JSON.stringify(memo)}</memo>` : "";
  const who = name ?? call;

  // 卦象解读
  const hexHit = /摇出来是\s*\*\*(.+?)\*\*/.exec(t);
  if (hexHit) {
    const h = HEXAGRAMS.find((x) => hexHit[1].includes(x.name) && hexHit[1].includes(x.full.slice(0, 1))) ?? HEXAGRAMS.find((x) => hexHit[1].includes(x.full)) ?? pick(HEXAGRAMS);
    const chg = /变\s*\*\*(.+?)\*\*/.exec(t);
    const ch = chg ? HEXAGRAMS.find((x) => chg[1].includes(x.full)) : null;
    return `<think>本卦 ${h.full}，上${h.upper}下${h.lower}。
${ch ? `之卦 ${ch.full}，事情的走向在变。` : "无动爻，看本卦卦辞即可。"}
卦气：${h.gist}
结合问题，重点看态度而非吉凶。</think>**${h.full}**，${h.upper === h.lower ? "上下同气" : `上${h.upper}下${h.lower}`}。

${h.gist}

${ch ? `它会往 **${ch.full}** 走——${ch.gist}` : "这一卦很安静，没有动爻，意思是：局面不会突然变，你现在的做法大体是对的。"}

落到你问的事上：别去赌一个瞬间的结果，看的是你接下来一两个月的姿态。

> 算了，${h.letgo.replace(/^算了，?/, "")}${memoStr}`;
  }

  // 塔罗解读
  if (/此刻的你：\*\*/.test(t)) {
    const names = [...t.matchAll(/\*\*(.+?)\*\*（(正位|逆位)）/g)].map((m) => ({ card: TAROT.find((c) => c.name === m[1]) ?? TAROT[0], rev: m[2] === "逆位" }));
    const [a, b, c] = names;
    if (a && b && c) {
      const line = (x: { card: (typeof TAROT)[number]; rev: boolean }) => (x.rev ? x.card.rev : x.card.up);
      return `<think>三张牌阵：现状 / 阻碍 / 建议。
${a.card.name}${a.rev ? "逆" : "正"} → ${line(a)}
${b.card.name}${b.rev ? "逆" : "正"} → ${line(b)}
${c.card.name}${c.rev ? "逆" : "正"} → ${line(c)}
整体基调：从 ${a.card.name} 到 ${c.card.name}，有流动。</think>**此刻的你 · ${a.card.name}${a.rev ? "（逆位）" : ""}**
${line(a)}。这张牌不评判，它只是把你现在的样子照出来。

**卡住你的 · ${b.card.name}${b.rev ? "（逆位）" : ""}**
${line(b)}。卡住的常常不是事，是你对事的解释。

**可以试试 · ${c.card.name}${c.rev ? "（逆位）" : ""}**
${line(c)}。小小地做一次就好，不用一步到位。

> 算了，牌已经翻开了，剩下的让日子慢慢翻。${memoStr}`;
    }
  }

  // 八字
  if (/这是我的生辰/.test(t) || birth) {
    const b = computeBazi(birth ?? profile.birth);
    if (b) {
      const top = Object.entries(b.wuxing).sort((x, y) => y[1] - x[1])[0];
      const lack = Object.entries(b.wuxing).filter(([, v]) => v === 0).map(([k]) => k);
      return `<think>四柱：${b.pillars.map((p) => p.gz).join(" ")}
日主 ${b.dayMaster}${b.dayMasterWx}，${top[0]} 最旺（${top[1]}），${lack.length ? `缺${lack.join("")}` : "五行俱全"}。
纳音 ${b.nayin}，生肖 ${b.shengxiao}。${b.hourKnown ? "" : "时柱未知，留余地。"}</think>${who}，排出来了。

你是 **${b.dayMaster}${b.dayMasterWx}** 日主（${b.dayMasterWx === "木" ? "像树，要往上长，也怕没土没水" : b.dayMasterWx === "火" ? "像火，热烈，也容易烧得太快" : b.dayMasterWx === "土" ? "像土，稳，能托住人，也容易闷着" : b.dayMasterWx === "金" ? "像金，锋利讲原则，有时太硬" : "像水，通透灵活，有时想太多"}）。命里 **${top[0]}** 最旺${lack.length ? `，**${lack.join("、")}** 偏少` : "，五行还算匀称"}。

大白话讲：${top[0] === "木" ? "你是个有生长欲的人，闲不住，怕停滞。" : top[0] === "火" ? "你情绪来得快去得也快，表达欲强。" : top[0] === "土" ? "你靠谱，别人爱把事托付给你，但你自己常常累。" : top[0] === "金" ? "你做事有标准，有时对自己太狠。" : "你心思细，想得多，夜里尤其。"}

最近该注意的只有一件：${lack.length ? `给自己补点"${lack[0]}"的东西——${lack[0] === "水" ? "多喝水、靠近水、让心流动一下" : lack[0] === "木" ? "去有树的地方走走，让事情慢慢长" : lack[0] === "火" ? "多见太阳、多见人，别把自己关着" : lack[0] === "土" ? "吃饱睡好，稳住节奏" : "把该断的断掉，给自己立几条规矩"}。` : "别贪多，一次只做一件事。"}

> 算了，命盘只是地图，走哪条路还是你说了算。${memoStr}`;
    }
  }

  // 情绪 & 意图
  if (/(焦虑|累|撑不住|崩溃|难受|想哭|压力|烦死|熬不下去|emo)/.test(t)) {
    return `${who}，先别急着分析，我听见了。

能说出"${t.slice(0, 14)}${t.length > 14 ? "…" : ""}"这句话，本身就已经很不容易了。

要不这样，你把最压着你的那件事写下来，咱们把它揉成一团，先扔了再说。扔完要是还想聊，我在。${widget({ widget: "letgo", text: t.slice(0, 20) })}${memoStr}`;
  }
  if (/(要不要|该不该|还是|选哪个|值得吗|能成吗|会不会)/.test(t)) {
    return `这种事，脑子里来回拉锯一百遍也拉不出结果。

咱们换个法子：摇一卦。不是让铜钱替你做决定，是让你看到——结果出来那一瞬间，你心里是松了口气，还是不服。那个反应，才是答案。${widget({ widget: "coins", question: t.slice(0, 30) })}${memoStr}`;
  }
  if (/(感情|喜欢|分手|前任|暧昧|他|她|脱单|复合|爱情|恋爱)/.test(t) && !/(我叫|叫我)/.test(t)) {
    return `感情的事，讲理没用，讲牌还有点用。

抽三张吧：此刻的你、卡住你的、可以试试。抽之前心里想着那个人，想三秒就好，别想太久。${widget({ widget: "tarot", question: t.slice(0, 30) })}${memoStr}`;
  }
  if (/(八字|命盘|五行|命格|我是什么命|生辰)/.test(t) && !birth) {
    return `行，看命盘得先有生辰。

年月日肯定要，时辰知道最好，不知道也能看个七八分。你填一下，我给你排。${widget({ widget: "bazi" })}${memoStr}`;
  }
  if (/(今天|今日|运势|黄历|宜|忌|日子)/.test(t)) {
    const a = todayAlmanac();
    return `今天${a.dateText}，农历${a.lunarText}，${a.ganzhi.split(" ")[2]}。

宜：${a.yi.join("、")}
忌：${a.ji.join("、")}

幸运色是${a.color.name}。${a.line}${widget({ widget: "almanac" })}${memoStr}`;
  }
  if (name) {
    return `${name}，好的，记住了。

那今天是有什么事想算一算，还是就想找个人说说话？两个都行，我都在。${memoStr}`;
  }
  if (/(你好|在吗|哈喽|hi|hello|嗨|你是谁)/i.test(t)) {
    return `在的。

我叫"算了"——会算八字、六爻、塔罗这些，但更擅长陪人把事想开。

怎么称呼你？${memoStr}`;
  }
  if (/(谢谢|感谢|辛苦)/.test(t)) {
    return `客气啥。

去吧，该干嘛干嘛。想起来了再回来坐坐。${memoStr}`;
  }

  // 兜底
  const a = todayAlmanac();
  const opener = pick(["嗯，我在听。", "说下去。", "这事儿听着有点意思。", "慢慢说，不急。"]);
  return `${opener}

${t.length > 40 ? "你说了不少，我先抓住一个点：" : "你刚才那句话里，"}其实藏着一个问题——你到底是想要个答案，还是想要个台阶？

想要答案，咱们摇一卦或抽张牌；想要台阶，我这儿有现成的：${a.line}

${profile.name ? "" : "对了，还没问，怎么称呼你？"}${memoStr}`;
}

/** 本地起标题 */
export function mockTitle(messages: ChatMsg[]): { title: string; category: string; emoji: string } {
  const text = messages.filter((m) => m.role === "user").map((m) => m.content).join(" ");
  const rules: [RegExp, string, string][] = [
    [/(感情|喜欢|分手|前任|暧昧|复合|恋爱|脱单)/, "感情", "💌"],
    [/(工作|老板|同事|跳槽|升职|裁员|面试|创业|事业)/, "事业", "🧭"],
    [/(爸|妈|父母|家里|孩子|婚姻|老公|老婆)/, "家庭", "🏠"],
    [/(钱|工资|花呗|房贷|投资|股票|财运)/, "财运", "🪙"],
    [/(焦虑|累|迷茫|意义|自我|emo|内耗)/, "自我", "🌙"],
  ];
  const hit = rules.find(([r]) => r.test(text));
  const first = messages.find((m) => m.role === "user")?.content ?? "随便聊聊";
  const title = first.replace(/[，。？！、\s]/g, "").slice(0, 10) || "随便聊聊";
  return { title, category: hit?.[1] ?? "日常", emoji: hit?.[2] ?? "☁️" };
}

/** 本地隐喻 */
export function mockMetaphor(tokens: number, profile: ProfileLite = {}) {
  const yuan = tokens / 10000;
  const items = [
    { item: "热拿铁", unit: "杯", price: 18, emoji: "☕" },
    { item: "清香", unit: "炷", price: 5, emoji: "🕯️" },
    { item: "肉包子", unit: "个", price: 2.5, emoji: "🥟" },
    { item: "地铁票", unit: "张", price: 4, emoji: "🚇" },
    { item: "橘子", unit: "斤", price: 6, emoji: "🍊" },
    { item: "公园长椅上的阳光", unit: "刻钟", price: 0.8, emoji: "🌤️" },
  ];
  const tags = (profile.tags ?? []).join(" ");
  const prefer = /咖啡|加班|程序|设计/.test(tags) ? items[0] : /佛|寺|香|拜/.test(tags) ? items[1] : null;
  const it = prefer ?? items[Math.floor(yuan * 7) % items.length];
  const n = Math.max(0.5, Math.round((yuan / it.price) * 2) / 2);
  const lines = ["换成这个，是不是就没那么抽象了。", "算力这东西，落到生活里也就这么点。", "够不够，你心里有数就好。", "值不值，看你松没松一口气。"];
  return { item: it.item, count: `${n} ${it.unit}`, emoji: it.emoji, line: lines[Math.floor(tokens / 997) % lines.length] };
}
