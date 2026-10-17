import React from "react";
import { COLORS } from "../theme";

/**
 * 水墨晕染 —— 径向墨色 + 分形噪声位移，模拟墨入生宣纤维后的毛边与浓淡。
 * progress 0→1 为墨滴落纸后的扩散过程；seed 固定以避免逐帧闪烁。
 */
export const InkWash: React.FC<{
  x: number;
  y: number;
  size: number;
  progress: number;
  opacity?: number;
  color?: string;
  seed?: string;
  time?: number;
}> = ({ x, y, size, progress, opacity = 1, color = COLORS.ink, seed = "ink", time = 0 }) => {
  const p = Math.max(0, Math.min(1, progress));
  if (p <= 0) return null;
  // 先快后慢的扩散（墨入纸纤维）
  const spread = 1 - Math.pow(1 - p, 3);
  const box = size * 2.2;
  const c = box / 2;
  const r = (size / 2) * (0.1 + 0.9 * spread);
  const numericSeed = Array.from(seed).reduce((a, ch) => a + ch.charCodeAt(0), 7);
  const disp = size * 0.32 * (0.35 + 0.65 * p);
  const rot = time * 1.5;

  return (
    <svg
      width={box}
      height={box}
      viewBox={`0 0 ${box} ${box}`}
      style={{
        position: "absolute",
        left: x - c,
        top: y - c,
        mixBlendMode: "multiply",
        opacity,
        pointerEvents: "none",
        overflow: "visible",
      }}
    >
      <defs>
        <radialGradient id={`${seed}-g`}>
          <stop offset="0%" stopColor={color} stopOpacity={0.92} />
          <stop offset="30%" stopColor={color} stopOpacity={0.62} />
          <stop offset="62%" stopColor={color} stopOpacity={0.22} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </radialGradient>
        <filter id={`${seed}-f`} x="-60%" y="-60%" width="220%" height="220%">
          <feTurbulence type="fractalNoise" baseFrequency={4.2 / size} numOctaves={3} seed={numericSeed} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={disp} xChannelSelector="R" yChannelSelector="G" />
          <feGaussianBlur stdDeviation={size * 0.006} />
        </filter>
      </defs>
      <g filter={`url(#${seed}-f)`} transform={`rotate(${rot} ${c} ${c})`}>
        <circle cx={c} cy={c} r={r} fill={`url(#${seed}-g)`} />
        <circle cx={c + r * 0.12} cy={c - r * 0.08} r={r * 0.5} fill={color} opacity={0.32 * p} />
        <circle cx={c - r * 0.06} cy={c + r * 0.05} r={r * 0.22} fill={color} opacity={0.85} />
      </g>
    </svg>
  );
};
