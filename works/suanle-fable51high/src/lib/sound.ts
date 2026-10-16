"use client";

let ctx: AudioContext | null = null;
function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const W = window as typeof window & { webkitAudioContext?: typeof AudioContext };
    ctx = ctx ?? new (window.AudioContext || W.webkitAudioContext!)();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch { return null; }
}

export function haptic(pattern: number | number[] = 10) {
  try { if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern); } catch { /* ignore */ }
}

function tone(freq: number, dur: number, type: OscillatorType = "sine", gain = 0.08, when = 0) {
  const c = ac(); if (!c) return;
  const o = c.createOscillator(); const g = c.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, c.currentTime + when);
  g.gain.exponentialRampToValueAtTime(gain, c.currentTime + when + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + when + dur);
  o.connect(g).connect(c.destination);
  o.start(c.currentTime + when); o.stop(c.currentTime + when + dur + 0.05);
}

function noise(dur: number, gain = 0.05, lp = 1800) {
  const c = ac(); if (!c) return;
  const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = c.createBufferSource(); src.buffer = buf;
  const f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = lp;
  const g = c.createGain(); g.gain.value = gain;
  src.connect(f).connect(g).connect(c.destination); src.start();
}

/** 铜钱落盘 */
export function playCoins() { haptic([8, 30, 8]); [0, 0.06, 0.13].forEach((w, i) => tone(2200 + i * 180, 0.18, "triangle", 0.05, w)); }
/** 翻牌 */
export function playFlip() { haptic(6); noise(0.08, 0.03, 3000); tone(880, 0.08, "sine", 0.03); }
/** 揉纸 */
export function playCrumple() { haptic([5, 20, 5, 20, 5]); noise(0.35, 0.06, 2400); }
/** 丢出 */
export function playWhoosh() { noise(0.25, 0.04, 900); }
/** 落篓 */
export function playLand() { haptic(14); tone(180, 0.12, "sine", 0.06); noise(0.1, 0.03, 600); }
/** 颂钵 */
export function playBowl() { haptic([10, 40, 10]); tone(432, 2.2, "sine", 0.05); tone(864, 1.6, "sine", 0.02, 0.02); tone(1296, 1.0, "sine", 0.012, 0.04); }
/** 轻点 */
export function playTap() { tone(1200, 0.05, "sine", 0.02); }
