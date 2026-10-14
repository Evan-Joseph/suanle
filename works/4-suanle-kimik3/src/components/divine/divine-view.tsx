"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Coins, Moon, ScrollText } from "lucide-react";
import { LiuyaoTool } from "./liuyao";
import { TarotTool } from "./tarot";
import { BaziTool } from "./bazi";
import { cn } from "@/lib/utils";

type ToolKey = "liuyao" | "tarot" | "bazi";

const TOOLS: Array<{ key: ToolKey; name: string; en: string; icon: typeof Coins; hint: string }> = [
  { key: "liuyao", name: "六爻摇卦", en: "I-CHING", icon: Coins, hint: "一事一卦，铜钱作答" },
  { key: "tarot", name: "塔罗抽牌", en: "TAROT", icon: Moon, hint: "凭直觉，抽当下启示" },
  { key: "bazi", name: "八字排盘", en: "FOUR PILLARS", icon: ScrollText, hint: "排你落地那一刻的天干地支" },
];

export function DivineView() {
  const [tool, setTool] = useState<ToolKey>("liuyao");

  return (
    <div className="night relative flex h-full min-h-0 flex-1 flex-col bg-night text-moon">
      {/* 星尘背景 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(1px 1px at 12% 22%, rgba(212,175,55,0.8) 50%, transparent 51%), radial-gradient(1px 1px at 68% 12%, rgba(236,231,219,0.7) 50%, transparent 51%), radial-gradient(1.5px 1.5px at 84% 38%, rgba(212,175,55,0.55) 50%, transparent 51%), radial-gradient(1px 1px at 32% 64%, rgba(236,231,219,0.5) 50%, transparent 51%), radial-gradient(1.5px 1.5px at 54% 84%, rgba(212,175,55,0.5) 50%, transparent 51%), radial-gradient(1px 1px at 90% 76%, rgba(236,231,219,0.65) 50%, transparent 51%), radial-gradient(1px 1px at 6% 88%, rgba(212,175,55,0.4) 50%, transparent 51%)",
        }}
      />
      <header className="relative z-10 px-5 pb-1 pt-5 text-center">
        <p className="text-[10px] tracking-[0.5em] text-gold-2/60">不 问 祸 福 ， 只 照 当 下</p>
        <h2 className="mt-2 font-display text-[24px] tracking-[0.3em] text-moon">起卦间</h2>
      </header>

      {/* tool switcher */}
      <div className="relative z-10 mt-3 flex justify-center gap-2 px-4">
        {TOOLS.map((t) => {
          const active = tool === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTool(t.key)}
              className={cn(
                "no-tap-highlight flex items-center gap-2 rounded-full border px-3.5 py-2 text-[12.5px] transition-all active:scale-95",
                active
                  ? "border-gold-2/70 bg-gold-2/10 text-gold-2 shadow-[0_0_24px_rgba(212,175,55,0.18)]"
                  : "border-white/10 bg-white/[0.03] text-moon/55 hover:border-gold-2/30 hover:text-moon"
              )}
            >
              <t.icon size={14} />
              <span className="font-display tracking-wider">{t.name}</span>
            </button>
          );
        })}
      </div>

      <div className="relative z-10 mt-1 min-h-0 flex-1 overflow-y-auto night-scroll">
        <AnimatePresence mode="wait">
          <motion.div
            key={tool}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto h-full w-full max-w-[640px]"
          >
            {tool === "liuyao" && <LiuyaoTool />}
            {tool === "tarot" && <TarotTool />}
            {tool === "bazi" && <BaziTool />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* —— 共享小件 —— */

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[10.5px] tracking-[0.35em] text-gold-2/50">{children}</p>
  );
}

export function DivineActions({
  onSave,
  onAsk,
  onReset,
  askLabel,
}: {
  onSave: () => void;
  onAsk: () => void;
  onReset: () => void;
  askLabel: string;
}) {
  return (
    <div className="mt-6 space-y-2.5">
      <button
        onClick={onAsk}
        className="no-tap-highlight w-full rounded-2xl bg-gold-2 py-3 font-display text-[15px] tracking-[0.2em] text-night shadow-[0_6px_24px_rgba(212,175,55,0.3)] transition-all hover:brightness-110 active:scale-[0.98]"
      >
        {askLabel}
      </button>
      <div className="flex gap-2.5">
        <button
          onClick={onSave}
          className="no-tap-highlight flex-1 rounded-2xl border border-gold-2/30 py-2.5 text-[13px] text-gold-2/90 transition-colors hover:bg-gold-2/10 active:scale-[0.98]"
        >
          收进命运存档
        </button>
        <button
          onClick={onReset}
          className="no-tap-highlight flex-1 rounded-2xl border border-white/12 py-2.5 text-[13px] text-moon/60 transition-colors hover:bg-white/5 active:scale-[0.98]"
        >
          再占一次
        </button>
      </div>
    </div>
  );
}

export function IntentionCard({
  value,
  onChange,
  onStart,
  cta,
  hint,
}: {
  value: string;
  onChange: (v: string) => void;
  onStart: () => void;
  cta: string;
  hint: string;
}) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-10">
      <div className="anim-breathe h-24 w-24 rounded-full border border-gold-2/30 bg-gold-2/5 shadow-[0_0_60px_rgba(212,175,55,0.12)]" />
      <p className="mt-8 text-center font-display text-[17px] leading-loose tracking-wider text-moon/85">
        闭目凝神，
        <br />
        把心里的那件事，轻轻放在桌上。
      </p>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={hint}
        className="mt-6 w-full max-w-[340px] rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-center text-[14px] text-moon outline-none transition-colors placeholder:text-moon/30 focus:border-gold-2/50"
      />
      <button
        onClick={onStart}
        className="no-tap-highlight mt-5 rounded-full bg-gold-2 px-10 py-3 font-display text-[14px] tracking-[0.3em] text-night shadow-[0_6px_24px_rgba(212,175,55,0.3)] transition-all hover:brightness-110 active:scale-95"
      >
        {cta}
      </button>
      <p className="mt-4 text-[11px] text-moon/35">也可留白 —— 让天意先说</p>
    </div>
  );
}

const COMPUTING_LINES = [
  "正在遍历万年历历元与干支交接…",
  "正在推演天干地支刑冲克害局势…",
  "正在检索《渊海子平》格局拓扑…",
  "正在投射荣格原型心理图谱…",
  "命书已成，天机显化。",
];

export function Computing({ onDone }: { onDone: () => void }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => {
      setIdx((i) => {
        if (i >= COMPUTING_LINES.length - 1) {
          clearInterval(t);
          setTimeout(onDone, 480);
          return i;
        }
        return i + 1;
      });
    }, 620);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center px-6">
      <div className="relative">
        <div className="anim-spin-slower h-20 w-20 rounded-full border border-gold-2/40 p-[3px]">
          <div className="h-full w-full rounded-full border border-gold-2/20 bg-gradient-to-br from-gold-2/25 via-transparent to-cinnabar/25" />
        </div>
        <div className="absolute inset-0 m-auto h-2 w-2 rounded-full bg-gold-2 shadow-[0_0_16px_rgba(212,175,55,0.9)]" />
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={idx}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="mt-8 text-[12.5px] tracking-wider text-gold-2/80"
        >
          ✦ {COMPUTING_LINES[idx]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
