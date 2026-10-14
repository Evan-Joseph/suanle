"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { DrawnCard, drawCards, SPREADS, SpreadType, tarotContext } from "@/lib/tarot";
import { sfxFlip, sfxReveal, sfxShake } from "@/lib/audio";
import { useApp } from "@/store/app";
import { Computing, DivineActions, IntentionCard, SectionLabel } from "./divine-view";
import { cn } from "@/lib/utils";

type Phase = "intention" | "shuffle" | "picking" | "flipping" | "computing" | "revealed";

const FAN_COUNT = 18;

function CardBack({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-gold-2/35 shadow-[0_8px_22px_rgba(0,0,0,0.55)]",
        className
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/img/card-back.png" alt="牌背" className="h-full w-full object-cover" draggable={false} />
    </div>
  );
}

function CardFace({ d, size = "md" }: { d: DrawnCard; size?: "md" | "sm" }) {
  const face = d.reversed ? d.card.rev : d.card.up;
  return (
    <div
      className={cn(
        "relative flex h-full w-full flex-col items-center rounded-md border border-gold-2/50 bg-gradient-to-b from-[#1a1e2a] to-[#0e1017] px-1.5 text-center shadow-[0_8px_22px_rgba(0,0,0,0.55)]",
        size === "md" ? "py-2.5" : "py-2"
      )}
    >
      <span className="text-[9px] tracking-[0.2em] text-gold-2/70">{d.card.num}</span>
      <span
        className={cn(
          "mt-1 font-display text-gold-2 [writing-mode:vertical-rl]",
          size === "md" ? "text-[21px] tracking-[0.35em]" : "text-[15px] tracking-[0.3em]",
          d.reversed && "rotate-180"
        )}
      >
        {d.card.name}
      </span>
      {size === "md" && (
        <span className="mt-auto line-clamp-2 text-[8.5px] leading-tight text-moon/50">
          {face.keywords.join(" · ")}
        </span>
      )}
      {d.reversed && (
        <span className="absolute right-1 top-1 rounded-sm bg-cinnabar/85 px-1 py-px text-[8px] text-paper-2">
          逆
        </span>
      )}
    </div>
  );
}

