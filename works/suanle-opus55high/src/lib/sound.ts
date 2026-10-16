
import { useApp } from "./store";

let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!useApp.getState().sound) return null;
  try {
    if (!ctx) {
      const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new C();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function noise(c: AudioContext, dur: number) {
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  return src;
}

function tone(freq: number, dur: number, type: OscillatorType = "sine", vol = 0.15, delay = 0) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

/** 揉纸：一串短促的高频噪声 */
export function playCrumple() {
  const c = ac();
  if (!c) return;
  for (let i = 0; i < 9; i++) {
    const t = c.currentTime + i * 0.055 + Math.random() * 0.03;
    const n = noise(c, 0.06);
    const f = c.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 2200 + Math.random() * 3000;
    f.Q.value = 0.8;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    n.connect(f).connect(g).connect(c.destination);
    n.start(t);
    n.stop(t + 0.07);
  }
}

export function playWhoosh() {
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  const n = noise(c, 0.45);
  const f = c.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.setValueAtTime(400, t);
  f.frequency.exponentialRampToValueAtTime(1800, t + 0.35);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.12, t + 0.1);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
  n.connect(f).connect(g).connect(c.destination);
  n.start(t);
  n.stop(t + 0.46);
}

/** 落进纸篓：闷响 + 木鱼般的一声 */
export function playLand() {
  tone(110, 0.18, "sine", 0.25);
  tone(820, 0.35, "triangle", 0.08, 0.12);
  tone(1230, 0.5, "sine", 0.04, 0.14);
}

export function playCoin() {
  tone(2600 + Math.random() * 400, 0.12, "triangle", 0.06);
  tone(3900 + Math.random() * 300, 0.09, "sine", 0.03, 0.03);
}

export function playFlip() {
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  const n = noise(c, 0.12);
  const f = c.createBiquadFilter();
  f.type = "highpass";
  f.frequency.value = 1800;
  const g = c.createGain();
  g.gain.setValueAtTime(0.12, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
  n.connect(f).connect(g).connect(c.destination);
  n.start(t);
  n.stop(t + 0.12);
}

/** 颂钵：用于完成、致谢 */
export function playBowl() {
  tone(432, 2.2, "sine", 0.1);
  tone(864.6, 1.6, "sine", 0.035, 0.01);
  tone(1297, 1.1, "sine", 0.02, 0.02);
}

export function haptic(ms = 10) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(ms);
  } catch {
    /* ignore */
  }
}
