import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Matter from "matter-js";
import { MessageCircle, RotateCcw } from "lucide-react";
import { useApp, useUI, dayKey } from "@/lib/store";
import { LETGO_LINES } from "@/lib/mock";
import { haptic, playBowl, playCrumple, playLand, playWhoosh } from "@/lib/sound";
import { bringToChat } from "@/lib/engine";

const { Engine, Bodies, Body, Composite } = Matter;

type Stage = "write" | "crumple" | "ready" | "flying" | "done";

const PLACEHOLDERS = ["老板那句阴阳怪气的话", "那条迟迟没回的消息", "体重秤上的数字", "三年前说错的一句话", "别人家的孩子", "还没还完的花呗", "凌晨两点的胡思乱想"];

const STEP = 1000 / 60;
const BALL_R = 24;
const COLS = 8;
const ROWS = 10;
const PAD = 22;
const LINE_H = 32;
const FONT = '17px "Noto Serif SC", "Songti SC", serif';

interface Vert { fx: number; fy: number; tx: number; ty: number; u: number; v: number; delay: number; jx: number; jy: number }
interface Crumple { start: number; dur: number; tex: HTMLCanvasElement; verts: Vert[]; shade: number[]; cx: number; cy: number }
interface Bin { cx: number; top: number; bottom: number; topHalf: number; botHalf: number; floorY: number }

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** 把一张纹理三角形映射到画布上的任意三角形（仿射贴图） */
function texTri(ctx: CanvasRenderingContext2D, img: HTMLCanvasElement, p: number[], uv: number[]) {
  let [x0, y0, x1, y1, x2, y2] = p;
  const [u0, v0, u1, v1, u2, v2] = uv;
  const mx = (x0 + x1 + x2) / 3, my = (y0 + y1 + y2) / 3;
  const grow = (x: number, y: number) => {
    const dx = x - mx, dy = y - my, l = Math.hypot(dx, dy) || 1;
    return [x + (dx / l) * 0.7, y + (dy / l) * 0.7];
  };
  [x0, y0] = grow(x0, y0);
  [x1, y1] = grow(x1, y1);
  [x2, y2] = grow(x2, y2);
  const d = u0 * (v1 - v2) + u1 * (v2 - v0) + u2 * (v0 - v1);
  if (!d) return;
  const a = (x0 * (v1 - v2) + x1 * (v2 - v0) + x2 * (v0 - v1)) / d;
  const b = (x0 * (u2 - u1) + x1 * (u0 - u2) + x2 * (u1 - u0)) / d;
  const c = (x0 * (u1 * v2 - u2 * v1) + x1 * (u2 * v0 - u0 * v2) + x2 * (u0 * v1 - u1 * v0)) / d;
  const dd = (y0 * (v1 - v2) + y1 * (v2 - v0) + y2 * (v0 - v1)) / d;
  const e = (y0 * (u2 - u1) + y1 * (u0 - u2) + y2 * (u1 - u0)) / d;
  const f = (y0 * (u1 * v2 - u2 * v1) + y1 * (u2 * v0 - u0 * v2) + y2 * (u0 * v1 - u1 * v0)) / d;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.closePath();
  ctx.clip();
  ctx.transform(a, dd, b, e, c, f);
  ctx.drawImage(img, 0, 0);
  ctx.restore();
}

