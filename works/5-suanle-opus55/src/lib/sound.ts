"use client";

let ctx: AudioContext | null = null;
let muted = false;
export function setMuted(m: boolean) { muted = m; }

function ac(): AudioContext | null {
  if (typeof window === "undefined" || muted) return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, dur: number, type: OscillatorType = "sine", gain = 0.08, delay = 0) {
  const a = ac();
  if (!a) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function noise(dur: number, gain = 0.05, delay = 0, hp = 1200) {
  const a = ac();
  if (!a) return;
  const len = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = a.createBufferSource();
  s.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = "highpass";
  f.frequency.value = hp;
  const g = a.createGain();
  g.gain.value = gain;
  s.connect(f).connect(g).connect(a.destination);
  s.start(a.currentTime + delay);
}

export const sfx = {
  tap: () => tone(880, 0.06, "sine", 0.03),
  send: () => { tone(660, 0.08, "sine", 0.04); tone(990, 0.12, "sine", 0.03, 0.05); },
  coin: () => { [0, 0.07, 0.15].forEach((d, i) => { tone(2400 + i * 300, 0.25, "triangle", 0.035, d); tone(3600 + i * 200, 0.15, "sine", 0.02, d); }); },
  bell: () => { tone(523, 1.6, "sine", 0.06); tone(1046, 1.2, "sine", 0.025); tone(1568, 0.8, "sine", 0.012); },
  flip: () => noise(0.12, 0.05, 0, 2500),
  sticks: () => { for (let i = 0; i < 8; i++) noise(0.04, 0.06, i * 0.07, 800); },
  crumple: () => { for (let i = 0; i < 10; i++) noise(0.05 + Math.random() * 0.05, 0.04, i * 0.05, 1500 + Math.random() * 2000); },
  toss: () => { tone(300, 0.25, "sine", 0.04); tone(180, 0.2, "sine", 0.05, 0.35); noise(0.08, 0.05, 0.35, 400); },
  chime: () => { [784, 988, 1175].forEach((f, i) => tone(f, 0.6, "sine", 0.04, i * 0.09)); },
};
