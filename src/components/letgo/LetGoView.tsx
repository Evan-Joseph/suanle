"use client";

import { AnimatePresence, motion, useAnimationControls } from "motion/react";
import { useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from "react";
import { todayLetgo, useApp, useUI } from "@/lib/store";
import { LETGO_LINES } from "@/lib/mock";
import { haptic, playBowl, playCrumple, playRim, playThud, playWhoosh } from "@/lib/sound";
import { Logo } from "../brand/Logo";
import { GhostButton, PrimaryButton } from "../ui";
import { bringToChat } from "../chat/engine";
import { computeGeo, createWorld, idealVelocity, insideBin, type Geo, type World } from "./physics";

type Stage = "write" | "crumple" | "aim" | "flying" | "landed" | "done";

const EXAMPLES = ["老板那句阴阳怪气的话", "那条迟迟没回的消息", "体重秤上的数字", "三年前说错的一句话", "别人家的孩子", "还没还完的花呗", "凌晨两点的胡思乱想", "没抢到的那张票"];

function PaperBall({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden className="drop-shadow-[0_6px_6px_rgba(60,40,10,0.22)]">
      <path d="M32 3 L47 8 L59 20 L61 36 L54 51 L40 61 L23 60 L9 50 L3 33 L8 17 L20 6 Z" fill="#fffdf8" stroke="#d8d0bf" strokeWidth="1.2" />
      <path d="M20 6 L28 24 L47 8 M28 24 L59 20 M28 24 L21 40 L3 33 M21 40 L40 44 L61 36 M40 44 L40 61 M21 40 L23 60 M40 44 L54 51 M28 24 L40 44" fill="none" stroke="#e3dbc9" strokeWidth="1.1" />
      <path d="M13 27 Q21 29 25 35 M36 13 Q40 21 48 25" fill="none" stroke="rgba(196,85,58,0.28)" strokeWidth="1" />
    </svg>
  );
}

/** 网格纸篓：分成后壁与前脸两层，纸团落进去时夹在中间 */
function BinLayer({ g, part }: { g: Geo; part: "back" | "front" }) {
  const pad = 8;
  const W = g.tw + pad * 2;
  const H = g.bh + pad * 2;
  const cx = W / 2;
  const top = pad;
  const bot = pad + g.bh;
  const tl = cx - g.tw / 2;
  const tr = cx + g.tw / 2;
  const bl = cx - g.bw / 2;
  const br = cx + g.bw / 2;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="absolute" style={{ left: g.binX - W / 2, top: g.binTop - pad }} aria-hidden>
      {part === "back" ? (
        <>
          <path d={`M${tl} ${top} L${bl} ${bot} Q${cx} ${bot + 5} ${br} ${bot} L${tr} ${top} Z`} fill="var(--paper-2)" />
          <ellipse cx={cx} cy={top} rx={g.tw / 2} ry={7} fill="var(--line)" />
        </>
      ) : (
        <>
          <path d={`M${tl} ${top} L${bl} ${bot} Q${cx} ${bot + 5} ${br} ${bot} L${tr} ${top}`} fill="color-mix(in srgb, var(--paper-2) 55%, transparent)" stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round" />
          {Array.from({ length: 7 }, (_, i) => {
            const f = (i + 1) / 8;
            return <path key={i} d={`M${tl + (tr - tl) * f} ${top + 3} L${bl + (br - bl) * f} ${bot}`} stroke="var(--ink)" strokeOpacity="0.16" strokeWidth="1.3" />;
          })}
          {[0.33, 0.66].map((f) => {
            const y = top + g.bh * f;
            const x1 = tl + (bl - tl) * f;
            const x2 = tr + (br - tr) * f;
            return <path key={f} d={`M${x1} ${y} Q${cx} ${y + 5} ${x2} ${y}`} fill="none" stroke="var(--ink)" strokeOpacity="0.14" strokeWidth="1.3" />;
          })}
          <path d={`M${tl} ${top} A ${g.tw / 2} 7 0 0 0 ${tr} ${top}`} fill="none" stroke="var(--ink)" strokeWidth="2.2" />
          <path d={`M${tl} ${top} A ${g.tw / 2} 7 0 0 1 ${tr} ${top}`} fill="none" stroke="var(--ink)" strokeOpacity="0.35" strokeWidth="1.6" />
        </>
      )}
    </svg>
  );
}

