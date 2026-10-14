"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CloudRainWind, Sunrise } from "lucide-react";
import type { LifeWave } from "@/lib/fortune";

const PAD_X = 34;
const PAD_TOP = 26;
const PAD_BOTTOM = 46;

function smoothPath(pts: [number, number][]): string {
  if (pts.length < 3) return pts.map((p, i) => `${i ? "L" : "M"}${p[0]},${p[1]}`).join(" ");
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
  }
  return d;
}

export function EnergyChart({ wave }: { wave: LifeWave }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(760);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      setW(Math.max(320, Math.floor(entries[0].contentRect.width)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const H = 300;
  const plotH = H - PAD_TOP - PAD_BOTTOM;
  const plotW = w - PAD_X * 2;

  const x = useCallback((age: number) => PAD_X + ((age - 1) / 99) * plotW, [plotW]);
  const y = useCallback((v: number) => PAD_TOP + (1 - v / 100) * plotH, [plotH]);

  const pts: [number, number][] = wave.points.map((v, i) => [x(i + 1), y(v)]);
  const line = smoothPath(pts);
  const area = `${line} L${x(100)},${H - PAD_BOTTOM} L${x(1)},${H - PAD_BOTTOM} Z`;

  const ageFromEvent = (clientX: number) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const rel = clientX - rect.left - PAD_X;
    return Math.round(1 + (Math.min(Math.max(rel, 0), plotW) / plotW) * 99);
  };

  const hoverInfo = hover != null
    ? {
        age: hover,
        v: wave.points[hover - 1],
        win: wave.windows.find((wd) => hover >= wd.start && hover <= wd.end),
      }
    : null;

  return (
    <div>
      <div ref={wrapRef} className="relative select-none" style={{ touchAction: "pan-y" }}>
        <svg
          width={w} height={H}
          onPointerMove={(e) => setHover(ageFromEvent(e.clientX))}
          onPointerLeave={() => setHover(null)}
          className="block"
        >
          <defs>
            <linearGradient id="waveFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7FA78D" stopOpacity="0.34" />
              <stop offset="100%" stopColor="#7FA78D" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* 窗口背景 */}
          {wave.windows.map((wd, i) => (
            <rect
              key={i}
              x={x(wd.start)} y={PAD_TOP - 6}
              width={Math.max(6, x(wd.end) - x(wd.start))}
              height={plotH + 12}
              rx={10}
              fill={wd.kind === "peak" ? "#A9884F" : "#7E97A8"}
              opacity={wd.kind === "peak" ? 0.09 : 0.1}
            />
          ))}

          {/* 网格 */}
          {[25, 50, 75].map((g) => (
            <line key={g} x1={PAD_X} x2={w - PAD_X} y1={y(g)} y2={y(g)} stroke="#E6E1D6" strokeDasharray="3 6" />
          ))}

          {/* 面积与主线 */}
          <motion.path d={area} fill="url(#waveFill)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 1 }} />
          <motion.path
            d={line} fill="none" stroke="#5F7A6B" strokeWidth={2.6} strokeLinecap="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: 1.6, ease: [0.65, 0, 0.35, 1] }}
          />

          {/* 年龄刻度 */}
          {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((a) => (
            <text key={a} x={x(a)} y={H - PAD_BOTTOM + 24} textAnchor="middle" fontSize={11} fill="#A39C92" className="tabular">
              {a}
            </text>
          ))}
          <text x={w - PAD_X} y={H - 6} textAnchor="end" fontSize={10} fill="#C7C0B2">岁</text>

          {/* 峰值 / 谷值标记 */}
          {wave.windows.map((wd, i) => (
            <g key={i}>
              <circle cx={x(wd.crest)} cy={y(wave.points[wd.crest - 1])} r={4.5} fill={wd.kind === "peak" ? "#A9884F" : "#7E97A8"} stroke="#FAF9F6" strokeWidth={2} />
            </g>
          ))}

          {/* 此刻 */}
          {wave.currentAge >= 1 && wave.currentAge <= 100 && (
            <g>
              <line x1={x(wave.currentAge)} x2={x(wave.currentAge)} y1={PAD_TOP - 6} y2={H - PAD_BOTTOM} stroke="#B9714B" strokeWidth={1.4} strokeDasharray="4 5" />
              <circle cx={x(wave.currentAge)} cy={y(wave.points[wave.currentAge - 1])} r={6} fill="#B9714B" stroke="#FAF9F6" strokeWidth={2.5}>
                <animate attributeName="r" values="5.5;7.5;5.5" dur="2.4s" repeatCount="indefinite" />
              </circle>
              <text x={x(wave.currentAge)} y={16} textAnchor="middle" fontSize={11.5} fontWeight={600} fill="#B9714B">
                此刻 {wave.currentAge} 岁
              </text>
            </g>
          )}

          {/* 悬停十字线 */}
          {hoverInfo && (
            <g>
              <line x1={x(hoverInfo.age)} x2={x(hoverInfo.age)} y1={PAD_TOP} y2={H - PAD_BOTTOM} stroke="#262626" strokeWidth={1} opacity={0.25} />
              <circle cx={x(hoverInfo.age)} cy={y(hoverInfo.v)} r={5} fill="#262626" stroke="#FAF9F6" strokeWidth={2} />
            </g>
          )}
        </svg>

        {/* 悬停提示 */}
        {hoverInfo && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-line bg-paper px-3.5 py-1.5 text-[11.5px] shadow-soft"
            style={{ left: Math.min(Math.max(x(hoverInfo.age), 90), w - 90), top: 6 }}
          >
            <span className="tabular font-medium">{hoverInfo.age} 岁 · 心气 {hoverInfo.v}°</span>
            {hoverInfo.win && <span className={hoverInfo.win.kind === "peak" ? "text-gold" : "text-haze"}> · {hoverInfo.win.label}</span>}
          </div>
        )}
      </div>

      {/* 窗口批注 */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {wave.windows.map((wd, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + i * 0.1, duration: 0.5 }}
            className={`rounded-3xl border p-5 ${wd.kind === "peak" ? "border-gold/25 bg-[#A9884F]/[0.06]" : "border-haze/25 bg-haze2/20"}`}
          >
            <p className={`flex items-center gap-2 font-display text-[14px] font-bold tracking-wide ${wd.kind === "peak" ? "text-gold" : "text-haze"}`}>
              {wd.kind === "peak" ? <Sunrise size={15} /> : <CloudRainWind size={15} />}
              {wd.label}
              <span className="tabular ml-auto text-[11px] font-normal text-faint">{wd.start} – {wd.end} 岁</span>
            </p>
            <p className="mt-2.5 text-[12.5px] leading-[1.85] text-ink2">{wd.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
