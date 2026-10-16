"use client";

import { useApp } from "./store";

/** 全部用 WebAudio 即时合成，无需加载音频文件 */

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!useApp.getState().settings.sound) return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

export function haptic(pattern: number | number[] = 10) {
  try {
    if (!useApp.getState().settings.haptics) return;
    navigator.vibrate?.(pattern);
  } catch {
    /* 不支持震动 */
  }
}

function noise(c: AudioContext, dur: number): AudioBufferSourceNode {
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  return src;
}

function tone(c: AudioContext, freq: number, start: number, dur: number, gain: number, type: OscillatorType = "sine") {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g).connect(c.destination);
  o.start(start);
  o.stop(start + dur + 0.05);
}

/** 揉纸：一串细碎的高频噼啪声 */
export function playCrumple() {
  const c = audio();
  if (!c) return;
  const t0 = c.currentTime;
  for (let i = 0; i < 16; i++) {
    const t = t0 + i * 0.042 + Math.random() * 0.03;
    const src = noise(c, 0.07);
    const bp = c.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1600 + Math.random() * 3600;
    bp.Q.value = 0.8;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.2 * (0.45 + Math.random()), t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.045 + Math.random() * 0.035);
    src.connect(bp).connect(g).connect(c.destination);
    src.start(t);
    src.stop(t + 0.1);
  }
}

export function playWhoosh() {
  const c = audio();
  if (!c) return;
  const t = c.currentTime;
  const src = noise(c, 0.55);
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = 1.1;
  bp.frequency.setValueAtTime(380, t);
  bp.frequency.exponentialRampToValueAtTime(2100, t + 0.24);
  bp.frequency.exponentialRampToValueAtTime(650, t + 0.5);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.16, t + 0.12);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.52);
  src.connect(bp).connect(g).connect(c.destination);
  src.start(t);
  src.stop(t + 0.56);
}

/** 碰到纸篓边沿 */
export function playRim(strength = 1) {
  const c = audio();
  if (!c) return;
  const t = c.currentTime;
  tone(c, 980, t, 0.16, 0.06 * strength, "triangle");
  tone(c, 2150, t, 0.1, 0.025 * strength);
}

/** 落进纸篓 */
export function playThud() {
  const c = audio();
  if (!c) return;
  const t = c.currentTime;
  tone(c, 130, t, 0.22, 0.28);
  const src = noise(c, 0.12);
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 900;
  const g = c.createGain();
  g.gain.setValueAtTime(0.18, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
  src.connect(lp).connect(g).connect(c.destination);
  src.start(t);
  src.stop(t + 0.14);
}

/** 颂钵：尘埃落定（基于 432Hz 真实铜钵物理建模，含双频拍频微差与丰富谐波） */
export function playBowl() {
  const c = audio();
  if (!c) return;
  const t = c.currentTime;
  // 钵槌轻触的柔和敲击音
  tone(c, 108, t, 0.08, 0.12, "sine");
  // 基频微差拍频（431.6Hz 与 432.4Hz），产生天然的物理回响呼吸感
  tone(c, 431.6, t, 4.6, 0.11, "sine");
  tone(c, 432.4, t, 4.8, 0.11, "sine");
  // 二次谐波（八度泛音）
  tone(c, 864.2, t + 0.005, 3.6, 0.048, "sine");
  // 三次谐波（纯五度泛音）
  tone(c, 1296.5, t + 0.01, 2.5, 0.026, "sine");
  // 高阶泛音微鸣
  tone(c, 1728.8, t + 0.015, 1.8, 0.014, "sine");
  tone(c, 2592.0, t + 0.02, 1.1, 0.008, "sine");
}

export function playCoin() {
  const c = audio();
  if (!c) return;
  const t = c.currentTime;
  [0, 0.05, 0.11].forEach((d, i) => {
    tone(c, 2600 + i * 700 + Math.random() * 300, t + d, 0.09, 0.05, "triangle");
    tone(c, 5200 + i * 500, t + d, 0.05, 0.015);
  });
}

export function playFlip() {
  const c = audio();
  if (!c) return;
  const t = c.currentTime;
  const src = noise(c, 0.18);
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 2400;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.08, t + 0.04);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.17);
  src.connect(hp).connect(g).connect(c.destination);
  src.start(t);
  src.stop(t + 0.2);
  tone(c, 1760, t + 0.08, 0.5, 0.025);
  tone(c, 2637, t + 0.12, 0.4, 0.012);
}

