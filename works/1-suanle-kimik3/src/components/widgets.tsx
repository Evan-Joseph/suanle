"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Flame, Trash2 } from "lucide-react";
import { FISH_MILESTONES } from "@/lib/copy";
import { useStore } from "@/lib/store";
import { rngFrom, todayKey } from "@/lib/rand";
import { weekOutlook } from "@/lib/fortune";
import { WORRY_REPLIES } from "@/lib/copy";

// ———————————————————————— 木鱼 ————————————————————————
const FISH_WORDS = ["烦恼 -1", "心事 -1", "内耗 -1", "焦虑 -1", "火气 -1", "杂念 -1"];

function useKnock() {
  const ctxRef = useRef<AudioContext | null>(null);
  return useCallback(() => {
    try {
      if (!ctxRef.current) ctxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const ctx = ctxRef.current;
      const t = ctx.currentTime;
      // 木质主体
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(760, t);
      osc.frequency.exponentialRampToValueAtTime(150, t + 0.09);
      gain.gain.setValueAtTime(0.55, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.18);
      // 敲击瞬态
      const len = Math.floor(ctx.sampleRate * 0.02);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ctx.createBufferSource();
      const bp = ctx.createBiquadFilter();
      const g2 = ctx.createGain();
      bp.type = "bandpass"; bp.frequency.value = 2400; bp.Q.value = 1.1;
      g2.gain.setValueAtTime(0.22, t);
      g2.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      src.buffer = buf;
      src.connect(bp).connect(g2).connect(ctx.destination);
      src.start(t);
    } catch { /* 无声环境静默 */ }
  }, []);
}

