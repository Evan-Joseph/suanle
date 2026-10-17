import React from "react";
import { interpolate, useCurrentFrame, Easing } from "remotion";
import { C } from "../theme";
import { clamp } from "./Primitives";

/** 水墨晕染：多层湍流位移的墨团扩散 */
export const InkBloom: React.FC<{
  start: number;
  x: number;
  y: number;
  maxR?: number;
  color?: string;
  opacity?: number;
  seed?: number;
}> = ({ start, x, y, maxR = 520, color = C.ink, opacity = 0.9, seed = 2 }) => {
  const frame = useCurrentFrame();
  const t = frame - start;
  if (t < 0) return null;
  const grow = interpolate(t, [0, 120], [0, 1], { ...clamp, easing: Easing.out(Easing.exp) });
  const fade = interpolate(t, [0, 30, 160], [opacity, opacity * 0.55, opacity * 0.18], clamp);
  const id = `inkBloom${seed}`;
  const rings = [1, 0.72, 0.45, 0.22];
  return (
    <svg
      width={maxR * 3}
      height={maxR * 3}
      style={{ position: "absolute", left: x - maxR * 1.5, top: y - maxR * 1.5, overflow: "visible" }}
    >
      <defs>
        <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
          <feTurbulence type="fractalNoise" baseFrequency={0.012 + t * 0.00002} numOctaves="4" seed={seed} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={60 + grow * 120} />
          <feGaussianBlur stdDeviation={6 + grow * 14} />
        </filter>
        <radialGradient id={`${id}g`}>
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="60%" stopColor={color} stopOpacity="0.55" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <g filter={`url(#${id})`} opacity={fade}>
        {rings.map((r, i) => (
          <circle
            key={i}
            cx={maxR * 1.5 + Math.sin(i * 2.1 + seed) * 24 * grow}
            cy={maxR * 1.5 + Math.cos(i * 1.7 + seed) * 18 * grow}
            r={Math.max(1, maxR * r * grow)}
            fill={`url(#${id}g)`}
            opacity={0.35 + i * 0.18}
          />
        ))}
      </g>
    </svg>
  );
};

/** 下落的墨滴 */
export const InkDrop: React.FC<{ land: number; x: number; y: number }> = ({ land, x, y }) => {
  const frame = useCurrentFrame();
  const t = frame - (land - 22);
  if (t < 0 || t > 24) return null;
  const p = interpolate(t, [0, 22], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const top = interpolate(p, [0, 1], [-80, y]);
  const stretch = interpolate(p, [0, 1], [1, 1.8]);
  const o = interpolate(t, [20, 24], [1, 0], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: x - 9,
        top: top - 18,
        width: 18,
        height: 18 * stretch,
        borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
        background: C.ink,
        opacity: o,
        boxShadow: "0 0 6px rgba(43,43,43,0.4)",
      }}
    />
  );
};

/** 袅袅茶烟 */
export const Steam: React.FC<{ x: number; y: number; scale?: number; opacity?: number }> = ({
  x,
  y,
  scale = 1,
  opacity = 0.5,
}) => {
  const frame = useCurrentFrame();
  const strands = [0, 1, 2];
  return (
    <svg
      width={300 * scale}
      height={520 * scale}
      viewBox="0 0 300 520"
      style={{ position: "absolute", left: x - 150 * scale, top: y - 520 * scale, opacity }}
    >
      <defs>
        <filter id="steamBlur">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <linearGradient id="steamFade" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={C.gold} stopOpacity="0.0" />
          <stop offset="25%" stopColor="#9C8F7A" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#9C8F7A" stopOpacity="0" />
        </linearGradient>
      </defs>
      {strands.map((s) => {
        const ph = frame / 26 + s * 2.1;
        const pts: string[] = [];
        for (let i = 0; i <= 20; i++) {
          const yy = 520 - i * 26;
          const amp = 6 + i * 2.4;
          const xx = 150 + (s - 1) * 34 + Math.sin(ph - i * 0.42) * amp;
          pts.push(`${i === 0 ? "M" : "L"}${xx.toFixed(1)},${yy}`);
        }
        return (
          <path
            key={s}
            d={pts.join(" ")}
            fill="none"
            stroke="url(#steamFade)"
            strokeWidth={14 - s * 3}
            strokeLinecap="round"
            filter="url(#steamBlur)"
          />
        );
      })}
    </svg>
  );
};
