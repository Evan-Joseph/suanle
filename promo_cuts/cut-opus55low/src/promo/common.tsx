import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, interpolate, useCurrentFrame, Easing } from "remotion";
import { C, SERIF, USE_REAL_ASSETS, asset } from "./constants";

export const Paper: React.FC<{ tint?: string }> = ({ tint = C.paper }) => (
  <AbsoluteFill style={{ background: tint }}>
    <svg width="100%" height="100%" style={{ position: "absolute", opacity: 0.5 }}>
      <filter id="rice">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="7" />
        <feColorMatrix values="0 0 0 0 0.55  0 0 0 0 0.5  0 0 0 0 0.42  0 0 0 0.09 0" />
      </filter>
      <filter id="fiber">
        <feTurbulence type="fractalNoise" baseFrequency="0.006 0.04" numOctaves="2" seed="3" />
        <feColorMatrix values="0 0 0 0 0.6  0 0 0 0 0.55  0 0 0 0 0.45  0 0 0 0.07 0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#rice)" />
      <rect width="100%" height="100%" filter="url(#fiber)" />
    </svg>
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(120,100,70,0.16) 100%)" }} />
  </AbsoluteFill>
);

/** 淡入淡出包裹 */
export const Fade: React.FC<{ dur: number; inF?: number; outF?: number; children: React.ReactNode }> = ({ dur, inF = 30, outF = 30, children }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, inF, dur - outF, dur], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

/** 手持微晃镜头 */
export const Handheld: React.FC<{ amp?: number; zoom?: [number, number]; dur: number; children: React.ReactNode }> = ({ amp = 4, zoom = [1, 1.06], dur, children }) => {
  const f = useCurrentFrame();
  const x = Math.sin(f / 47) * amp + Math.sin(f / 19) * amp * 0.3;
  const y = Math.cos(f / 53) * amp * 0.8 + Math.sin(f / 23) * amp * 0.25;
  const r = Math.sin(f / 71) * 0.15;
  const z = interpolate(f, [0, dur], zoom, { easing: Easing.inOut(Easing.sin) });
  return <AbsoluteFill style={{ transform: `translate(${x}px,${y}px) rotate(${r}deg) scale(${z})` }}>{children}</AbsoluteFill>;
};

/** 旁白字幕：逐字墨显 */
export const Subtitle: React.FC<{ lines: { t: string; from: number; to: number }[] }> = ({ lines }) => {
  const f = useCurrentFrame();
  const cur = lines.find((l) => f >= l.from && f < l.to);
  if (!cur) return null;
  const local = f - cur.from;
  const len = cur.to - cur.from;
  const out = interpolate(local, [len - 20, len], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", bottom: 70, width: "100%", textAlign: "center", fontFamily: SERIF, fontSize: 36, letterSpacing: 6, color: C.ink, opacity: out }}>
      {[...cur.t].map((ch, i) => {
        const o = interpolate(local, [i * 2.2, i * 2.2 + 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return <span key={i} style={{ opacity: o, filter: `blur(${(1 - o) * 6}px)` }}>{ch}</span>;
      })}
    </div>
  );
};

/** 手机外壳：真实录屏 / 矢量重绘 */
export const Phone: React.FC<{ video?: string; image?: string; fallback: React.ReactNode; w?: number; style?: React.CSSProperties; startFrom?: number }> = ({ video, image, fallback, w = 400, style, startFrom = 0 }) => {
  const h = w * (1864 / 860);
  return (
    <div style={{ width: w, height: h, borderRadius: w * 0.13, padding: w * 0.03, background: "#1d1c1a", boxShadow: "0 60px 120px rgba(60,45,25,0.28), 0 0 0 2px #3a3835 inset", ...style }}>
      <div style={{ width: "100%", height: "100%", borderRadius: w * 0.105, overflow: "hidden", background: C.paper, position: "relative" }}>
        {USE_REAL_ASSETS && video ? (
          <OffthreadVideo src={asset(video)} startFrom={startFrom} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : USE_REAL_ASSETS && image ? (
          <Img src={asset(image)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          fallback
        )}
        <div style={{ position: "absolute", top: w * 0.025, left: "50%", transform: "translateX(-50%)", width: w * 0.28, height: w * 0.075, borderRadius: 99, background: "#111" }} />
      </div>
    </div>
  );
};

/** 品牌标识：坤卦六断爻 + 微笑弧 */
export const Logo: React.FC<{ size?: number; color?: string }> = ({ size = 120, color = C.ink }) => {
  if (USE_REAL_ASSETS) return <Img src={asset("logo.png")} style={{ width: size, height: size }} />;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      {[0, 1, 2].map((i) => (
        <g key={i} fill={color}>
          <rect x="18" y={20 + i * 14} width="26" height="7" rx="2" />
          <rect x="56" y={20 + i * 14} width="26" height="7" rx="2" />
        </g>
      ))}
      <path d="M24 70 Q50 88 76 70" stroke={C.cinnabar} strokeWidth="6" fill="none" strokeLinecap="round" />
    </svg>
  );
};

/** 朱砂印章 */
export const Seal: React.FC<{ text: string; size?: number }> = ({ text, size = 160 }) => (
  <div style={{ width: size, height: size, background: C.cinnabar, borderRadius: size * 0.08, display: "grid", placeItems: "center", boxShadow: "inset 0 0 0 6px rgba(250,249,246,0.25)", filter: "url(#sealRough)" }}>
    <svg width="0" height="0" style={{ position: "absolute" }}>
      <filter id="sealRough"><feTurbulence baseFrequency="0.9" numOctaves="2" seed="2" /><feDisplacementMap in="SourceGraphic" scale="5" /></filter>
    </svg>
    <div style={{ fontFamily: SERIF, color: C.paper, fontSize: size * 0.36, fontWeight: 900, writingMode: "vertical-rl", letterSpacing: 4 }}>{text}</div>
  </div>
);
