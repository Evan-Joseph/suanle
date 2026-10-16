"use client";

import { motion } from "motion/react";
import { useMemo, useRef, useState } from "react";
import { resolveCast, tossThree, YAO_NAMES, type CastResult } from "@/lib/divination";
import { haptic, playCoin } from "@/lib/sound";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 方孔铜钱：字面（2）刻「通宝」，背面（3）留白 */
function Coin({ face }: { face: number }) {
  return (
    <svg viewBox="0 0 64 64" width="56" height="56" aria-hidden>
      <circle cx="32" cy="32" r="30" fill="#c9a463" />
      <circle cx="32" cy="32" r="30" fill="none" stroke="#8a6a35" strokeWidth="2.5" />
      <circle cx="32" cy="32" r="24" fill="none" stroke="#a8844a" strokeWidth="1.2" />
      <rect x="25" y="25" width="14" height="14" rx="1.5" fill="var(--paper)" stroke="#8a6a35" strokeWidth="2" />
      {face === 2 ? (
        <g fill="#5e4520" fontSize="10" fontFamily="var(--font-song)" fontWeight="700" textAnchor="middle">
          <text x="32" y="20">通</text>
          <text x="32" y="53">宝</text>
          <text x="15" y="36">乾</text>
          <text x="49" y="36">隆</text>
        </g>
      ) : (
        <path d="M18 44 Q32 52 46 44" fill="none" stroke="#8a6a35" strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
      )}
    </svg>
  );
}

export function HexLines({ sums, size = "md" }: { sums: number[]; size?: "sm" | "md" }) {
  const w = size === "sm" ? 120 : 168;
  const h = size === "sm" ? 9 : 12;
  return (
    <div className="flex flex-col-reverse items-center gap-[7px]" aria-label="卦象">
      {Array.from({ length: 6 }, (_, i) => {
        const s = sums[i];
        const known = s !== undefined;
        const yang = s === 7 || s === 9;
        const moving = s === 6 || s === 9;
        return (
          <div key={i} className="flex items-center gap-3">
            <span className="w-4 text-right text-[11px] text-mute">{YAO_NAMES[i]}</span>
            {known ? (
              <motion.div initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 24 }} className="flex justify-between" style={{ width: w, height: h }}>
                {yang ? (
                  <span className="h-full w-full rounded-[3px] bg-ink" />
                ) : (
                  <>
                    <span className="h-full w-[44%] rounded-[3px] bg-ink" />
                    <span className="h-full w-[44%] rounded-[3px] bg-ink" />
                  </>
                )}
              </motion.div>
            ) : (
              <div className="rounded-[3px] border border-dashed border-faint" style={{ width: w, height: h }} />
            )}
            <span className="w-4 text-[12px] font-bold text-seal">{moving ? (s === 9 ? "○" : "×") : ""}</span>
          </div>
        );
      })}
    </div>
  );
}

export function CastSummary({ r }: { r: CastResult }) {
  return (
    <div className="mt-4 rounded-2xl bg-paper-2/70 p-4">
      <div className="flex items-baseline justify-between gap-2">
        <div className="font-song text-[20px] font-bold">{r.primary.full}</div>
        <div className="text-[12px] text-mute">本卦 · 第{r.primary.no}卦</div>
      </div>
      <p className="mt-1.5 text-[14px] leading-relaxed text-ink-2">{r.primary.gist}</p>
      {r.changed && (
        <div className="mt-3 border-t border-line pt-3">
          <div className="flex items-baseline justify-between gap-2">
            <div className="font-song text-[16px] font-bold">变 · {r.changed.full}</div>
            <div className="text-[12px] text-mute">动爻 {r.moving.map((m) => YAO_NAMES[m - 1]).join("、")}</div>
          </div>
          <p className="mt-1 text-[13.5px] leading-relaxed text-ink-2">{r.changed.gist}</p>
        </div>
      )}
    </div>
  );
}

export function CoinCaster({ question, initial, onDone }: { question?: string; initial: CastResult | null; onDone: (r: CastResult) => void }) {
  const [sums, setSums] = useState<number[]>(initial?.sums ?? []);
  const [faces, setFaces] = useState<number[]>([2, 3, 2]);
  const [tossing, setTossing] = useState(false);
  const [tick, setTick] = useState(0);
  const fired = useRef(!!initial);
  const done = sums.length >= 6;
  const result = useMemo(() => (sums.length === 6 ? resolveCast(sums, question) : null), [sums, question]);

  const toss = async (all: boolean) => {
    if (tossing || done) return;
    setTossing(true);
    const next = [...sums];
    do {
      const t = tossThree();
      haptic(14);
      setTick((x) => x + 1);
      await sleep(all ? 460 : 640);
      setFaces(t.coins);
      playCoin();
      next.push(t.sum);
      setSums([...next]);
      if (all && next.length < 6) await sleep(160);
    } while (all && next.length < 6);
    setTossing(false);
    if (next.length === 6 && !fired.current) {
      fired.current = true;
      haptic([10, 40, 20]);
      onDone(resolveCast(next, question));
    }
  };

  return (
    <div>
      {!done && (
        <>
          <div className="flex h-[92px] items-end justify-center gap-4" style={{ perspective: 600 }}>
            {faces.map((f, i) => (
              <motion.div
                key={`${tick}-${i}`}
                initial={tick ? { y: 0, rotateX: 0 } : false}
                animate={tick ? { y: [0, -54 - i * 8, 0, -7, 0], rotateX: [0, 540 + i * 180, 720 + i * 360, 720 + i * 360, 720 + i * 360] } : { y: 0 }}
                transition={{ duration: 0.62, delay: i * 0.05, ease: "easeOut", times: [0, 0.42, 0.78, 0.9, 1] }}
                className="drop-shadow-[0_6px_6px_rgba(80,55,15,0.25)]"
              >
                <Coin face={f} />
              </motion.div>
            ))}
          </div>
          <div className="mt-3 text-center text-[12.5px] text-mute">{sums.length ? `第 ${sums.length} 爻已成，还差 ${6 - sums.length} 次` : "心里想着那件事，摇六次，自下而上成卦"}</div>
        </>
      )}
      <div className="mt-4">
        <HexLines sums={sums} />
      </div>
      {result ? (
        <CastSummary r={result} />
      ) : (
        <div className="mt-5 flex items-center gap-2">
          <button
            type="button"
            onClick={() => void toss(false)}
            disabled={tossing}
            className="h-11 flex-1 rounded-2xl bg-ink text-[15px] font-medium tracking-[0.12em] text-on-ink transition active:scale-[0.98] disabled:opacity-60"
          >
            {tossing ? "叮当……" : sums.length ? "再摇一次" : "摇"}
          </button>
          <button type="button" onClick={() => void toss(true)} disabled={tossing} className="h-11 shrink-0 rounded-2xl border border-line px-4 text-[13.5px] text-ink-2 transition active:scale-[0.98] disabled:opacity-60">
            一口气摇完
          </button>
        </div>
      )}
    </div>
  );
}
