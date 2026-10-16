"use client";

import { motion } from "motion/react";
import { useRef, useState } from "react";
import { shuffledDeck, TAROT, TAROT_POSITIONS, type TarotDraw } from "@/lib/divination";
import { haptic, playFlip } from "@/lib/sound";

function CardBack({ className = "" }: { className?: string }) {
  return (
    <div className={`relative h-full w-full overflow-hidden rounded-[10px] border border-ink/30 bg-ink ${className}`}>
      <div className="absolute inset-[5px] rounded-[7px] border border-on-ink/25" />
      <div className="absolute inset-0 grid place-items-center font-song text-[18px] text-on-ink/70">☷</div>
    </div>
  );
}

function CardFace({ id, reversed }: { id: number; reversed: boolean }) {
  const c = TAROT[id];
  return (
    <div className="flex h-full w-full flex-col items-center justify-between rounded-[10px] border border-line bg-card px-1 py-2 text-center">
      <span className="font-mono text-[10px] tracking-widest text-mute">{c.roman}</span>
      <span className={`font-song text-[17px] font-bold leading-tight ${reversed ? "rotate-180" : ""}`}>{c.name}</span>
      <span className="text-[9px] leading-tight text-mute">{c.en}</span>
    </div>
  );
}

export function TarotSpread({ draw }: { draw: TarotDraw }) {
  return (
    <div className="space-y-2.5">
      {draw.cards.map((c, i) => {
        const card = TAROT[c.id];
        return (
          <div key={i} className="flex gap-3 rounded-2xl bg-paper-2/70 p-3">
            <div className="h-[74px] w-[48px] shrink-0">
              <CardFace id={c.id} reversed={c.reversed} />
            </div>
            <div className="min-w-0">
              <div className="text-[11.5px] text-mute">{TAROT_POSITIONS[i]}</div>
              <div className="mt-0.5 font-song text-[15.5px] font-bold">
                {card.name}
                <span className="ml-1.5 text-[12px] font-normal text-mute">{c.reversed ? "逆位" : "正位"}</span>
              </div>
              <div className="mt-0.5 text-[13px] leading-relaxed text-ink-2">{c.reversed ? card.rev : card.up}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function TarotPicker({ question, initial, onDone }: { question?: string; initial: TarotDraw | null; onDone: (d: TarotDraw) => void }) {
  // 洗牌时就定好每张牌的正逆位
  const [deck] = useState(() => shuffledDeck().map((id) => ({ id, reversed: Math.random() < 0.28 })));
  const [picked, setPicked] = useState<{ id: number; reversed: boolean }[]>(initial?.cards ?? []);
  const fired = useRef(!!initial);
  const full = picked.length >= 3;

  const pick = (entry: { id: number; reversed: boolean }) => {
    if (full || picked.some((p) => p.id === entry.id)) return;
    const card = { id: entry.id, reversed: entry.reversed };
    const next = [...picked, card];
    setPicked(next);
    haptic(10);
    playFlip();
    if (next.length === 3 && !fired.current) {
      fired.current = true;
      setTimeout(() => onDone({ cards: next, question: question?.trim() || undefined }), 1200);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-3">
        {TAROT_POSITIONS.map((pos, i) => {
          const c = picked[i];
          return (
            <div key={pos} className="flex flex-col items-center gap-1.5">
              <div className="relative h-[124px] w-full max-w-[84px]" style={{ perspective: 800 }}>
                {c ? (
                  <motion.div
                    initial={initial ? false : { rotateY: 180, y: 40, opacity: 0 }}
                    animate={{ rotateY: 0, y: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 160, damping: 18 }}
                    className="relative h-full w-full"
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    <div className="absolute inset-0" style={{ backfaceVisibility: "hidden" }}>
                      <CardFace id={c.id} reversed={c.reversed} />
                    </div>
                    <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                      <CardBack />
                    </div>
                  </motion.div>
                ) : (
                  <div className="grid h-full w-full place-items-center rounded-[10px] border border-dashed border-faint text-[11px] text-faint">{i + 1}</div>
                )}
              </div>
              <span className="text-[11.5px] text-mute">{pos}</span>
            </div>
          );
        })}
      </div>
      {!full && (
        <>
          <div className="mt-4 text-center text-[12.5px] text-mute">凭第一眼的感觉，选 {3 - picked.length} 张</div>
          <div className="no-scrollbar -mx-1 mt-2 overflow-x-auto px-1 pb-2 pt-3">
            <div className="flex w-max pl-1 pr-6">
              {deck.map((entry, k) => {
                const taken = picked.some((p) => p.id === entry.id);
                return (
                  <motion.button
                    key={entry.id}
                    type="button"
                    aria-label="选这张牌"
                    disabled={taken}
                    onClick={() => pick(entry)}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: taken ? 0 : 1, y: taken ? -24 : 0 }}
                    whileHover={{ y: -8 }}
                    whileTap={{ y: -12, scale: 0.97 }}
                    transition={{ delay: taken ? 0 : k * 0.018, type: "spring", stiffness: 380, damping: 26 }}
                    className="-ml-6 h-[92px] w-[58px] shrink-0 first:ml-0"
                    style={{ rotate: (k - deck.length / 2) * 0.6 }}
                  >
                    <CardBack className="shadow-[0_4px_10px_rgba(0,0,0,0.18)]" />
                  </motion.button>
                );
              })}
            </div>
          </div>
        </>
      )}
      {full && <div className="mt-4">{<TarotSpread draw={{ cards: picked }} />}</div>}
    </div>
  );
}