export default function LetGoView() {
  const draft = useUI((s) => s.letgoDraft);
  const [text, setText] = useState(draft);
  const [stage, setStage] = useState<Stage>("write");
  const [missed, setMissed] = useState(false);
  const [line, setLine] = useState(LETGO_LINES[0]);
  const [ex, setEx] = useState(0);
  const [global, setGlobal] = useState<{ today: number; total: number } | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [bits, setBits] = useState(0);
  const today = useApp((s) => todayLetgo(s));
  const anonId = useApp((s) => s.anonId);

  const stageRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLDivElement>(null);
  const dispRef = useRef<SVGFEDisplacementMapElement>(null);
  const worldRef = useRef<World | null>(null);
  const rafRef = useRef(0);
  const drag = useRef<{ pts: { x: number; y: number; t: number }[]; sx: number; sy: number; ox: number; oy: number } | null>(null);
  const offset = useRef({ x: 0, y: 0 });
  const cardCtl = useAnimationControls();
  const binCtl = useAnimationControls();

  const g = useMemo(() => computeGeo(size.w || 360, size.h || 560), [size]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (draft) useUI.getState().setLetgoDraft("");
  }, [draft]);

  useEffect(() => {
    const t = setInterval(() => setEx((p) => (p + 1) % EXAMPLES.length), 2800);
    fetch("/api/letgo")
      .then((r) => r.json())
      .then((j: { today: number; total: number }) => setGlobal(j))
      .catch(() => setGlobal(null));
    return () => {
      clearInterval(t);
      cancelAnimationFrame(rafRef.current);
      worldRef.current?.destroy();
    };
  }, []);

  const placeBall = (x: number, y: number, angle = 0) => {
    const el = ballRef.current;
    if (el) el.style.transform = `translate3d(${x - g.R}px, ${y - g.R}px, 0) rotate(${angle}rad)`;
  };

  useEffect(() => {
    if (stage === "aim") placeBall(g.x0 + offset.current.x, g.y0 + offset.current.y);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, g]);

  /* ───── 揉 ───── */
  const crumple = () => {
    if (stage !== "write") return;
    (document.activeElement as HTMLElement | null)?.blur?.();
    haptic([12, 30, 12, 30, 18]);
    playCrumple();
    setStage("crumple");
    const stageEl = stageRef.current;
    const card = cardRef.current;
    let dx = 0;
    let dy = 120;
    if (stageEl && card) {
      const sr = stageEl.getBoundingClientRect();
      const cr = card.getBoundingClientRect();
      dx = g.x0 - (cr.left - sr.left + cr.width / 2);
      dy = g.y0 - (cr.top - sr.top + cr.height / 2);
    }
    const t0 = performance.now();
    const wrinkle = (now: number) => {
      const p = Math.min(1, (now - t0) / 700);
      dispRef.current?.setAttribute("scale", String(Math.round(p * 46)));
      if (p < 1) requestAnimationFrame(wrinkle);
    };
    requestAnimationFrame(wrinkle);
    void cardCtl
      .start({ x: dx, y: dy, scale: 0.15, rotate: 300, borderRadius: 400, transition: { duration: 0.78, ease: [0.55, 0, 0.75, 0.2] } })
      .then(() => {
        offset.current = { x: 0, y: 0 };
        setMissed(false);
        setStage("aim");
      });
  };

  /* ───── 丢 ───── */
  const finish = async () => {
    setStage("done");
    setLine(LETGO_LINES[Math.floor(Math.random() * LETGO_LINES.length)]);
    setText("");
    useApp.getState().addLetgo();
    try {
      const r = await fetch("/api/letgo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ anonId }) });
      if (r.ok) setGlobal((await r.json()) as { today: number; total: number });
    } catch {
      /* 网络不好，也算了 */
    }
  };

  const land = () => {
    setStage("landed");
    playThud();
    haptic([20, 40, 30]);
    setTimeout(playBowl, 260);
    setBits((b) => b + 1);
    void binCtl.start({ rotate: [0, -5, 4, -2, 1, 0], transition: { duration: 0.7, ease: "easeOut" } });
    setTimeout(() => void finish(), 900);
  };

  const miss = () => {
    setMissed(true);
    offset.current = { x: 0, y: 0 };
    setStage("aim");
  };

  const throwBall = async (v: { x: number; y: number }) => {
    const M = (await import("matter-js")).default;
    worldRef.current?.destroy();
    const start = { x: g.x0 + offset.current.x, y: g.y0 + offset.current.y };
    let lastRim = 0;
    const world = createWorld(M, g, start, v, (label, speed) => {
      const now = performance.now();
      if (label === "rim" && now - lastRim > 90) {
        lastRim = now;
        playRim(Math.min(1, speed / 7));
        haptic(8);
      }
    });
    worldRef.current = world;
    setStage("flying");
    setMissed(false);
    playWhoosh();
    let insideFor = 0;
    let stillFor = 0;
    let steps = 0;
    let acc = 0;
    let last = performance.now();
    const loop = (now: number) => {
      acc += Math.min(64, now - last);
      last = now;
      let result: "in" | "out" | null = null;
      while (acc >= 1000 / 60 && !result) {
        world.step();
        acc -= 1000 / 60;
        steps++;
        const { x, y } = world.ball.position;
        const sp = world.ball.speed;
        if (insideBin(g, x, y)) {
          insideFor++;
          if ((sp < 1.4 && insideFor > 6) || insideFor > 50) result = "in";
        } else insideFor = 0;
        stillFor = sp < 0.2 ? stillFor + 1 : 0;
        if (!result && (y > g.h + 120 || stillFor > 36 || steps > 480)) result = "out";
      }
      placeBall(world.ball.position.x, world.ball.position.y, world.ball.angle);
      if (result) {
        cancelAnimationFrame(rafRef.current);
        if (result === "in") land();
        else miss();
        world.destroy();
        worldRef.current = null;
        return;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  };

  const onDown = (e: RPointerEvent<HTMLDivElement>) => {
    if (stage !== "aim") return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { pts: [{ x: e.clientX, y: e.clientY, t: performance.now() }], sx: e.clientX, sy: e.clientY, ox: offset.current.x, oy: offset.current.y };
  };
  const onMove = (e: RPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    d.pts.push({ x: e.clientX, y: e.clientY, t: performance.now() });
    if (d.pts.length > 10) d.pts.shift();
    let x = d.ox + (e.clientX - d.sx);
    let y = d.oy + (e.clientY - d.sy);
    const r = Math.hypot(x, y);
    const max = 110;
    if (r > max) {
      // 越拉越紧的阻尼
      const k = (max + (r - max) * 0.25) / r;
      x *= k;
      y *= k;
    }
    offset.current = { x, y };
    placeBall(g.x0 + x, g.y0 + y);
  };
  const onUp = (e: RPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    drag.current = null;
    if (!d || stage !== "aim") return;
    const now = performance.now();
    const recent = d.pts.filter((p) => now - p.t < 90);
    const first = recent[0] ?? d.pts[0];
    const dt = Math.max(8, now - first.t);
    const pvx = (e.clientX - first.x) / dt;
    const pvy = (e.clientY - first.y) / dt;
    const moved = Math.hypot(e.clientX - d.sx, e.clientY - d.sy);
    const start = { x: g.x0 + offset.current.x, y: g.y0 + offset.current.y };
    if (moved < 8) {
      void throwBall(idealVelocity(g, start));
      return;
    }
    const speed = Math.hypot(pvx, pvy);
    if (speed < 0.28) {
      // 力气不够：弹性回弹到原位
      const from = { ...offset.current };
      const t0 = performance.now();
      const back = (t: number) => {
        const p = Math.min(1, (t - t0) / 420);
        const k = 1 - Math.pow(1 - p, 3) * Math.cos(p * 5);
        offset.current = { x: from.x * (1 - k), y: from.y * (1 - k) };
        placeBall(g.x0 + offset.current.x, g.y0 + offset.current.y);
        if (p < 1) requestAnimationFrame(back);
      };
      requestAnimationFrame(back);
      return;
    }
    let v = { x: Math.max(-16, Math.min(16, pvx * 16.67 * 0.34)), y: Math.max(-22, Math.min(6, pvy * 16.67 * 0.34)) };
    if (v.x > 0.4 && v.y < -0.4) {
      // 方向对了就轻轻扶一把：手感是自己的，结果更温柔
      const ideal = idealVelocity(g, start, Math.min(75, Math.max(38, (Math.atan2(-v.y, v.x) * 180) / Math.PI)));
      v = { x: v.x + (ideal.x - v.x) * 0.5, y: v.y + (ideal.y - v.y) * 0.5 };
    }
    void throwBall(v);
  };

  const again = () => {
    // 纸张会重新挂载并回到初始姿态，这里只需复位褶皱滤镜
    dispRef.current?.setAttribute("scale", "0");
    setMissed(false);
    setStage("write");
  };

  const showBall = stage === "aim" || stage === "flying";
  const showBin = stage !== "write" && stage !== "done";

  return (
    <div className="flex h-full flex-col">
      <header className="pt-safe shrink-0">
        <div className="flex items-end justify-between px-5 pb-1 pt-5">
          <div>
            <h1 className="font-song text-[26px] font-bold tracking-wide text-ink">算了</h1>
            <p className="mt-1 text-[13px] text-mute">写下来，揉成团，丢进纸篓。</p>
          </div>
          <div className="pb-0.5 text-right text-[12px] leading-snug text-mute">
            今天算了
            <b className="mx-1 font-song text-[18px] text-ink">{today}</b>件
          </div>
        </div>
      </header>

      <div ref={stageRef} className="relative min-h-0 flex-1 select-none overflow-hidden">
        <svg width="0" height="0" className="absolute" aria-hidden>
          <filter id="crumple-filter">
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" />
            <feDisplacementMap ref={dispRef} in="SourceGraphic" scale="0" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>

        {(stage === "write" || stage === "crumple") && (
          <div className="absolute inset-0 flex flex-col px-6 pb-5 pt-3">
            <motion.div
              ref={cardRef}
              animate={cardCtl}
              initial={{ rotate: -1.2, borderRadius: 8 }}
              className="lined-paper relative mx-auto w-full max-w-[340px] flex-1 overflow-hidden border border-line p-5 shadow-[0_12px_32px_rgba(60,40,10,0.10)]"
              style={{ maxHeight: 300, minHeight: 180, filter: stage === "crumple" ? "url(#crumple-filter)" : undefined }}
            >
              <div className="absolute inset-y-0 left-4 w-px bg-seal/25" />
              <textarea
                value={text}
                disabled={stage !== "write"}
                onChange={(e) => setText(e.target.value.slice(0, 200))}
                placeholder={`写下那件放不下的事……\n比如：${EXAMPLES[ex]}`}
                className="h-full w-full resize-none bg-transparent pl-2 font-song text-[17px] leading-8 text-ink outline-none placeholder:text-mute/80 disabled:opacity-60"
              />
            </motion.div>
            <p className="mt-3 text-center text-[11.5px] text-mute">写下的字只留在这一刻。揉掉，就没了。</p>
            <PrimaryButton onClick={crumple} disabled={stage !== "write"} className="mx-auto mt-3 max-w-[340px] tracking-[0.3em]">
              揉掉它
            </PrimaryButton>
          </div>
        )}

        {showBin && (
          <>
            <div className="absolute inset-x-0 border-t border-dashed border-line" style={{ top: g.floorY }} />
            <motion.div animate={binCtl} className="absolute inset-0" style={{ transformOrigin: `${g.binX}px ${g.floorY}px` }}>
              <BinLayer g={g} part="back" />
            </motion.div>
          </>
        )}

        {showBall && (
          <div
            ref={ballRef}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            className="absolute left-0 top-0 z-[2] cursor-grab touch-none active:cursor-grabbing"
            style={{ width: g.R * 2, height: g.R * 2, transform: `translate3d(${g.x0 - g.R}px, ${g.y0 - g.R}px, 0)` }}
          >
            <PaperBall size={g.R * 2} />
          </div>
        )}

        {showBin && (
          <motion.div animate={binCtl} className="pointer-events-none absolute inset-0 z-[3]" style={{ transformOrigin: `${g.binX}px ${g.floorY}px` }}>
            <BinLayer g={g} part="front" />
          </motion.div>
        )}

        <AnimatePresence>
          {stage === "landed" &&
            Array.from({ length: 7 }, (_, i) => (
              <motion.span
                key={`${bits}-${i}`}
                className="pointer-events-none absolute z-[4] h-2 w-2.5 rounded-[2px] border border-line bg-card"
                style={{ left: g.binX - 5, top: g.binTop - 2 }}
                initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
                animate={{ x: (i - 3) * 14 + ((i * 37) % 9), y: -50 - ((i * 53) % 40), opacity: 0, rotate: (i - 3) * 60 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            ))}
        </AnimatePresence>

        {stage === "aim" && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="absolute inset-x-0 z-[5] px-6 text-center" style={{ top: Math.max(12, g.y0 - 150) }}>
            <div className="font-song text-[16px] text-ink-2">{missed ? "偏了一点。再来，或者——" : "往纸篓那边一甩"}</div>
            <div className="mt-1 text-[12px] text-mute">{missed ? "" : "轻点纸团，我帮你丢"}</div>
            {missed && (
              <button type="button" onClick={() => void finish()} className="mt-3 h-9 rounded-full border border-line bg-card/80 px-4 text-[13px] text-ink-2 transition active:scale-95">
                没进也算了
              </button>
            )}
          </motion.div>
        )}

        <AnimatePresence>
          {stage === "done" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="absolute inset-0 z-10 flex flex-col items-center justify-center px-8 text-center">
              <div className="text-ink">
                <Logo size={92} mood="smile" />
              </div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-6 pl-[0.2em] font-song text-[52px] font-bold tracking-[0.2em] text-ink">
                算了。
              </motion.div>
              <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mt-3 max-w-[300px] font-song text-[16px] leading-relaxed text-ink-2">
                {line}
              </motion.p>
              {global && global.today > 0 && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-5 text-[12px] text-mute">
                  过去 24 小时，有 {global.today.toLocaleString()} 件事在这里被算了。你不是一个人。
                </motion.p>
              )}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-10 w-full max-w-[320px] space-y-2">
                <PrimaryButton onClick={again}>再丢一件</PrimaryButton>
                <div className="grid grid-cols-2 gap-2">
                  <GhostButton onClick={() => useUI.getState().open("share", { kicker: "今天，我算了一件事", title: "算了。", body: "写下来，揉成团，丢进纸篓。\n那件事，就留在纸篓里了。", line })} className="border border-line">
                    做成卡片
                  </GhostButton>
                  <GhostButton onClick={() => bringToChat("刚刚丢掉了一件烦心事，想再跟你说说。", { fresh: false })} className="border border-line">
                    还想聊聊
                  </GhostButton>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
