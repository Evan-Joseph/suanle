// Deterministic seeded randomness — the backbone of a consistent "命盘".
export function hashSeed(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rngFrom(key: string) {
  return mulberry32(hashSeed(key));
}

export function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function pickN<T>(rng: () => number, arr: readonly T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  while (copy.length && out.length < n) {
    out.push(copy.splice(Math.floor(rng() * copy.length), 1)[0]);
  }
  return out;
}

export function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}

/** Smooth 1‑D value noise over [0,1] using seeded lattice points. */
export function makeNoise1D(key: string, octaves = 4) {
  const layers: number[][] = [];
  for (let o = 0; o < octaves; o++) {
    const rng = rngFrom(`${key}#oct${o}`);
    const n = 6 + o * 5;
    layers.push(Array.from({ length: n + 2 }, () => rng()));
  }
  return (x: number) => {
    let sum = 0;
    let amp = 1;
    let total = 0;
    for (let o = 0; o < layers.length; o++) {
      const lattice = layers[o];
      const n = lattice.length - 2;
      const fx = x * n;
      const i = Math.floor(fx);
      const t = smoothstep(fx - i);
      sum += lerp(lattice[i], lattice[i + 1], t) * amp;
      total += amp;
      amp *= 0.5;
    }
    return sum / total;
  };
}

export function uid(prefix = ""): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return prefix + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  }
  return prefix + Math.random().toString(36).slice(2, 14) + Date.now().toString(36);
}

export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function cnDate(d = new Date()): string {
  const week = ["日", "一", "二", "三", "四", "五", "六"][d.getDay()];
  return `${d.getMonth() + 1}月${d.getDate()}日 · 星期${week}`;
}
