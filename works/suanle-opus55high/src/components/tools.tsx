import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  hexLines,
  resolveCast,
  tossThree,
  shuffledDeck,
  TAROT,
  TAROT_POSITIONS,
  type CastResult,
  type TarotDraw,
  type BaziResult,
  type Almanac,
  type Candle,
} from "@/lib/divination";
import { haptic, playCoin, playFlip } from "@/lib/sound";

export const WX_COLOR: Record<string, string> = { 木: "#6f8f62", 火: "#c4553a", 土: "#b8955a", 金: "#8d9298", 水: "#3f5a73" };
const GAN_WX: Record<string, string> = { 甲: "木", 乙: "木", 丙: "火", 丁: "火", 戊: "土", 己: "土", 庚: "金", 辛: "金", 壬: "水", 癸: "水" };
const ZHI_WX: Record<string, string> = { 子: "水", 丑: "土", 寅: "木", 卯: "木", 辰: "土", 巳: "火", 午: "火", 未: "土", 申: "金", 酉: "金", 戌: "土", 亥: "水" };
const YAO = ["初", "二", "三", "四", "五", "上"];

/* ───────────────────────── 铜钱 ───────────────────────── */

function Coin({ face, spinning, delay }: { face: number; spinning: boolean; delay: number }) {
  const yang = face === 3; // 背 = 3
  return (
    <div style={{ perspective: 400 }}>
      <div
        className={`relative grid h-14 w-14 place-items-center rounded-full ${spinning ? "coin-spin" : ""}`}
        style={{
          animationDelay: `${delay}ms`,
          background: "radial-gradient(circle at 35% 30%, #f1d9a0, #c99a4c 55%, #9c7433)",
          boxShadow: "inset 0 0 0 3px rgba(120,84,30,.35), 0 4px 10px rgba(120,84,30,.25)",
        }}
      >
        <div className="absolute h-4 w-4 rounded-[3px] bg-paper shadow-[inset_0_0_0_2px_rgba(120,84,30,.4)]" />
        <span className="absolute top-1 font-song text-[10px] font-bold text-[#6b4c1c]/80">{yang ? "背" : "字"}</span>
        <span className="absolute bottom-1 font-song text-[10px] font-bold text-[#6b4c1c]/80">{yang ? "" : "通"}</span>
      </div>
    </div>
  );
}

export function YaoLine({ yang, moving, w = 120, delay = 0 }: { yang: boolean; moving?: boolean; w?: number; delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0, scaleX: 0.3 }} animate={{ opacity: 1, scaleX: 1 }} transition={{ delay, duration: 0.4 }} className="relative flex items-center justify-between" style={{ width: w, height: 10 }}>
      {yang ? (
        <div className="h-full w-full rounded-[3px] bg-ink" />
      ) : (
        <>
          <div className="h-full rounded-[3px] bg-ink" style={{ width: "42%" }} />
          <div className="h-full rounded-[3px] bg-ink" style={{ width: "42%" }} />
        </>
      )}
      {moving && <span className="absolute -right-5 h-2 w-2 rounded-full bg-seal" />}
    </motion.div>
  );
}

export function HexFigure({ lines, moving = [], w = 110 }: { lines: number[]; moving?: number[]; w?: number }) {
  return (
    <div className="flex flex-col-reverse items-center gap-[7px]">
      {lines.map((l, i) => (
        <YaoLine key={i} yang={l === 1} moving={moving.includes(i + 1)} w={w} />
      ))}
    </div>
  );
}

