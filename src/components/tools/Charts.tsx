"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { computeBazi, todayAlmanac, computeKLine, type BaziResult, type Candle } from "@/lib/divination";
import { Pill } from "../ui";

const WX_COLOR: Record<string, string> = { 木: "#7d9a6f", 火: "#c4553a", 土: "#c9a45c", 金: "#a9b4bd", 水: "#3f5a73" };
const WX_PLAIN: Record<string, string> = {
  木: "像一棵树，向上生长，有主见也有韧性",
  火: "像一盏灯，热情外放，感染力强",
  土: "像一块地，稳重可靠，能托住别人",
  金: "像一把刀，干脆利落，讲原则",
  水: "像一条河，聪明灵活，心思细腻",
};

export function KLineChart({ candles, currentAge }: { candles: Candle[]; currentAge: number }) {
  const [sel, setSel] = useState<Candle | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const cw = 11;
  const H = 190;
  const pad = 14;
  const W = candles.length * cw + 24;
  const y = (v: number) => pad + (100 - v) * ((H - pad * 2) / 100);

  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollLeft = Math.max(0, (currentAge - 10) * cw);
  }, [currentAge, cw]);

  const ma = candles.map((_, i) => {
    const s = candles.slice(Math.max(0, i - 4), i + 1);
    return s.reduce((a, c) => a + c.close, 0) / s.length;
  });

  const shown = sel ?? candles.find((c) => c.age === currentAge) ?? candles[0];

  return (
    <div className="rounded-2xl border border-line bg-white/80 p-3.5 anim-fade-in">
      <div className="mb-2.5 flex items-start justify-between gap-2">
        <div>
          <div className="font-mono text-[16px] font-bold text-ink">
            {shown.age}岁 <span className="text-[12px] font-normal text-mute">{shown.year}年 · {shown.pillar}</span>
          </div>
          <div className="mt-0.5 font-mono text-[11px] text-mute">
            开 {shown.open} · 高 {shown.high} · 低 {shown.low} · 收{" "}
            <span className={shown.close >= shown.open ? "font-bold text-sage" : "font-bold text-seal"}>
              {shown.close}
            </span>
          </div>
        </div>
        {shown.tag && (
          <span className="shrink-0 rounded-full bg-paper-2 px-2.5 py-0.5 text-[11px] text-ink-2">
            {shown.tag}
          </span>
        )}
      </div>

      <div ref={ref} className="no-scrollbar relative -mx-3.5 overflow-x-auto px-3.5">
        <svg width={W} height={H + 20} className="block select-none">
          {[40, 50, 65].map((v) => (
            <line key={v} x1="0" x2={W} y1={y(v)} y2={y(v)} stroke={v === 50 ? "#d9d3c8" : "#eeeae3"} strokeDasharray={v === 50 ? "0" : "3 4"} />
          ))}
          {candles.map((c, i) => {
            const x = 12 + i * cw;
            const up = c.close >= c.open;
            const color = up ? "#7d9a6f" : "#c4553a";
            const top = y(Math.max(c.open, c.close));
            const bh = Math.max(1.5, Math.abs(y(c.open) - y(c.close)));
            return (
              <g key={c.age} onClick={() => setSel(c)} style={{ cursor: "pointer" }}>
                <rect x={x - 4} y={0} width={cw} height={H} fill="transparent" />
                <line x1={x} x2={x} y1={y(c.high)} y2={y(c.low)} stroke={color} strokeWidth="1" />
                <rect x={x - 3} y={top} width={6} height={bh} rx="1" fill={up ? "#fff" : color} stroke={color} strokeWidth="1" />
                {c.age % 10 === 0 && (
                  <text x={x} y={H + 14} textAnchor="middle" fontSize="9" fill="#9a958c">
                    {c.age}
                  </text>
                )}
                {sel?.age === c.age && <rect x={x - 5} y={2} width={10} height={H - 4} rx="2" fill="rgba(43,43,43,0.08)" />}
              </g>
            );
          })}
          <polyline
            points={ma.map((v, i) => `${12 + i * cw},${y(v)}`).join(" ")}
            fill="none"
            stroke="#6e8ba6"
            strokeWidth="1.2"
            opacity="0.65"
          />
          {currentAge <= candles.length && (
            <g>
              <line x1={12 + (currentAge - 1) * cw} x2={12 + (currentAge - 1) * cw} y1={4} y2={H} stroke="#2b2b2b" strokeDasharray="2 3" opacity="0.45" />
              <text x={12 + (currentAge - 1) * cw + 3} y={12} fontSize="9" fill="#2b2b2b" opacity="0.7">
                今年
              </text>
            </g>
          )}
        </svg>
      </div>
      <div className="mt-2 text-center text-[10.5px] text-mute">
        横向滑动查看 1~{candles.length} 岁运势 · 点按年份可看当年卦气
      </div>
    </div>
  );
}

