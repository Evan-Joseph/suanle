"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useAnimation, useMotionValue, type PanInfo } from "motion/react";
import { RotateCcw, MessageCircle, Flame } from "lucide-react";
import { useApp, useUI } from "@/store/app";
import { LETGO_LINES } from "@/lib/mock";
import { playBowl, playCrumple, playLand, playWhoosh, haptic } from "@/lib/sound";
import { bringToChat } from "@/lib/engine";

type Stage = "write" | "ball" | "flying" | "done";

const PLACEHOLDERS = ["老板那句阴阳怪气的话", "那条迟迟没回的消息", "体重秤上的数字", "三年前说错的一句话", "别人家的孩子", "还没还完的花呗", "凌晨两点的胡思乱想"];

function PaperBall({ size = 72 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className="drop-shadow-[0_8px_10px_rgba(60,40,10,0.25)]">
      <path d="M32 4 L46 8 L58 20 L60 36 L54 50 L40 60 L24 59 L10 50 L4 34 L8 18 L20 7 Z" fill="#fffdf8" stroke="#d9d2c2" strokeWidth="1.2" />
      <path d="M20 7 L28 24 L46 8 M28 24 L58 20 M28 24 L22 40 L4 34 M22 40 L40 44 L60 36 M40 44 L40 60 M22 40 L24 59 M40 44 L54 50 M28 24 L40 44" fill="none" stroke="#e1d9c7" strokeWidth="1.1" />
      <path d="M14 28 Q22 30 26 36 M36 14 Q40 22 48 26" fill="none" stroke="rgba(63,90,115,0.25)" strokeWidth="1" />
    </svg>
  );
}

function Bin({ wobble, lit }: { wobble: boolean; lit: boolean }) {
  return (
    <svg viewBox="0 0 120 120" width={120} height={120} className={wobble ? "anim-wobble" : ""} style={{ transformOrigin: "50% 100%" }}>
      <ellipse cx="60" cy="112" rx="40" ry="5" fill="rgba(0,0,0,0.07)" />
      <path d="M18 26 L28 108 Q60 116 92 108 L102 26 Z" fill={lit ? "#f3e7d3" : "#efe9dc"} stroke="#2b2a28" strokeWidth="2.2" strokeLinejoin="round" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => <path key={i} d={`M${30 + i * 10} 30 L${36 + i * 8} 108`} stroke="#2b2a28" strokeOpacity="0.18" strokeWidth="1.4" />)}
      {[48, 70, 92].map((y) => <path key={y} d={`M${20 + y * 0.09} ${y} Q60 ${y + 6} ${100 - y * 0.09} ${y}`} fill="none" stroke="#2b2a28" strokeOpacity="0.14" strokeWidth="1.4" />)}
      <ellipse cx="60" cy="26" rx="42" ry="9" fill="#e2dccd" stroke="#2b2a28" strokeWidth="2.2" />
      <ellipse cx="60" cy="27" rx="34" ry="5.5" fill="#cfc7b4" />
    </svg>
  );
}

