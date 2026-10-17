/**
 * 《算了 · Suanle》品牌宣传片 —— 设计系统与节拍表
 * 所有时间以「秒」为单位，由 fps 换算为帧，使 30FPS 与 60FPS 合成共享同一份导演脚本。
 */

export const COLORS = {
  paper: "#FAF9F6", // 生宣米白
  ink: "#2B2B2B", // 徽墨温黑
  vermilion: "#C4553A", // 朱砂印红
  gold: "#A9844A", // 古拙泥金
  bamboo: "#74866A", // 修竹清绿
  mist: "#E8E3D9", // 晴岚淡灰
  inkSoft: "#5A5651",
  inkFaint: "#9A958D",
} as const;

export const FONT_FAMILY =
  '"Suanle Serif", "Songti SC", "STSong", "Noto Serif SC", "Source Han Serif SC", "Noto Serif CJK SC", serif';

export const WIDTH = 1920;
export const HEIGHT = 1080;
export const DURATION_SECONDS = 50;

/**
 * 节拍表（来自 promo/AUDIO_BEATS.md，主配乐《晓寺晨曦》85.7 BPM）
 * 强拍网格：D(n) = 13.36 + 2.84 * n
 */
export const CUES = {
  inkDrop: 1.17, // 晨钟第二回响 → 墨滴入纸
  flute: 3.56, // 竹笛入场 → 品牌叩问
  strings: 6.43, // 弦乐上行 → 老友对坐
  pickup: 9.76, // 预备拍 → 铜钱浮起
  drop: 11.47, // 💥 主鼓点爆发 → 铜钱落案
  bar4: 13.36, // 强拍 → 老友解盘
  bar5: 16.2, // 强拍 → 命盘 / 大运 K 线
  bar6: 19.04, // 强拍 → 「低谷蓄力，高峰尽兴」
  turn: 20.43, // 情绪转折 → 纸篓界面
  crumple: 22.86, // 纸张揉皱
  flight: 25.74, // 抛物线飞跃
  climax: 27.62, // 💥 纸团落篓 · 颂钵重击
  afterglow: 28.61, // 余音回荡
  reprise: 33.34, // 尾声主题复现 → 宣纸卡片
  cta: 38.92, // 品牌 CTA 终章（强拍 D9）
  fadeOut: 48.3, // 全片淡出
  end: DURATION_SECONDS,
} as const;

export const downbeat = (n: number) => 13.36 + 2.84 * n;
export const BEAT = 60 / 85.7; // ≈ 0.700s

/** 素材路径（映射自 promo/assets → public/promo） */
export const ASSETS = {
  video: {
    home: "promo/video/01_home_navigation.mp4",
    chat: "promo/video/02_chat_consultation.mp4",
    letgo: "promo/video/03_letgo_paper_crumple.mp4",
    card: "promo/video/04_share_card_with_qr.mp4",
    coins: "promo/video/05_coins_divination.mp4",
  },
  image: {
    home: "promo/prod_mobile_home.png",
    chat: "promo/ui_chat_view.png",
    bazi: "promo/ui_bazi_chart.png",
    kline: "promo/ui_kline.png",
    coins: "promo/ui_coins_hexagram.png",
    letgoWrite: "promo/ui_letgo_write.png",
    letgoBall: "promo/ui_letgo_ball.png",
    letgoDone: "promo/ui_letgo_done.png",
    cardAphorism: "promo/card_aphorism.png",
    cardDialogue: "promo/card_dialogue.png",
    cardLetgo: "promo/card_letgo.png",
    cardAnnual: "promo/card_annual.png",
  },
  brand: {
    logo: "promo/brand/logo.svg",
    qr: "promo/brand/suanle_qrcode.png",
  },
  audio: {
    bgm: "promo/audio/suanle_zen_bgm.mp3",
    waterDrop: "promo/audio/water_drop.mp3",
    coinClatter: "promo/audio/coin_clatter.mp3",
    paperCrumple: "promo/audio/paper_crumple.mp3",
    bowlStrike: "promo/audio/singing_bowl_strike.mp3",
    bowlSustain: "promo/audio/singing_bowl.mp3",
  },
} as const;

export const SITE_URL = "https://www.suanle.cc/";