export function WoodenFish() {
  const { state, fishBump } = useStore();
  const knock = useKnock();
  const [particles, setParticles] = useState<{ id: number; x: number; text: string }[]>([]);
  const [toast, setToast] = useState<string>("");
  const idRef = useRef(0);
  const today = state.fish.byDay[todayKey()] ?? 0;

  const hit = () => {
    knock();
    fishBump();
    const after = today + 1;
    if (FISH_MILESTONES[after]) {
      setToast(FISH_MILESTONES[after]);
      window.setTimeout(() => setToast(""), 3600);
    }
    const id = ++idRef.current;
    setParticles((p) => [...p.slice(-7), { id, x: -44 + Math.random() * 88, text: FISH_WORDS[id % FISH_WORDS.length] }]);
    window.setTimeout(() => setParticles((p) => p.filter((pt) => pt.id !== id)), 1100);
  };

  return (
    <div className="panel relative flex flex-col items-center overflow-hidden px-6 py-7">
      <p className="text-[11px] tracking-[0.4em] text-faint">解压小筑 · 木鱼</p>

      <div className="relative mt-2">
        <AnimatePresence>
          {particles.map((pt) => (
            <motion.span
              key={pt.id}
              className="pointer-events-none absolute left-1/2 top-2 z-10 whitespace-nowrap font-display text-[13px] text-terra"
              initial={{ opacity: 0, y: 10, x: pt.x }}
              animate={{ opacity: [0, 1, 0], y: -74 }}
              transition={{ duration: 1.05, ease: "easeOut" }}
            >
              {pt.text}
            </motion.span>
          ))}
        </AnimatePresence>

        <motion.button
          onClick={hit}
          whileTap={{ scale: 0.9, rotate: -2 }}
          transition={{ type: "spring", stiffness: 500, damping: 16 }}
          className="relative mt-4 block cursor-pointer outline-none"
          aria-label="敲木鱼"
        >
          <svg viewBox="0 0 200 160" width="168" height="134">
            <ellipse cx="100" cy="142" rx="68" ry="9" fill="#E4DECF" />
            <ellipse cx="100" cy="92" rx="62" ry="48" fill="#C79B6B" />
            <ellipse cx="100" cy="92" rx="62" ry="48" fill="url(#fishShade)" />
            <path d="M 52 74 Q 100 36 148 74" stroke="rgba(96,66,38,.4)" strokeWidth="7" fill="none" strokeLinecap="round" />
            <path d="M 128 100 Q 160 103 164 84" stroke="#6A4A2C" strokeWidth="6" fill="none" strokeLinecap="round" />
            <path d="M 42 120 L 158 120 Q 152 138 100 138 Q 48 138 42 120" fill="#8A6540" opacity="0.35" />
            <circle cx="70" cy="86" r="4.5" fill="rgba(96,66,38,.5)" />
            <defs>
              <radialGradient id="fishShade" cx="0.5" cy="0.28" r="0.9">
                <stop offset="0%" stopColor="#E4C08C" stopOpacity="0.85" />
                <stop offset="55%" stopColor="#C79B6B" stopOpacity="0" />
                <stop offset="100%" stopColor="#8A6540" stopOpacity="0.4" />
              </radialGradient>
            </defs>
          </svg>
        </motion.button>
      </div>

      <div className="mt-4 flex h-6 items-center justify-center">
        <AnimatePresence mode="wait">
          {toast ? (
            <motion.p key={toast} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-center font-display text-[12.5px] text-terra">
              {toast}
            </motion.p>
          ) : (
            <motion.p key="count" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-[12px] text-ink2">
              今日已敲 <span className="tabular font-display text-[15px] font-bold text-ink">{today}</span> 下 · 累计 {state.fish.total} 下
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ———————————————————————— 烦恼纸篓 ————————————————————————
export function WorryBin() {
  const { state, worryBump } = useStore();
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<"idle" | "crumple" | "fly" | "done">("idle");
  const [flight, setFlight] = useState({ dx: 60, dy: 150 });
  const [reply, setReply] = useState("");
  const paperRef = useRef<HTMLDivElement>(null);
  const binRef = useRef<HTMLDivElement>(null);

  const throwAway = () => {
    if (!text.trim() || phase !== "idle") return;
    const p = paperRef.current?.getBoundingClientRect();
    const b = binRef.current?.getBoundingClientRect();
    if (p && b) setFlight({ dx: b.left + b.width / 2 - (p.left + p.width / 2), dy: b.top + b.height / 2 - (p.top + p.height / 2) });
    setPhase("crumple");
    window.setTimeout(() => setPhase("fly"), 520);
    window.setTimeout(() => {
      setPhase("done");
      worryBump();
      const rng = rngFrom("纸篓" + Date.now());
      setReply(WORRY_REPLIES[Math.floor(rng() * WORRY_REPLIES.length)]);
      setText("");
      window.setTimeout(() => { setPhase("idle"); setReply(""); }, 3400);
    }, 1420);
  };

  return (
    <div className="panel relative flex flex-col overflow-hidden px-6 py-7">
      <p className="text-[11px] tracking-[0.4em] text-faint">解压小筑 · 纸篓</p>

      <div className="relative mt-3 flex-1">
        <motion.div
          ref={paperRef}
          animate={
            phase === "crumple" || phase === "fly"
              ? { scale: 0.34, rotate: 26, borderRadius: "50%", filter: "saturate(.6) contrast(1.08)" }
              : { scale: 1, rotate: 0, borderRadius: "1rem", filter: "none" }
          }
          transition={{ duration: 0.5, ease: [0.55, 0, 0.45, 1] }}
          className="border border-line bg-white/90 shadow-soft"
          style={{ transformOrigin: "center center" }}
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            readOnly={phase !== "idle"}
            placeholder="把盘旋在脑子里的那件事，写下来……"
            className="h-[104px] w-full resize-none bg-transparent p-4 text-[13.5px] leading-relaxed text-ink outline-none placeholder:text-faint"
          />
        </motion.div>

        {/* 飞出的纸团 */}
        <AnimatePresence>
          {(phase === "fly" || phase === "done") && (
            <motion.span
              className="pointer-events-none absolute top-14 z-10 block h-9 w-9 rounded-full border border-line bg-white shadow-soft"
              style={{ left: "50%", marginLeft: -18 }}
              initial={{ x: 0, y: 0, scale: 0.3, rotate: 0, opacity: 1 }}
              animate={
                phase === "done"
                  ? { opacity: 0, scale: 0.2, rotate: 520 }
                  : { x: [0, flight.dx * 0.35, flight.dx], y: [0, Math.min(flight.dy * 0.4 - 120, -60), flight.dy], rotate: 520, scale: [0.3, 0.9, 0.72] }
              }
              exit={{ opacity: 0 }}
              transition={{ duration: 0.85, ease: "easeIn" }}
            />
          )}
        </AnimatePresence>

        <div className="mt-4 flex items-end justify-between gap-4">
          <div className="flex-1">
            <button
              className="btn-ink h-10 px-5 text-[13px] disabled:opacity-40"
              onClick={throwAway}
              disabled={!text.trim() || phase !== "idle"}
            >
              <Trash2 size={14} /> 揉掉它
            </button>
            <p className="mt-2.5 text-[11px] text-faint">已替你回收 {state.worries} 团心事</p>
          </div>
          <motion.div
            ref={binRef}
            animate={phase === "done" ? { rotate: [0, -5, 4, -2, 0] } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative"
          >
            <svg viewBox="0 0 96 104" width="76" height="82">
              <path d="M 18 26 L 78 26 L 71 96 Q 48 103 25 96 Z" fill="#EFECE3" stroke="#D9D2C4" strokeWidth="3" strokeLinejoin="round" />
              <rect x="30" y="38" width="5" height="46" rx="2.5" fill="#D9D2C4" />
              <rect x="45.5" y="38" width="5" height="50" rx="2.5" fill="#D9D2C4" />
              <rect x="61" y="38" width="5" height="46" rx="2.5" fill="#D9D2C4" />
              <rect x="12" y="14" width="72" height="12" rx="6" fill="#D9D2C4" />
              <rect x="38" y="7" width="20" height="9" rx="4.5" fill="#D9D2C4" />
            </svg>
          </motion.div>
        </div>
      </div>

      <div className="flex min-h-6 items-end">
        <AnimatePresence>
          {reply && (
            <motion.p key={reply} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="font-display text-[13px] leading-relaxed text-mint">
              {reply}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ———————————————————————— 一周气流 ————————————————————————
export function WeekStrip() {
  const { state } = useStore();
  const [days, setDays] = useState(() => weekOutlook(null));
  const [sel, setSel] = useState(0);
  useEffect(() => { setDays(weekOutlook(state.profile)); setSel(0); }, [state.profile]);

  return (
    <div className="panel px-6 py-6">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-[11px] tracking-[0.4em] text-faint"><Flame size={13} className="text-terra" /> 七日气流</p>
        <p className="text-[11px] text-faint">看准风向，再决定躺或起</p>
      </div>
      <div className="mt-5 grid grid-cols-7 gap-2 sm:gap-3">
        {days.map((d, i) => {
          const active = sel === i;
          const today = i === 0;
          return (
            <button key={d.dateKey} onClick={() => setSel(i)} className="group flex flex-col items-center gap-2">
              <span className={`text-[10px] tracking-wider ${today ? "text-terra font-medium" : "text-faint"}`}>{today ? "今" : `周${d.week}`}</span>
              <span className="relative flex h-[84px] w-full items-end justify-center">
                <motion.span
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.round(d.temp * 0.84)}%` }}
                  transition={{ delay: 0.08 * i, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  className={`w-full max-w-[26px] rounded-full transition-colors ${
                    active ? "bg-terra" : today ? "bg-terra2/80 group-hover:bg-terra2" : d.temp >= 70 ? "bg-mint2 group-hover:bg-mint" : d.temp >= 52 ? "bg-haze2 group-hover:bg-haze" : "bg-line group-hover:bg-faint/50"
                  }`}
                />
              </span>
              <span className={`tabular text-[10.5px] ${active ? "text-ink" : "text-faint"}`}>{d.temp}°</span>
            </button>
          );
        })}
      </div>
      <AnimatePresence mode="wait">
        <motion.p key={sel} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 border-t border-line/70 pt-3 text-center text-[12px] text-ink2">
          {days[sel].dateKey} · <span className="font-display font-semibold">{days[sel].word}</span> · 心气 {days[sel].temp}°
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
