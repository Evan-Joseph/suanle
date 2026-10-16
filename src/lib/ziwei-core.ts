/** 紫微命盘的类型与纯函数（不依赖排盘库，可在任何地方轻量引用） */

export interface ZStar {
  name: string;
  brightness: string;
  mutagen: string;
}

export interface ZPalace {
  index: number;
  name: string;
  stem: string;
  branch: string;
  isBody: boolean;
  major: ZStar[];
  minor: ZStar[];
  adj: string[];
  decadal: [number, number];
  changsheng: string;
}

import type { SolarCalibration } from "./divination";

export interface ZiweiChart {
  palaces: ZPalace[];
  soul: string;
  body: string;
  fiveElements: string;
  chineseDate: string;
  lunarDate: string;
  time: string;
  timeRange: string;
  sign: string;
  zodiac: string;
  gender: "男" | "女";
  hourKnown: boolean;
  genderKnown: boolean;
  solarCalibration?: SolarCalibration;
}

/** 传统方盘的十二地支位置 [行, 列] */
export const BRANCH_POS: Record<string, [number, number]> = {
  巳: [0, 0],
  午: [0, 1],
  未: [0, 2],
  申: [0, 3],
  辰: [1, 0],
  酉: [1, 3],
  卯: [2, 0],
  戌: [2, 3],
  寅: [3, 0],
  丑: [3, 1],
  子: [3, 2],
  亥: [3, 3],
};

export const PALACE_HINT: Record<string, string> = {
  命宫: "你是什么样的人",
  兄弟: "手足与同辈",
  夫妻: "亲密关系",
  子女: "孩子与创造力",
  财帛: "赚钱与花钱的方式",
  疾厄: "身体与压力的出口",
  迁移: "出门在外与机遇",
  仆役: "朋友与人际",
  官禄: "事业与做事风格",
  田宅: "家与安全感",
  福德: "精神世界与享受",
  父母: "长辈与文书",
};

export function starLabel(s: ZStar): string {
  return `${s.name}${s.brightness}${s.mutagen ? "化" + s.mutagen : ""}`;
}

export function palaceLine(p: ZPalace): string {
  const major = p.major.map(starLabel).join("、") || "无主星（借对宫）";
  const minor = p.minor.map((s) => s.name + (s.mutagen ? "化" + s.mutagen : "")).join("、");
  return `${p.name}（${p.stem}${p.branch}）：${major}${minor ? `；辅星 ${minor}` : ""}`;
}

/** 三方四正：本宫、对宫与两个三合宫 */
export function surroundIndices(i: number): number[] {
  return [i, (i + 6) % 12, (i + 4) % 12, (i + 8) % 12];
}

export function ziweiBrief(c: ZiweiChart): string {
  const pick = ["命宫", "夫妻", "财帛", "官禄", "迁移", "福德"];
  const lines = pick
    .map((n) => c.palaces.find((p) => p.name === n))
    .filter((p): p is ZPalace => !!p)
    .map(palaceLine);
  const body = c.palaces.find((p) => p.isBody);
  return `${c.fiveElements}，命主${c.soul}，身主${c.body}${body ? `，身宫在${body.name}` : ""}；${lines.join("；")}${c.hourKnown ? "" : "（时辰不详，暂按午时）"}`;
}

export function ziweiToText(c: ZiweiChart, focus?: ZPalace | null): string {
  const soul = c.palaces.find((p) => p.name === "命宫");
  const target = focus ?? soul;
  const around = target
    ? surroundIndices(target.index)
        .slice(1)
        .map((i) => c.palaces[i])
        .filter(Boolean)
        .map(palaceLine)
    : [];
  return [
    `这是我的紫微命盘：${c.fiveElements}，命主${c.soul}，身主${c.body}。`,
    target ? palaceLine(target) : "",
    around.length ? `三方四正：${around.join("；")}` : "",
    `帮我看看${target && target.name !== "命宫" ? `${target.name}宫（${PALACE_HINT[target.name] ?? ""}）` : "命宫和整体格局"}？`,
  ]
    .filter(Boolean)
    .join("\n");
}
