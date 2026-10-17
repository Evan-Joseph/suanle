import { staticFile } from "remotion";

export const FPS = 60;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const DURATION = 3000; // 50s

/**
 * 素材开关：将 promo/ 素材目录放入 public/promo/ 后改为 true，
 * 即可启用真实录屏、UI 快照、二维码与声学音轨。
 * 为 false 时，全片使用矢量重绘的同构 UI（便于沙盒/浏览器预览）。
 */
export const USE_REAL_ASSETS = true;

export const C = {
  paper: "#FAF9F6",
  ink: "#2B2B2B",
  cinnabar: "#C4553A",
  gold: "#A9844A",
  bamboo: "#74866A",
  mist: "#E8E3D9",
};

export const SERIF = `"Noto Serif SC","Source Han Serif SC","Songti SC","STSong",serif`;

export const SPRING_SOFT = { damping: 200, stiffness: 60, mass: 1 };
export const SPRING_COIN = { damping: 9, stiffness: 120, mass: 0.8 };
export const SPRING_STAMP = { damping: 12, stiffness: 260, mass: 1.2 };

export const s = (sec: number) => Math.round(sec * FPS);

export const SCENES = {
  hook: { from: 0, dur: s(8) },
  tavern: { from: s(8), dur: s(12) },
  kline: { from: s(20), dur: s(12) },
  letgo: { from: s(32), dur: s(12) },
  end: { from: s(44), dur: s(6) },
};
export const XFADE = 30; // 0.5s 交叠溶解

export const BEATS = {
  water: 0,
  coin: s(13.2),
  crumple: s(34.5),
  bowl: s(38.0),
  stamp: s(44.0),
};

export const asset = (p: string) => staticFile(`promo/${p}`);
