"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import BirthForm from "@/components/BirthForm";
import InterpretPanel from "@/components/Interpret";
import { saveReading, ToolFrame } from "@/components/ToolFrame";
import { useApp } from "@/components/AppShell";
import { api, getUid, haptic, patchUser, useUserState } from "@/lib/client";
import { computeBazi, computeKLine, type Candle } from "@/lib/bazi";
import { interpretBazi } from "@/lib/mock-oracle";
import { PASS_PRICE, UNLOCK_PRICE, yuan } from "@/lib/pricing";
import { Skeleton } from "@/components/ui";

type Reading = { id: string; data: { birthday: string; hour: number | null }; unlocked: boolean; interpretation: string | null };

function KLineChart({ candles, currentAge, lockedFrom, onLockedTap }: { candles: Candle[]; currentAge: number; lockedFrom: number | null; onLockedTap: () => void }) {
  const [sel, setSel] = useState<Candle | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const cw = 10;
  const H = 210;
  const pad = 14;
  const W = candles.length * cw + 20;
  const y = (v: number) => pad + (100 - v) * ((H - pad * 2) / 100);
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollLeft = Math.max(0, (currentAge - 12) * cw);
  }, [currentAge]);
  const ma = candles.map((_, i) => {
    const s = candles.slice(Math.max(0, i - 4), i + 1);
    return s.reduce((a, c) => a + c.close, 0) / s.length;
  });
  const shown = sel ?? candles.find((c) => c.age === currentAge) ?? candles[0];
  const shownLocked = lockedFrom != null && shown.age >= lockedFrom;

  return (
    <div className="rounded-3xl bg-white p-4">
      <div className="mb-3 flex min-h-[46px] items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-mono text-[18px] text-ink">{shown.age}岁 <span className="text-[12px] text-sub">{shown.year} · {shown.pillar}</span></div>
          {shownLocked ? (
            <div className="mt-0.5 text-[12px] text-faint">这一年还没解锁</div>
          ) : (
            <div className="mt-0.5 font-mono text-[11.5px] text-sub">开 {shown.open} · 高 {shown.high} · 低 {shown.low} · 收 <span className={shown.close >= shown.open ? "text-sage" : "text-clay"}>{shown.close}</span></div>
          )}
        </div>
        {!shownLocked && shown.tag && <span className="shrink-0 rounded-full bg-sand px-2 py-0.5 text-[11px] text-ink-2">{shown.tag}</span>}
      </div>
      <div ref={ref} className="no-scrollbar relative -mx-4 overflow-x-auto px-4">
        <svg width={W} height={H + 20} className="block">
          {[40, 50, 65].map((v) => (
            <g key={v}>
              <line x1="0" x2={W} y1={y(v)} y2={y(v)} stroke={v === 50 ? "#d9d3c8" : "#eeeae3"} strokeDasharray={v === 50 ? "0" : "3 4"} />
            </g>
          ))}
          {candles.map((c, i) => {
            const x = 10 + i * cw;
            const locked = lockedFrom != null && c.age >= lockedFrom;
            const up = c.close >= c.open;
            const color = locked ? "#dcd6cc" : up ? "#7e9a7a" : "#b4664a";
            const top = y(Math.max(c.open, c.close));
            const bh = Math.max(1.5, Math.abs(y(c.open) - y(c.close)));
            return (
              <g key={c.age} onClick={() => { haptic(4); setSel(c); if (locked) onLockedTap(); }} style={{ cursor: "pointer" }} opacity={locked ? 0.55 : 1}>
                <rect x={x - 4} y={0} width={cw} height={H} fill="transparent" />
                <line x1={x} x2={x} y1={y(c.high)} y2={y(c.low)} stroke={color} strokeWidth="1" />
                <rect x={x - 3} y={top} width={6} height={bh} rx="1" fill={up && !locked ? "#fff" : color} stroke={color} strokeWidth="1" />
                {c.age % 10 === 0 && <text x={x} y={H + 14} textAnchor="middle" fontSize="9.5" fill="#8b867e">{c.age}</text>}
                {sel?.age === c.age && <rect x={x - 5} y={2} width={10} height={H - 4} rx="3" fill="rgba(38,38,38,0.05)" />}
              </g>
            );
          })}
          <polyline
            points={ma.map((v, i) => `${10 + i * cw},${y(v)}`).filter((_, i) => lockedFrom == null || candles[i].age < lockedFrom).join(" ")}
            fill="none" stroke="#6e8ba6" strokeWidth="1.2" opacity="0.7"
          />
          {currentAge <= candles.length && (
            <g>
              <line x1={10 + (currentAge - 1) * cw} x2={10 + (currentAge - 1) * cw} y1={4} y2={H} stroke="#262626" strokeDasharray="2 3" opacity="0.4" />
              <text x={10 + (currentAge - 1) * cw + 4} y={12} fontSize="9.5" fill="#262626" opacity="0.6">今年</text>
            </g>
          )}
        </svg>
        {lockedFrom != null && (
          <div className="pointer-events-none absolute top-0 bottom-5 backdrop-blur-[3px]" style={{ left: 16 + (lockedFrom - 1) * cw - 2, width: W }} />
        )}
      </div>
      <div className="mt-2 flex items-center gap-4 text-[11px] text-sub">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm border border-sage" />顺</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-clay" />磨</span>
        <span className="flex items-center gap-1"><span className="h-px w-3 bg-mist" />五年均线</span>
        <span className="ml-auto">左右滑动 · 点按看每一年</span>
      </div>
    </div>
  );
}

