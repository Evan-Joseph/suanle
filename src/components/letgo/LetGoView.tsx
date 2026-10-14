"use client";

import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from "react";
import { useApp, useUI, dayKey } from "@/lib/store";
import { LETGO_LINES } from "@/lib/mock";
import { haptic, playBowl, playCrumple, playLand, playWhoosh } from "@/lib/sound";
import { Icon } from "../ui";
import { bringToChat } from "../chat/engine";

type Stage = "write" | "crumple" | "ball" | "flying" | "done";

const PLACEHOLDERS = [
  "老板那句阴阳怪气的话",
  "那条迟迟没回的消息",
  "体重秤上的数字",
  "三年前说错的一句话",
  "别人家的孩子",
  "还没还完的花呗",
  "凌晨两点的胡思乱想",
];

function PaperBall({ size = 64 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className="drop-shadow-[0_6px_8px_rgba(60,40,10,0.25)]">
      <path d="M32 4 L46 8 L58 20 L60 36 L54 50 L40 60 L24 59 L10 50 L4 34 L8 18 L20 7 Z" fill="#fffdf8" stroke="#d9d2c2" strokeWidth="1.2" />
      <path d="M20 7 L28 24 L46 8 M28 24 L58 20 M28 24 L22 40 L4 34 M22 40 L40 44 L60 36 M40 44 L40 60 M22 40 L24 59 M40 44 L54 50 M28 24 L40 44" fill="none" stroke="#e1d9c7" strokeWidth="1.1" />
      <path d="M14 28 Q22 30 26 36 M36 14 Q40 22 48 26" fill="none" stroke="rgba(196,85,58,0.25)" strokeWidth="1" />
    </svg>
  );
}

function Bin({ wobble }: { wobble: boolean }) {
  return (
    <svg viewBox="0 0 120 120" width={112} height={112} className={wobble ? "anim-wobble" : ""} style={{ transformOrigin: "50% 100%" }}>
      <ellipse cx="60" cy="112" rx="40" ry="5" fill="rgba(0,0,0,0.07)" />
      <path d="M18 26 L28 108 Q60 116 92 108 L102 26 Z" fill="#efe9dc" stroke="#2b2b2b" strokeWidth="2.2" strokeLinejoin="round" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <path key={i} d={`M${30 + i * 10} 30 L${36 + i * 8} 108`} stroke="#2b2b2b" strokeOpacity="0.18" strokeWidth="1.4" />
      ))}
      {[48, 70, 92].map((y) => (
        <path key={y} d={`M${20 + y * 0.09} ${y} Q60 ${y + 6} ${100 - y * 0.09} ${y}`} fill="none" stroke="#2b2b2b" strokeOpacity="0.14" strokeWidth="1.4" />
      ))}
      <ellipse cx="60" cy="26" rx="42" ry="9" fill="#e2dccd" stroke="#2b2b2b" strokeWidth="2.2" />
      <ellipse cx="60" cy="27" rx="34" ry="5.5" fill="#cfc7b4" />
    </svg>
  );
}

