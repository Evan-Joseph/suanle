import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { C, SERIF } from "../theme";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 生宣纸底：米白 + 纤维噪点 + 温润暗角 */
export const PaperBackground: React.FC<{ tone?: string }> = ({ tone = C.paper }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: tone }}>
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
        <filter id="paperFiber">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="7" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.45  0 0 0 0 0.38  0 0 0 0 0.28  0 0 0 0.07 0"
          />
        </filter>
        <filter id="paperCloud">
          <feTurbulence type="fractalNoise" baseFrequency="0.004 0.012" numOctaves="2" seed="3" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.66  0 0 0 0 0.56  0 0 0 0 0.40  0 0 0 0.09 0"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#paperCloud)" />
        <rect width="100%" height="100%" filter="url(#paperFiber)" />
      </svg>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 45%, rgba(255,255,255,0) 55%, rgba(120,98,66,0.14) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

/** 逐字浮现（墨迹从模糊到清晰） */
export const InkText: React.FC<{
  text: string;
  start: number;
  stagger?: number;
  size?: number;
  color?: string;
  weight?: number;
  letterSpacing?: number;
  highlight?: { chars: string; color: string };
  style?: React.CSSProperties;
}> = ({
  text,
  start,
  stagger = 3,
  size = 64,
  color = C.ink,
  weight = 600,
  letterSpacing = 0.12,
  highlight,
  style,
}) => {
  const frame = useCurrentFrame();
  const hiStart = highlight ? text.indexOf(highlight.chars) : -1;
  return (
    <div
      style={{
        fontFamily: SERIF,
        fontSize: size,
        fontWeight: weight,
        color,
        letterSpacing: `${letterSpacing}em`,
        lineHeight: 1.35,
        whiteSpace: "pre",
        ...style,
      }}
    >
      {Array.from(text).map((ch, i) => {
        const t = frame - start - i * stagger;
        const o = interpolate(t, [0, 14], [0, 1], clamp);
        const blur = interpolate(t, [0, 16], [10, 0], clamp);
        const y = interpolate(t, [0, 18], [18, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
        const isHi = hiStart >= 0 && i >= hiStart && i < hiStart + (highlight?.chars.length ?? 0);
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: o,
              filter: `blur(${blur}px)`,
              transform: `translateY(${y}px)`,
              color: isHi ? highlight!.color : undefined,
            }}
          >
            {ch === " " ? "\u00A0" : ch}
          </span>
        );
      })}
    </div>
  );
};

/** 场景整体淡入淡出包装 */
export const SceneFade: React.FC<{
  dur: number;
  fadeIn?: number;
  fadeOut?: number;
  children: React.ReactNode;
}> = ({ dur, fadeIn = 14, fadeOut = 14, children }) => {
  const frame = useCurrentFrame();
  const o = Math.min(
    fadeIn ? interpolate(frame, [0, fadeIn], [0, 1], clamp) : 1,
    fadeOut ? interpolate(frame, [dur - fadeOut, dur], [1, 0], clamp) : 1,
  );
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

/** 物理弹簧（阻尼）快捷方法 */
export const useSpring = (delay: number, config?: Partial<{ damping: number; stiffness: number; mass: number }>) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({
    frame: frame - delay,
    fps,
    config: { damping: 18, stiffness: 90, mass: 1, ...config },
  });
};

/** 朱砂方印 */
export const Seal: React.FC<{ text: string; size?: number; style?: React.CSSProperties }> = ({
  text,
  size = 120,
  style,
}) => {
  const chars = Array.from(text);
  return (
    <div
      style={{
        width: size,
        height: size,
        background: C.cinnabar,
        borderRadius: size * 0.08,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: `inset 0 0 0 ${size * 0.045}px rgba(250,249,246,0.85), inset 0 0 ${size * 0.25}px rgba(90,20,10,0.35)`,
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, mixBlendMode: "screen" }}>
        <filter id={`sealWear${size}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="2" seed="11" />
          <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 0.96  0 0 0 0 0.9  0 0 0 -2.2 1.05" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#sealWear${size})`} />
      </svg>
      <div
        style={{
          fontFamily: SERIF,
          fontWeight: 900,
          color: C.paper,
          fontSize: chars.length > 1 ? size * 0.4 : size * 0.62,
          lineHeight: 1,
          writingMode: chars.length > 1 ? "vertical-rl" : undefined,
          letterSpacing: chars.length > 1 ? "0.05em" : 0,
          position: "relative",
        }}
      >
        {text}
      </div>
    </div>
  );
};

/** 竹叶般细线分隔 */
export const HairLine: React.FC<{ progress: number; width?: number; color?: string }> = ({
  progress,
  width = 260,
  color = C.gold,
}) => (
  <div style={{ width: width * progress, height: 2, background: color, opacity: 0.7, borderRadius: 2 }} />
);