export default function KLinePage() {
  const { user, loading } = useUserState();
  const { openPay } = useApp();
  const [reading, setReading] = useState<Reading | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const bd = user?.profile?.birthday;
  const hour = user?.profile?.birthHour ?? null;

  useEffect(() => {
    if (!bd || editing) return;
    let cancelled = false;
    (async () => {
      setBusy(true);
      let r: Reading | null = null;
      try {
        const list = await api<{ readings: Reading[] }>(`/api/readings?userId=${getUid()}&kind=kline`);
        r = list.readings.find((x) => x.data?.birthday === bd && (x.data?.hour ?? null) === hour) ?? null;
      } catch {}
      if (!r) {
        const b = computeBazi(bd, hour);
        const s = await saveReading({ kind: "kline", title: `人生波动图 · ${b.pillars.year.label}年生`, data: { birthday: bd, hour } });
        r = { id: s.id, data: { birthday: bd, hour }, unlocked: s.unlocked, interpretation: s.interpretation };
      }
      if (!cancelled) { setReading(r); setBusy(false); }
    })();
    return () => { cancelled = true; };
  }, [bd, hour, editing]);

  const bazi = useMemo(() => (bd ? computeBazi(bd, hour) : null), [bd, hour]);
  const kline = useMemo(() => (bazi ? computeKLine(bazi) : null), [bazi]);
  const currentAge = bd ? new Date().getFullYear() - Number(bd.slice(0, 4)) + 1 : 1;
  const unlocked = !!reading?.unlocked || !!user?.pass;
  const lockedFrom = unlocked ? null : currentAge + 2;

  const askUnlock = () => {
    if (!reading) return;
    openPay({
      kind: "unlock",
      readingId: reading.id,
      title: "解锁人生波动详批",
      reason: "完整 1~90 岁曲线、每步大运的主题、高点与低点怎么过，详批永久留在你的档案里。",
      onSuccess: () => setReading((r) => (r ? { ...r, unlocked: true } : r)),
    });
  };

  const showForm = editing || (!loading && !bd);

  return (
    <ToolFrame title="人生波动图" sub="八字大运 × 流年 · 1~90 岁" right={bd && !editing ? <button onClick={() => setEditing(true)} className="text-[13px] text-sub">修改</button> : null}>
      {showForm ? (
        <div className="anim-fade-up pt-4">
          <div className="mb-6 text-center">
            <div className="font-serif text-[18px] text-ink">人生不是直线，是 K 线</div>
            <div className="mt-1 text-[12.5px] text-sub">有涨有跌，才叫行情</div>
          </div>
          <BirthForm initial={user?.profile} submitLabel="生成我的人生图" onSubmit={async (v) => { await patchUser({ profile: { birthday: v.birthday, birthHour: v.birthHour, ...(v.gender ? { gender: v.gender } : {}) } }).catch(() => {}); setEditing(false); }} />
        </div>
      ) : !kline || busy || !reading ? (
        <div className="space-y-3 pt-3"><Skeleton className="h-[300px] rounded-3xl" /><Skeleton className="h-24 rounded-3xl" /></div>
      ) : (
        <div className="anim-fade-up space-y-4 pt-2">
          <KLineChart candles={kline.candles} currentAge={currentAge} lockedFrom={lockedFrom} onLockedTap={askUnlock} />

          <div className="grid grid-cols-2 gap-2.5">
            <div className="min-w-0 rounded-2xl bg-white p-4">
              <div className="text-[11.5px] text-sub">人生高点</div>
              <div className={`mt-1 font-mono text-[20px] text-sage ${unlocked ? "" : "blur-[6px] select-none"}`}>{unlocked ? `${kline.peak.age} 岁` : "?? 岁"}</div>
              <div className={`text-[11.5px] text-faint ${unlocked ? "" : "blur-[4px]"}`}>{unlocked ? `${kline.peak.year} · ${kline.peak.pillar}` : "0000 · 甲子"}</div>
            </div>
            <div className="min-w-0 rounded-2xl bg-white p-4">
              <div className="text-[11.5px] text-sub">需要多照顾自己</div>
              <div className={`mt-1 font-mono text-[20px] text-clay ${unlocked ? "" : "blur-[6px] select-none"}`}>{unlocked ? `${kline.trough.age} 岁` : "?? 岁"}</div>
              <div className={`text-[11.5px] text-faint ${unlocked ? "" : "blur-[4px]"}`}>{unlocked ? `${kline.trough.year} · ${kline.trough.pillar}` : "0000 · 甲子"}</div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-4">
            <div className="mb-2 text-[12.5px] text-sub">大运 · 每十年一步</div>
            <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
              {kline.luckPillars.map((l, i) => {
                const hidden = !unlocked && l.startAge > currentAge + 2;
                return (
                  <div key={i} className={`flex w-[62px] shrink-0 flex-col items-center rounded-2xl py-2.5 ${currentAge >= l.startAge && currentAge < l.startAge + 10 ? "bg-ink text-paper" : "bg-paper"}`}>
                    <div className={`font-serif text-[16px] ${hidden ? "blur-[4px]" : ""}`}>{hidden ? "甲子" : l.label}</div>
                    <div className="mt-0.5 text-[10.5px] opacity-60">{l.startAge}岁起</div>
                    <div className={`mt-1 text-[10.5px] ${hidden ? "opacity-0" : l.score > 4 ? "text-sage" : l.score < -4 ? "text-clay" : "opacity-60"}`}>{l.score > 4 ? "顺" : l.score < -4 ? "磨" : "平"}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {unlocked ? (
            <InterpretPanel readingId={reading.id} initial={reading.interpretation} auto={false} label="请写一份人生详批" localFallback={() => interpretBazi(bazi!, kline)} onLocked={askUnlock} />
          ) : (
            <div className="rounded-3xl border border-line bg-white p-5 text-center">
              <div className="font-serif text-[17px] text-ink">剩下的人生，要不要看完？</div>
              <div className="mx-auto mt-1.5 max-w-[280px] text-[12.5px] leading-relaxed text-sub">解锁完整曲线和一份私人详批。看完记得：高点别飘，低点别慌。</div>
              <button onClick={askUnlock} className="mt-4 w-full rounded-full bg-ink py-3.5 text-[15px] text-paper active:scale-[0.98]">¥{yuan(UNLOCK_PRICE)} 解锁这一份</button>
              <button onClick={() => openPay({ kind: "pass", title: "松弛月卡", reason: "30 天内，人生图和所有深度详批随便看。", onSuccess: () => setReading((r) => (r ? { ...r, unlocked: true } : r)) })} className="mt-2 w-full rounded-full border border-line py-3 text-[13.5px] text-ink-2 active:scale-[0.98]">或 ¥{yuan(PASS_PRICE)} 开松弛月卡</button>
            </div>
          )}
          <p className="text-center text-[11.5px] leading-relaxed text-faint">曲线由八字大运与流年推演而来，是一张地图，不是判决书。</p>
        </div>
      )}
    </ToolFrame>
  );
}
