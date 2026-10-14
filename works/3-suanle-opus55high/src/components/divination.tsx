"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { haptic } from "@/lib/client";
import { isYang, LINE_NAMES, resolveCast, tossCoins, trigramsOf, type CastResult, type LineValue } from "@/lib/iching";
import { MAJOR_ARCANA, SPREADS, type DrawnCard, type TarotResult, type TarotSpread } from "@/lib/tarot";
import { ELEMENT_CN, ELEMENT_COLOR, ELEMENTS, STEMS, BRANCHES, type BaziResult, type Element } from "@/lib/bazi";

/* ---------------- 六爻 ---------------- */

export function YaoLine({ value, w = 120, h = 12, animate = false }: { value: LineValue; w?: number; h?: number; animate?: boolean }) {
  const yang = isYang(value);
  const changing = value === 6 || value === 9;
  return (
    <div className={`flex items-center gap-2 ${animate ? "line-in" : ""}`}>
      <div className="flex" style={{ width: w, height: h, gap: w * 0.14 }}>
        {yang ? <div className="flex-1 rounded-[3px] bg-ink" /> : <><div className="flex-1 rounded-[3px] bg-ink" /><div className="flex-1 rounded-[3px] bg-ink" /></>}
      </div>
      <span className="w-3 text-center text-[11px] text-clay">{changing ? (value === 9 ? "○" : "×") : ""}</span>
    </div>
  );
}

export function HexFigure({ lines, w = 64, h = 7, muted = false }: { lines: number[]; w?: number; h?: number; muted?: boolean }) {
  return (
    <div className="flex flex-col-reverse" style={{ gap: h * 0.7 }}>
      {lines.map((b, i) => (
        <div key={i} className="flex" style={{ width: w, height: h, gap: w * 0.16 }}>
          {b ? <div className={`flex-1 rounded-[2px] ${muted ? "bg-faint" : "bg-ink"}`} /> : <><div className={`flex-1 rounded-[2px] ${muted ? "bg-faint" : "bg-ink"}`} /><div className={`flex-1 rounded-[2px] ${muted ? "bg-faint" : "bg-ink"}`} /></>}
        </div>
      ))}
    </div>
  );
}

function Coin({ face, spinning, delay }: { face: 2 | 3 | null; spinning: boolean; delay: number }) {
  return (
    <div className={`relative flex h-16 w-16 items-center justify-center rounded-full border-2 ${face === 3 ? "border-clay/60 bg-clay-soft" : "border-[#c9b38a] bg-[#f4ead6]"} shadow-[inset_0_-3px_0_rgba(0,0,0,0.06)] ${spinning ? "coin-flip" : ""}`} style={{ animationDelay: `${delay}ms` }}>
      <div className="absolute h-4 w-4 rounded-[3px] border-2 border-[#c9b38a] bg-paper" />
      {face === 2 && (
        <div className="absolute inset-0 font-serif text-[10px] text-[#8a7350]">
          <span className="absolute top-1.5 left-1/2 -translate-x-1/2">乾</span>
          <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2">隆</span>
          <span className="absolute top-1/2 left-1.5 -translate-y-1/2">宝</span>
          <span className="absolute top-1/2 right-1.5 -translate-y-1/2">通</span>
        </div>
      )}
    </div>
  );
}

