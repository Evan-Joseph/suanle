"use client";

import { motion } from "motion/react";
import { useMemo, useRef, useState } from "react";
import { shuffledDeck, TAROT, TAROT_POSITIONS, type TarotDraw } from "@/lib/divination";
import { haptic, playFlip } from "@/lib/sound";
import { Maximize2, Minimize2, Sparkles } from "lucide-react";

function CardBack({ className = "" }: { className?: string }) {
  return (
    <div className={`relative h-full w-full overflow-hidden rounded-[10px] border border-ink/30 bg-ink ${className}`}>
      <div className="absolute inset-[4px] rounded-[7px] border border-on-ink/20" />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-song text-[16px] text-on-ink/75">☷</span>
        <span className="mt-0.5 text-[8px] font-mono tracking-widest text-on-ink/40">SUANLE</span>
      </div>
    </div>
  );
}

function CardFace({ id, reversed }: { id: number; reversed: boolean }) {
  const c = TAROT[id] ?? TAROT[0];
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-between overflow-hidden rounded-[10px] border border-line bg-card px-1 py-1.5 text-center shadow-sm">
      <div className="flex w-full items-center justify-between px-1 text-[8.5px] text-mute">
        <span className="font-mono tracking-wider">{c.roman}</span>
        <span className="opacity-80" title={c.suitLabel}>{c.suitGlyph}</span>
      </div>
      <div className="my-auto flex flex-col items-center">
        <span className={`font-song text-[15px] font-bold leading-tight ${reversed ? "rotate-180" : ""}`}>{c.name}</span>
        <span className="mt-0.5 text-[8.5px] leading-tight text-mute truncate max-w-[64px]">{c.en}</span>
      </div>
      <div className="w-full text-center">
        <span className={`inline-block rounded-full px-1.5 py-[1px] text-[8px] ${reversed ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-ink/5 text-ink-2"}`}>
          {reversed ? "逆位" : "正位"}
        </span>
      </div>
    </div>
  );
}