export function BaziChart({ b, birth }: { b: BaziResult; birth?: string }) {
  const [tab, setTab] = useState<"pillars" | "kline">("pillars");
  const max = Math.max(...Object.values(b.wuxing), 1);
  const kl = useMemo(() => (birth ? computeKLine(b, birth) : null), [b, birth]);

  return (
    <div>
      <div className="mb-3 flex items-center justify-center gap-2">
        <button
          onClick={() => setTab("pillars")}
          className={`rounded-full px-4 py-1 text-[13px] font-medium transition ${
            tab === "pillars" ? "bg-ink text-paper shadow-sm" : "bg-paper-2 text-mute hover:text-ink-2"
          }`}
        >
          四柱原局
        </button>
        <button
          onClick={() => setTab("kline")}
          className={`rounded-full px-4 py-1 text-[13px] font-medium transition ${
            tab === "kline" ? "bg-ink text-paper shadow-sm" : "bg-paper-2 text-mute hover:text-ink-2"
          }`}
        >
          人生百岁K线
        </button>
      </div>

      {tab === "pillars" ? (
        <div className="anim-fade-in">
          <div className="grid grid-cols-4 gap-2">
            {b.pillars.map((p) => (
              <div key={p.label} className={`rounded-2xl border border-line bg-white/70 py-3 text-center ${p.label === "日柱" ? "ring-1 ring-seal/40" : ""}`}>
                <div className="text-[11px] text-mute">{p.label}</div>
                <div className="mt-1 font-song text-[22px] font-bold leading-tight tracking-wider" style={{ writingMode: "vertical-rl", margin: "4px auto 0", height: 52 }}>
                  {p.gz}
                </div>
                <div className="mt-1 text-[11px] text-ink-2">{p.wx || "—"}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            {Object.entries(b.wuxing).map(([k, v]) => (
              <div key={k} className="flex items-center gap-3 text-[13px]">
                <span className="w-4 font-song font-bold" style={{ color: WX_COLOR[k] }}>
                  {k}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/5">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(v / max) * 100}%`, background: WX_COLOR[k] }} />
                </div>
                <span className="w-4 text-right text-mute">{v}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl bg-paper-2 p-3.5 text-[13.5px] leading-relaxed text-ink-2">
            日主 <b className="font-song text-ink">{b.dayMaster}{b.dayMasterWx}</b>——{WX_PLAIN[b.dayMasterWx] ?? "自有一番气象"}。
            <div className="mt-1 text-[12.5px] text-mute">
              {b.lunarText} · 属{b.shengxiao} · {b.zodiac} · {b.nayin}
              {!b.hourKnown && " · 时辰不详"}
            </div>
          </div>
        </div>
      ) : (
        <div>
          {kl ? (
            <KLineChart candles={kl.candles} currentAge={kl.currentAge} />
          ) : (
            <div className="rounded-2xl border border-dashed border-line p-6 text-center text-[13px] text-mute">
              生辰数据不足以推演时序K线
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function BirthForm({ onSave, initialGender }: { onSave: (birth: string, gender?: string) => void; initialGender?: string }) {
  const [date, setDate] = useState("1996-06-18");
  const [time, setTime] = useState("12:00");
  const [noTime, setNoTime] = useState(false);
  const [gender, setGender] = useState<string | undefined>(initialGender);
  const preview = computeBazi(noTime ? date : `${date} ${time}`);
  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-[12.5px] text-mute">出生日期（公历）</span>
        <input
          type="date"
          value={date}
          max="2030-12-31"
          min="1920-01-01"
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 block w-full rounded-xl border border-line bg-white px-3 py-2.5 text-ink outline-none focus:border-ink/40"
        />
      </label>
      <div className="flex items-end gap-3">
        <label className="block flex-1">
          <span className="text-[12.5px] text-mute">出生时间</span>
          <input
            type="time"
            value={time}
            disabled={noTime}
            onChange={(e) => setTime(e.target.value)}
            className="mt-1 block w-full rounded-xl border border-line bg-white px-3 py-2.5 text-ink outline-none disabled:opacity-40"
          />
        </label>
        <Pill active={noTime} onClick={() => setNoTime(!noTime)} className="mb-1">
          不记得了
        </Pill>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[12.5px] text-mute">性别</span>
        {["女", "男", "不说"].map((g) => (
          <Pill key={g} active={gender === g} onClick={() => setGender(g)}>
            {g}
          </Pill>
        ))}
      </div>
      {preview && (
        <div className="text-[12px] text-mute">
          预览：{preview.pillars.map((p) => p.gz).join(" ")} · 属{preview.shengxiao}
        </div>
      )}
      <button
        disabled={!preview}
        onClick={() => onSave(noTime ? date : `${date} ${time}`, gender && gender !== "不说" ? gender : undefined)}
        className="w-full rounded-2xl bg-ink py-3 text-[15px] text-paper transition active:scale-[0.98] disabled:opacity-40"
      >
        排盘
      </button>
      <p className="text-center text-[11.5px] text-mute">只存在你自己的手机里。</p>
    </div>
  );
}

export function AlmanacCard({ compact = false }: { compact?: boolean }) {
  const [a] = useState(() => todayAlmanac());
  return (
    <div className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-[#fffdf8] to-[#f4efe4] p-4">
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-25 blur-2xl" style={{ background: a.color.hex }} />
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[12px] tracking-widest text-mute">
            {a.weekday} · {a.jieqi ? `${a.jieqi}后` : "今日"}
          </div>
          <div className={`font-song font-bold ${compact ? "text-[24px]" : "text-[34px]"} leading-tight`}>{a.dateText}</div>
          <div className="text-[13px] text-ink-2">农历{a.lunarText}</div>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-mute">今日色</div>
          <div className="mt-1 flex items-center justify-end gap-1.5">
            <span className="h-4 w-4 rounded-full border border-black/10" style={{ background: a.color.hex }} />
            <span className="font-song text-[14px]">{a.color.name}</span>
          </div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[13px]">
        <div className="rounded-xl bg-white/70 px-3 py-2">
          <span className="mr-1.5 inline-grid h-5 w-5 place-items-center rounded-full bg-sage text-[11px] text-white">宜</span>
          <span className="text-ink-2">{a.yi.slice(0, compact ? 2 : 4).join(" ")}</span>
        </div>
        <div className="rounded-xl bg-white/70 px-3 py-2">
          <span className="mr-1.5 inline-grid h-5 w-5 place-items-center rounded-full bg-seal text-[11px] text-white">忌</span>
          <span className="text-ink-2">{a.ji.slice(0, compact ? 2 : 4).join(" ")}</span>
        </div>
      </div>
      <div className="mt-3 font-song text-[14.5px] text-ink">「{a.line}」</div>
      {!compact && <div className="mt-1 text-[11px] text-mute">{a.ganzhi}</div>}
    </div>
  );
}
