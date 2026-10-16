import { HEXAGRAMS, TAROT, TAROT_POSITIONS, computeBazi, todayAlmanac, WX_ORDER } from "./divination";

/** 本地陪伴：在没有网络或模型服务时，依然自洽、有温度地接住对方 */

export interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

export interface ProfileLite {
  name?: string;
  birth?: string;
  gender?: string;
  facts?: string[];
  tags?: string[];
}

export const LETGO_LINES = [
  "想不通的事，就先放在想不通那一格。算了。",
  "你已经尽力了，剩下的交给时间。算了。",
  "别人的嘴管不住，自己的心可以先放过。算了。",
  "不是所有的门都要敲开。算了，前面还有路。",
  "今天先到这儿，明天的事，明天的你会处理。算了。",
  "追不上的公交，等下一班就好。算了。",
  "执念像握紧的沙，松开手反而留得住。算了。",
  "你不欠任何人一个完美的自己。算了。",
  "纸团进了纸篓，事情就留在纸篓里。算了。",
  "肩膀放下来，呼一口气。算了。",
];

const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

function widget(obj: Record<string, unknown>): string {
  return "\n\n```suanle\n" + JSON.stringify(obj) + "\n```";
}

function extractName(t: string): string | null {
  const m = t.match(/(?:叫我|我叫|我是|喊我|称呼我)\s*([\u4e00-\u9fa5A-Za-z]{1,6})/);
  if (!m) return null;
  const n = m[1].replace(/(吧|就好|就行|啊|呀|哈|呢)$/, "");
  if (!n || /^(谁|什么|一个|有点|不是|很|好|最近|个|在|想|那个)/.test(n)) return null;
  return n;
}

export function extractBirth(t: string): string | null {
  const m = t.match(/((?:19|20)\d{2})[年\-/.](\d{1,2})[月\-/.](\d{1,2})[日号]?(?:\D{0,4}?(\d{1,2})[点:：时](\d{1,2})?)?/);
  if (!m) return null;
  const pad = (x: string | number) => String(x).padStart(2, "0");
  let hour = m[4] !== undefined ? Number(m[4]) : null;
  if (hour !== null && hour < 12 && /下午|晚上|傍晚|夜里/.test(m[0])) hour += 12;
  if (hour !== null && hour > 23) hour = null;
  return `${m[1]}-${pad(m[2])}-${pad(m[3])}${hour !== null ? ` ${pad(hour)}:${pad(m[5] ?? 0)}` : ""}`;
}

export function extractGender(t: string): string | null {
  if (/我是(个)?(女生|女孩|女的)|本姑娘/.test(t)) return "女";
  if (/我是(个)?(男生|男孩|男的)/.test(t)) return "男";
  return null;
}

function timeWord(h = new Date().getHours()) {
  return h < 5 ? "这么晚还没睡" : h < 11 ? "早上好" : h < 14 ? "中午好" : h < 18 ? "下午好" : "晚上好";
}

export function greeting(name?: string): { title: string; sub: string } {
  if (!name) {
    return {
      title: "嗨，我是算了。",
      sub: "一个懂点八字、会摇卦、偶尔翻翻塔罗的老朋友。比起算命，我更擅长陪你把心里那团乱麻理一理。先认识一下——该怎么称呼你？",
    };
  }
  const h = new Date().getHours();
  if (h < 5) return { title: `这么晚了，${name}。`, sub: "睡不着就聊两句。聊完，早点睡。" };
  const subs = ["今天想算一算，还是想算了？都行，我在。", "坐。今天有想说的事，还是只想安静待会儿？", "老位置给你留着。今天过得怎么样？"];
  return { title: `${timeWord(h)}，${name}。`, sub: subs[new Date().getDate() % subs.length] };
}

/** 第一条消息发出时，写进会话的开场白，让模型知道自己问过什么 */
export function introText(name?: string): string {
  const g = greeting(name);
  return `${g.title}\n\n${g.sub}`;
}

