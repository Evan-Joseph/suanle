"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import {
  buildResult,
  labelLines,
  liuyaoContext,
  throwCoins,
  CoinThrow,
  THROW_META,
  LiuYaoResult,
} from "@/lib/yijing";
import { sfxCoinLand, sfxReveal, sfxShake } from "@/lib/audio";
import { useApp } from "@/store/app";
import { Computing, DivineActions, IntentionCard, SectionLabel } from "./divine-view";
import { cn } from "@/lib/utils";

type Phase = "intention" | "casting" | "computing" | "revealed";

/** 铜钱：外圆内方的乾隆通宝 */
function Coin({ back, rolling }: { back: boolean | null; rolling: boolean }) {
  return (
    <motion.div
      animate={
        rolling
          ? { rotateZ: [0, 40, -30, 20, -10, 0], y: [0, -14, 4, -8, 0] }
          : { rotateZ: 0, y: 0 }
      }
      transition={{ duration: 0.55, ease: "easeInOut" }}
      className="relative flex h-14 w-14 items-center justify-center rounded-full shadow-[0_6px_18px_rgba(0,0,0,0.5)]"
      style={{
        background:
          "radial-gradient(circle at 32% 28%, #ecd9a0 0%, #c8a24e 42%, #8a6a25 100%)",
      }}
    >
      <div className="absolute inset-[15%] rounded-full border border-[#7a5c1c]/50" />
      <div className="h-[26%] w-[26%] rounded-[3px] bg-night shadow-[inset_0_1px_3px_rgba(0,0,0,0.7)]" />
      {back !== null && !rolling && (
        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] tracking-widest text-gold-2/70">
          {back ? "背" : "字"}
        </span>
      )}
    </motion.div>
  );
}

/** 单爻 */
function Yao({ yang, changing, label, fresh }: { yang: boolean; changing: boolean; label?: string; fresh?: boolean }) {
  return (
    <div className="flex items-center justify-center gap-3">
      <span className="w-8 text-right text-[10px] tracking-wider text-moon/40">{label}</span>
      {yang ? (
        <motion.span
          initial={fresh ? { scaleX: 0, opacity: 0 } : false}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="h-2.5 w-36 origin-center rounded-full bg-moon/90"
        />
      ) : (
        <motion.span
          initial={fresh ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex w-36 justify-between"
        >
          <motion.span
            initial={fresh ? { scaleX: 0 } : false}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.3 }}
            className="h-2.5 w-[42%] origin-left rounded-full bg-moon/90"
          />
          <motion.span
            initial={fresh ? { scaleX: 0 } : false}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.3, delay: 0.12 }}
            className="h-2.5 w-[42%] origin-right rounded-full bg-moon/90"
          />
        </motion.span>
      )}
      <span className="w-8 text-[13px]">
        {changing ? (
          <span className={yang ? "text-gold-2" : "text-cinnabar"}>{yang ? "○" : "×"}</span>
        ) : null}
      </span>
    </div>
  );
}