function paperTexture(w: number, h: number, text: string, dpr: number) {
  const cv = document.createElement("canvas");
  cv.width = Math.round(w * dpr);
  cv.height = Math.round(h * dpr);
  const c = cv.getContext("2d")!;
  c.scale(dpr, dpr);
  c.fillStyle = "#fffdf7";
  c.fillRect(0, 0, w, h);
  c.strokeStyle = "rgba(110,139,166,0.18)";
  c.lineWidth = 1;
  for (let y = PAD + LINE_H; y < h - 10; y += LINE_H) {
    c.beginPath();
    c.moveTo(14, y + 0.5);
    c.lineTo(w - 14, y + 0.5);
    c.stroke();
  }
  c.strokeStyle = "rgba(196,85,58,0.25)";
  c.beginPath();
  c.moveTo(PAD + 6, 0);
  c.lineTo(PAD + 6, h);
  c.stroke();
  c.fillStyle = "#2b2b2b";
  c.font = FONT;
  c.textBaseline = "alphabetic";
  const maxW = w - PAD * 2 - 14;
  let line = "";
  let y = PAD + LINE_H - 9;
  const x = PAD + 14;
  for (const ch of text) {
    if (ch === "\n" || c.measureText(line + ch).width > maxW) {
      c.fillText(line, x, y);
      y += LINE_H;
      line = ch === "\n" ? "" : ch;
      if (y > h - 12) break;
    } else line += ch;
  }
  if (y <= h - 12) c.fillText(line, x, y);
  return cv;
}

function drawMesh(ctx: CanvasRenderingContext2D, cr: Crumple, T: number, ox = 0, oy = 0) {
  const pos = cr.verts.map((v) => {
    const k = ease(clamp01((T - v.delay) / 0.72));
    const wob = Math.sin(Math.PI * k);
    return [v.fx + (v.tx - v.fx) * k + v.jx * wob + ox, v.fy + (v.ty - v.fy) * k + v.jy * wob + oy];
  });
  const W = cr.tex.width, H = cr.tex.height;
  const ge = ease(clamp01(T));
  let s = 0;
  for (let j = 0; j < ROWS - 1; j++) {
    for (let i = 0; i < COLS - 1; i++) {
      const a = j * COLS + i, b = a + 1, c = a + COLS, d = c + 1;
      for (const [p, q, r] of [[a, b, c], [b, d, c]]) {
        const P = [pos[p][0], pos[p][1], pos[q][0], pos[q][1], pos[r][0], pos[r][1]];
        const V = cr.verts;
        texTri(ctx, cr.tex, P, [V[p].u * W, V[p].v * H, V[q].u * W, V[q].v * H, V[r].u * W, V[r].v * H]);
        const sh = cr.shade[s++];
        if (ge > 0.02) {
          ctx.beginPath();
          ctx.moveTo(P[0], P[1]);
          ctx.lineTo(P[2], P[3]);
          ctx.lineTo(P[4], P[5]);
          ctx.closePath();
          ctx.fillStyle = sh > 0.35 ? `rgba(80,62,34,${ge * (0.04 + 0.26 * (sh - 0.35))})` : `rgba(255,255,255,${ge * 0.5 * (0.35 - sh)})`;
          ctx.fill();
        }
      }
    }
  }
}