export function TarotTool() {
  const [phase, setPhase] = useState<Phase>("intention");
  const [spread, setSpread] = useState<SpreadType>("triangle");
  const [question, setQuestion] = useState("");
  const [picked, setPicked] = useState<number[]>([]);
  const [drawn, setDrawn] = useState<DrawnCard[]>([]);
  const [flipped, setFlipped] = useState<number>(0);
  const saveReading = useApp((s) => s.saveReading);
  const askAbout = useApp((s) => s.askAboutReading);
  const toast = useApp((s) => s.toast);

  const need = SPREADS[spread].positions.length;
  const fanIdx = useMemo(
    () => Array.from({ length: FAN_COUNT }, (_, i) => i),
    []
  );

  const startShuffle = () => {
    setPhase("shuffle");
    sfxShake();
    setTimeout(() => setPhase("picking"), 1400);
  };

  const pick = (i: number) => {
    if (picked.includes(i) || picked.length >= need) return;
    sfxFlip();
    const next = [...picked, i];
    setPicked(next);
    if (next.length === need) {
      const cards = drawCards(spread);
      setTimeout(() => {
        setDrawn(cards);
        setFlipped(0);
        setPhase("flipping");
      }, 700);
    }
  };

  const flipCard = (i: number) => {
    if (i !== flipped) return;
    sfxFlip();
    setFlipped((f) => f + 1);
    if (i + 1 === need) {
      setTimeout(() => {
        setPhase("computing");
      }, 900);
    }
  };

  const summaryText = () =>
    `牌阵：${SPREADS[spread].name}\n${drawn
      .map((d) => {
        const face = d.reversed ? d.card.rev : d.card.up;
        return `【${d.position}】${d.card.name}${d.reversed ? "逆位" : ""}｜${face.keywords.join("、")}\n${face.line}`;
      })
      .join("\n")}`;

  const saveAndToast = () => {
    saveReading({
      type: "tarot",
      title: `${SPREADS[spread].name} · ${drawn.map((d) => d.card.name).join(" / ")}`,
      summary: summaryText(),
      llmContext: tarotContext(question, spread, drawn),
      question,
    });
    toast("已收进你的命运存档");
  };

  const askMaster = () => {
    const payload = {
      type: "tarot" as const,
      title: `${SPREADS[spread].name} · ${drawn.map((d) => d.card.name).join(" / ")}`,
      summary: summaryText(),
      llmContext: tarotContext(question, spread, drawn),
      question,
    };
    const id = saveReading(payload);
    askAbout({ id, createdAt: Date.now(), ...payload });
  };

  const reset = () => {
    setPhase("intention");
    setPicked([]);
    setDrawn([]);
    setFlipped(0);
    setQuestion("");
  };

  /* ---------- phases ---------- */

  if (phase === "intention") {
    return (
      <div>
        <div className="flex justify-center gap-2 pt-4">
          {(Object.keys(SPREADS) as SpreadType[]).map((k) => (
            <button
              key={k}
              onClick={() => setSpread(k)}
              className={cn(
                "no-tap-highlight rounded-full border px-4 py-1.5 text-[12px] transition-all active:scale-95",
                spread === k
                  ? "border-gold-2/60 bg-gold-2/10 text-gold-2"
                  : "border-white/10 text-moon/50"
              )}
            >
              {SPREADS[k].name}
            </button>
          ))}
        </div>
        <IntentionCard
          value={question}
          onChange={setQuestion}
          onStart={startShuffle}
          cta="静心洗牌"
          hint={spread === "single" ? "今日指引，或心里那件小事…" : "想看一件事的来龙去脉…"}
        />
      </div>
    );
  }

  if (phase === "shuffle") {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="relative h-[150px] w-[100px]">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className="absolute inset-0"
              animate={{
                x: [0, i % 2 ? 46 : -46, 0, i % 2 ? -30 : 30, 0],
                rotate: [0, i % 2 ? 8 : -8, 0, i % 2 ? -5 : 5, 0],
              }}
              transition={{ duration: 1.35, times: [0, 0.3, 0.55, 0.8, 1], ease: "easeInOut" }}
            >
              <CardBack className="h-full w-full" />
            </motion.div>
          ))}
        </div>
        <p className="absolute mt-[240px] text-[12px] tracking-[0.4em] text-gold-2/60">切 牌 洗 心 …</p>
      </div>
    );
  }

  if (phase === "picking") {
    const mid = (FAN_COUNT - 1) / 2;
    return (
      <div className="flex min-h-full flex-col px-2 pb-8 pt-5">
        <p className="text-center text-[12.5px] tracking-[0.25em] text-moon/55">
          凭直觉，选出 <span className="text-gold-2">{need}</span> 张与你有感应的牌
        </p>
        <div className="mt-2 flex justify-center gap-2">
          {SPREADS[spread].positions.map((p, i) => (
            <span
              key={p}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[10.5px] transition-colors",
                i < picked.length
                  ? "border-gold-2/50 text-gold-2"
                  : "border-white/10 text-moon/35"
              )}
            >
              {p}
            </span>
          ))}
        </div>
        <FanDeck picked={picked} fanIdx={fanIdx} mid={mid} onPick={pick} />
        <p className="mt-2 text-center text-[11px] text-moon/30">没有对错，哪张顺眼便是哪张</p>
      </div>
    );
  }

  if (phase === "flipping") {
    return (
      <div className="flex min-h-[440px] flex-col items-center justify-center px-4">
        <p className="mb-8 text-[12.5px] tracking-[0.3em] text-moon/55">
          轻触牌面，逐一揭晓 —— 第 {flipped + 1} / {need} 张
        </p>
        <div className={cn("flex items-stretch justify-center gap-4", need === 1 && "gap-0")}>
          {drawn.map((d, i) => {
            const isFlipped = i < flipped;
            return (
              <div key={i} className="flex flex-col items-center gap-2.5">
                <motion.button
                  className="no-tap-highlight relative h-[168px] w-[106px] [perspective:900px] sm:h-[190px] sm:w-[122px]"
                  onClick={() => flipCard(i)}
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: i * 0.12 }}
                >
                  <motion.div
                    className="relative h-full w-full [transform-style:preserve-3d]"
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.7, ease: [0.32, 0.72, 0.24, 1] }}
                  >
                    <div className="absolute inset-0 [backface-visibility:hidden]">
                      <CardBack className="h-full w-full" />
                    </div>
                    <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                      <CardFace d={d} />
                    </div>
                  </motion.div>
                </motion.button>
                <span className="text-[10.5px] tracking-[0.2em] text-moon/45">{d.position}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (phase === "computing") {
    return (
      <Computing
        onDone={() => {
          setPhase("revealed");
          sfxReveal();
        }}
      />
    );
  }

  /* revealed */
  return (
    <div className="anim-rise px-5 pb-10 pt-6">
      <SectionLabel>牌 面 已 显 · {SPREADS[spread].name}</SectionLabel>
      {question && (
        <p className="mb-4 text-[12px] text-moon/45">所问：{question}</p>
      )}
      <div className={cn("grid gap-3", need === 3 ? "grid-cols-3" : "grid-cols-1 max-w-[200px] mx-auto w-full")}>
        {drawn.map((d, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="h-[170px]"
          >
            <CardFace d={d} size="sm" />
            <p className="mt-1.5 text-center text-[10px] tracking-[0.2em] text-moon/40">{d.position}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {drawn.map((d, i) => {
          const face = d.reversed ? d.card.rev : d.card.up;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.12 }}
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-4.5 p-4"
            >
              <div className="flex items-baseline gap-2">
                <span className="font-display text-[14px] text-gold-2">
                  {d.card.name}
                  <span className="ml-1 text-[11px] text-moon/50">{d.reversed ? "逆位" : "正位"}</span>
                </span>
                <span className="text-[10px] text-moon/40">{d.position}</span>
              </div>
              <p className="mt-1 text-[11px] text-gold-2/60">{face.keywords.join(" · ")}</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-moon/75">{face.line}</p>
            </motion.div>
          );
        })}
      </div>

      <DivineActions
        onSave={saveAndToast}
        onAsk={askMaster}
        onReset={reset}
        askLabel="请瑟琳娜解此牌阵"
      />
    </div>
  );
}

/** 牌扇：按容器宽度自适应间距，窄屏不溢出 */
function FanDeck({
  picked,
  fanIdx,
  mid,
  onPick,
}: {
  picked: number[];
  fanIdx: number[];
  mid: number;
  onPick: (i: number) => void;
}) {
  const [spacing, setSpacing] = useState(26);
  return (
    <div
      ref={(el) => {
        if (el) {
          const s = Math.min(26, Math.max(16, (el.clientWidth - 88) / (FAN_COUNT - 1)));
          if (Math.abs(s - spacing) > 0.5) setSpacing(s);
        }
      }}
      className="relative mx-auto mt-8 h-[240px] w-full max-w-[520px]"
    >
      {fanIdx.map((i) => {
        const off = i - mid;
        const isPicked = picked.includes(i);
        return (
          <motion.button
            key={i}
            className="no-tap-highlight absolute left-1/2 top-6 h-[132px] w-[82px] origin-bottom"
            style={{ marginLeft: -41, zIndex: i }}
            initial={{ y: 140, opacity: 0, rotate: 0 }}
            animate={{
              y: isPicked ? -160 : Math.abs(off) * 3.4,
              x: isPicked ? 0 : off * spacing,
              rotate: isPicked ? 0 : off * (spacing / 5),
              opacity: isPicked ? 0 : 1,
              scale: isPicked ? 0.7 : 1,
            }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: isPicked ? 0 : i * 0.025 }}
            whileHover={isPicked ? undefined : { y: Math.abs(off) * 3.4 - 14 }}
            onClick={() => onPick(i)}
          >
            <CardBack className="h-full w-full" />
          </motion.button>
        );
      })}
    </div>
  );
}