export function CoinCaster({ question, initial, onDone, compact = false }: { question?: string; initial?: CastResult | null; onDone: (r: CastResult) => void; compact?: boolean }) {
  const [sums, setSums] = useState<number[]>(initial?.sums ?? []);
  const [faces, setFaces] = useState<number[]>([2, 3, 2]);
  const [spinning, setSpinning] = useState(false);
  const result = useMemo(() => (sums.length === 6 ? initial ?? resolveCast(sums, question) : null), [sums, initial, question]);
  const reported = useRef(!!initial);

  useEffect(() => {
    if (result && !reported.current) {
      reported.current = true;
      onDone(result);
    }
  }, [result, onDone]);

  const toss = () => {
    if (spinning || sums.length >= 6) return;
    const t = tossThree();
    setSpinning(true);
    haptic(12);
    [0, 160, 320].forEach((d) => setTimeout(playCoin, 700 + d * 0.4));
    setTimeout(() => {
      setFaces(t.coins);
      setSpinning(false);
      setSums((s) => [...s, t.sum]);
    }, 950);
  };
  const tossAll = () => {
    if (spinning || sums.length >= 6) return;
    const rest = Array.from({ length: 6 - sums.length }, () => tossThree().sum);
    setSpinning(true);
    haptic(18);
    setTimeout(playCoin, 600);
    setTimeout(() => {
      setSpinning(false);
      setSums((s) => [...s, ...rest]);
    }, 950);
  };

  const lines = sums.map((s) => (s === 7 || s === 9 ? 1 : 0));
  const moving = sums.map((s, i) => (s === 6 || s === 9 ? i + 1 : 0)).filter(Boolean);

  return (
    <div className="flex flex-col items-center">
      {!result && (
        <>
          <div className="flex gap-4 py-3">
            {faces.map((f, i) => (
              <Coin key={i} face={f} spinning={spinning} delay={i * 70} />
            ))}
          </div>
          <div className={`flex min-h-[112px] flex-col-reverse items-center justify-start gap-[7px] ${compact ? "" : "py-2"}`}>
            {lines.map((l, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-7 text-right text-[11px] text-mute">{YAO[i]}爻</span>
                <YaoLine yang={l === 1} moving={moving.includes(i + 1)} w={104} />
                <span className="w-7" />
              </div>
            ))}
            {!lines.length && <div className="pt-8 text-center text-[13px] text-mute">心里默念一件事，越具体越好</div>}
          </div>
          <div className="mt-3 flex w-full gap-2">
            <button onClick={toss} disabled={spinning} className="h-11 flex-1 rounded-full bg-ink text-[14.5px] font-medium text-paper transition active:scale-[0.97] disabled:opacity-60">
              {sums.length === 0 ? "摇第一次" : `再摇 · 第 ${sums.length + 1} 次`}
            </button>
            {sums.length < 5 && (
              <button onClick={tossAll} disabled={spinning} className="h-11 rounded-full border border-line bg-white px-4 text-[13.5px] text-ink-2 active:scale-[0.97]">
                一次摇完
              </button>
            )}
          </div>
        </>
      )}
      {result && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex w-full items-center gap-5 py-1">
          <HexFigure lines={hexLines(result.primary)} moving={result.moving} w={78} />
          <div className="min-w-0 flex-1">
            <div className="text-[11.5px] tracking-wider text-mute">第 {result.primary.no} 卦</div>
            <div className="font-song text-[20px] font-bold leading-tight">{result.primary.full}</div>
            {result.changed && <div className="mt-0.5 text-[12.5px] text-ink-2">变卦 · {result.changed.full}</div>}
            <div className="mt-1.5 text-[13px] leading-relaxed text-ink-2">{result.primary.gist}</div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ───────────────────────── 塔罗 ───────────────────────── */

const ROMAN = ["0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI"];

function CardBack({ small = false }: { small?: boolean }) {
  return (
    <div className={`relative h-full w-full overflow-hidden rounded-[10px] border border-[#3b3833] bg-[#2b2925] ${small ? "" : "shadow-md"}`}>
      <div className="absolute inset-[5px] rounded-[7px] border border-gold/40" />
      <svg viewBox="0 0 40 60" className="absolute inset-0 m-auto h-[46%] w-[46%] opacity-70">
        <circle cx="20" cy="30" r="11" fill="none" stroke="#b8955a" strokeWidth="1" />
        <path d="M20 14v32M4 30h32" stroke="#b8955a" strokeWidth=".6" />
        <circle cx="20" cy="30" r="3" fill="#b8955a" />
      </svg>
    </div>
  );
}

export function TarotFace({ id, reversed }: { id: number; reversed: boolean }) {
  const c = TAROT[id];
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-between overflow-hidden rounded-[10px] border border-[#d9cfbb] bg-[#fffcf4] p-1.5 shadow-md">
      <div className="absolute inset-[4px] rounded-[7px] border border-gold/40" />
      <div className={`flex h-full w-full flex-col items-center justify-between ${reversed ? "rotate-180" : ""}`}>
        <span className="font-song text-[10px] text-gold">{ROMAN[c.id]}</span>
        <span className="text-[26px] leading-none text-ink">{c.glyph}</span>
        <span className="font-song text-[11.5px] font-bold">{c.name}</span>
      </div>
    </div>
  );
}

export function TarotPicker({ question, initial, onDone }: { question?: string; initial?: TarotDraw | null; onDone: (d: TarotDraw) => void }) {
  const deck = useMemo(() => shuffledDeck().slice(0, 13), []);
  const [picked, setPicked] = useState<{ id: number; reversed: boolean }[]>(initial?.cards ?? []);
  const [revealed, setRevealed] = useState<number>(initial ? 3 : 0);
  const reported = useRef(!!initial);

  useEffect(() => {
    if (picked.length === 3 && revealed < 3) {
      const t = setTimeout(() => {
        setRevealed((r) => r + 1);
        playFlip();
      }, revealed === 0 ? 450 : 520);
      return () => clearTimeout(t);
    }
    if (picked.length === 3 && revealed === 3 && !reported.current) {
      reported.current = true;
      onDone({ cards: picked, question });
    }
  }, [picked, revealed, onDone, question]);

  const pick = (id: number) => {
    if (picked.length >= 3 || picked.some((p) => p.id === id)) return;
    haptic(8);
    playFlip();
    setPicked((p) => [...p, { id, reversed: Math.random() < 0.28 }]);
  };

  return (
    <div className="flex flex-col items-center">
      {picked.length < 3 && (
        <>
          <div className="relative mx-auto h-[150px] w-full max-w-[320px]">
            {deck.map((id, i) => {
              const n = deck.length;
              const angle = (i - (n - 1) / 2) * 5.5;
              const taken = picked.some((p) => p.id === id);
              return (
                <motion.button
                  key={id}
                  onClick={() => pick(id)}
                  className="absolute left-1/2 top-3 h-[92px] w-[58px] origin-[50%_260%]"
                  style={{ marginLeft: -29 }}
                  initial={{ rotate: 0, opacity: 0 }}
                  animate={{ rotate: angle, opacity: taken ? 0 : 1, y: taken ? -40 : 0 }}
                  whileHover={{ y: -8 }}
                  whileTap={{ y: -10 }}
                  transition={{ delay: taken ? 0 : i * 0.03, type: "spring", stiffness: 260, damping: 22 }}
                  aria-label="抽一张牌"
                >
                  <CardBack small />
                </motion.button>
              );
            })}
          </div>
          <div className="mb-2 mt-1 text-[12.5px] text-mute">凭直觉选三张 · 已选 {picked.length}/3</div>
        </>
      )}
      <div className="grid w-full grid-cols-3 gap-3">
        {TAROT_POSITIONS.map((pos, i) => {
          const p = picked[i];
          const show = p && revealed > i;
          return (
            <div key={pos} className="flex flex-col items-center gap-1.5">
              <div className="relative aspect-[5/8] w-full max-w-[88px]" style={{ perspective: 600 }}>
                {!p && <div className="h-full w-full rounded-[10px] border border-dashed border-line" />}
                {p && (
                  <motion.div className="relative h-full w-full" style={{ transformStyle: "preserve-3d" }} animate={{ rotateY: show ? 180 : 0 }} transition={{ duration: 0.6 }}>
                    <div className="absolute inset-0" style={{ backfaceVisibility: "hidden" }}>
                      <CardBack />
                    </div>
                    <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                      <TarotFace id={p.id} reversed={p.reversed} />
                    </div>
                  </motion.div>
                )}
              </div>
              <div className="text-[11px] text-mute">{pos}</div>
              {show && <div className="text-center text-[11.5px] leading-snug text-ink-2">{p.reversed ? "逆 · " : ""}{p.reversed ? TAROT[p.id].rev : TAROT[p.id].up}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────────────────── 生辰表单 ───────────────────────── */

export function BirthForm({ initial, gender: g0, onSubmit, cta = "排盘" }: { initial?: string; gender?: string; onSubmit: (birth: string, gender?: string) => void; cta?: string }) {
  const [date, setDate] = useState(initial?.slice(0, 10) || "1996-06-18");
  const [time, setTime] = useState(initial && initial.length > 10 ? initial.slice(11, 16) : "");
  const [unknown, setUnknown] = useState(!(initial && initial.length > 10));
  const [gender, setGender] = useState<string | undefined>(g0);
  const ok = /^\d{4}-\d{2}-\d{2}$/.test(date);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2.5">
        <label className="block">
          <span className="mb-1 block text-[12px] text-mute">出生日期（公历）</span>
          <input type="date" value={date} max="2030-12-31" min="1920-01-01" onChange={(e) => setDate(e.target.value)} className="h-11 w-full rounded-2xl border border-line bg-white px-3 text-[15px] outline-none focus:border-ink/40" />
        </label>
        <label className="block">
          <span className="mb-1 block text-[12px] text-mute">出生时间</span>
          <input type="time" value={unknown ? "" : time} disabled={unknown} onChange={(e) => setTime(e.target.value)} className="h-11 w-full rounded-2xl border border-line bg-white px-3 text-[15px] outline-none focus:border-ink/40 disabled:bg-paper-2 disabled:text-mute" />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setUnknown((u) => !u)} className={`h-8 rounded-full border px-3 text-[12.5px] transition ${unknown ? "border-ink bg-ink text-paper" : "border-line bg-white text-ink-2"}`}>
          不清楚时辰
        </button>
        <span className="mx-1 h-4 w-px bg-line" />
        {["女", "男"].map((x) => (
          <button key={x} onClick={() => setGender(gender === x ? undefined : x)} className={`h-8 w-11 rounded-full border text-[12.5px] transition ${gender === x ? "border-ink bg-ink text-paper" : "border-line bg-white text-ink-2"}`}>
            {x}
          </button>
        ))}
      </div>
      <button
        disabled={!ok}
        onClick={() => onSubmit(unknown || !time ? date : `${date} ${time}`, gender)}
        className="h-11 w-full rounded-full bg-ink text-[14.5px] font-medium text-paper transition active:scale-[0.98] disabled:opacity-40"
      >
        {cta}
      </button>
    </div>
  );
}

/* ───────────────────────── 命盘 + 五行雷达 ───────────────────────── */

export function WuxingRadar({ wuxing, size = 150 }: { wuxing: Record<string, number>; size?: number }) {
  const keys = ["木", "火", "土", "金", "水"];
  const max = Math.max(3, ...keys.map((k) => wuxing[k] ?? 0));
  const c = size / 2;
  const R = size / 2 - 22;
  const pt = (i: number, r: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    return [c + Math.cos(a) * r, c + Math.sin(a) * r];
  };
  const poly = keys.map((k, i) => pt(i, R * (0.12 + (0.88 * (wuxing[k] ?? 0)) / max)).join(",")).join(" ");
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="shrink-0">
      {[1, 0.66, 0.33].map((s) => (
        <polygon key={s} points={keys.map((_, i) => pt(i, R * s).join(",")).join(" ")} fill="none" stroke="#e4ded2" strokeWidth="1" />
      ))}
      {keys.map((_, i) => {
        const [x, y] = pt(i, R);
        return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke="#ece7dc" />;
      })}
      <motion.polygon points={poly} fill="rgba(196,85,58,0.14)" stroke="#c4553a" strokeWidth="1.5" strokeLinejoin="round" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} style={{ transformOrigin: "50% 50%" }} transition={{ duration: 0.7 }} />
      {keys.map((k, i) => {
        const [x, y] = pt(i, R + 12);
        return (
          <text key={k} x={x} y={y + 4} textAnchor="middle" fontSize="12" fontFamily="Noto Serif SC, serif" fontWeight="700" fill={WX_COLOR[k]}>
            {k}
            <tspan fontSize="9" fill="#9a958c" fontWeight="400">{wuxing[k] ?? 0}</tspan>
          </text>
        );
      })}
    </svg>
  );
}

export function BaziChart({ b }: { b: BaziResult }) {
  const weakest = Object.entries(b.wuxing).sort((a, c) => a[1] - c[1])[0];
  const strongest = Object.entries(b.wuxing).sort((a, c) => c[1] - a[1])[0];
  return (
    <div>
      <div className="grid grid-cols-4 gap-2">
        {b.pillars.map((p) => (
          <div key={p.label} className="flex flex-col items-center rounded-2xl bg-paper-2/70 py-2.5">
            <span className="text-[10.5px] text-mute">{p.label}</span>
            {p.gz.length === 2 ? (
              <>
                <span className="mt-1 font-song text-[22px] font-bold leading-none" style={{ color: WX_COLOR[GAN_WX[p.gz[0]]] }}>{p.gz[0]}</span>
                <span className="mt-1 font-song text-[22px] font-bold leading-none" style={{ color: WX_COLOR[ZHI_WX[p.gz[1]]] }}>{p.gz[1]}</span>
              </>
            ) : (
              <span className="mt-3 pb-2.5 text-[13px] text-faint">未知</span>
            )}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <WuxingRadar wuxing={b.wuxing} size={140} />
        <div className="min-w-0 flex-1 space-y-1.5 text-[12.5px] leading-relaxed text-ink-2">
          <div>
            日主 <b className="font-song text-[15px]" style={{ color: WX_COLOR[b.dayMasterWx] }}>{b.dayMaster}{b.dayMasterWx}</b>
          </div>
          <div>{b.shengxiao}年生 · {b.zodiac}</div>
          <div className="text-mute">{b.lunarText}</div>
          <div>
            <span style={{ color: WX_COLOR[strongest[0]] }}>{strongest[0]}</span>气最足，
            <span style={{ color: WX_COLOR[weakest[0]] }}>{weakest[0]}</span>
            {weakest[1] === 0 ? "缺位" : "偏弱"}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── 黄历 ───────────────────────── */

export function AlmanacCard({ a, compact = false }: { a: Almanac; compact?: boolean }) {
  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[12px] tracking-wider text-mute">{a.weekday} · {a.dateText}</div>
          <div className="mt-0.5 font-song text-[24px] font-bold leading-tight">农历{a.lunarText}</div>
          <div className="mt-0.5 text-[12px] text-ink-2">{a.ganzhi}</div>
        </div>
        <div className="flex flex-col items-center">
          <div className="h-9 w-9 rounded-full border-2 border-white shadow" style={{ background: a.color.hex }} />
          <div className="mt-1 text-[10.5px] text-mute">幸运色 · {a.color.name}</div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-sage/10 px-3 py-2">
          <div className="font-song text-[13px] font-bold text-sage">宜</div>
          <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[12.5px] leading-relaxed text-ink-2">{(a.yi.length ? a.yi.slice(0, compact ? 3 : 4) : ["随心"]).map((x) => <span key={x} className="whitespace-nowrap">{x}</span>)}</div>
        </div>
        <div className="rounded-2xl bg-seal/[0.07] px-3 py-2">
          <div className="font-song text-[13px] font-bold text-seal">忌</div>
          <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[12.5px] leading-relaxed text-ink-2">{(a.ji.length ? a.ji.slice(0, compact ? 3 : 4) : ["多虑"]).map((x) => <span key={x} className="whitespace-nowrap">{x}</span>)}</div>
        </div>
      </div>
      {!compact && <div className="mt-3 border-t border-dashed border-line pt-3 font-song text-[14.5px] text-ink">「{a.line}」</div>}
    </div>
  );
}

/* ───────────────────────── 人生 K 线 ───────────────────────── */

export function KLineChart({ candles, currentAge }: { candles: Candle[]; currentAge: number }) {
  const [sel, setSel] = useState<Candle | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const cw = 10;
  const H = 180;
  const pad = 12;
  const W = candles.length * cw + 24;
  const y = (v: number) => pad + (100 - v) * ((H - pad * 2) / 100);
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollLeft = Math.max(0, (currentAge - 14) * cw);
  }, [currentAge]);
  const ma = candles.map((_, i) => {
    const s = candles.slice(Math.max(0, i - 4), i + 1);
    return s.reduce((a, c) => a + c.close, 0) / s.length;
  });
  const shown = sel ?? candles.find((c) => c.age === currentAge) ?? candles[0];
  return (
    <div>
      <div className="mb-2 flex min-h-[42px] items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-song text-[17px] font-bold">
            {shown.age} 岁 <span className="text-[12px] font-normal text-mute">{shown.year} · {shown.gz}年</span>
          </div>
          <div className="mt-0.5 text-[11.5px] tabular-nums text-ink-2">
            开 {shown.open} · 高 {shown.high} · 低 {shown.low} · 收 <span className={shown.close >= shown.open ? "text-sage" : "text-seal"}>{shown.close}</span>
          </div>
        </div>
        {shown.tag && <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] ${shown.tag === "顺风年" ? "bg-sage/15 text-sage" : "bg-seal/10 text-seal"}`}>{shown.tag}</span>}
      </div>
      <div ref={ref} className="no-scrollbar -mx-4 overflow-x-auto px-4">
        <svg width={W} height={H + 18} className="block">
          {[30, 50, 70].map((v) => (
            <line key={v} x1="0" x2={W} y1={y(v)} y2={y(v)} stroke={v === 50 ? "#ddd6c9" : "#eee9df"} strokeDasharray={v === 50 ? "0" : "3 4"} />
          ))}
          {candles.map((c, i) => {
            const x = 12 + i * cw;
            const up = c.close >= c.open;
            const color = up ? "#7d8b70" : "#c4553a";
            const top = y(Math.max(c.open, c.close));
            const bh = Math.max(1.5, Math.abs(y(c.open) - y(c.close)));
            return (
              <g key={c.age} onClick={() => { haptic(4); setSel(c); }} style={{ cursor: "pointer" }}>
                <rect x={x - 5} y={0} width={cw} height={H} fill={sel?.age === c.age ? "rgba(38,38,38,0.05)" : "transparent"} rx="3" />
                <line x1={x} x2={x} y1={y(c.high)} y2={y(c.low)} stroke={color} strokeWidth="1" />
                <rect x={x - 3} y={top} width={6} height={bh} rx="1" fill={up ? "#faf9f6" : color} stroke={color} strokeWidth="1" />
                {c.age % 10 === 0 && <text x={x} y={H + 13} textAnchor="middle" fontSize="9.5" fill="#9a958c">{c.age}</text>}
              </g>
            );
          })}
          <polyline points={ma.map((v, i) => `${12 + i * cw},${y(v)}`).join(" ")} fill="none" stroke="#6e8ba6" strokeWidth="1.2" opacity="0.6" />
          {currentAge >= 1 && currentAge <= candles.length && (
            <g>
              <line x1={12 + (currentAge - 1) * cw} x2={12 + (currentAge - 1) * cw} y1={4} y2={H} stroke="#262626" strokeDasharray="2 3" opacity="0.45" />
              <text x={12 + (currentAge - 1) * cw + 4} y={12} fontSize="9.5" fill="#262626" opacity="0.6">今年</text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
