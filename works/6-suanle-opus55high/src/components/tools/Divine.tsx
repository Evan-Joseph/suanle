"use client";

import { useState } from "react";
import {
  hexLines,
  resolveCast,
  shuffledDeck,
  tossThree,
  TAROT,
  TAROT_POSITIONS,
  type CastResult,
  type TarotDraw,
} from "@/lib/divination";
import { haptic, playBowl, playCoin, playFlip } from "@/lib/sound";
import { Logo } from "../ui";

/* ───────── 卦画 ───────── */
export function HexagramView({ lines, moving = [], size = 1, dim = false }: { lines: number[]; moving?: number[]; size?: number; dim?: boolean }) {
  const w = 76 * size;
  const h = 8 * size;
  const slots = [0, 1, 2, 3, 4, 5];
  return (
    <div className="flex flex-col-reverse items-center" style={{ gap: 6 * size }}>
      {slots.map((i) => {
        const v = lines[i];
        const isMoving = moving.includes(i + 1);
        if (v === undefined)
          return <div key={i} style={{ width: w, height: h }} className="rounded-[3px] border border-dashed border-line" />;
        return (
          <div key={i} className="relative flex items-center anim-fade-in" style={{ width: w, height: h }}>
            {v === 1 ? (
              <div className={`h-full w-full rounded-[3px] ${dim ? "bg-ink/40" : "bg-ink"}`} />
            ) : (
              <div className="flex h-full w-full justify-between">
                <div className={`h-full w-[43%] rounded-[3px] ${dim ? "bg-ink/40" : "bg-ink"}`} />
                <div className={`h-full w-[43%] rounded-[3px] ${dim ? "bg-ink/40" : "bg-ink"}`} />
              </div>
            )}
            {isMoving && <span className="absolute -right-4 h-2 w-2 rounded-full bg-seal" />}
          </div>
        );
      })}
    </div>
  );
}

