import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { noise2D } from "@remotion/noise";
import { COLORS } from "../theme";

/** 静态生宣纹理（固定 seed，避免逐帧闪烁） */
const GRAIN_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='360' height='360'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='3' stitchTiles='stitch' seed='7'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`;
const GRAIN_URL = `url("data:image/svg+xml;utf8,${encodeURIComponent(GRAIN_SVG)}")`;

const FIBER_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='900' height='900'><filter id='f'><feTurbulence type='fractalNoise' baseFrequency='0.004 0.02' numOctaves='2' seed='3'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(#f)'/></svg>`;
const FIBER_URL = `url("data:image/svg+xml;utf8,${encodeURIComponent(FIBER_SVG)}")`;

export const Paper: React.FC<{
  /** 0~1 画面整体暖度（纸篓仪式时略微加深） */
  warmth?: number;
  children?: React.ReactNode;
}> = ({ warmth = 0, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  // 缓慢游移的光斑 —— 像清晨窗棂透进来的光
  const lx = 50 + noise2D("light-x", t * 0.05, 0) * 18;
  const ly = 40 + noise2D("light-y", 0, t * 0.05) * 14;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.paper, overflow: "hidden" }}>
      {/* 暖光 */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 60% at ${lx}% ${ly}%, rgba(255,250,240,0.9) 0%, rgba(250,249,246,0) 70%)`,
        }}
      />
      {/* 纸纤维 */}
      <AbsoluteFill
        style={{
          backgroundImage: FIBER_URL,
          backgroundSize: "900px 900px",
          opacity: 0.045,
          mixBlendMode: "multiply",
        }}
      />
      {/* 颗粒 */}
      <AbsoluteFill
        style={{
          backgroundImage: GRAIN_URL,
          backgroundSize: "360px 360px",
          opacity: 0.07,
          mixBlendMode: "multiply",
        }}
      />
      {/* 晴岚暗角 */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 85% 80% at 50% 50%, rgba(232,227,217,0) 55%, rgba(200,192,178,${0.35 + warmth * 0.25}) 100%)`,
        }}
      />
      {warmth > 0 && (
        <AbsoluteFill
          style={{
            backgroundColor: `rgba(169,132,74,${0.06 * warmth})`,
            mixBlendMode: "multiply",
          }}
        />
      )}
      {children}
    </AbsoluteFill>
  );
};