function drawBin(ctx: CanvasRenderingContext2D, b: Bin, part: "back" | "front", wob: number) {
  ctx.save();
  ctx.translate(b.cx, b.bottom);
  ctx.rotate(wob);
  ctx.translate(-b.cx, -b.bottom);
  const h = b.bottom - b.top;
  if (part === "back") {
    ctx.fillStyle = "rgba(0,0,0,0.07)";
    ctx.beginPath();
    ctx.ellipse(b.cx, b.bottom + 2, b.botHalf + 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#cdc4b0";
    ctx.beginPath();
    ctx.ellipse(b.cx, b.top, b.topHalf, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(b.cx - b.topHalf, b.top);
    ctx.lineTo(b.cx - b.botHalf, b.bottom - 4);
    ctx.quadraticCurveTo(b.cx, b.bottom + 6, b.cx + b.botHalf, b.bottom - 4);
    ctx.lineTo(b.cx + b.topHalf, b.top);
    ctx.ellipse(b.cx, b.top, b.topHalf, 10, 0, 0, Math.PI, false);
    ctx.closePath();
    ctx.fillStyle = "#efe9dc";
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = "rgba(43,43,43,0.13)";
    ctx.lineWidth = 1.3;
    for (let i = -6; i <= 6; i++) {
      ctx.beginPath();
      ctx.moveTo(b.cx + i * (b.topHalf / 6), b.top);
      ctx.lineTo(b.cx + i * (b.botHalf / 6), b.bottom);
      ctx.stroke();
    }
    for (let k = 1; k < 4; k++) {
      const y = b.top + (h * k) / 4;
      ctx.beginPath();
      ctx.ellipse(b.cx, y, b.topHalf - ((b.topHalf - b.botHalf) * k) / 4, 7, 0, 0, Math.PI);
      ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = "#2b2b2b";
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(b.cx - b.topHalf, b.top);
    ctx.lineTo(b.cx - b.botHalf, b.bottom - 4);
    ctx.quadraticCurveTo(b.cx, b.bottom + 6, b.cx + b.botHalf, b.bottom - 4);
    ctx.lineTo(b.cx + b.topHalf, b.top);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(b.cx, b.top, b.topHalf, 10, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

export default function LetGoView() {
  const draft = useUI((s) => s.letgoDraft);
  const letgo = useApp((s) => s.letgo);
  const todayCount = letgo.day === dayKey() ? letgo.today : 0;
  const [text, setText] = useState(draft);
  const [stage, setStage] = useState<Stage>("write");
  const [ph, setPh] = useState(0);
  const [line, setLine] = useState(LETGO_LINES[0]);
  const [missTip, setMissTip] = useState(false);

  const stageEl = useRef<HTMLDivElement>(null);
  const paperEl = useRef<HTMLDivElement>(null);
  const canvasEl = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<Stage>("write");
  const textRef = useRef(text);
  textRef.current = text;

  const W = useRef({
    engine: Engine.create({ gravity: { x: 0, y: 1.5, scale: 0.001 } }),
    statics: [] as Matter.Body[],
    ball: null as Matter.Body | null,
    sprite: null as HTMLCanvasElement | null,
    old: [] as { body: Matter.Body; sprite: HTMLCanvasElement }[],
    hold: null as { x: number; y: number } | null,
    home: { x: 0, y: 0 },
    drag: null as { pts: { x: number; y: number; t: number }[] } | null,
    thrownAt: 0,
    inFrames: 0,
    wobbleAt: -9999,
    crumple: null as Crumple | null,
    bin: { cx: 0, top: 0, bottom: 0, topHalf: 64, botHalf: 50, floorY: 0 } as Bin,
    size: { w: 0, h: 0, dpr: 1 },
    popAt: 0,
  });

  const go = useCallback((s: Stage) => {
    stageRef.current = s;
    setStage(s);
  }, []);

  useEffect(() => {
    if (draft) useUI.getState().setLetgoDraft("");
  }, [draft]);

  useEffect(() => {
    const t = setInterval(() => setPh((p) => (p + 1) % PLACEHOLDERS.length), 2800);
    return () => clearInterval(t);
  }, []);

  /* ── 布局：尺寸变化时重建静态刚体（纸篓、地面、墙） ── */
  useEffect(() => {
    const el = stageEl.current, cv = canvasEl.current;
    if (!el || !cv) return;
    const w = W.current;
    const build = () => {
      const width = el.clientWidth, height = el.clientHeight;
      const dpr = Math.min(2.5, window.devicePixelRatio || 1);
      w.size = { w: width, h: height, dpr };
      cv.width = Math.round(width * dpr);
      cv.height = Math.round(height * dpr);
      cv.style.width = width + "px";
      cv.style.height = height + "px";
      const floorY = height - 8;
      const binH = Math.max(104, Math.min(140, height * 0.22));
      const bin: Bin = { cx: width / 2, top: floorY - binH, bottom: floorY, topHalf: 64, botHalf: 50, floorY };
      w.bin = bin;
      if (w.statics.length) Composite.remove(w.engine.world, w.statics);
      const opt = { isStatic: true, friction: 0.4, restitution: 0.3 };
      const lean = Math.atan((bin.topHalf - bin.botHalf) / binH);
      const wallLen = Math.hypot(binH, bin.topHalf - bin.botHalf);
      w.statics = [
        Bodies.rectangle(width / 2, floorY + 50, width * 3, 100, opt),
        Bodies.rectangle(-50, height / 2, 100, height * 4, opt),
        Bodies.rectangle(width + 50, height / 2, 100, height * 4, opt),
        Bodies.rectangle(width / 2, -height - 50, width * 3, 100, opt),
        Bodies.rectangle(bin.cx - (bin.topHalf + bin.botHalf) / 2, (bin.top + bin.bottom) / 2, 6, wallLen, { ...opt, angle: -lean }),
        Bodies.rectangle(bin.cx + (bin.topHalf + bin.botHalf) / 2, (bin.top + bin.bottom) / 2, 6, wallLen, { ...opt, angle: lean }),
        Bodies.circle(bin.cx - bin.topHalf, bin.top, 4, opt),
        Bodies.circle(bin.cx + bin.topHalf, bin.top, 4, opt),
        Bodies.rectangle(bin.cx, bin.bottom - 3, bin.botHalf * 2, 6, opt),
      ];
      Composite.add(w.engine.world, w.statics);
      const pr = paperEl.current?.getBoundingClientRect();
      const sr = el.getBoundingClientRect();
      if (pr) w.home = { x: width / 2, y: Math.min(pr.top - sr.top + pr.height / 2, bin.top - 90) };
      if (w.hold) w.hold = { ...w.home };
    };
    build();
    const ro = new ResizeObserver(build);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* ── 主循环：固定步长物理 + 绘制 ── */
  useEffect(() => {
    const w = W.current;
    const cv = canvasEl.current!;
    const ctx = cv.getContext("2d")!;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const g = 1.5 * 0.001 * STEP * STEP;

    const success = () => {
      const ball = w.ball!;
      w.old.push({ body: ball, sprite: w.sprite! });
      if (w.old.length > 6) {
        const o = w.old.shift()!;
        Composite.remove(w.engine.world, o.body);
      }
      w.ball = null;
      w.wobbleAt = performance.now();
      playLand();
      setTimeout(playBowl, 360);
      haptic(30);
      setLine(LETGO_LINES[Math.floor(Math.random() * LETGO_LINES.length)]);
      useApp.getState().addLetgo();
      go("done");
    };
    const miss = () => {
      if (w.ball) Composite.remove(w.engine.world, w.ball);
      const b = Bodies.circle(w.home.x, w.home.y, BALL_R, { restitution: 0.42, friction: 0.3, frictionAir: 0, density: 0.0016 });
      Composite.add(w.engine.world, b);
      w.ball = b;
      w.hold = { ...w.home };
      w.popAt = performance.now();
      setMissTip(true);
      go("ready");
    };

    const loop = (t: number) => {
      acc += Math.min(64, t - last);
      last = t;
      while (acc >= STEP) {
        if (w.ball && w.hold) {
          const bob = w.drag ? 0 : Math.sin(t / 520) * 3;
          Body.setPosition(w.ball, { x: w.hold.x, y: w.hold.y + bob });
          Body.setVelocity(w.ball, { x: 0, y: 0 });
          Body.setAngularVelocity(w.ball, 0);
        }
        Matter.Engine.update(w.engine, STEP);
        acc -= STEP;
      }

      const st = stageRef.current;
      const b = w.bin;
      if (st === "flying" && w.ball) {
        const { x, y } = w.ball.position;
        const inside = Math.abs(x - b.cx) < b.topHalf - 6 && y > b.top + 4 && y < b.bottom;
        w.inFrames = inside ? w.inFrames + 1 : 0;
        if (w.inFrames > 6) success();
        else if (t - w.thrownAt > 3400 || (t - w.thrownAt > 700 && !inside && y > b.floorY - BALL_R - 4 && w.ball.speed < 0.6)) miss();
      }

      // ── 绘制 ──
      const { w: cw, h: chh, dpr } = w.size;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cw, chh);
      const since = t - w.wobbleAt;
      const wob = since < 900 ? Math.sin(since / 55) * 0.07 * (1 - since / 900) : 0;

      drawBin(ctx, b, "back", wob);
      const drawBall = (body: Matter.Body, sprite: HTMLCanvasElement, scale = 1) => {
        const s = (sprite.width / dpr) * scale;
        ctx.save();
        ctx.translate(body.position.x, body.position.y);
        ctx.rotate(body.angle);
        ctx.drawImage(sprite, -s / 2, -s / 2, s, s);
        ctx.restore();
      };
      w.old.forEach((o) => drawBall(o.body, o.sprite));
      const cur = w.ball && w.sprite ? w.ball : null;
      const curInside = cur && Math.abs(cur.position.x - b.cx) < b.topHalf && cur.position.y > b.top - BALL_R * 0.2;
      const popK = Math.min(1, (t - w.popAt) / 280);
      const popScale = 0.6 + 0.4 * (1 - Math.pow(1 - popK, 3));
      if (cur && curInside) drawBall(cur, w.sprite!);
      drawBin(ctx, b, "front", wob);
      if (cur && !curInside) {
        if (w.hold) {
          const dist = b.floorY - cur.position.y;
          ctx.fillStyle = `rgba(0,0,0,${Math.max(0.03, 0.12 - dist / 4000)})`;
          ctx.beginPath();
          ctx.ellipse(cur.position.x, b.floorY, BALL_R * 0.9, 4, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        drawBall(cur, w.sprite!, popScale);
      }

      if (w.crumple && st === "crumple") {
        const T = (t - w.crumple.start) / w.crumple.dur;
        drawMesh(ctx, w.crumple, Math.min(1, T));
        if (T >= 1) {
          const cr = w.crumple;
          const size = (BALL_R + 10) * 2;
          const sp = document.createElement("canvas");
          sp.width = Math.round(size * dpr);
          sp.height = Math.round(size * dpr);
          const sc = sp.getContext("2d")!;
          sc.scale(dpr, dpr);
          drawMesh(sc, cr, 1, size / 2 - cr.cx, size / 2 - cr.cy);
          w.sprite = sp;
          const ball = Bodies.circle(cr.cx, cr.cy, BALL_R, { restitution: 0.42, friction: 0.3, frictionAir: 0, density: 0.0016 });
          Composite.add(w.engine.world, ball);
          w.ball = ball;
          w.hold = { x: cr.cx, y: cr.cy };
          w.home = { x: cr.cx, y: cr.cy };
          w.popAt = t - 1000;
          w.crumple = null;
          go("ready");
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    (w as unknown as { g: number }).g = g;
    return () => cancelAnimationFrame(raf);
  }, [go]);

  /* ── 揉 ── */
  const crumple = () => {
    const w = W.current;
    const el = stageEl.current, pe = paperEl.current;
    if (!el || !pe || stageRef.current !== "write") return;
    const content = textRef.current.trim() || PLACEHOLDERS[ph];
    if (!textRef.current.trim()) setText(content);
    const sr = el.getBoundingClientRect();
    const pr = pe.getBoundingClientRect();
    const x = pr.left - sr.left, y = pr.top - sr.top, pw = pr.width, phh = pr.height;
    const cx = sr.width / 2;
    const cy = Math.min(y + phh / 2, w.bin.top - 90);
    const tex = paperTexture(pw, phh, content, w.size.dpr);
    const verts: Vert[] = [];
    for (let j = 0; j < ROWS; j++) {
      for (let i = 0; i < COLS; i++) {
        const u = i / (COLS - 1), v = j / (ROWS - 1);
        const dx = (u - 0.5) * 2, dy = (v - 0.5) * 2;
        const mx = dx * Math.sqrt(1 - (dy * dy) / 2), my = dy * Math.sqrt(1 - (dx * dx) / 2);
        const r = (BALL_R + 4) * (0.7 + Math.random() * 0.42);
        const ang = (Math.random() - 0.5) * 0.9;
        const rx = mx * Math.cos(ang) - my * Math.sin(ang), ry = mx * Math.sin(ang) + my * Math.cos(ang);
        const edge = Math.max(Math.abs(dx), Math.abs(dy));
        verts.push({ fx: x + u * pw, fy: y + v * phh, tx: cx + rx * r, ty: cy + ry * r, u, v, delay: (1 - edge) * 0.24 + Math.random() * 0.04, jx: (Math.random() - 0.5) * 46, jy: (Math.random() - 0.5) * 46 });
      }
    }
    const shade = Array.from({ length: (COLS - 1) * (ROWS - 1) * 2 }, () => Math.random());
    w.crumple = { start: performance.now(), dur: 1000, tex, verts, shade, cx, cy };
    haptic(20);
    playCrumple();
    setTimeout(playCrumple, 380);
    setMissTip(false);
    go("crumple");
  };

  /* ── 扔 ── */
  const local = (e: React.PointerEvent) => {
    const r = canvasEl.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const onDown = (e: React.PointerEvent) => {
    const w = W.current;
    if (stageRef.current !== "ready" || !w.ball) return;
    const p = local(e);
    if (Math.hypot(p.x - w.ball.position.x, p.y - w.ball.position.y) > 70) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    w.drag = { pts: [{ ...p, t: performance.now() }] };
    w.hold = { x: w.ball.position.x, y: w.ball.position.y };
    haptic(6);
  };
  const onMove = (e: React.PointerEvent) => {
    const w = W.current;
    if (!w.drag) return;
    const p = local(e);
    w.drag.pts.push({ ...p, t: performance.now() });
    if (w.drag.pts.length > 10) w.drag.pts.shift();
    w.hold = { x: Math.max(BALL_R, Math.min(w.size.w - BALL_R, p.x)), y: Math.max(BALL_R, Math.min(w.bin.top - BALL_R - 6, p.y)) };
  };
  const onUp = () => {
    const w = W.current;
    const d = w.drag;
    w.drag = null;
    if (!d || !w.ball || !w.hold) return;
    const now = performance.now();
    const recent = d.pts.filter((p) => now - p.t < 110);
    let vx = 0, vy = 0;
    if (recent.length >= 2) {
      const a = recent[0], b = recent[recent.length - 1];
      const dt = Math.max(16, b.t - a.t);
      vx = ((b.x - a.x) / dt) * STEP * 0.9;
      vy = ((b.y - a.y) / dt) * STEP * 0.9;
    }
    const g = (w as unknown as { g: number }).g;
    const x0 = w.hold.x, y0 = w.hold.y;
    const bin = w.bin;
    const yt = bin.top + 14;
    const speed = Math.hypot(vx, vy);
    // 限制力度，别撞到天花板
    const maxUp = -Math.sqrt(2 * g * (y0 + w.size.h * 0.6));
    vy = Math.max(maxUp, Math.min(18, vy));
    if (speed > 2.2) {
      // 温和的瞄准辅助：尊重你的力度，帮你把方向修正到纸篓
      const tHit = (vy + Math.sqrt(vy * vy + 2 * g * Math.max(1, yt - y0))) / g;
      const ideal = (bin.cx - x0) / tHit;
      const ok = Math.abs(vx - ideal) < Math.max(6, Math.abs(ideal) * 0.8);
      if (ok) vx = ideal * (0.985 + Math.random() * 0.03);
    } else {
      vx = 0;
      vy = 0; // 松手，就是放下
    }
    w.hold = null;
    w.ball.frictionAir = 0;
    Body.setVelocity(w.ball, { x: vx, y: vy });
    Body.setAngularVelocity(w.ball, vx * 0.03 + (Math.random() - 0.5) * 0.1);
    w.thrownAt = now;
    w.inFrames = 0;
    if (speed > 2.2) playWhoosh();
    go("flying");
  };

  const again = () => {
    setText("");
    setMissTip(false);
    go("write");
  };

  const busy = stage !== "write";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between px-5">
        <h2 className="font-song text-[18px] font-bold tracking-[0.12em]">放下</h2>
        <div className="text-[12px] text-mute">
          今天放下 <b className="font-song text-[14px] text-ink">{todayCount}</b> 件 · 累计 {letgo.total}
        </div>
      </header>

      <div ref={stageEl} className="relative min-h-0 flex-1 overflow-hidden">
        {/* 纸条 */}
        <div className="absolute inset-x-0 top-1 flex justify-center px-6">
          <div
            ref={paperEl}
            className={`relative h-[min(44vh,300px)] w-full max-w-[340px] rounded-[6px] shadow-[0_10px_30px_rgba(60,40,10,0.10),0_1px_0_rgba(0,0,0,0.04)] transition-opacity duration-100 ${busy ? "pointer-events-none opacity-0" : "opacity-100"}`}
            style={{
              backgroundColor: "#fffdf7",
              backgroundImage: `linear-gradient(90deg, transparent ${PAD + 5.5}px, rgba(196,85,58,0.25) ${PAD + 5.5}px, rgba(196,85,58,0.25) ${PAD + 6.5}px, transparent ${PAD + 6.5}px), repeating-linear-gradient(180deg, transparent 0, transparent ${LINE_H - 1}px, rgba(110,139,166,0.18) ${LINE_H - 1}px, rgba(110,139,166,0.18) ${LINE_H}px)`,
              backgroundPosition: `0 0, 0 ${PAD + 1}px`,
              transform: "rotate(-0.6deg)",
            }}
          >
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 160))}
              placeholder={`比如：${PLACEHOLDERS[ph]}`}
              className="absolute inset-0 h-full w-full resize-none bg-transparent font-song text-[17px] text-ink outline-none placeholder:text-faint"
              style={{ padding: `${PAD}px ${PAD}px 12px ${PAD + 14}px`, lineHeight: `${LINE_H}px` }}
            />
            <div className="pointer-events-none absolute bottom-2 right-3 text-[11px] text-faint">{text.length}/160</div>
          </div>
        </div>

        <canvas
          ref={canvasEl}
          className="absolute inset-0"
          style={{ touchAction: stage === "ready" ? "none" : "auto", pointerEvents: stage === "write" ? "none" : "auto" }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        />

        <AnimatePresence>
          {stage === "ready" && (
            <motion.div key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-x-0 top-[calc(min(44vh,300px)+20px)] text-center text-[13px] leading-relaxed text-mute">
              {missTip ? "差一点点。再来一次？" : "按住纸团，甩向纸篓"}
              <br />
              <span className="text-[12px] text-faint">或者，直接松手——松手，就是放下</span>
            </motion.div>
          )}
          {stage === "done" && (
            <motion.div key="done" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: 0.35 }} className="absolute inset-x-0 top-6 flex flex-col items-center px-8 text-center">
              <div className="text-[12px] tracking-[0.3em] text-mute">已放下</div>
              <div className="mt-3 max-w-[300px] font-song text-[19px] font-bold leading-relaxed text-ink [text-wrap:balance]">{line}</div>
              <div className="mt-6 flex gap-2.5">
                <button onClick={again} className="flex h-10 items-center gap-1.5 rounded-full border border-line bg-white px-4 text-[13.5px] text-ink-2 active:scale-95">
                  <RotateCcw size={14} /> 再写一张
                </button>
                <button onClick={() => bringToChat(`我刚把「${text.slice(0, 40)}」揉成一团，扔进纸篓了。`)} className="flex h-10 items-center gap-1.5 rounded-full bg-ink px-4 text-[13.5px] text-paper active:scale-95">
                  <MessageCircle size={14} /> 跟算了说说
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="shrink-0 px-6 pb-3 pt-2">
        {stage === "write" ? (
          <button onClick={crumple} className="h-12 w-full rounded-full bg-ink text-[15px] font-medium tracking-wider text-paper shadow-[0_6px_20px_rgba(38,38,38,0.18)] transition active:scale-[0.98]">
            揉成一团
          </button>
        ) : (
          <div className="h-12" />
        )}
      </div>
    </div>
  );
}
