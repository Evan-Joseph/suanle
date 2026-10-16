"use client";

import { useApp } from "@/lib/store";
import { baziToText, castToText, tarotToText, TAROT, type BaziResult, type CastResult, type TarotDraw } from "@/lib/divination";
import { palaceLine, ziweiToText, type ZiweiChart } from "@/lib/ziwei-core";
import { annualToText, type AnnualReport } from "@/lib/annual";

/** 档案写入：同一份命盘只存一份，每次起卦/抽牌各存一条 */

export function saveCast(r: CastResult) {
  useApp.getState().upsertRecord({
    kind: "coins",
    title: r.changed ? `${r.primary.full} → ${r.changed.full}` : r.primary.full,
    summary: r.question ? `问：${r.question}` : r.primary.gist,
    text: castToText(r),
    payload: r,
  });
}

export function saveTarot(d: TarotDraw) {
  useApp.getState().upsertRecord({
    kind: "tarot",
    title: d.cards.map((c) => TAROT[c.id].name + (c.reversed ? "（逆）" : "")).join(" · "),
    summary: d.question ? `问：${d.question}` : d.cards.map((c) => (c.reversed ? TAROT[c.id].rev : TAROT[c.id].up)).join("；"),
    text: tarotToText(d),
    payload: d,
  });
}

export function saveBazi(birth: string, b: BaziResult) {
  useApp.getState().upsertRecord({
    key: `bazi:${birth}`,
    kind: "bazi",
    title: b.pillars.map((p) => p.gz || "··").join(" "),
    summary: `日主${b.dayMaster}${b.dayMasterWx} · 属${b.shengxiao} · ${b.strongest}旺${b.weakest}弱`,
    text: baziToText(b, birth),
    payload: { birth },
  });
}

export function saveZiwei(birth: string, c: ZiweiChart) {
  const soul = c.palaces.find((p) => p.name === "命宫");
  useApp.getState().upsertRecord({
    key: `ziwei:${birth}`,
    kind: "ziwei",
    title: `${c.fiveElements} · 命主${c.soul}`,
    summary: soul ? palaceLine(soul) : "",
    text: ziweiToText(c),
    payload: { birth },
  });
}

export function saveAnnual(birth: string, r: AnnualReport) {
  useApp.getState().upsertRecord({
    key: `annual:${r.year}:${birth}`,
    kind: "annual",
    title: `${r.year} ${r.ganzhi}年 ·「${r.keyword}」`,
    summary: r.summary.slice(0, 48),
    text: annualToText(r),
    payload: r,
  });
}
