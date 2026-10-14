"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BaZiChart, baziContext, computeBaZi, WX_COLOR, WuXing } from "@/lib/bazi";
import { sfxReveal } from "@/lib/audio";
import { useApp } from "@/store/app";
import { Computing, DivineActions, SectionLabel } from "./divine-view";
import { cn } from "@/lib/utils";

const SHICHEN = [
  { v: null, label: "时辰未知" },
  { v: 0, label: "子时 23:00–01:00" },
  { v: 2, label: "丑时 01:00–03:00" },
  { v: 4, label: "寅时 03:00–05:00" },
  { v: 6, label: "卯时 05:00–07:00" },
  { v: 8, label: "辰时 07:00–09:00" },
  { v: 10, label: "巳时 09:00–11:00" },
  { v: 12, label: "午时 11:00–13:00" },
  { v: 14, label: "未时 13:00–15:00" },
  { v: 16, label: "申时 15:00–17:00" },
  { v: 18, label: "酉时 17:00–19:00" },
  { v: 20, label: "戌时 19:00–21:00" },
  { v: 22, label: "亥时 21:00–23:00" },
];

type Phase = "form" | "computing" | "revealed";

function PillarCard({
  label,
  pillar,
  isDay,
  delay,
}: {
  label: string;
  pillar: { gan: string; zhi: string; ganWx: WuXing; zhiWx: WuXing; god: string } | null;
  isDay?: boolean;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "flex flex-col items-center rounded-2xl border px-2 py-3.5",
        isDay ? "border-gold-2/45 bg-gold-2/[0.07]" : "border-white/10 bg-white/[0.03]"
      )}
    >
      <span className="text-[10px] tracking-[0.3em] text-moon/45">{label}</span>
      {pillar ? (
        <>
          <span
            className="mt-2.5 font-display text-[30px] leading-none"
            style={{ color: WX_COLOR[pillar.ganWx], textShadow: `0 0 18px ${WX_COLOR[pillar.ganWx]}66` }}
          >
            {pillar.gan}
          </span>
          <span
            className="mt-1.5 font-display text-[30px] leading-none"
            style={{ color: WX_COLOR[pillar.zhiWx], textShadow: `0 0 18px ${WX_COLOR[pillar.zhiWx]}66` }}
          >
            {pillar.zhi}
          </span>
          <span className="mt-2.5 rounded-full bg-white/[0.06] px-2 py-0.5 text-[9.5px] text-moon/55">
            {pillar.god}
          </span>
        </>
      ) : (
        <span className="mt-3 font-display text-[22px] text-moon/25">未知</span>
      )}
    </motion.div>
  );
}

