import type { Profile } from "./types";
import { hashStr, seeded } from "./divination";

export const SAYINGS = [
  "能解决的事不用担心，解决不了的事担心也没用。算了。",
  "地球离了谁都转，但你今天离了午觉不行。算了，先睡。",
  "你已经很努力了，剩下的交给时间。算了。",
  "别人怎么想是别人的事，你今晚吃什么才是你的事。算了。",
  "想不通就先别想，明天的你会比今天聪明一点。算了。",
  "人生不是考试，没有标准答案，也没人给你打分。算了。",
  "该来的会来，该走的留不住，中间这段好好吃饭。算了。",
  "允许自己今天只做到六十分。算了，六十分万岁。",
  "那封想了一晚上的回复，其实对方可能根本没在等。算了。",
  "累了就停一下，停下来不是放弃，是换气。算了。",
];

export function saying(seed: string) {
  return SAYINGS[hashStr(seed) % SAYINGS.length];
}

interface M { role: string; content: string }

const TOPICS: { re: RegExp; tag: string; lines: string[] }[] = [
  {
    re: /工作|上班|老板|领导|同事|加班|辞职|裁员|绩效|offer|面试|跳槽|KPI/i,
    tag: "工作",
    lines: [
      "工作这件事啊，像一锅一直在火上的汤——你一走开它就要溢，你守着它又烫手。",
      "先分清楚：哪些是**你能改变的**（比如今天下班的时间、明天先做哪件事），哪些是**你改变不了的**（比如老板的脾气、公司的风向）。",
      "能改变的，挑一件最小的今天就做；改变不了的，就把它当天气——下雨带伞，别骂天。",
    ],
  },
  {
    re: /喜欢|爱|分手|前任|对象|男朋友|女朋友|暗恋|结婚|相亲|暧昧|感情|复合/,
    tag: "感情",
    lines: [
      "感情里最累的，往往不是对方怎么样，而是自己脑子里那场停不下来的连续剧。",
      "试着问自己一句：**如果不考虑对方会怎么想，我自己想要的是什么？** 这个答案，比任何人的回复都重要。",
      "值得的人不用你猜，猜来猜去的，多半是缘分在提醒你：可以松手了。",
    ],
  },
  {
    re: /钱|穷|存款|房贷|理财|工资|负债|花呗|买房|投资/,
    tag: "钱财",
    lines: [
      "钱的焦虑最会骗人——它让你觉得全世界都在赚钱，只有你在原地。",
      "其实大多数人都在差不多的位置上咬着牙。先把账摊开看一眼：**每月固定要花的、可以砍掉的、能攒下来的**，写下来，心里就有底了。",
      "财是慢慢聚的，像攒落叶，一片一片，不用一口气堆成山。",
    ],
  },
  {
    re: /焦虑|失眠|睡不着|累|烦|emo|难过|崩溃|内耗|压力|抑郁|想哭|迷茫/i,
    tag: "自我",
    lines: [
      "先抱一下你。能说出来，就已经比憋着强很多了。",
      "焦虑像手机后台开了太多程序——不是你不行，是同时在跑的东西太多了。今晚可以试试：**把脑子里转的事写在纸上，写完就关灯。**纸替你记着，你负责睡觉。",
      "你不需要今天就想通所有事。今天能好好吃一顿饭、洗个热水澡，就算赢。",
    ],
  },
  {
    re: /爸|妈|父母|家里|孩子|家人|婆婆|催婚/,
    tag: "家人",
    lines: [
      "家里的事最难，因为爱和压力常常裹在一起递过来。",
      "他们的担心是真的，你的边界也是真的。可以温柔地说：**“我知道你们为我好，这件事让我自己来。”** 说一次不行就说十次，像复读机一样也没关系。",
      "血缘是改不了的缘分，但相处的距离，你可以自己调。",
    ],
  },
];

const PROFILE_ASK = [
  "对了，还不知道该怎么称呼你？随便一个小名就行。",
  "要是方便的话，可以告诉我你大概是哪天出生的吗？我好顺手帮你排排盘，不方便也完全没关系。",
  "出生时辰还记得吗？不记得也不要紧，大致是早上、中午还是晚上就行。",
];

