/* Tiny WebAudio synth layer — no external assets needed. */

let ctx: AudioContext | null = null;
let muted = false;

export function setMuted(m: boolean) {
  muted = m;
}

function ac(): AudioContext | null {
  if (muted) return null;
  try {
    if (!ctx) {
      const AC =
        typeof window !== "undefined"
          ? window.AudioContext ||
            (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
          : null;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(
  freq: number,
  dur: number,
  type: OscillatorType,
  gain: number,
  when = 0,
  glideTo?: number
) {
  const c = ac();
  if (!c) return;
  const t0 = c.currentTime + when;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur * 0.85);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noiseBurst(dur: number, gain: number, when = 0, hp = 2400) {
  const c = ac();
  if (!c) return;
  const t0 = c.currentTime + when;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = hp;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter).connect(g).connect(c.destination);
  src.start(t0);
}

/** coins jingling inside a cup while shaking */
export function sfxShake() {
  for (let i = 0; i < 5; i++) {
    noiseBurst(0.06, 0.12, i * 0.07, 3200);
    tone(4200 + Math.random() * 2200, 0.08, "triangle", 0.05, i * 0.07);
  }
}

/** three coins landing on the table */
export function sfxCoinLand() {
  tone(2600, 0.24, "triangle", 0.14, 0, 1500);
  tone(3400, 0.2, "triangle", 0.1, 0.05, 1900);
  tone(2100, 0.28, "triangle", 0.12, 0.1, 1200);
  noiseBurst(0.09, 0.12, 0, 2600);
}

/** tarot card flip — airy whoosh + chime */
export function sfxFlip() {
  noiseBurst(0.28, 0.07, 0, 900);
  tone(1320, 0.5, "sine", 0.08, 0.16);
  tone(1980, 0.65, "sine", 0.06, 0.22);
}

/** reading revealed — temple bell */
export function sfxReveal() {
  tone(196, 2.6, "sine", 0.16);
  tone(392, 2.1, "sine", 0.07, 0.02);
  tone(587, 1.6, "sine", 0.045, 0.04);
}

/** wooden fish knock — merit +1 */
export function sfxWood() {
  tone(880, 0.14, "sine", 0.22, 0, 820);
  tone(1760, 0.07, "triangle", 0.1);
  noiseBurst(0.035, 0.14, 0, 1800);
}

/** soft send / receive ticks for chat */
export function sfxSend() {
  tone(660, 0.09, "sine", 0.06);
}
export function sfxReceive() {
  tone(520, 0.12, "sine", 0.05);
  tone(780, 0.14, "sine", 0.04, 0.07);
}