export function BaziTool() {
  const [phase, setPhase] = useState<Phase>("form");
  const [dateStr, setDateStr] = useState("2000-01-01");
  const [hour, setHour] = useState<number | null>(null);
  const [gender, setGender] = useState<"male" | "female" | "secret">("secret");
  const [chart, setChart] = useState<BaZiChart | null>(null);
  const saveReading = useApp((s) => s.saveReading);
  const askAbout = useApp((s) => s.askAboutReading);
  const setProfile = useApp((s) => s.setProfile);
  const toast = useApp((s) => s.toast);

  const compute = () => {
    const [y, m, d] = dateStr.split("-").map(Number);
    if (!y || !m || !d) return;
    setPhase("computing");
  };

  const done = () => {
    const [y, m, d] = dateStr.split("-").map(Number);
    const c = computeBaZi({ year: y, month: m, day: d, hour });
    setChart(c);
    setProfile({ birthday: dateStr, birthHour: hour, gender });
    setPhase("revealed");
    sfxReveal();
  };

  const inputLabel = () =>
    `${dateStr}${hour !== null ? ` ${SHICHEN.find((s) => s.v === hour)?.label ?? ""}` : "（时辰未知）"}，性别：${gender === "male" ? "乾造（男）" : gender === "female" ? "坤造（女）" : "未言"}`;

  const summaryText = (c: BaZiChart) => {
    const p = (pl: { gan: string; zhi: string } | null) => (pl ? `${pl.gan}${pl.zhi}` : "未知");
    return `生辰：${inputLabel()}\n四柱：${p(c.year)} / ${p(c.month)} / ${p(c.day)} / ${p(c.hour)}\n日主：${c.dayMaster.gan}${c.dayMaster.wx}（${c.dayMaster.yinyang}），生肖属${c.zodiac}\n五行：木${c.wxPercent.木}% 火${c.wxPercent.火}% 土${c.wxPercent.土}% 金${c.wxPercent.金}% 水${c.wxPercent.水}%${c.lacking.length ? `（缺${c.lacking.join("、")}）` : ""}`;
  };

  const saveAndToast = () => {
    if (!chart) return;
    saveReading({
      type: "bazi",
      title: `${chart.dayMaster.gan}${chart.dayMaster.wx}日主 · ${chart.day.gan}${chart.day.zhi}日`,
      summary: summaryText(chart),
      llmContext: baziContext(chart, inputLabel()),
    });
    toast("本命盘已收进你的命运存档");
  };

  const askMaster = () => {
    if (!chart) return;
    const payload = {
      type: "bazi" as const,
      title: `${chart.dayMaster.gan}${chart.dayMaster.wx}日主 · ${chart.day.gan}${chart.day.zhi}日`,
      summary: summaryText(chart),
      llmContext: baziContext(chart, inputLabel()),
    };
    const id = saveReading(payload);
    askAbout({ id, createdAt: Date.now(), ...payload });
  };

  if (phase === "computing") return <Computing onDone={done} />;

  if (phase === "form") {
    return (
      <div className="flex min-h-full flex-col justify-center px-6 py-8">
        <SectionLabel>天 时 校 准 · 公 历 生 辰</SectionLabel>
        <div className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <div>
            <label className="mb-1.5 block text-[11px] tracking-[0.25em] text-moon/50">出生日期（公历）</label>
            <input
              type="date"
              value={dateStr}
              min="1900-01-01"
              max="2100-12-31"
              onChange={(e) => setDateStr(e.target.value)}
              className="w-full rounded-xl border border-white/12 bg-night-3 px-4 py-3 text-[14px] text-moon outline-none [color-scheme:dark] focus:border-gold-2/50"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] tracking-[0.25em] text-moon/50">出生时辰</label>
            <select
              value={hour === null ? "" : hour}
              onChange={(e) => setHour(e.target.value === "" ? null : Number(e.target.value))}
              className="w-full appearance-none rounded-xl border border-white/12 bg-night-3 px-4 py-3 text-[14px] text-moon outline-none focus:border-gold-2/50"
            >
              {SHICHEN.map((s) => (
                <option key={String(s.v)} value={s.v === null ? "" : s.v}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] tracking-[0.25em] text-moon/50">造主（大运顺逆之用）</label>
            <div className="flex gap-2">
              {([
                ["male", "乾造 · 男"],
                ["female", "坤造 · 女"],
                ["secret", "暂且不言"],
              ] as const).map(([v, label]) => (
                <button
                  key={v}
                  onClick={() => setGender(v)}
                  className={cn(
                    "no-tap-highlight flex-1 rounded-xl border py-2.5 text-[12px] transition-all active:scale-95",
                    gender === v
                      ? "border-gold-2/60 bg-gold-2/10 text-gold-2"
                      : "border-white/10 text-moon/45"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <button
          onClick={compute}
          className="no-tap-highlight mt-5 w-full rounded-2xl bg-gold-2 py-3.5 font-display text-[15px] tracking-[0.35em] text-night shadow-[0_6px_24px_rgba(212,175,55,0.3)] transition-all hover:brightness-110 active:scale-[0.98]"
        >
          排 盘
        </button>
        <p className="mt-3 text-center text-[10.5px] text-moon/30">
          节气近似排盘 · 生辰只留在你本机，不上传不留档
        </p>
      </div>
    );
  }

  if (!chart) return null;

  const pillars = [
    { label: "年柱", p: chart.year },
    { label: "月柱", p: chart.month },
    { label: "日柱", p: chart.day },
    { label: "时柱", p: chart.hour },
  ];
  const wxEntries = (Object.keys(chart.wxPercent) as WuXing[]).map((k) => ({
    k,
    v: chart.wxPercent[k],
  }));

  return (
    <div className="px-5 pb-10 pt-6">
      <SectionLabel>本 命 四 柱 · 落 地 之 时</SectionLabel>
      <div className="grid grid-cols-4 gap-2">
        {pillars.map((x, i) => (
          <PillarCard key={x.label} label={x.label} pillar={x.p} isDay={x.label === "日柱"} delay={i * 0.08} />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mt-4 rounded-2xl border border-gold-2/25 bg-gold-2/[0.05] px-4 py-3.5"
      >
        <div className="flex items-baseline gap-2">
          <span className="font-display text-[16px] text-gold-2">
            日主 {chart.dayMaster.gan}
            {chart.dayMaster.wx}
          </span>
          <span className="text-[10.5px] text-moon/45">
            {chart.dayMaster.yinyang} · 生肖属{chart.zodiac}
          </span>
        </div>
        <p className="mt-1.5 text-[13px] leading-relaxed text-moon/80">{chart.blurb}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-4"
      >
        <SectionLabel>五 行 气 数</SectionLabel>
        <div className="overflow-hidden rounded-full border border-white/10">
          <div className="flex h-9 w-full">
            {wxEntries.map(({ k, v }) =>
              v > 0 ? (
                <div
                  key={k}
                  className="flex items-center justify-center text-[10.5px] font-medium text-night"
                  style={{ width: `${v}%`, background: WX_COLOR[k] }}
                >
                  {k}
                  {v >= 14 ? `${v}%` : ""}
                </div>
              ) : null
            )}
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-white/[0.05] px-2.5 py-1 text-[10.5px] text-moon/60">
            最旺之气：{chart.dominant}
          </span>
          {chart.lacking.length > 0 ? (
            <span className="rounded-full bg-cinnabar/15 px-2.5 py-1 text-[10.5px] text-cinnabar">
              命局缺：{chart.lacking.join("、")}
            </span>
          ) : (
            <span className="rounded-full bg-white/[0.05] px-2.5 py-1 text-[10.5px] text-moon/60">
              五行俱全 · 难得
            </span>
          )}
        </div>
      </motion.div>

      <DivineActions
        onSave={saveAndToast}
        onAsk={askMaster}
        onReset={() => setPhase("form")}
        askLabel="请玄玑道长详解此盘"
      />
    </div>
  );
}