export function TarotSpread({ draw }: { draw: TarotDraw }) {
  return (
    <div className="space-y-2.5">
      {draw.cards.map((c, i) => {
        const card = TAROT[c.id] ?? TAROT[0];
        return (
          <div key={i} className="flex gap-3 rounded-2xl bg-paper-2/70 p-3 transition hover:bg-paper-2">
            <div className="h-[84px] w-[54px] shrink-0">
              <CardFace id={c.id} reversed={c.reversed} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between text-[11.5px] text-mute">
                <span>{TAROT_POSITIONS[i]}</span>
                <span className="text-[10.5px]">{card.suitGlyph} {card.suitLabel}</span>
              </div>
              <div className="mt-0.5 font-song text-[16px] font-bold text-ink">
                {card.name}
                <span className={`ml-2 text-[12px] font-normal ${c.reversed ? "text-amber-600 dark:text-amber-400" : "text-mute"}`}>
                  {c.reversed ? "逆位" : "正位"}
                </span>
              </div>
              <div className="mt-1 text-[13px] leading-relaxed text-ink-2">
                {c.reversed ? card.rev : card.up}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function TarotPicker({ question, initial, onDone }: { question?: string; initial: TarotDraw | null; onDone: (d: TarotDraw) => void }) {
  const [deckMode, setDeckMode] = useState<"all" | "major">("all");
  const [isSpreadExpanded, setIsSpreadExpanded] = useState(false);

  // 根据当前牌组模式洗牌
  const [deck, setDeck] = useState(() =>
    shuffledDeck(deckMode).map((id) => ({ id, reversed: Math.random() < 0.28 }))
  );
  const [picked, setPicked] = useState<{ id: number; reversed: boolean }[]>(initial?.cards ?? []);
  const fired = useRef(!!initial);
  const full = picked.length >= 3;

  const resetDeck = (newMode: "all" | "major") => {
    setDeckMode(newMode);
    setPicked([]);
    fired.current = false;
    setDeck(shuffledDeck(newMode).map((id) => ({ id, reversed: Math.random() < 0.28 })));
  };

  const pick = (entry: { id: number; reversed: boolean }) => {
    if (full || picked.some((p) => p.id === entry.id)) return;
    const card = { id: entry.id, reversed: entry.reversed };
    const next = [...picked, card];
    setPicked(next);
    haptic(10);
    playFlip();
    if (next.length === 3 && !fired.current) {
      fired.current = true;
      setTimeout(() => onDone({ cards: next, question: question?.trim() || undefined, deckMode }), 1200);
    }
  };

  return (
    <div>
      {/* 牌库模式切换与牌数提示 */}
      {!full && (
        <div className="mb-3 flex items-center justify-between border-b border-line/60 pb-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] text-mute">牌组：</span>
            <div className="inline-flex rounded-full bg-ink/[0.05] p-0.5 text-[11.5px]">
              <button
                type="button"
                onClick={() => resetDeck("all")}
                className={`rounded-full px-2.5 py-0.5 transition ${deckMode === "all" ? "bg-card font-semibold text-ink shadow-sm" : "text-mute hover:text-ink"}`}
              >
                78张 韦特全牌
              </button>
              <button
                type="button"
                onClick={() => resetDeck("major")}
                className={`rounded-full px-2.5 py-0.5 transition ${deckMode === "major" ? "bg-card font-semibold text-ink shadow-sm" : "text-mute hover:text-ink"}`}
              >
                22张 大阿卡那
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsSpreadExpanded(!isSpreadExpanded)}
            className="flex items-center gap-1 text-[11.5px] text-mute hover:text-ink transition"
          >
            {isSpreadExpanded ? (
              <>
                <Minimize2 className="h-3.5 w-3.5" />
                <span>收起</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-3.5 w-3.5" />
                <span>展开牌阵</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* 3 张牌阵槽位 */}
      <div className="grid grid-cols-3 gap-3">
        {TAROT_POSITIONS.map((pos, i) => {
          const c = picked[i];
          return (
            <div key={pos} className="flex flex-col items-center gap-1.5">
              <div className="relative h-[132px] w-full max-w-[88px]" style={{ perspective: 800 }}>
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
                  <div className="flex h-full w-full flex-col items-center justify-center rounded-[10px] border border-dashed border-line bg-card/40 text-center">
                    <span className="font-mono text-[13px] text-faint">{i + 1}</span>
                    <span className="mt-1 text-[10px] text-mute">{pos}</span>
                  </div>
                )}
              </div>
              <span className="text-[11.5px] font-medium text-mute">{pos}</span>
            </div>
          );
        })}
      </div>

      {!full && (
        <>
          <div className="mt-4 flex items-center justify-center gap-1.5 text-center text-[12.5px] text-mute">
            <Sparkles className="h-3.5 w-3.5 text-amber-500/80" />
            <span>凭第一感觉，选 <b>{3 - picked.length}</b> 张牌（共 {deck.length} 张）</span>
          </div>

          {/* 展开/普通选牌区 */}
          {isSpreadExpanded ? (
            /* 全平铺展开视图：解决 UI 挤的问题 */
            <div className="no-scrollbar mt-3 max-h-[220px] overflow-y-auto rounded-2xl border border-line/60 bg-paper-2/40 p-2.5">
              <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
                {deck.map((entry) => {
                  const taken = picked.some((p) => p.id === entry.id);
                  return (
                    <motion.button
                      key={entry.id}
                      type="button"
                      disabled={taken}
                      onClick={() => pick(entry)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.94 }}
                      className={`h-[72px] w-full rounded-[8px] transition ${taken ? "opacity-20 pointer-events-none" : "hover:shadow-md"}`}
                    >
                      <CardBack />
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* 横向卷轴扇形叠牌视图 */
            <div className="no-scrollbar -mx-2 mt-2 overflow-x-auto px-3 pb-3 pt-4">
              <div className="flex w-max pl-2 pr-8">
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
                      whileHover={{ y: -12, scale: 1.05, zIndex: 30 }}
                      whileTap={{ y: -16, scale: 0.98 }}
                      transition={{ delay: taken ? 0 : Math.min(0.25, k * 0.008), type: "spring", stiffness: 380, damping: 26 }}
                      className={`-ml-5 h-[98px] w-[62px] shrink-0 first:ml-0 ${taken ? "pointer-events-none" : ""}`}
                      style={{ rotate: (k - deck.length / 2) * 0.35 }}
                    >
                      <CardBack className="shadow-[0_4px_12px_rgba(0,0,0,0.18)]" />
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {full && <div className="mt-5">{<TarotSpread draw={{ cards: picked }} />}</div>}
    </div>
  );
}