function Coin({ value, spinning, delay }: { value: number | null; spinning: boolean; delay: number }) {
  const back = value === 3;
  return (
    <div className={`relative h-[58px] w-[58px] ${spinning ? "coin-spin" : ""}`} style={{ animationDelay: `${delay}ms`, transformStyle: "preserve-3d" }}>
      <div
        className="absolute inset-0 grid place-items-center rounded-full shadow-[inset_0_-3px_6px_rgba(0,0,0,0.18),0_4px_10px_rgba(120,90,30,0.25)]"
        style={{ background: "radial-gradient(circle at 35% 30%, #f3dc9c, #c9a45c 55%, #9c7a3a)" }}
      >
        <div className="absolute inset-[5px] rounded-full border border-[#8a6a2c]/40" />
        <div className="h-[15px] w-[15px] rounded-[2px] bg-paper shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]" />
        {value !== null && !spinning && (
          <div className="pointer-events-none absolute inset-0 font-song text-[10px] font-bold text-[#5a4316]">
            {back ? (
              <span className="absolute left-1/2 top-[7px] -translate-x-1/2">◠</span>
            ) : (
              <>
                <span className="absolute left-1/2 top-[6px] -translate-x-1/2">算</span>
                <span className="absolute bottom-[6px] left-1/2 -translate-x-1/2">了</span>
                <span className="absolute left-[8px] top-1/2 -translate-y-1/2">通</span>
                <span className="absolute right-[8px] top-1/2 -translate-y-1/2">宝</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const SUM_LABEL: Record<number, string> = { 6: "老阴 · 动", 7: "少阳", 8: "少阴", 9: "老阳 · 动" };

export function CoinCaster({ question, onDone, initial }: { question?: string; onDone: (r: CastResult) => void; initial?: CastResult | null }) {
  const [sums, setSums] = useState<number[]>(initial?.sums ?? []);
  const [coins, setCoins] = useState<number[] | null>(null);
  const [spinning, setSpinning] = useState(false);
  const done = sums.length >= 6;
  const result = done ? resolveCast(sums, question) : null;

  const toss = () => {
    if (spinning || done) return;
    haptic(15);
    const r = tossThree();
    setCoins(r.coins);
    setSpinning(true);
    [120, 300, 520, 700].forEach((t) => setTimeout(playCoin, t));
    setTimeout(() => {
      setSpinning(false);
      const next = [...sums, r.sum];
      setSums(next);
      if (next.length === 6) {
        playBowl();
        setTimeout(() => onDone(resolveCast(next, question)), 500);
      }
    }, 820);
  };

  const lines = sums.map((s) => (s === 7 || s === 9 ? 1 : 0));
  const moving = sums.map((s, i) => (s === 6 || s === 9 ? i + 1 : 0)).filter(Boolean);

  return (
    <div className="select-none">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {!done ? (
            <>
              <div className="text-[13px] text-mute">第 {Math.min(sums.length + 1, 6)} / 6 次</div>
              <div className="mt-1 font-song text-[15px] leading-relaxed text-ink-2">
                {sums.length === 0 ? "默念心事，一次只问一件。" : coins && !spinning ? SUM_LABEL[sums[sums.length - 1]] : "……"}
              </div>
            </>
          ) : result ? (
            <div className="anim-fade-up">
              <div className="text-[12px] tracking-widest text-mute">本卦{result.changed ? " → 变卦" : ""}</div>
              <div className="mt-0.5 font-song text-[20px] font-bold">
                {result.primary.full}
                {result.changed && <span className="text-ink-2"> → {result.changed.full}</span>}
              </div>
              <div className="mt-1.5 text-[13.5px] leading-relaxed text-ink-2">{result.primary.gist}</div>
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 gap-3 pr-3">
          <HexagramView lines={lines} moving={moving} size={0.62} />
          {result?.changed && <HexagramView lines={hexLines(result.changed)} size={0.62} dim />}
        </div>
      </div>
      {!done && (
        <>
          <div className="mt-5 flex justify-center gap-4" style={{ perspective: 600 }}>
            {[0, 1, 2].map((i) => (
              <Coin key={`${sums.length}-${i}`} value={coins ? coins[i] : null} spinning={spinning} delay={i * 60} />
            ))}
          </div>
          <button
            onClick={toss}
            disabled={spinning}
            className="mt-5 w-full rounded-2xl bg-ink py-3.5 text-[15px] font-medium tracking-widest text-paper transition active:scale-[0.98] disabled:opacity-60"
          >
            {spinning ? "叮叮当当……" : sums.length === 0 ? "摇" : "再摇"}
          </button>
        </>
      )}
    </div>
  );
}

/* ───────── 塔罗 ───────── */
export function TarotFace({ id, reversed, small = false }: { id: number; reversed: boolean; small?: boolean }) {
  const c = TAROT[id];
  const roman = ["0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI"][id];
  return (
    <div className="flex h-full w-full flex-col items-center justify-between rounded-xl border border-[#d9c79c] bg-[#fffaf0] p-1.5 shadow-sm">
      <div className="text-[9px] tracking-widest text-gold">{roman}</div>
      <div className={`${small ? "text-[22px]" : "text-[30px]"} leading-none text-ink`} style={{ transform: reversed ? "rotate(180deg)" : undefined }}>
        {c.glyph}
      </div>
      <div className="text-center">
        <div className={`font-song font-bold ${small ? "text-[11px]" : "text-[13px]"}`}>{c.name}</div>
        {reversed && <div className="text-[9px] text-seal">逆位</div>}
      </div>
    </div>
  );
}

function CardBack() {
  return (
    <div className="relative grid h-full w-full place-items-center rounded-xl border border-[#c9a45c]/60 bg-ink text-gold shadow-md">
      <div className="absolute inset-[4px] rounded-[9px] border border-[#c9a45c]/30" />
      <Logo size={22} />
    </div>
  );
}

export function TarotPicker({ onDone, initial, question }: { onDone: (d: TarotDraw) => void; initial?: TarotDraw | null; question?: string }) {
  const [deck] = useState(() => shuffledDeck());
  const [revs] = useState(() => TAROT.map(() => Math.random() < 0.3));
  const [picked, setPicked] = useState<{ id: number; reversed: boolean }[]>(initial?.cards ?? []);
  const [flipped, setFlipped] = useState<number>(initial ? 3 : 0);
  const done = picked.length >= 3;

  const pick = (id: number) => {
    if (done || picked.some((p) => p.id === id)) return;
    haptic(8);
    playFlip();
    const next = [...picked, { id, reversed: revs[id] }];
    setPicked(next);
    setTimeout(() => {
      setFlipped(next.length);
      playFlip();
    }, 380);
    if (next.length === 3) setTimeout(() => onDone({ cards: next, question }), 1100);
  };

  return (
    <div className="select-none">
      <div className="grid grid-cols-3 gap-3">
        {TAROT_POSITIONS.map((pos, i) => (
          <div key={pos} className="flex flex-col items-center gap-1.5">
            <div className="flip-card aspect-[2/3] w-full">
              {picked[i] ? (
                <div className={`flip-inner ${flipped > i ? "flipped" : ""}`}>
                  <div className="flip-face">
                    <CardBack />
                  </div>
                  <div className="flip-face flip-back">
                    <TarotFace id={picked[i].id} reversed={picked[i].reversed} />
                  </div>
                </div>
              ) : (
                <div className="grid h-full w-full place-items-center rounded-xl border border-dashed border-[#d8d0bd] text-[11px] text-mute">{i + 1}</div>
              )}
            </div>
            <div className="text-[11.5px] text-ink-2">{pos}</div>
            {picked[i] && flipped > i && (
              <div className="anim-fade-in text-center text-[11px] leading-snug text-mute">
                {picked[i].reversed ? TAROT[picked[i].id].rev : TAROT[picked[i].id].up}
              </div>
            )}
          </div>
        ))}
      </div>
      {!done && (
        <>
          <div className="mt-4 text-center text-[12.5px] text-mute">凭第一感觉，选 {3 - picked.length} 张</div>
          <div className="mt-3 grid grid-cols-8 gap-1.5">
            {deck.map((id, i) => {
              const used = picked.some((p) => p.id === id);
              return (
                <button
                  key={id}
                  onClick={() => pick(id)}
                  disabled={used}
                  className={`relative aspect-[2/3] transition duration-300 active:scale-95 ${used ? "scale-75 opacity-0" : "hover:-translate-y-1"}`}
                  style={{ transform: used ? undefined : `rotate(${((i % 5) - 2) * 1.5}deg)` }}
                  aria-label="选这张"
                >
                  <CardBack />
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