export function HexagramCast({ question, onDone, autoFocusQuestion = false, askQuestion = true }: { question?: string; onDone: (c: CastResult) => void; autoFocusQuestion?: boolean; askQuestion?: boolean }) {
  const [q, setQ] = useState(question ?? "");
  const [lines, setLines] = useState<LineValue[]>([]);
  const [coins, setCoins] = useState<(2 | 3)[] | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [computing, setComputing] = useState(false);
  const lastShake = useRef(0);
  const busy = spinning || computing;

  const toss = () => {
    if (busy || lines.length >= 6) return;
    haptic([12, 60, 12, 60, 18]);
    setSpinning(true);
    const r = tossCoins();
    setTimeout(() => {
      setCoins(r.coins);
      setSpinning(false);
      haptic(20);
      setLines((prev) => {
        const next = [...prev, r.value];
        if (next.length === 6) {
          setComputing(true);
          setTimeout(() => onDone(resolveCast(next, q.trim() || undefined)), 1600);
        }
        return next;
      });
    }, 950);
  };

  const tossRef = useRef(toss);
  useEffect(() => { tossRef.current = toss; });
  useEffect(() => {
    const onMotion = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const mag = Math.abs(a.x ?? 0) + Math.abs(a.y ?? 0) + Math.abs(a.z ?? 0);
      if (mag > 34 && Date.now() - lastShake.current > 1400) {
        lastShake.current = Date.now();
        tossRef.current();
      }
    };
    window.addEventListener("devicemotion", onMotion);
    return () => window.removeEventListener("devicemotion", onMotion);
  }, []);

  const requestMotion = async () => {
    const D = window.DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> };
    if (D?.requestPermission) { try { await D.requestPermission(); } catch {} }
  };

  return (
    <div className="flex flex-col items-center">
      {askQuestion && lines.length === 0 && (
        <div className="w-full">
          <label className="mb-1.5 block text-[12px] text-sub">心里默念一个问题（可以不写）</label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoFocus={autoFocusQuestion}
            maxLength={60}
            placeholder="比如：这周要不要跟领导提调岗"
            className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-[15px] outline-none placeholder:text-faint focus:border-faint"
          />
        </div>
      )}
      {askQuestion && lines.length > 0 && q && <div className="w-full truncate text-center text-[13px] text-sub">「{q}」</div>}

      <div className="mt-6 flex h-24 items-end justify-center gap-4">
        {[0, 1, 2].map((i) => <Coin key={i} face={spinning ? null : coins?.[i] ?? null} spinning={spinning} delay={i * 70} />)}
      </div>

      <div className="mt-6 flex min-h-[132px] flex-col-reverse items-center gap-2.5">
        {lines.map((v, i) => <YaoLine key={i} value={v} animate />)}
        {Array.from({ length: 6 - lines.length }).map((_, i) => <div key={`e${i}`} className="mr-5 h-3 w-[120px] rounded-[3px] border border-dashed border-line" />)}
      </div>

      <div className="mt-6 h-5 text-[12.5px] text-sub">
        {computing ? <span className="shimmer-text">卦成，正在排本卦、互卦、变卦…</span> : lines.length === 0 ? "三枚铜钱，摇六次，自下而上成卦" : `第 ${lines.length} 爻：${["", "", "", "", "", "", "老阴 · 变", "少阳", "少阴", "老阳 · 变"][lines[lines.length - 1]]}`}
      </div>

      <button
        onClick={() => { requestMotion(); toss(); }}
        disabled={busy || lines.length >= 6}
        className="mt-4 w-full rounded-full bg-ink py-3.5 text-[15px] text-paper transition active:scale-[0.98] disabled:opacity-50"
      >
        {lines.length >= 6 ? "卦已成" : spinning ? "铜钱在转…" : `摇一下 · ${lines.length}/6`}
      </button>
      <p className="mt-2 text-[11px] text-faint">也可以晃一晃手机</p>
    </div>
  );
}

