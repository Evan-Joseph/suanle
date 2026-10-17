import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { C, SERIF, s } from "./constants";
import { Handheld, Paper, Subtitle } from "./common";

const QUESTIONS = [
  { t: "今年考研能上岸吗？", x: 300, y: 260, at: s(1.6) },
  { t: "换工作，是对还是错？", x: 1240, y: 340, at: s(2.6) },
  { t: "他还会回来吗……", x: 420, y: 720, at: s(3.5) },
  { t: "我的人生为什么总在打转？", x: 1120, y: 760, at: s(4.3) },
];

export const Scene1Hook: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = s(8);
  // 墨滴下落
  const fall = interpolate(f, [0, 22], [-200, 540], { easing: Easing.in(Easing.quad), extrapolateRight: "clamp" });
  const spread = spring({ frame: f - 22, fps, config: { damping: 200, stiffness: 18 } });
  const ring = interpolate(f, [22, 120], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <Paper />
      <Handheld dur={dur} zoom={[1, 1.12]} amp={3}>
        <svg width="1920" height="1080" style={{ position: "absolute" }}>
          <defs>
            <filter id="inkBleed">
              <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="4" seed={4} />
              <feDisplacementMap in="SourceGraphic" scale={60 + spread * 80} />
              <feGaussianBlur stdDeviation={6 + spread * 10} />
            </filter>
            <radialGradient id="inkG">
              <stop offset="0%" stopColor={C.ink} stopOpacity="0.92" />
              <stop offset="60%" stopColor={C.ink} stopOpacity="0.45" />
              <stop offset="100%" stopColor={C.ink} stopOpacity="0" />
            </radialGradient>
          </defs>
          {f < 24 && <ellipse cx={960} cy={fall} rx={9} ry={14} fill={C.ink} />}
          {f >= 22 && (
            <g filter="url(#inkBleed)">
              <circle cx={960} cy={540} r={20 + spread * 340} fill="url(#inkG)" opacity={1 - spread * 0.35} />
              <circle cx={1010} cy={500} r={spread * 160} fill="url(#inkG)" opacity={0.5} />
            </g>
          )}
          {f >= 22 && <circle cx={960} cy={540} r={ring * 600} stroke={C.ink} strokeOpacity={(1 - ring) * 0.25} fill="none" strokeWidth={2} />}
        </svg>
        {QUESTIONS.map((q, i) => {
          const lf = f - q.at;
          const o = interpolate(lf, [0, 40, 150, 220], [0, 0.75, 0.6, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{ position: "absolute", left: q.x, top: q.y - lf * 0.25, fontFamily: SERIF, fontSize: 40, color: C.ink, opacity: o, letterSpacing: 6, filter: `blur(${interpolate(lf, [0, 40, 160, 220], [8, 0, 0, 10], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)` }}>
              {q.t}
            </div>
          );
        })}
      </Handheld>
      <Subtitle
        lines={[
          { t: "人这一生，为什么总想算一算？", from: s(0.8), to: s(3.6) },
          { t: "算前程、算感情、算流年……", from: s(3.7), to: s(5.6) },
          { t: "算那个总在深夜敲打心房的问号。", from: s(5.7), to: s(8) },
        ]}
      />
    </AbsoluteFill>
  );
};