export function playTap() {
  const c = audio();
  if (!c) return;
  tone(c, 720, c.currentTime, 0.06, 0.03);
}

/* ───────────────────────── 茶室静心白噪音（雨声与禅意底鸣） ───────────────────────── */

let ambientNodes: { gain: GainNode; stop: () => void } | null = null;

export function stopAmbient() {
  if (!ambientNodes) return;
  try {
    const c = ambientNodes.gain.context;
    ambientNodes.gain.gain.setValueAtTime(ambientNodes.gain.gain.value, c.currentTime);
    ambientNodes.gain.gain.exponentialRampToValueAtTime(0.00001, c.currentTime + 1.2);
    setTimeout(() => {
      ambientNodes?.stop();
      ambientNodes = null;
    }, 1300);
  } catch {
    ambientNodes = null;
  }
}

export function startAmbient() {
  if (ambientNodes) return;
  const c = audio();
  if (!c) return;

  try {
    const masterGain = c.createGain();
    masterGain.gain.setValueAtTime(0.0001, c.currentTime);
    masterGain.gain.exponentialRampToValueAtTime(0.07, c.currentTime + 1.5);
    masterGain.connect(c.destination);

    // 1. 茶室雨声基底（粉红滤波柔和白噪音）
    const rainBuf = c.createBuffer(1, Math.floor(c.sampleRate * 4), c.sampleRate);
    const data = rainBuf.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.025 * white) / 1.025;
      lastOut = data[i];
    }
    const rainSrc = c.createBufferSource();
    rainSrc.buffer = rainBuf;
    rainSrc.loop = true;

    const rainFilter = c.createBiquadFilter();
    rainFilter.type = "lowpass";
    rainFilter.frequency.setValueAtTime(1200, c.currentTime);

    const rainGain = c.createGain();
    rainGain.gain.value = 0.65;

    rainSrc.connect(rainFilter).connect(rainGain).connect(masterGain);
    rainSrc.start();

    // 2. 禅意低频寺院底鸣（108Hz）
    const drone = c.createOscillator();
    drone.type = "sine";
    drone.frequency.setValueAtTime(108, c.currentTime);
    const droneGain = c.createGain();
    droneGain.gain.value = 0.16;
    drone.connect(droneGain).connect(masterGain);
    drone.start();

    // 3. 偶发轻柔水珠滴答
    const dropInterval = setInterval(() => {
      if (!ambientNodes) {
        clearInterval(dropInterval);
        return;
      }
      if (Math.random() < 0.6) {
        const dropFreq = 1800 + Math.random() * 1200;
        const now = c.currentTime;
        const osc = c.createOscillator();
        const dg = c.createGain();
        osc.frequency.setValueAtTime(dropFreq, now);
        osc.frequency.exponentialRampToValueAtTime(dropFreq * 0.75, now + 0.08);
        dg.gain.setValueAtTime(0.0001, now);
        dg.gain.exponentialRampToValueAtTime(0.02 * Math.random(), now + 0.01);
        dg.gain.exponentialRampToValueAtTime(0.00001, now + 0.09);
        osc.connect(dg).connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.1);
      }
    }, 500);

    ambientNodes = {
      gain: masterGain,
      stop: () => {
        clearInterval(dropInterval);
        try {
          rainSrc.stop();
          drone.stop();
          rainSrc.disconnect();
          drone.disconnect();
          masterGain.disconnect();
        } catch {
          /* noop */
        }
      },
    };
  } catch {
    ambientNodes = null;
  }
}

export function syncAmbient(enabled: boolean) {
  if (enabled) {
    startAmbient();
  } else {
    stopAmbient();
  }
}
