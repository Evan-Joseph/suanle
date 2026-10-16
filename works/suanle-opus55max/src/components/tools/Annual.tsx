"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import type { AnnualReport } from "@/lib/annual";
import { Logo } from "../brand/Logo";
import { Skeleton } from "../ui";

function smoothPath(pts: [number, number][]): string {
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

export function MonthCurve({ report }: { report: AnnualReport }) {
  const nowM = new Date().getFullYear() === report.year ? new Date().getMonth() + 1 : 1;
  const [sel, setSel] = useState(nowM);
  const W = 320;
  const H = 128;
  const pts: [number, number][] = report.months.map((m, i) => [16 + (i * (W - 32)) / 11, 12 + (100 - m.v) * 0.9]);
  const line = smoothPath(pts);
  const area = `${line} L${pts[pts.length - 1][0]},${H} L${pts[0][0]},${H} Z`;
  const cur = report.months[sel - 1];
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H + 18}`} className="w-full" role="img" aria-label="十二个月的起伏">
        <defs>
          <linearGradient id="curveFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--ink)" stopOpacity="0.12" />
            <stop offset="100%" stopColor="var(--ink)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="12" x2={W - 12} y1={12 + 50 * 0.9} y2={12 + 50 * 0.9} stroke="var(--line)" strokeDasharray="3 4" />
        <motion.path d={area} fill="url(#curveFill)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.6 }} />
        <motion.path d={line} fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, ease: "easeInOut" }} />
        {pts.map(([x, y], i) => (
          <g key={i} onClick={() => setSel(i + 1)} className="cursor-pointer">
            <rect x={x - 12} y={0} width={24} height={H + 18} fill="transparent" />
            <circle cx={x} cy={y} r={sel === i + 1 ? 5 : 3} fill={sel === i + 1 ? "var(--seal)" : "var(--paper)"} stroke={sel === i + 1 ? "var(--seal)" : "var(--ink)"} strokeWidth="1.5" />
            <text x={x} y={H + 14} textAnchor="middle" fontSize="10" fill={i + 1 === nowM ? "var(--ink)" : "var(--mute)"} fontWeight={i + 1 === nowM ? 700 : 400}>
              {i + 1}
            </text>
          </g>
        ))}
      </svg>
      <AnimatePresence mode="wait">
        <motion.div key={sel} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }} className="mt-2 flex items-center gap-2 rounded-2xl bg-paper-2/70 px-3.5 py-2.5 text-[13.5px]">
          <span className="font-song font-bold">{sel}月</span>
          <span className="text-ink-2">{cur?.note}</span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function AnnualView({ report }: { report: AnnualReport }) {
  return (
    <div>
      <div className="text-center">
        <div className="text-[12.5px] tracking-[0.2em] text-mute">
          {report.year} · {report.ganzhi}年 · 属{report.shengxiao}
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 18 }} className="mt-3 font-song text-[34px] font-bold tracking-[0.12em] text-ink">
          「{report.keyword}」
        </motion.div>
        <p className="mx-auto mt-3 max-w-[330px] text-[14px] leading-relaxed text-ink-2">{report.summary}</p>
      </div>
      <div className="mt-6 rounded-[22px] border border-line bg-card/80 p-4">
        <div className="mb-1 text-[12.5px] text-mute">十二个月的起伏 · 点一点看每个月</div>
        <MonthCurve report={report} />
      </div>
      <div className="mt-3 space-y-2.5 rounded-[22px] border border-line bg-card/80 p-4">
        {report.dims.map((d) => (
          <div key={d.key}>
            <div className="flex items-center gap-3">
              <span className="w-8 shrink-0 font-song text-[14px] font-bold">{d.key}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/[0.06]">
                <motion.div className="h-full rounded-full bg-ink" initial={{ width: 0 }} animate={{ width: `${d.score}%` }} transition={{ duration: 0.9, ease: "easeOut" }} />
              </div>
            </div>
            <p className="mt-1.5 pl-11 text-[13px] leading-relaxed text-ink-2">{d.text}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-[22px] border border-line bg-card/80 p-4">
        <div className="mb-2 text-[12.5px] text-mute">今年可以试试</div>
        <ol className="space-y-1.5">
          {report.advice.map((a, i) => (
            <li key={i} className="flex gap-2.5 text-[14px] leading-relaxed text-ink">
              <span className="mt-[3px] grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ink/[0.06] text-[11px] text-ink-2">{i + 1}</span>
              {a}
            </li>
          ))}
        </ol>
      </div>
      <div className="mt-3 rounded-r-[18px] border-l-2 border-seal bg-seal/[0.06] px-4 py-3.5 font-song text-[15.5px] leading-relaxed text-ink">{report.letgo}</div>
    </div>
  );
}

const LOADING_LINES = ["排流年干支…", "对照大运与命局…", "看看紫微流年四化…", "一个月一个月地过…", "写成人话…"];

export function AnnualLoading() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % LOADING_LINES.length), 1800);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex flex-col items-center pt-6">
      <div className="text-ink">
        <Logo size={64} mood="listen" />
      </div>
      <AnimatePresence mode="wait">
        <motion.p key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="mt-4 text-[13.5px] text-mute">
          {LOADING_LINES[i]}
        </motion.p>
      </AnimatePresence>
      <div className="mt-6 w-full space-y-3">
        <Skeleton className="mx-auto h-9 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-36 w-full rounded-[22px]" />
        <Skeleton className="h-28 w-full rounded-[22px]" />
      </div>
    </div>
  );
}