export function mockReply(messages: ChatMsg[], profile: ProfileLite = {}, opts: { deep?: boolean } = {}): string {
  const last = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const t = last.trim();
  const call = profile.name || "朋友";
  const memo: Record<string, unknown> = {};
  const name = !profile.name ? extractName(t) : null;
  if (name) memo.name = name;
  const birth = extractBirth(t);
  if (birth) memo.birth = birth;
  const gender = extractGender(t);
  if (gender) memo.gender = gender;
  const memoStr = Object.keys(memo).length ? `\n<memo>${JSON.stringify(memo)}</memo>` : "";
  const ending = `\n\n> ${pick(LETGO_LINES)}`;
  const deepTail = opts.deep
    ? "\n\n**再往深一层说**\n\n很多时候我们焦虑的不是事情本身，而是\"失控感\"。所以先把能控制的部分拎出来：今天能做的一件小事、这周能问的一个人、这个月能攒下的一点余地。剩下那些控制不了的，就交给时间和运气。\n\n**今天就能做的**\n\n- 把这件事用一句话写下来，越短越好\n- 选一个最小的动作，十分钟内能完成的那种\n- 晚上给自己留半小时，什么都不想"
    : "";

  // 卦象解读
  const hexHit = HEXAGRAMS.filter((h) => t.includes(h.full));
  if (/摇出来是/.test(t) && hexHit.length) {
    const [p, c] = hexHit;
    return (
      `<think>本卦${p.full}，上${p.upper}下${p.lower}。${c ? `之卦${c.full}，事情有转向，重点看变化的方向。` : "六爻安静，以本卦卦意为主。"}取其象，说人话。</think>` +
      `这一卦是 **${p.full}**。\n\n${p.gist}` +
      (c
        ? `\n\n后面变成了 **${c.full}**——${c.gist}也就是说，事情不会一直停在现在这个样子，它正往那个方向走。`
        : "\n\n六个爻都很安静，说明局面短期内比较稳，不用天天去盯着它。") +
      `\n\n给你一个小建议：先做一件**最小的、你能掌控的事**。比如把那条消息的草稿写好，但先别发，睡一觉再看。${deepTail}\n\n> ${p.letgo}`
    );
  }

  // 塔罗解读
  const cards = TAROT.filter((c) => t.includes(`**${c.name}**`) || t.includes(c.name));
  if (/塔罗|抽了|此刻的你/.test(t) && cards.length) {
    const lines = cards.slice(0, 3).map((c, i) => {
      const rev = t.includes(`${c.name}**（逆位）`) || t.includes(`${c.name}（逆位）`);
      return `- **${TAROT_POSITIONS[i] ?? "补充"} · ${c.name}${rev ? "（逆）" : ""}**：${rev ? c.rev : c.up}`;
    });
    return (
      `<think>三张牌阵：现状 / 阻碍 / 建议。${cards.map((c) => c.name).join("、")}，主题落在自我与选择。</think>` +
      `牌摊开了，我们一张张看：\n\n${lines.join("\n")}\n\n连起来读，大概是：你心里其实早有答案，只是还在等一个"被允许"的感觉。那我来说吧——**你可以，也可以不**。${deepTail}` +
      ending
    );
  }

  if (/紫微命盘/.test(t)) {
    const soul = t.match(/命宫（[^）]*）：([^\n；]+)/)?.[1] ?? "";
    return (
      `<think>先看命宫主星定基调，再看三方四正的支撑，最后落到生活里能用的建议。</think>` +
      `你的命宫${soul ? `坐的是 **${soul.split("、")[0]}**` : "我看了"}。\n\n紫微看人，先看命宫是什么底色，再看三方四正给不给力。你的盘有一个挺明显的特点：**内在的韧性比表现出来的多**——别人看你可能觉得挺随和，其实你心里有自己的一套秩序。\n\n这样的人最容易累在"想得太周全"。所以给你的建议很简单：**重要的事想三遍，不重要的事想一遍就够了**。${deepTail}` +
      ending
    );
  }

  if (/四柱|生辰/.test(t) && /五行|日主/.test(t)) {
    const b = computeBazi(profile.birth ?? extractBirth(t), profile.gender);
    const strong = b?.strongest ?? WX_ORDER[0];
    const weak = b?.weakest ?? WX_ORDER[3];
    return (
      `<think>日主${b ? `${b.dayMaster}${b.dayMasterWx}` : ""}，看五行旺衰与流通：${strong}旺、${weak}弱。多的泄，少的补，转成生活建议。</think>` +
      `你的盘我看了。日主是你的"本我"，五行是你身上几股力气。\n\n- **${strong}**最旺：这是你的天赋，也容易变成执念，用力过猛的时候要提醒自己收一收；\n- **${weak}**偏弱：这是你需要向外借的东西——朋友、环境、习惯都能补。\n\n最近别给自己排太满，留点空白，运气才有地方落脚。${deepTail}` +
      ending
    );
  }

  if (name) {
    return `${name}，好名字，记住啦。\n\n今天是想聊点心事，还是想让我帮你**算一算**？摇一卦、抽张牌、看看今天的黄历，都行。不想算也没关系，坐会儿也挺好。${memoStr}`;
  }
  if (birth) {
    return `收到。来，看看你的盘：${widget({ widget: "bazi" })}${memoStr}`;
  }
  if (/摇|卦|六爻|问事|问个事/.test(t)) {
    return `好。心里默念你想问的事，**一件就好**，越具体越准。准备好了就摇，一共六次。${widget({ widget: "coins", question: "" })}${memoStr}`;
  }
  if (/塔罗|tarot|抽牌|抽张/i.test(t)) {
    return `牌洗好了。深呼吸，凭感觉选三张，不用想太多——第一眼的那张，往往就是对的。${widget({ widget: "tarot" })}${memoStr}`;
  }
  if (/紫微/.test(t)) {
    return `紫微得看生辰，时辰越准越好。${widget({ widget: "ziwei" })}${memoStr}`;
  }
  if (/八字|命盘|生日|出生/.test(t)) {
    return `看命盘得先知道你哪天来到这个世界。填一下就好，时辰不记得也没关系。${widget({ widget: "bazi" })}${memoStr}`;
  }
  if (/今天|运势|黄历|宜|忌/.test(t)) {
    const a = todayAlmanac();
    return `今天是农历${a.lunarText}，${a.dayGz}日。\n\n宜${a.yi.slice(0, 2).join("、")}，忌${a.ji.slice(0, 2).join("、")}——古人的宜忌听一半就好，另一半听你自己的。${widget({ widget: "almanac" })}\n\n> 算了，${a.line}${memoStr}`;
  }
  if (/烦|累|焦虑|难过|失眠|内耗|emo|崩溃|压力|委屈|想哭|不开心|睡不着|好难/i.test(t)) {
    return (
      `<think>情绪先于问题。先接住，再给一个出口。</think>` +
      `${call}，先抱一下。\n\n能说出来已经很不容易了。很多事当下像天塌了，过一阵回头看，可能只是一片云。\n\n要不要试试：把这件事写下来，揉成一团，丢掉。听起来有点傻，但手往往比脑子先学会放下。${widget({ widget: "letgo", text: t.slice(0, 40) })}` +
      ending +
      memoStr
    );
  }
  if (/^(你好|hi|hello|嗨|在吗|哈喽|在不在)/i.test(t)) {
    return `在呢。${profile.name ? `${profile.name}，` : ""}今天过得怎么样？${!profile.name ? "\n\n对了，还不知道怎么称呼你？" : ""}${memoStr}`;
  }
  return (
    `嗯，我听着呢。\n\n${t.length > 30 ? "你说的这些，我大概能感觉到那种拧巴。" : "这事儿说大不大，说小也不小。"}要不换个角度：**如果一年后回头看，它还会这么重要吗？**\n\n想深聊的话，我可以帮你摇一卦看看走向；只想吐槽，我也接得住。` +
    (!profile.name ? "\n\n还不知道怎么称呼你呢？" : "") +
    deepTail +
    ending +
    memoStr
  );
}

