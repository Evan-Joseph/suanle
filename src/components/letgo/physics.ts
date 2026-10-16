import type Matter from "matter-js";

type MatterNS = typeof Matter;

/** 舞台几何：一切坐标都等于舞台像素 */
export interface Geo {
  w: number;
  h: number;
  floorY: number;
  binX: number;
  binTop: number;
  bw: number;
  tw: number;
  bh: number;
  x0: number;
  y0: number;
  R: number;
}

export const FRICTION_AIR = 0.006;
const G_SCALE = 0.0018;
const DT = 1000 / 60;
const G_STEP = G_SCALE * DT * DT;

export function computeGeo(w: number, h: number): Geo {
  const R = 22;
  const floorY = h - 40;
  const bh = Math.round(Math.min(118, Math.max(92, h * 0.2)));
  const bw = 90;
  const tw = 114;
  const binX = w - 20 - tw / 2;
  const binTop = floorY - bh;
  const x0 = Math.round(Math.max(64, Math.min(w * 0.26, binX - 160)));
  const y0 = Math.round(Math.max(R + 70, binTop - 48));
  return { w, h, floorY, binX, binTop, bw, tw, bh, x0, y0, R };
}

/** 求一条恰好落进纸篓中心的抛物线（与物理引擎同样的积分方式） */
export function idealVelocity(g: Geo, from = { x: g.x0, y: g.y0 }, angleDeg = 62): { x: number; y: number } {
  const tx = g.binX;
  const ty = g.binTop + 16;
  const th = (angleDeg * Math.PI) / 180;
  const k = 1 - FRICTION_AIR;
  const yAt = (s: number): number => {
    let x = from.x;
    let y = from.y;
    let vx = Math.cos(th) * s;
    let vy = -Math.sin(th) * s;
    for (let i = 0; i < 600; i++) {
      vx = vx * k;
      vy = vy * k + G_STEP;
      const nx = x + vx;
      const ny = y + vy;
      if (nx >= tx) return y + ((tx - x) / Math.max(1e-6, nx - x)) * (ny - y);
      x = nx;
      y = ny;
      if (y > g.h + 200) return Infinity;
    }
    return Infinity;
  };
  let lo = 2;
  let hi = 40;
  for (let i = 0; i < 28; i++) {
    const mid = (lo + hi) / 2;
    if (yAt(mid) < ty) hi = mid;
    else lo = mid;
  }
  const s = (lo + hi) / 2;
  return { x: Math.cos(th) * s, y: -Math.sin(th) * s };
}

export interface World {
  engine: Matter.Engine;
  ball: Matter.Body;
  step: () => void;
  destroy: () => void;
}

export function createWorld(M: MatterNS, g: Geo, start: { x: number; y: number }, v: { x: number; y: number }, onHit: (label: string, speed: number) => void): World {
  const engine = M.Engine.create();
  engine.gravity.x = 0;
  engine.gravity.y = 1;
  engine.gravity.scale = G_SCALE;

  const t = 8;
  const flare = (g.tw - g.bw) / 2;
  const L = Math.hypot(g.bh, flare);
  const ang = Math.atan2(flare, g.bh);
  const wallOpts = { isStatic: true, label: "rim", friction: 0.02, restitution: 0.35, chamfer: { radius: t / 2 } };
  const leftWall = M.Bodies.rectangle(g.binX - (g.bw + g.tw) / 4, g.floorY - g.bh / 2, t, L, { ...wallOpts, angle: -ang });
  const rightWall = M.Bodies.rectangle(g.binX + (g.bw + g.tw) / 4, g.floorY - g.bh / 2, t, L, { ...wallOpts, angle: ang });
  const bottom = M.Bodies.rectangle(g.binX, g.floorY - 3, g.bw, 6, { isStatic: true, label: "bottom", friction: 0.6, restitution: 0.1 });
  const floor = M.Bodies.rectangle(g.w / 2, g.floorY + 30, g.w * 3, 60, { isStatic: true, label: "floor", friction: 0.5, restitution: 0.25 });
  const wallL = M.Bodies.rectangle(-30, g.h / 2, 60, g.h * 4, { isStatic: true, label: "wall", restitution: 0.4 });
  const wallR = M.Bodies.rectangle(g.w + 30, g.h / 2, 60, g.h * 4, { isStatic: true, label: "wall", restitution: 0.4 });
  const ball = M.Bodies.circle(start.x, start.y, g.R, { label: "ball", restitution: 0.42, friction: 0.05, frictionAir: FRICTION_AIR, density: 0.0016 });
  M.Composite.add(engine.world, [leftWall, rightWall, bottom, floor, wallL, wallR, ball]);
  M.Body.setVelocity(ball, v);
  M.Body.setAngularVelocity(ball, Math.max(-0.35, Math.min(0.35, v.x * 0.04)));

  const handler = (ev: Matter.IEventCollision<Matter.Engine>) => {
    for (const p of ev.pairs) {
      const other = p.bodyA === ball ? p.bodyB : p.bodyB === ball ? p.bodyA : null;
      if (other) onHit(other.label, ball.speed);
    }
  };
  M.Events.on(engine, "collisionStart", handler);

  return {
    engine,
    ball,
    step: () => M.Engine.update(engine, DT),
    destroy: () => {
      M.Events.off(engine, "collisionStart", handler);
      M.Composite.clear(engine.world, false);
      M.Engine.clear(engine);
    },
  };
}

export function insideBin(g: Geo, x: number, y: number): boolean {
  if (y < g.binTop + g.R * 0.5 || y > g.floorY) return false;
  const depth = (g.floorY - y) / g.bh;
  const half = g.bw / 2 + ((g.tw - g.bw) / 2) * depth - 4;
  return Math.abs(x - g.binX) < half;
}