export function mockReply(messages: M[], profile: Profile | null): string {
  const last = [...messages].reverse().find((m) => m.role === "user")?.content || "";
  const seed = last + messages.length;
  const r = seeded(hashStr(seed));
  const name = profile?.name ? profile.name : "";
  const call = name ? `${name}，` : "";
  let prof = "";

  // simple profile capture
  const nameM = last.match(/(?:叫我|我叫|我是|称呼我)\s*([\u4e00-\u9fa5A-Za-z]{1,6})/);
  const dateM = last.match(/(19\d{2}|20\d{2})\s*[年\-/.]\s*(\d{1,2})\s*[月\-/.]\s*(\d{1,2})/);
  const p: Record<string, string> = {};
  if (nameM) p.name = nameM[1];
  if (dateM) p.birthDate = `${dateM[1]}-${dateM[2].padStart(2, "0")}-${dateM[3].padStart(2, "0")}`;
  if (Object.keys(p).length) prof = `\n<profile>${JSON.stringify(p)}</profile>`;

  // widget results
  if (/^【六爻】/.test(last)) {
    const hex = last.match(/本卦：(.*?)——(.*)/);
    const chg = last.match(/变卦：(.*?)——(.*)/);
    return `<think>先看本卦定基调，再看动爻和变卦看走向。本卦${hex?.[1] || ""}，${chg ? "有动爻，事情在变" : "无动爻，局面相对稳定"}。</think>\n${call}卦出来了。\n\n**本卦 ${hex?.[1] || ""}**：${hex?.[2] || ""}\n\n${chg ? `**变卦 ${chg[1]}**：${chg[2]}\n\n这说明事情不是一成不变的，眼下的状态会慢慢往变卦的方向走。与其担心结果，不如把注意力放在你此刻能做的那一小步上。` : "六爻安静，说明这件事短期不会有大起伏。急不来，也坏不到哪去。"}\n\n> ${saying(seed)}`;
  }
  if (/^【塔罗】/.test(last)) {
    const cards = last.split("\n").filter((l) => /·/.test(l)).slice(0, 3);
    return `<think>三张牌对应过去、现在与建议，连起来看是一条线。</think>\n${call}牌我替你翻开了，连起来看是这样一条线：\n\n${cards.map((c) => `- ${c.replace(/^[-·\s]+/, "")}`).join("\n")}\n\n过去那张是你走过来的路，不用后悔；现在那张是你此刻的心境，承认它就好；最后那张是给你的一句悄悄话——**不是预言，是提醒。**\n\n> ${saying(seed)}`;
  }
  if (/^【求签】/.test(last)) {
    const poem = last.match(/签文：(.*)/)?.[1] || "";
    return `${call}这支签说的是：「${poem}」\n\n签不是判决书，更像是老天爷随手递来的一张便利贴。把它当成今天的小提醒就好——遇到卡住的时候，想想这句话，没准就松开了。\n\n> ${saying(seed)}`;
  }
  if (/^【八字】/.test(last)) {
    return `<think>日主定性格底色，五行多寡看能量分布，缺的不是“命不好”，只是需要多补一点的方向。</think>\n${call}你的盘我看了一下。\n\n日主是你的“底色”，五行的多少只是能量的分布，**没有好坏，只有特点**。缺的那一项，不是命里缺，而是生活里可以多留意、多补一补的地方。\n\n比起盯着命盘，更重要的是：你现在过得舒不舒服？\n\n> ${saying(seed)}`;
  }

  // divination intent
  if (/算一卦|摇卦|六爻|起卦|算算|占卜/.test(last))
    return `好呀，${call}心里默念你想问的事，越具体越好。准备好了就摇吧👇\n\n[[卡片:六爻]]${prof}`;
  if (/塔罗|抽牌|抽张牌/.test(last)) return `来，${call}深呼吸三次，想着你的问题，抽三张。\n\n[[卡片:塔罗]]${prof}`;
  if (/求签|抽签/.test(last)) return `${call}闭上眼，摇一支今天的签。\n\n[[卡片:求签]]${prof}`;
  if (/八字|命盘|排盘|生辰/.test(last)) return `${call}把生日告诉我，我们一起看看你的“出厂设置”。\n\n[[卡片:八字]]${prof}`;
  if (/算了吧|放下|扔掉|丢掉|不想了/.test(last))
    return `那就算了。把它写下来，揉成一团，丢进纸篓里吧。\n\n[[卡片:纸篓]]${prof}`;

  const topic = TOPICS.find((t) => t.re.test(last));
  let body: string;
  if (topic) {
    body = `<think>用户在说${topic.tag}的事。先接住情绪，再给一个能落地的小动作，最后用一句“算了”收尾。</think>\n${call}${topic.lines.join("\n\n")}`;
  } else if (last.length < 8) {
    const opens = ["嗯，我在听。", "我在呢。", "好嘞～", "收到。"];
    body = `${opens[Math.floor(r() * opens.length)]}${call ? "" : ""}想聊什么都行，大事小事、正经的不正经的。要是一时不知道从哪说起，也可以让我帮你**摇一卦**或者**抽张塔罗**，就当给今天找个由头。`;
  } else {
    body = `${call}我听明白了。很多事情在脑子里转的时候特别大，说出来以后会发现，它其实是一团可以一点点拆开的毛线。\n\n要不我们先挑最扎手的那一根：**这件事里，最让你睡不着的是哪一部分？**`;
  }
  const need = !profile?.name && !p.name ? PROFILE_ASK[0] : !profile?.birthDate && !p.birthDate && messages.length > 3 ? PROFILE_ASK[1] : "";
  return `${body}\n\n> ${saying(seed)}${need ? `\n\n${need}` : ""}${prof}`;
}

export function mockMeta(text: string, tokens: number) {
  const t = TOPICS.find((x) => x.re.test(text));
  let tag = t ? (t.tag === "工作" ? "事业" : t.tag) : "日常";
  if (/【(六爻|塔罗|求签|八字)】|摇卦|塔罗|求签/.test(text)) tag = "占卜";
  const first = text.replace(/【.*?】/g, "").replace(/\s+/g, " ").trim().slice(0, 12);
  return { title: first || "随便聊聊", tag, tokens };
}