export default function LetGoView() {
  const draft = useUI((s) => s.letgoDraft);
  const setDraft = useUI((s) => s.setLetgoDraft);
  const toast = useUI((s) => s.toast);
  const addLetgo = useApp((s) => s.addLetgo);
  const letgo = useApp((s) => s.letgo);
  const anonId = useApp((s) => s.anonId);
  const [text, setText] = useState(draft);
  const [stage, setStage] = useState<Stage>("write");
  const [ph, setPh] = useState(0);
  const [wobble, setWobble] = useState(false);
  const [line, setLine] = useState(LETGO_LINES[0]);
  const [global, setGlobal] = useState<{ today: number; total: number } | null>(null);
  const [crumpling, setCrumpling] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const binRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLDivElement>(null);
  const ballCtrl = useAnimation();
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  useEffect(() => { if (draft) setDraft(""); }, [draft, setDraft]);
  useEffect(() => { const t = setInterval(() => setPh((p) => (p + 1) % PLACEHOLDERS.length), 2600); return () => clearInterval(t); }, []);
  useEffect(() => { fetch("/api/letgo").then((r) => r.json()).then(setGlobal).catch(() => null); }, []);
  // 纸团登场：从揉皱的位置弹出来
  useEffect(() => {
    if (stage !== "ball") return;
    void ballCtrl.start({ x: 0, y: 0, rotate: 0, scale: 1, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 18 } });
  }, [stage, ballCtrl]);

  const crumple = () => {
    if (!text.trim()) { setText(PLACEHOLDERS[ph]); return; }
    setCrumpling(true); playCrumple();
    setTimeout(() => { setCrumpling(false); setStage("ball"); x.set(0); y.set(0); }, 720);
  };

  /** 松手：根据速度判断是否能飞进纸篓（简化抛体） */
  const onDragEnd = async (_: unknown, info: PanInfo) => {
    const ballEl = ballRef.current, binEl = binRef.current;
    if (!ballEl || !binEl) return;
    const r = ballEl.getBoundingClientRect(), br = binEl.getBoundingClientRect();
    const ballX = r.left + r.width / 2, ballY = r.top + r.height / 2;
    // 纸团初始原点（当前位置减去已拖动偏移）
    const originX = ballX - x.get(), originY = ballY - y.get();
    const targetX = br.left + br.width / 2 - originX;
    const targetY = br.top + br.height * 0.3 - originY;
    const vy = info.velocity.y, vx = info.velocity.x;
    const speed = Math.hypot(vx, vy);
    const inBin = ballX > br.left - 10 && ballX < br.right + 10 && ballY > br.top - 20 && ballY < br.bottom;
    const thrownDown = vy > 450 || (speed > 650 && vy > -200);

    if (!inBin && !thrownDown) {
      // 没扔出去，弹回
      void ballCtrl.start({ x: 0, y: 0, rotate: 0, transition: { type: "spring", stiffness: 300, damping: 22 } });
      setHint("往下用力一甩，或者直接拖进去");
      setTimeout(() => setHint(null), 1800);
      return;
    }
    setStage("flying"); playWhoosh(); haptic(6);
    // 抛物线：先向上/前抛一点，再落进篓
    const curX = x.get(), curY = y.get();
    const apexY = Math.min(curY, targetY) - 90;
    await ballCtrl.start({
      x: [curX, (curX + targetX) / 2, targetX],
      y: [curY, apexY, targetY],
      rotate: [0, 160, 340],
      scale: [1, 0.95, 0.55],
      opacity: [1, 1, 0],
      transition: { duration: 0.62, ease: ["easeOut", "easeIn"], times: [0, 0.45, 1] },
    });
    setWobble(true); playLand();
    setTimeout(() => setWobble(false), 520);
    addLetgo();
    setLine(LETGO_LINES[Math.floor(Math.random() * LETGO_LINES.length)]);
    setTimeout(() => { setStage("done"); playBowl(); }, 350);
    fetch("/api/letgo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ anonId }) }).then((r) => r.json()).then(setGlobal).catch(() => null);
  };

  const reset = () => { setText(""); setStage("write"); x.set(0); y.set(0); ballCtrl.set({ x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 }); };

  return (
    <div className="flex h-full flex-col">
      <header className="px-5 pt-[calc(14px+var(--sat))] pb-2 text-center">
        <h1 className="font-serif text-[22px] font-semibold tracking-[0.12em]">放下</h1>
        <p className="mt-0.5 text-xs text-ink-3">写下来，揉成团，丢进去。</p>
      </header>

      <div ref={stageRef} className="relative mx-auto flex w-full max-w-md flex-1 flex-col items-center overflow-hidden px-5">
        <AnimatePresence mode="wait">
          {stage === "write" && (
            <motion.div key="write" initial={{ opacity: 0, y: 10 }} animate={crumpling ? { scale: [1, 0.9, 0.3], rotate: [0, -6, 14], opacity: [1, 1, 0], borderRadius: ["12px", "20px", "50%"] } : { opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: crumpling ? 0.7 : 0.3, ease: "easeInOut" }} className="paper-texture mt-4 w-full rounded-xl border border-indigo-ink/10 bg-[#fffdf8] p-5 shadow-[0_12px_30px_-14px_rgba(43,42,40,0.35)]">
              <textarea
                value={text} onChange={(e) => setText(e.target.value.slice(0, 140))} rows={5} placeholder={`比如：${PLACEHOLDERS[ph]}`}
                className="w-full resize-none bg-transparent font-serif text-[17px] leading-[28px] text-ink outline-none placeholder:text-ink-4"
              />
              <div className="mt-1 flex items-center justify-between text-[11px] text-ink-4"><span>只有你看得见</span><span>{text.length}/140</span></div>
            </motion.div>
          )}
        </AnimatePresence>

        {stage === "write" && (
          <motion.button initial={{ opacity: 0 }} animate={{ opacity: crumpling ? 0 : 1 }} onClick={crumple} className="ink-btn mt-5 rounded-full px-7 py-3 text-[15px] font-medium shadow-soft">
            {text.trim() ? "揉成一团" : "先帮我写一个"}
          </motion.button>
        )}

        {(stage === "ball" || stage === "flying") && (
          <div className="relative flex w-full flex-1 flex-col items-center">
            <p className="mt-3 h-5 text-sm text-ink-3">{hint ?? (stage === "ball" ? "拖起来，往纸篓里扔" : "")}</p>
            <div className="relative flex w-full flex-1 items-start justify-center pt-6">
              <motion.div
                ref={ballRef}
                drag={stage === "ball"} dragMomentum={false} dragElastic={0.2} style={{ x, y, touchAction: "none" }} animate={ballCtrl}
                whileDrag={{ scale: 1.08, cursor: "grabbing" }} onDragEnd={onDragEnd} initial={{ scale: 0.4, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 18 }}
                className="z-10 cursor-grab select-none" aria-label="纸团">
                <motion.div animate={stage === "ball" ? { rotate: [0, -3, 3, 0] } : {}} transition={{ repeat: Infinity, duration: 2.4 }}>
                  <PaperBall />
                </motion.div>
              </motion.div>
            </div>
          </div>
        )}

        {stage === "done" && (
          <motion.div key="done" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mt-6 flex w-full flex-col items-center text-center">
            <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 220, damping: 16 }} className="grid h-16 w-16 place-items-center rounded-full bg-cinnabar-soft text-cinnabar"><Flame size={26} /></motion.div>
            <p className="mt-5 max-w-[280px] font-serif text-[19px] leading-relaxed">{line}</p>
            <p className="mt-4 text-xs text-ink-3">
              今天你已经放下 {letgo.today} 件{global ? ` · 全世界今天放下了 ${global.today + (global.today === 0 ? 1 : 0)} 件，一共 ${global.total.toLocaleString()} 件` : ""}
            </p>
            <div className="mt-6 flex gap-2.5">
              <button onClick={reset} className="press flex items-center gap-1.5 rounded-full border border-ink/15 bg-white/70 px-4 py-2.5 text-sm"><RotateCcw size={15} /> 再写一张</button>
              <button onClick={() => bringToChat("我刚刚把一件事揉成团扔掉了。扔完心里还是有点空，你陪我说两句吧。")} className="ink-btn flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm"><MessageCircle size={15} /> 找算了聊聊</button>
            </div>
          </motion.div>
        )}

        {/* 纸篓：常驻底部 */}
        <div ref={binRef} className={`mb-[calc(8px+var(--sab))] mt-auto transition-opacity ${stage === "write" ? "opacity-50" : "opacity-100"}`}>
          <Bin wobble={wobble} lit={stage === "done"} />
        </div>
      </div>
      {stage === "write" && letgo.total > 0 && (
        <p className="pb-2 text-center text-[11px] text-ink-4" onClick={() => toast(`一共放下过 ${letgo.total} 件`)}>你已经放下过 {letgo.total} 件事</p>
      )}
    </div>
  );
}
