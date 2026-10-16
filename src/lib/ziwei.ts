import { astro } from "iztro";
import { normalizeGender, parseBirth, timeIndexOf } from "./divination";
import type { ZiweiChart, ZStar } from "./ziwei-core";

export * from "./ziwei-core";

type RawStar = { name: string; brightness?: string; mutagen?: string };
const toStar = (s: RawStar): ZStar => ({ name: String(s.name), brightness: String(s.brightness ?? ""), mutagen: String(s.mutagen ?? "") });

/** 用 iztro 排出紫微斗数十二宫（支持真太阳时校准） */
export function computeZiwei(birth?: string | null, gender?: string | null, city?: string | null): ZiweiChart | null {
  const p = parseBirth(birth, city);
  if (!p) return null;
  const g = normalizeGender(gender);
  try {
    const a = astro.bySolar(`${p.y}-${p.m}-${p.d}`, timeIndexOf(p.h, p.hourKnown), g ?? "女", true, "zh-CN");
    return {
      palaces: a.palaces.map((pl) => ({
        index: pl.index,
        name: String(pl.name),
        stem: String(pl.heavenlyStem),
        branch: String(pl.earthlyBranch),
        isBody: Boolean(pl.isBodyPalace),
        major: pl.majorStars.map((s) => toStar(s as unknown as RawStar)),
        minor: pl.minorStars.map((s) => toStar(s as unknown as RawStar)),
        adj: pl.adjectiveStars.slice(0, 5).map((s) => String(s.name)),
        decadal: [Number(pl.decadal.range[0]), Number(pl.decadal.range[1])] as [number, number],
        changsheng: String(pl.changsheng12),
      })),
      soul: String(a.soul),
      body: String(a.body),
      fiveElements: String(a.fiveElementsClass),
      chineseDate: String(a.chineseDate),
      lunarDate: String(a.lunarDate),
      time: String(a.time),
      timeRange: String(a.timeRange),
      sign: String(a.sign),
      zodiac: String(a.zodiac),
      gender: g ?? "女",
      hourKnown: p.hourKnown,
      genderKnown: Boolean(g),
      solarCalibration: p.solarCalibration,
    };
  } catch {
    return null;
  }
}