export function LiuyaoTool() {
  const [phase, setPhase] = useState<Phase>("intention");
  const [question, setQuestion] = useState("");
  const [throws, setThrows] = useState<CoinThrow[]>([]);
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<LiuYaoResult | null>(null);
  const saveReading = useApp((s) => s.saveReading);
  const askAbout = useApp((s) => s.askAboutReading);
  const toast = useApp((s) => s.toast);

  const cast = () => {
    if (rolling || throws.length >= 6) return;
    setRolling(true);
    sfxShake();
    setTimeout(() => {
      const t = throwCoins();
      sfxCoinLand();
      setThrows((prev) => {
        const next = [...prev, t];
        if (next.length === 6) {
          setTimeout(() => setPhase("computing"), 900);
        }
        return next;
      });
      setRolling(false);
    }, 620);
  };

  const finish = () => {
    const r = buildResult(throws);
    setResult(r);
    setPhase("revealed");
    sfxReveal();
  };

  const buildSummary = (r: LiuYaoResult) =>
    `所问：${question || "（未明言）"}\n本卦：${r.original.name} —— ${r.original.gloss}\n互卦：${r.nuclear.name}\n${
      r.changed
        ? `变卦：${r.changed.name} —— ${r.changed.gloss}\n动爻：${r.changingYao.join("、")}`
        : "六爻安静，无动爻。"
    }`;

  const saveAndToast = () => {
    if (!result) return;
    saveReading({
      type: "liuyao",
      title: `${result.original.name}${result.changed ? ` 之 ${result.changed.name}` : ""}`,
      summary: buildSummary(result),
      llmContext: liuyaoContext(question, result),
      question,
    });
    toast("已收进你的命运存档");
  };

  const askMaster = () => {
    if (!result) return;
    const payload = {
      type: "liuyao" as const,
      title: `${result.original.name}${result.changed ? ` 之 ${result.changed.name}` : ""}`,
      summary: buildSummary(result),
      llmContext: liuyaoContext(question, result),
      question,
    };
    const id = saveReading(payload);
    askAbout({ id, createdAt: Date.now(), ...payload });
  };

  const reset = () => {
    setPhase("intention");
    setThrows([]);
    setResult(null);
    setQuestion("");
  };

  if (phase === "intention") {
    return (
      <IntentionCard
        value={question}
        onChange={setQuestion}
        onStart={() => setPhase("casting")}
        cta="净手摇卦"
        hint="默念心中所问，如：这份工作该不该接…"
      />
    );
  }

  if (phase === "computing") {
    return <Computing onDone={finish} />;
  }

  if (phase === "revealed" && result) {
    return (
      <div className="anim-rise px-5 pb-10 pt-6">
        <SectionLabel>本 卦 · 当 下 局 势</SectionLabel>
        <div className="rounded-3xl border border-gold-2/20 bg-gradient-to-b from-white/[0.05] to-transparent p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2">
              {[...result.lines].reverse().map((l, i) => (
                <Yao key={i} yang={l.yang} changing={l.changing} label={l.label} />
              ))}
            </div>
            <div className="text-right">
              <p className="text-[10px] tracking-[0.3em] text-moon/40">
                {result.original.upper.name}
                {result.original.upper.nature}上 · {result.original.lower.name}
                {result.original.lower.nature}下
              </p>
              <h3 className="mt-2 font-display text-[26px] tracking-[0.15em] text-gold-2">
                {result.original.name}
              </h3>
            </div>
          </div>
          <p className="mt-5 border-t border-white/8 pt-4 text-[13.5px] leading-relaxed text-moon/75">
            {result.original.gloss}
          </p>
        </div>

        {result.changed && (
          <div className="mt-5">
            <SectionLabel>之 卦 · 事 情 走 势</SectionLabel>
            <div className="flex items-center gap-3 rounded-2xl border border-cinnabar/25 bg-cinnabar/[0.06] px-5 py-4">
              <span className="font-display text-[15px] text-moon/70">{result.original.name}</span>
              <ArrowRight size={15} className="text-cinnabar" />
              <span className="font-display text-[17px] tracking-wider text-gold-2">
                {result.changed.name}
              </span>
              <span className="ml-auto text-[11px] text-moon/45">
                动爻：{result.changingYao.join(" · ")}
              </span>
            </div>
            <p className="mt-2 px-1 text-[12.5px] leading-relaxed text-moon/60">
              {result.changed.gloss}
            </p>
          </div>
        )}

        <div className="mt-5 rounded-2xl border border-white/8 bg-white/[0.02] px-5 py-3.5 text-[12px] leading-relaxed text-moon/50">
          <span className="text-gold-2/70">互卦 {result.nuclear.name}</span> —— 事情内里暗含的走向，供解卦人参详。
        </div>

        <DivineActions
          onSave={saveAndToast}
          onAsk={askMaster}
          onReset={reset}
          askLabel="请玄玑道长断此卦"
        />
      </div>
    );
  }

  /* casting */
  const lines = labelLines(
    throws.map((t) => ({
      yang: THROW_META[t.sum].yang,
      changing: THROW_META[t.sum].changing,
      label: "",
    }))
  );

  return (
    <div className="flex min-h-full flex-col px-5 pb-8 pt-4">
      <p className="text-center text-[12px] tracking-[0.25em] text-moon/45">
        {question ? `所问之事：${question}` : "心中所问，天自知之"}
      </p>

      {/* hexagram building */}
      <div className="mt-6 flex flex-1 flex-col justify-end gap-2.5 rounded-3xl border border-white/8 bg-white/[0.02] p-5">
        {Array.from({ length: 6 }).map((_, revIdx) => {
          const i = 5 - revIdx;
          const l = lines[i];
          if (!l)
            return (
              <div key={i} className="flex items-center justify-center gap-3 opacity-25">
                <span className="w-8 text-right text-[10px] text-moon/30">{["初","二","三","四","五","上"][i]}爻</span>
                <span className="h-2.5 w-36 rounded-full border border-dashed border-white/15" />
                <span className="w-8" />
              </div>
            );
          return (
            <Yao
              key={i}
              yang={l.yang}
              changing={l.changing}
              label={l.label}
              fresh={i === lines.length - 1}
            />
          );
        })}
      </div>

      {/* coins */}
      <div className="mt-7 flex items-center justify-center gap-6 pb-2 pt-1">
        {[0, 1, 2].map((i) => (
          <Coin key={i} back={throws.length ? throws[throws.length - 1].coins[i] : null} rolling={rolling} />
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={throws.length}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-center text-[12px] tracking-[0.3em] text-gold-2/70"
        >
          {throws.length === 0
            ? "共摇六次 · 自下而上成卦"
            : throws.length < 6
              ? `第 ${["一", "二", "三", "四", "五", "六"][throws.length - 1]} 掷 · ${throws[throws.length - 1].name}`
              : "六爻已成"}
        </motion.p>
      </AnimatePresence>

      <button
        onClick={cast}
        disabled={rolling || throws.length >= 6}
        className={cn(
          "no-tap-highlight mx-auto mt-4 w-full max-w-[340px] rounded-2xl py-3.5 font-display text-[15px] tracking-[0.35em] transition-all active:scale-[0.98]",
          rolling || throws.length >= 6
            ? "bg-white/8 text-moon/30"
            : "bg-gold-2 text-night shadow-[0_6px_24px_rgba(212,175,55,0.3)] hover:brightness-110"
        )}
      >
        {throws.length >= 6 ? "卦 已 成" : rolling ? "摇 卦 中 …" : "摇 卦"}
      </button>
    </div>
  );
}