/** 本地标题与分类 */
export const CATEGORIES = ["情感", "事业", "学业", "财运", "健康", "家庭", "人际", "占卜", "日常"] as const;

export function localTitle(firstUser: string): { title: string; category: string } {
  const t = firstUser;
  const category = /爱|喜欢|分手|对象|男朋友|女朋友|暧昧|前任|结婚|感情/.test(t)
    ? "情感"
    : /工作|老板|同事|加班|跳槽|面试|升职|项目|裁员|辞职/.test(t)
      ? "事业"
      : /考试|学习|论文|考研|毕业|学校|作业/.test(t)
        ? "学业"
        : /钱|工资|投资|股票|基金|理财|房贷|花呗/.test(t)
          ? "财运"
          : /身体|失眠|生病|焦虑|健康|睡/.test(t)
            ? "健康"
            : /爸|妈|父母|家里|孩子|老公|老婆/.test(t)
              ? "家庭"
              : /朋友|社交|室友|人际/.test(t)
                ? "人际"
                : /卦|塔罗|八字|命盘|紫微|黄历|运势/.test(t)
                  ? "占卜"
                  : "日常";
  const title = t.replace(/[\s\n]+/g, " ").replace(/[，。！？,.!?].*$/, "").slice(0, 10) || "随便聊聊";
  return { title, category };
}
