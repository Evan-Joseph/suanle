// 《算了 · Suanle》品牌宣传片 —— 视觉基准与时间线（30FPS，卡点对齐 promo/AUDIO_BEATS.md）
export const C = {
  paper: "#FAF9F6",
  ink: "#2B2B2B",
  cinnabar: "#C4553A",
  gold: "#A9844A",
  bamboo: "#74866A",
  mist: "#E8E3D9",
} as const;

export const SERIF =
  '"Noto Serif SC", "Songti SC", "STSong", "Source Han Serif SC", "SimSun", serif';
export const SANS =
  '"Noto Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const DURATION = 1350; // 45s

/** 关键音乐卡点（帧 @30FPS） */
export const BEAT = {
  inkDrop: 35, // 00:01.17 晨钟第二回响 / 墨滴
  flute: 107, // 00:03.56 竹笛入场
  strings: 193, // 00:06.43 弦乐上行
  pickup: 293, // 00:09.76 预备拍
  drop: 344, // 00:11.47 💥 Kick 爆发
  bar4: 401, // 00:13.36
  bar5: 486, // 00:16.20
  turn: 613, // 00:20.43 情绪转折
  crumple: 686, // 00:22.86 揉纸
  flight: 772, // 00:25.74 抛物线
  bowl: 829, // 00:27.62 💥 颂钵 / 落篓
  seal: 1000, // 00:33.34 朱砂印落
  cta: 1080, // 00:36.00 品牌终章
} as const;

/** 场景区间 [from, duration]，相邻场景少量重叠用于溶解转场 */
export const SCENES = {
  hook: { from: 0, dur: 205 },
  tea: { from: 188, dur: 166 },
  coins: { from: 338, dur: 156 },
  wave: { from: 478, dur: 146 },
  letgo: { from: 606, dur: 390 },
  card: { from: 975, dur: 135 },
  cta: { from: 1095, dur: 255 },
} as const;

export const SITE_URL = "https://www.suanle.cc/";
