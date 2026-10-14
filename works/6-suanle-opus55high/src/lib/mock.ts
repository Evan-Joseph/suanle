import { HEXAGRAMS, TAROT, todayAlmanac } from "./divination";

export interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

export interface ProfileLite {
  name?: string;
  birth?: string;
  facts?: string[];
  tags?: string[];
}

export const LETGO_LINES = [
  "想不通的事，就先放在想不通那一格。算了。",
  "你已经尽力了，剩下的交给时间。算了。",
  "别人的嘴，管不住；自己的心，可以先放过。算了。",
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

function extractName(t: string): string | null {
  const m = t.match(/(?:叫我|我叫|我是|喊我|称呼我)\s*([\u4e00-\u9fa5A-Za-z]{1,6})/);
  if (!m) return null;
  const n = m[1].replace(/(吧|就好|就行|啊|呀|哈)$/, "");
  if (/^(谁|什么|一个|有点|不是|很|好|最近)/.test(n)) return null;
  return n || null;
}

function extractBirth(t: string): string | null {
  const m = t.match(/((?:19|20)\d{2})[年\-/.](\d{1,2})[月\-/.](\d{1,2})日?(?:\s*(\d{1,2})[点:：时](\d{1,2})?)?/);
  if (!m) return null;
  const pad = (x: string | number) => String(x).padStart(2, "0");
  return `${m[1]}-${pad(m[2])}-${pad(m[3])}${m[4] ? ` ${pad(m[4])}:${pad(m[5] ?? 0)}` : ""}`;
}

/** 离线时的本地回应：保证体验不断裂，依旧有人味 */
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
  const ending = `\n\n> ${pick(LETGO_LINES)}`;

  // 卦象解读
  const hexHit = HEXAGRAMS.filter((h) => t.includes(h.full));
  if (/摇出来是|卦/.test(t) && hexHit.length) {
    const [p, c] = hexHit;
    return (
      `<think>本卦${p.full}，上${p.upper}下${p.lower}。${c ? `之卦${c.full}，事情有转向。` : "无动爻，看本卦卦辞。"}结合所问，取其象，说人话。</think>` +
      `这一卦是 **${p.full}**。\n\n${p.gist}` +
      (c ? `\n\n后面变成了 **${c.full}**——${c.gist}也就是说，事情不会一直停在现在这个样子，它在往那个方向走。` : "\n\n六个爻都很安静，说明局面短期内比较稳，不用天天去盯着它。") +
      `\n\n给你一个小建议：今天先做一件**最小的、你能掌控的事**，比如把那条消息的草稿写好，但先别发。\n\n> ${p.letgo}`
    );
  }

  // 塔罗解读
  const cards = TAROT.filter((c) => t.includes(c.name));
  if (/塔罗|抽了|此刻的你/.test(t) && cards.length) {
    const lines = cards.slice(0, 3).map((c, i) => {
      const rev = new RegExp(`${c.name}（逆位）`).test(t);
      return `- **${["此刻的你", "卡住你的", "可以试试"][i] ?? "补充"} · ${c.name}${rev ? "（逆）" : ""}**：${rev ? c.rev : c.up}`;
    });
    return (
      `<think>三张牌阵：现状 / 阻碍 / 建议。${cards.map((c) => c.name).join("、")}，主题围绕自我与选择。</think>` +
      `牌摊开了，我们一张张看：\n\n${lines.join("\n")}\n\n连起来读，大概是：你心里其实早有答案，只是还在等一个"被允许"的感觉。那就由我来说吧——**你可以的，也可以不**。` +
      ending
    );
  }

  if (/四柱|生辰|日主/.test(t) && /五行/.test(t)) {
    return (
      `<think>看日主旺衰与五行流通，缺什么补什么，多什么泄什么，转为生活建议。</think>` +
      `你的盘我看了。日主是你的"本我"，五行是你身上几股力气。\n\n- 多的那一行，是你的**天赋也是你的执念**，容易用力过猛；\n- 少的那一行，是你**需要向外借**的东西——朋友、环境、习惯都能补。\n\n最近别给自己排太满，留出空白的时间，运气才有地方落脚。` +
      ending
    );
  }

  if (name) {
    return `${name}，好名字，记住啦。\n\n今天是想聊点心事，还是想让我帮你**算一算**？摇一卦、抽张牌、看看今天的黄历，都行。不想算也没关系，坐会儿也挺好。${memoStr}`;
  }

  if (birth) {
    return `收到，生辰我记下了。来，看看你的盘：${widget({ widget: "bazi" })}${memoStr}`;
  }

  if (/摇|卦|六爻|问事|问个事/.test(t)) {
    return `好，心里默念你想问的事，**一件就好**，越具体越准。准备好了就摇吧，摇六次。${widget({ widget: "coins", question: "" })}${memoStr}`;
  }
  if (/塔罗|tarot|抽牌|抽张/.test(t)) {
    return `洗好牌了。深呼吸，凭感觉选三张，不用想太多——第一眼的那张，往往就是对的。${widget({ widget: "tarot" })}${memoStr}`;
  }
  if (/八字|命盘|紫微|生日|出生/.test(t)) {
    return `看命盘得先知道你哪天来到这个世界。填一下就好，时辰不知道也没关系。${widget({ widget: "bazi" })}${memoStr}`;
  }
  if (/今天|运势|黄历|宜|忌/.test(t)) {
    const a = todayAlmanac();
    return `今天是${a.lunarText}，${a.dayWx}气当令。\n\n宜${a.yi.slice(0, 2).join("、")}，忌${a.ji.slice(0, 2).join("、")}——当然，古人的宜忌听一半就好，另一半听你自己的。${widget({ widget: "almanac" })}\n\n> ${a.line}${memoStr}`;
  }
  if (/烦|累|焦虑|难过|失眠|内耗|emo|崩溃|压力|委屈|想哭|不开心/.test(t)) {
    return (
      `<think>情绪先于问题。先接住，再给出口。</think>` +
      `${call}，先抱一下。\n\n能说出来已经很不容易了。很多事情当下像天塌了，过阵子回头看，可能只是一片云。\n\n要不要试试：把这件事写下来，揉成一团，丢掉。听起来有点傻，但手比脑子先学会放下。${widget({ widget: "letgo", text: t.slice(0, 40) })}` +
      ending +
      memoStr
    );
  }
  if (/^(你好|hi|hello|嗨|在吗|哈喽)/i.test(t)) {
    return `在呢。${profile.name ? `${profile.name}，` : ""}今天过得怎么样？${!profile.name ? "\n\n对了，还不知道怎么称呼你？" : ""}`;
  }

  return (
    `嗯，我听着呢。\n\n${t.length > 30 ? "你说的这些，我大概能感觉到那种拧巴。" : "这事儿说大不大，说小也不小。"}要不我们换个角度：**如果这件事一年后回头看，它还会这么重要吗？**\n\n想深聊的话，我可以帮你摇一卦看看走向；只想吐槽，我也接得住。` +
    (!profile.name ? "\n\n还不知道怎么称呼你呢？" : "") +
    ending +
    memoStr
  );
}

export const WELCOME_NEW =
  "嗨，我是**算了**。\n\n一个懂点八字、会摇卦、偶尔也翻翻塔罗的老朋友。不过比起算命，我更擅长陪你把心里那团乱麻理一理。\n\n先认识一下——我该怎么称呼你？";

export function welcomeBack(name?: string): string {
  const h = new Date().getHours();
  const time = h < 5 ? "这么晚还没睡" : h < 11 ? "早" : h < 14 ? "中午好" : h < 18 ? "下午好" : "晚上好";
  return `${time}，${name ?? "朋友"}。\n\n今天想**算一算**，还是想**算了**？都行，我在。`;
}