export default function LetGoView() {
  const draft = useUI((s) => s.letgoDraft);
  const [text, setText] = useState(draft);
  const [stage, setStage] = useState<Stage>("write");
  const [ph, setPh] = useState(0);
  const [missed, setMissed] = useState(false);
  const [wobble, setWobble] = useState(false);
  const [line, setLine] = useState(LETGO_LINES[0]);
  const [global, setGlobal] = useState<{ today: number; total: number } | null>(null);
  const letgo = useApp((s) => s.letgo);
  const anonId = useApp((s) => s.anonId);
  const todayCount = letgo.day === dayKey() ? letgo.today : 0;

  const stageRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ pts: { x: number; y: number; t: number }[]; sx: number; sy: number; dx: number; dy: number } | null>(null);
  const offset = useRef({ dx: 0, dy: 0 });
  const [stageH, setStageH] = useState(600);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setStageH(el.clientHeight));
    ro.observe(el);
    setStageH(el.clientHeight);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (draft) useUI.getState().setLetgoDraft("");
  }, [draft]);

  useEffect(() => {
    const t = setInterval(() => setPh((p) => (p + 1) % PLACEHOLDERS.length), 2800);
    fetch("/api/letgo")
      .then((r) => r.json())
      .then((j: { today: number; total: number }) => setGlobal(j))
      .catch(() => setGlobal(null));
    return () => clearInterval(t);
  }, []);

  const geometry = () => {
    const el = stageRef.current;
    const w = el?.clientWidth ?? 360;
    const h = el?.clientHeight || stageH;
    const baseX = w / 2;
    const baseY = Math.max(360, h - 150);
    const binX = w / 2;
    const binY = 100; // 纸篓口
    return { w, h, baseX, baseY, binX, binY };
  };

  const crumple = () => {
    if (!text.trim() && stage === "write") {
      setText(PLACEHOLDERS[ph]);
    }
    haptic(20);
    playCrumple();
    setStage("crumple");
    setTimeout(() => {
      setStage("ball");
      offset.current = { dx: 0, dy: 0 };
    }, 720);
  };

  const finish = async () => {
    setStage("done");
    setWobble(true);
    setTimeout(() => setWobble(false), 700);
    playLand();
    setTimeout(playBowl, 380);
    haptic(30);
    setLine(LETGO_LINES[Math.floor(Math.random() * LETGO_LINES.length)]);
    setText("");
    useApp.getState().addLetgo();
    try {
      const r = await fetch("/api/letgo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ anonId }) });
      if (r.ok) setGlobal(await r.json());
    } catch {
      /* 网络不好也算了 */
    }
  };

  const throwBall = (vx: number, vy: number, auto: boolean) => {
    const el = ballRef.current;
    if (!el) return;
    const g = geometry();
    const p0 = { x: offset.current.dx, y: offset.current.dy };
    const startX = g.baseX + p0.x;
    const startY = g.baseY + p0.y;
    const dyToBin = startY - g.binY;
    const xAtBin = auto ? g.binX : startX + (vx / Math.max(0.05, -vy)) * dyToBin;
    const hit = Math.abs(xAtBin - g.binX) < 62;
    setStage("flying");
    setMissed(false);
    playWhoosh();
    const frames: Keyframe[] = [];
    const N = 28;
    if (hit) {
      const T = { x: g.binX - g.baseX, y: g.binY - g.baseY - 6 };
      const C = { x: (p0.x + T.x) / 2, y: Math.min(p0.y, T.y) - 120 };
      for (let i = 0; i <= N; i++) {
        const t = i / N;
        const x = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * C.x + t * t * T.x;
        const y = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * C.y + t * t * T.y;
        frames.push({ transform: `translate(${x}px, ${y}px) rotate(${t * 620}deg) scale(${1 - t * 0.45})`, opacity: 1, offset: t * 0.86 });
      }
      frames.push({ transform: `translate(${T.x}px, ${T.y + 34}px) rotate(680deg) scale(0.45)`, opacity: 0, offset: 1 });
      const anim = el.animate(frames, { duration: 900, easing: "cubic-bezier(.3,.1,.5,1)", fill: "forwards" });
      anim.onfinish = () => void finish();
    } else {
      const clampX = Math.max(-g.w / 2 + 20, Math.min(g.w / 2 - 20, xAtBin - g.baseX));
      const M = { x: clampX, y: g.binY - g.baseY + 10 };
      const C = { x: (p0.x + M.x) / 2, y: Math.min(p0.y, M.y) - 90 };
      for (let i = 0; i <= N; i++) {
        const t = i / N;
        const x = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * C.x + t * t * M.x;
        const y = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * C.y + t * t * M.y;
        frames.push({ transform: `translate(${x}px, ${y}px) rotate(${t * 400}deg)`, offset: t * 0.55 });
      }
      frames.push({ transform: `translate(${M.x + Math.sign(M.x || 1) * 50}px, ${g.h - g.baseY + 80}px) rotate(760deg)`, offset: 1 });
      const anim = el.animate(frames, { duration: 1150, easing: "linear", fill: "forwards" });
      anim.onfinish = () => {
        anim.cancel();
        offset.current = { dx: 0, dy: 0 };
        setMissed(true);
        setStage("ball");
      };
    }
  };

  const onDown = (e: RPointerEvent) => {
    if (stage !== "ball") return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    drag.current = { pts: [{ x: e.clientX, y: e.clientY, t: performance.now() }], sx: e.clientX, sy: e.clientY, dx: offset.current.dx, dy: offset.current.dy };
  };
  const onMove = (e: RPointerEvent) => {
    const d = drag.current;
    if (!d || !ballRef.current) return;
    d.pts.push({ x: e.clientX, y: e.clientY, t: performance.now() });
    if (d.pts.length > 8) d.pts.shift();
    const dx = d.dx + (e.clientX - d.sx);
    const dy = Math.max(-260, Math.min(40, d.dy + (e.clientY - d.sy)));
    offset.current = { dx, dy };
    ballRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
  };
  const onUp = (e: RPointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    const now = performance.now();
    const recent = d.pts.filter((p) => now - p.t < 120);
    const first = recent[0] ?? d.pts[0];
    const dt = Math.max(1, now - first.t);
    const vx = (e.clientX - first.x) / dt;
    const vy = (e.clientY - first.y) / dt;
    const moved = Math.hypot(e.clientX - d.sx, e.clientY - d.sy);
    if (moved < 8) return throwBall(0, -1, true); // 轻点：帮你投
    if (vy < -0.35) return throwBall(vx, vy, false);
    // 力气不够，弹回原位
    offset.current = { dx: 0, dy: 0 };
    ballRef.current?.animate([{ transform: ballRef.current.style.transform }, { transform: "translate(0px, 0px)" }], { duration: 260, easing: "ease-out" });
    if (ballRef.current) ballRef.current.style.transform = "translate(0px, 0px)";
  };

  const g = { baseY: Math.max(360, stageH - 150) };

  return (
    <div ref={stageRef} className="relative h-full overflow-hidden select-none">
      <div className="pt-safe absolute inset-x-0 top-0 z-10 px-5 pt-4 text-center">
        <div className="text-[12px] tracking-[0.25em] text-mute">
          今天你已经算了 <b className="font-song text-[15px] text-ink">{todayCount}</b> 件事
        </div>
      </div>

      <div className="pointer-events-none absolute left-1/2 top-[64px] z-[7] -translate-x-1/2">
        <Bin wobble={wobble} />
      </div>

      {stage === "write" || stage === "crumple" ? (
        <div className="absolute inset-x-0 bottom-0 top-[190px] flex flex-col px-6 pb-5">
          <div
            className={`lined-paper relative mx-auto w-full max-w-[340px] flex-1 rounded-[6px] border border-[#ece4d3] p-5 shadow-[0_10px_30px_rgba(60,40,10,0.10)] transition-all ease-in ${
              stage === "crumple" ? "duration-700" : "duration-300"
            }`}
            style={
              stage === "crumple"
                ? { transform: "translateY(42%) scale(0.18) rotate(420deg)", borderRadius: "50%", opacity: 0.9, maxHeight: 280 }
                : { transform: "rotate(-1.2deg)", maxHeight: 280 }
            }
          >
            <div className="absolute left-4 top-0 h-full w-px bg-seal/20" />
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 200))}
              placeholder={`写下那件放不下的事……\n比如：${PLACEHOLDERS[ph]}`}
              className="h-full w-full resize-none bg-transparent pl-2 font-song text-[17px] leading-8 text-ink outline-none placeholder:text-mute/80"
            />
          </div>
          <p className="mt-3 text-center text-[11.5px] text-mute">写下的字不会被保存。揉掉，就没了。</p>
          <button
            onClick={crumple}
            disabled={stage === "crumple"}
            className="mx-auto mt-3 w-full max-w-[340px] rounded-2xl bg-ink py-4 text-[16px] tracking-[0.3em] text-paper shadow-lg transition active:scale-[0.98]"
          >
            揉掉它
          </button>
        </div>
      ) : null}

      {(stage === "ball" || stage === "flying") && (
        <>
          <div className="anim-fade-in absolute inset-x-0 text-center" style={{ top: g.baseY - 150 }}>
            <div className="font-song text-[15px] text-ink-2">{missed ? "偏了一点。再来，或者……" : "往上一甩，丢进纸篓"}</div>
            <div className="mt-1 text-[11.5px] text-mute">{missed ? "" : "（轻点一下，我帮你丢）"}</div>
            {missed && stage === "ball" && (
              <button onClick={() => void finish()} className="mt-2 rounded-full border border-line bg-white/80 px-4 py-1.5 text-[13px] text-ink-2 active:scale-95">
                没进也算了
              </button>
            )}
          </div>
          <div
            ref={ballRef}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            className="absolute z-[6] touch-none cursor-grab anim-fade-in"
            style={{ left: "calc(50% - 36px)", top: g.baseY - 36, width: 72, height: 72 }}
          >
            <PaperBall size={72} />
          </div>
          {stage === "ball" && !missed && (
            <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 animate-bounce text-mute" style={{ top: g.baseY - 80 }}>
              <Icon name="send" size={20} />
            </div>
          )}
        </>
      )}

      {stage === "done" && (
        <div className="absolute inset-x-0 bottom-0 top-[190px] flex flex-col items-center px-8 pb-6 text-center">
          <div className="anim-fade-up mt-6 font-song text-[56px] font-bold tracking-[0.2em]">算了。</div>
          <p className="anim-fade-up mt-3 max-w-[300px] font-song text-[16px] leading-relaxed text-ink-2" style={{ animationDelay: "0.2s" }}>
            {line}
          </p>
          {global && global.today > 0 && (
            <p className="anim-fade-up mt-5 text-[12px] text-mute" style={{ animationDelay: "0.4s" }}>
              过去 24 小时，有 {global.today.toLocaleString()} 件事在这里被算了。你不是一个人。
            </p>
          )}
          <div className="mt-auto flex w-full max-w-[340px] flex-col gap-2">
            <button onClick={() => setStage("write")} className="w-full rounded-2xl bg-ink py-3.5 text-[15px] text-paper active:scale-[0.98]">
              再丢一件
            </button>
            <button onClick={() => bringToChat("刚刚丢掉了一件烦心事，想跟你说说。", { fresh: false })} className="w-full py-2.5 text-[13.5px] text-mute">
              还是想聊聊
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