export function HexagramResult({ cast, compact = false }: { cast: CastResult; compact?: boolean }) {
  const bits = cast.lines.map((v) => (isYang(v) ? 1 : 0));
  const resBits = cast.lines.map((v, i) => (v === 6 ? 1 : v === 9 ? 0 : bits[i]));
  const names = LINE_NAMES(cast.lines);
  const tg = trigramsOf(bits);
  return (
    <div className="min-w-0">
      <div className="flex items-center justify-center gap-6">
        <div className="flex flex-col items-center">
          <HexFigure lines={bits} w={compact ? 44 : 60} h={compact ? 5 : 7} />
          <div className="mt-2 text-[11px] text-sub">本卦</div>
          <div className="font-serif text-[15px] text-ink">{cast.original.full}</div>
        </div>
        {cast.resulting && (
          <>
            <svg width="22" height="12" viewBox="0 0 22 12" className="text-faint"><path d="M1 6h18M15 2l4 4-4 4" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" /></svg>
            <div className="flex flex-col items-center">
              <HexFigure lines={resBits} w={compact ? 44 : 60} h={compact ? 5 : 7} muted />
              <div className="mt-2 text-[11px] text-sub">变卦</div>
              <div className="font-serif text-[15px] text-ink">{cast.resulting.full}</div>
            </div>
          </>
        )}
      </div>
      {!compact && (
        <div className="mt-5 space-y-3 text-[13.5px] leading-relaxed">
          <div className="rounded-2xl bg-white p-4">
            <div className="flex items-center justify-between text-[11.5px] text-sub">
              <span>{tg.upper}上 · {tg.lower}下</span>
              <span className={`rounded-full px-2 py-0.5 ${cast.original.tone === "吉" ? "bg-sage-soft text-sage" : cast.original.tone === "慎" ? "bg-clay-soft text-clay" : "bg-mist-soft text-mist"}`}>{cast.original.tone === "慎" ? "宜慢" : cast.original.tone === "吉" ? "顺" : "平"}</span>
            </div>
            <div className="mt-2 font-serif text-ink">「{cast.original.judgment}」</div>
            <div className="mt-1 text-[12.5px] text-sub">象曰：{cast.original.image}</div>
            <div className="mt-3 text-ink-2">{cast.original.modern}</div>
          </div>
          <div className="grid grid-cols-2 gap-2.5 text-[12.5px]">
            <div className="min-w-0 rounded-2xl bg-white p-3">
              <div className="text-sub">互卦 · 暗流</div>
              <div className="mt-1 truncate font-serif text-ink">{cast.nuclear.full}</div>
            </div>
            <div className="min-w-0 rounded-2xl bg-white p-3">
              <div className="text-sub">动爻</div>
              <div className="mt-1 truncate font-serif text-ink">{cast.changing.length ? cast.changing.map((p) => names[p - 1]).join(" · ") : "六爻安静"}</div>
            </div>
          </div>
          <div className="rounded-2xl border border-clay/20 bg-clay-soft/50 p-4 text-ink">
            <span className="mr-1 text-clay">算了 ·</span>{(cast.resulting ?? cast.original).letgo}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- 塔罗 ---------------- */

export function TarotFace({ d, size = "md" }: { d: DrawnCard; size?: "sm" | "md" }) {
  const sm = size === "sm";
  return (
    <div className={`flex h-full w-full flex-col items-center justify-between rounded-xl border border-[#d9cdb8] bg-[#fbf7ef] ${sm ? "p-1.5" : "p-2.5"}`}>
      <div className={`font-serif text-[#8a7350] ${sm ? "text-[9px]" : "text-[11px]"}`}>{d.card.numeral}</div>
      <div className={`text-ink ${sm ? "text-[22px]" : "text-[34px]"} ${d.reversed ? "rotate-180" : ""}`}>{d.card.glyph}</div>
      <div className="text-center">
        <div className={`font-serif text-ink ${sm ? "text-[10.5px]" : "text-[13px]"}`}>{d.card.name}</div>
        {!sm && <div className="text-[9px] tracking-wide text-sub uppercase">{d.card.en}</div>}
        {d.reversed && <div className={`text-clay ${sm ? "text-[8.5px]" : "text-[10px]"}`}>逆位</div>}
      </div>
    </div>
  );
}

function CardBack({ sm = false }: { sm?: boolean }) {
  return (
    <div className="flex h-full w-full items-center justify-center rounded-xl border border-[#3a3a36] bg-[#2f2f2c] p-1">
      <div className="flex h-full w-full items-center justify-center rounded-lg border border-[#c9b38a]/40">
        <span className={`font-serif text-[#c9b38a]/80 ${sm ? "text-[12px]" : "text-[18px]"}`}>☷</span>
      </div>
    </div>
  );
}

export function TarotDraw({ spread, question, onDone }: { spread: TarotSpread; question?: string; onDone: (r: TarotResult) => void }) {
  const deck = useMemo(() => {
    const d = [...MAJOR_ARCANA];
    for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; }
    return d.map((card) => ({ card, reversed: Math.random() < 0.3 }));
  }, []);
  const positions = SPREADS[spread].positions;
  const [picked, setPicked] = useState<number[]>([]);
  const [flipped, setFlipped] = useState<number>(-1);
  const full = picked.length >= positions.length;

  useEffect(() => {
    if (!full) return;
    let i = 0;
    const t = setInterval(() => {
      setFlipped(i);
      haptic(14);
      i++;
      if (i >= positions.length) {
        clearInterval(t);
        setTimeout(() => onDone({ spread, question, at: new Date().toISOString(), cards: picked.map((p, k) => ({ ...deck[p], position: positions[k] })) }), 1100);
      }
    }, 650);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [full]);

  return (
    <div className="flex flex-col items-center">
      <div className="flex justify-center gap-3">
        {positions.map((pos, k) => {
          const p = picked[k];
          return (
            <div key={pos} className="flex flex-col items-center">
              <div className="card-3d h-[124px] w-[78px]">
                {p === undefined ? (
                  <div className="h-full w-full rounded-xl border border-dashed border-line" />
                ) : (
                  <div className={`card-inner relative h-full w-full ${flipped >= k ? "flipped" : ""}`}>
                    <div className="card-face absolute inset-0"><CardBack /></div>
                    <div className="card-face card-back-face absolute inset-0"><TarotFace d={{ ...deck[p], position: pos }} /></div>
                  </div>
                )}
              </div>
              <div className="mt-1.5 text-[11.5px] text-sub">{pos}</div>
            </div>
          );
        })}
      </div>
      <div className="mt-5 h-5 text-[12.5px] text-sub">{full ? <span className="shimmer-text">翻牌中…</span> : `凭直觉，选 ${positions.length - picked.length} 张`}</div>
      <div className="no-scrollbar mt-3 w-full overflow-x-auto pb-3">
        <div className="flex px-4 pt-4" style={{ width: deck.length * 30 + 60 }}>
          {deck.map((_, i) => {
            const taken = picked.includes(i);
            return (
              <button
                key={i}
                disabled={taken || full}
                onClick={() => { haptic(8); setPicked((s) => [...s, i]); }}
                className={`-mr-[26px] h-[92px] w-[56px] shrink-0 transition-all duration-300 ${taken ? "pointer-events-none -translate-y-6 opacity-0" : "hover:-translate-y-3 active:-translate-y-3"}`}
                style={{ transform: taken ? undefined : `rotate(${(i - deck.length / 2) * 1.6}deg)` }}
                aria-label="选这张牌"
              >
                <CardBack sm />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function TarotResultView({ result, compact = false }: { result: TarotResult; compact?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="flex justify-center gap-2.5">
        {result.cards.map((d) => (
          <div key={d.position} className="flex flex-col items-center">
            <div className={compact ? "h-[86px] w-[54px]" : "h-[124px] w-[78px]"}><TarotFace d={d} size={compact ? "sm" : "md"} /></div>
            <div className="mt-1 text-[11px] text-sub">{d.position}</div>
          </div>
        ))}
      </div>
      {!compact && (
        <div className="mt-5 space-y-2.5">
          {result.cards.map((d) => (
            <div key={d.position} className="rounded-2xl bg-white p-4 text-[13.5px] leading-relaxed">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 truncate font-serif text-ink">{d.position} · {d.card.name}{d.reversed ? "（逆位）" : ""}</div>
                <div className="flex shrink-0 gap-1">{(d.reversed ? d.card.rev : d.card.up).slice(0, 2).map((k) => <span key={k} className="rounded-full bg-sand px-2 py-0.5 text-[10.5px] text-sub">{k}</span>)}</div>
              </div>
              <div className="mt-1.5 text-ink-2">{d.reversed ? d.card.reversed : d.card.upright}</div>
            </div>
          ))}
          <div className="rounded-2xl border border-clay/20 bg-clay-soft/50 p-4 text-[13.5px] text-ink">
            <span className="mr-1 text-clay">算了 ·</span>{result.cards[result.cards.length - 1].card.letgo}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- 八字 ---------------- */

const STEM_EL: Element[] = ["wood", "wood", "fire", "fire", "earth", "earth", "metal", "metal", "water", "water"];
const BR_EL: Element[] = ["water", "earth", "wood", "wood", "earth", "fire", "fire", "earth", "metal", "metal", "earth", "water"];

export function PillarsView({ bazi }: { bazi: BaziResult }) {
  const cols = [
    ["年柱", bazi.pillars.year],
    ["月柱", bazi.pillars.month],
    ["日柱", bazi.pillars.day],
    ["时柱", bazi.pillars.hour],
  ] as const;
  return (
    <div className="grid grid-cols-4 gap-2">
      {cols.map(([label, p]) => (
        <div key={label} className={`flex flex-col items-center rounded-2xl py-3 ${label === "日柱" ? "bg-white ring-1 ring-ink/10" : "bg-white/70"}`}>
          <div className="text-[11px] text-sub">{label}</div>
          {p ? (
            <>
              <div className="mt-1.5 font-serif text-[26px] leading-none" style={{ color: ELEMENT_COLOR[STEM_EL[p.stem]] }}>{STEMS[p.stem]}</div>
              <div className="mt-1 font-serif text-[26px] leading-none" style={{ color: ELEMENT_COLOR[BR_EL[p.branch]] }}>{BRANCHES[p.branch]}</div>
            </>
          ) : (
            <div className="mt-3 text-[12px] leading-[1.9] text-faint">时辰<br />不详</div>
          )}
          {label === "日柱" && <div className="mt-1.5 text-[10px] text-clay">日元</div>}
        </div>
      ))}
    </div>
  );
}

export function ElementRadar({ elements, size = 180 }: { elements: Record<Element, number>; size?: number }) {
  const c = size / 2;
  const r = size / 2 - 26;
  const pt = (i: number, v: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    return [c + Math.cos(a) * r * v, c + Math.sin(a) * r * v];
  };
  const max = Math.max(40, ...Object.values(elements));
  const poly = ELEMENTS.map((e, i) => pt(i, Math.max(0.08, elements[e] / max)).join(",")).join(" ");
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
      {[0.33, 0.66, 1].map((s) => <polygon key={s} points={ELEMENTS.map((_, i) => pt(i, s).join(",")).join(" ")} fill="none" stroke="#e5e0d7" />)}
      <polygon points={poly} fill="rgba(180,102,74,0.16)" stroke="#b4664a" strokeWidth="1.5" strokeLinejoin="round" />
      {ELEMENTS.map((e, i) => {
        const [x, y] = pt(i, 1.22);
        return (
          <g key={e}>
            <text x={x} y={y - 2} textAnchor="middle" className="font-serif" fontSize="13" fill={ELEMENT_COLOR[e]}>{ELEMENT_CN[e]}</text>
            <text x={x} y={y + 11} textAnchor="middle" fontSize="10" fill="#8b867e">{elements[e]}%</text>
          </g>
        );
      })}
    </svg>
  );
}
