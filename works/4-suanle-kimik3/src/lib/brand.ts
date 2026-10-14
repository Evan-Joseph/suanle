/* ─────────────────────────────────────────────
   算了 · Suanle 品牌与运营配置
   所有运营者可改的内容集中于此。
   ───────────────────────────────────────────── */

export const BRAND = {
  name: "算了",
  pinyin: "Suanle",
  slogan: "算一算，然后，算了。",
  sub: "一间不打烊的命运小馆",
};

/**
 * 香油钱 / 打赏收款码配置。
 * 部署时将 payload 替换为真实收款链接或收款码内容即可（微信收款码解码后的文本 / 支付宝吱口令或链接）。
 * 前端会用该内容实时渲染二维码。
 */
export const PAYMENT = {
  wechat: {
    label: "微信供养",
    payload: "https://github.com/Evan-Joseph/suanle#suanle-tips-wechat",
    hint: "微信扫码 · 随缘添香",
    configured: false, // 替换为真实收款内容后置为 true
  },
  alipay: {
    label: "支付宝乐助",
    payload: "https://github.com/Evan-Joseph/suanle#suanle-tips-alipay",
    hint: "支付宝扫码 · 请杯冰美式",
    configured: false,
  },
  amounts: [6, 18, 36, 66],
};

/** Token 消耗的生活化折算单位 */
export const TOKEN_UNITS = [
  { key: "incense", label: "炷清香", per: 2400, icon: "incense", unit: "炷" },
  { key: "coffee", label: "冰美式", per: 26000, icon: "coffee", unit: "杯" },
  { key: "tree", label: "智慧树", per: 120000, icon: "tree", unit: "棵" },
] as const;

/** 本地兜底的消耗比喻（LLM 比喻不可用时的灵感池） */
export const METAPHOR_POOL: Array<{ min: number; text: string }> = [
  { min: 0, text: "刚点着火折子，香还没烧到第一寸。" },
  { min: 800, text: "约为小馆供上了小半炷香，青烟刚刚飘起来。" },
  { min: 2400, text: "一炷清香烧得正稳，烦恼跟着青烟散了些。" },
  { min: 6000, text: "香灰积了小半盏，够换掌柜煮一壶热茶慢慢聊。" },
  { min: 13000, text: "快够请解签人喝一杯手冲了——豆子还是耶加雪菲。" },
  { min: 26000, text: "正好一杯冰美式下锅，大师今晚的灵感有着落了。" },
  { min: 52000, text: "两杯冰美式下肚，卦摊的灯能为你多亮一宿。" },
  { min: 90000, text: "智慧树的树苗已破土，浇的水都是心事。" },
  { min: 120000, text: "整整一棵智慧树种下了，树荫够乘凉了。" },
  { min: 240000, text: "小馆的功德箱沉甸甸的，掌柜说要给你留座上宾牌位。" },
];

export function metaphorForTokens(tokens: number): string {
  let best = METAPHOR_POOL[0].text;
  for (const m of METAPHOR_POOL) if (tokens >= m.min) best = m.text;
  return best;
}

/** 每日一签：以日期为种子，作诗签 */
export const DAILY_LINES = [
  { text: "今日宜：把「我必须」换成「我可以」。", tag: "宜松绑" },
  { text: "事缓则圆，人缓则安，语迟则贵。", tag: "宜缓" },
  { text: "你纠结的那件事，三个月后只是一段下酒故事。", tag: "宜下酒" },
  { text: "允许自己今天只做七分，剩下三分交给风。", tag: "宜留白" },
  { text: "天塌不下来。塌下来，也先砸不着先睡觉的人。", tag: "宜早睡" },
  { text: "今日卦象：地天泰。小往大来，慢慢都会顺。", tag: "泰" },
  { text: "别在深夜给人生下结论，深夜只适合做泡面。", tag: "忌深夜决策" },
  { text: "念念不忘，必有回响；若是没响，就当放过。", tag: "宜放下" },
  { text: "今日开运小物：一杯热饮，和十分钟不看屏幕的眼睛。", tag: "开运" },
  { text: "人生海海，先上岸的人也未必快乐。慢慢游。", tag: "宜从容" },
  { text: "已经发生的，是经历；尚未发生的，是想象。你只拥有此刻。", tag: "宜当下" },
  { text: "今日宜断舍离：退一个群，删一张截图，原谅一个人。", tag: "宜清理" },
  { text: "风物长宜放眼量。眼前的苟且，是远处的铺垫。", tag: "宜远眺" },
  { text: "不必讨好潮汐，你自有你的月相。", tag: "宜自持" },
  { text: "急事慢做，慢事不做，没事早点睡。", tag: "三事箴言" },
  { text: "今日忌：反复复盘说过的话。说出去的话，泼出去的茶。", tag: "忌反刍" },
  { text: "花未全开月未圆，正是人间好时节。", tag: "宜未满" },
  { text: "你没有落后，也并没有领先。你在自己的时区里，一切准时。", tag: "宜准时" },
  { text: "烦恼像河里的石头，摸到第九块，就该上岸了。", tag: "宜上岸" },
  { text: "今日开运动作：认真吃完一顿饭，不看手机。", tag: "开运" },
  { text: "山重水复处若无路，坐下来，路会来找你。", tag: "宜坐忘" },
  { text: "别拿别人的尺子，量自己的人生。", tag: "忌内卷" },
  { text: "得之坦然，失之淡然，争其必然，顺其自然。", tag: "四然" },
  { text: "今日宜答应当初那个小小的自己：玩得开心点。", tag: "宜玩" },
  { text: "凡事先问一句：三年后这事还重要吗？答案多半是「算了」。", tag: "品牌心法" },
  { text: "雾总会散的，你只需在雾里别乱撞。", tag: "宜稳" },
  { text: "今日吉时：你读完这句话的这一秒。", tag: "即吉" },
  { text: "允许一切发生，包括允许自己偶尔不允许。", tag: "宜允许" },
  { text: "生活不是考场，没有标准答案。你的解法就是正解。", tag: "宜自洽" },
  { text: "船到桥头自然直的前提是：先把桨放下歇一会儿。", tag: "宜歇桨" },
  { text: "今日宜原谅：原谅那个搞砸了的周一早晨。", tag: "宜宽宥" },
];

/** 输入框占位符轮换 */
export const COMPOSER_PLACEHOLDERS = [
  "说说今天心里搁着的事…",
  "问姻缘、问前程，或只是问今晚吃什么…",
  "想到什么说什么，这儿不评判。",
  "纸团扔过来，掌柜替你接着。",
];

/** 首次进入的开场白气泡 */
export const OPENING_LINES = [
  "今天过得怎么样？",
  "可以说件具体的小事，也可以说一种说不清的感觉。",
  "测字不占祸福，只帮你把心事摊开晾一晾。",
];

/** “算了”哲学收尾句池（供离线兜底与 UI 灵感） */
export const SUALNLE_CLOSERS = [
  "先算到这儿，剩下的交给时间。",
  "看清了，就好办了；好办了，就算了。",
  "卦是死的，人是活的，饭是热的。",
  "把心放宽一寸，路就宽一丈。",
];
