import React, { CSSProperties } from "react";
import { COLORS, FONT_FAMILY } from "../theme";

/**
 * 朱砂方印 —— 边缘以噪声位移模拟手工篆刻与印泥的毛边。
 * progress：盖印弹簧进度（允许轻微过冲）。
 */
export const Seal: React.FC<{
  size: number;
  text: string;
  progress: number;
  style?: CSSProperties;
  id?: string;
}> = ({ size, text, progress, style, id = "seal" }) => {
  const p = progress;
  const visible = Math.max(0, Math.min(1, p * 4));
  const scale = 1.7 - 0.7 * p;
  const rotate = -9 + 6 * p;
  const chars = Array.from(text);
  const fontSize = chars.length === 1 ? size * 0.64 : size * 0.42;

  return (
    <div
      style={{
        width: size,
        height: size,
        opacity: visible,
        transform: `scale(${scale}) rotate(${rotate}deg)`,
        transformOrigin: "center",
        position: "relative",
        ...style,
      }}
    >
      <svg width={size} height={size} viewBox="0 0 100 100" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id={`${id}-rough`} x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="3" seed="11" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="4.5" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id={`${id}-grain`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="5" />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.35" />
            </feComponentTransfer>
            <feComposite in2="SourceGraphic" operator="in" />
          </filter>
        </defs>
        <g filter={`url(#${id}-rough)`}>
          <rect x="4" y="4" width="92" height="92" rx="5" fill={COLORS.vermilion} />
          <rect x="10.5" y="10.5" width="79" height="79" rx="2" fill="none" stroke={COLORS.paper} strokeWidth="1.6" opacity="0.85" />
        </g>
        <rect x="4" y="4" width="92" height="92" rx="5" fill="#fff" filter={`url(#${id}-grain)`} opacity="0.18" style={{ mixBlendMode: "overlay" }} />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: chars.length > 1 ? "column" : "row",
          gap: chars.length > 1 ? size * 0.02 : 0,
          fontFamily: FONT_FAMILY,
          fontWeight: 700,
          fontSize,
          lineHeight: 1,
          color: COLORS.paper,
          letterSpacing: 0,
        }}
      >
        {chars.map((c, i) => (
          <span key={i} style={{ display: "block" }}>
            {c}
          </span>
        ))}
      </div>
    </div>
  );
};
