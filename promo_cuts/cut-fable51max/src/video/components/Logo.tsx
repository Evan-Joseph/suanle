import React from "react";
import { spring, useVideoConfig } from "remotion";
import { COLORS } from "../theme";
import { easeInOutSine, progressAt, useSeconds } from "./Reveal";

/**
 * 品牌标识动画：坤卦六断爻依次落笔，继而一弧微笑徐徐画出。
 * 几何来自 promo/assets/brand/logo.svg (viewBox 1024)。
 */
const BARS = [
  { x: 248, y: 248 },
  { x: 560, y: 248 },
  { x: 248, y: 356 },
  { x: 560, y: 356 },
  { x: 248, y: 464 },
  { x: 560, y: 464 },
];

export const Logo: React.FC<{
  size: number;
  from: number;
  color?: string;
  smileColor?: string;
}> = ({ size, from, color = COLORS.ink, smileColor }) => {
  const { t, fps } = useSeconds();
  const { fps: vfps } = useVideoConfig();
  const smileFrom = from + 0.9;
  const smileP = easeInOutSine(progressAt(t, smileFrom, 1.1));
  return (
    <svg width={size} height={size} viewBox="0 0 1024 1024" style={{ display: "block", overflow: "visible" }}>
      {BARS.map((b, i) => {
        const delay = from + i * 0.12;
        const frame = Math.max(0, (t - delay) * fps);
        const s = spring({
          frame,
          fps: vfps,
          config: { damping: 16, stiffness: 140, mass: 0.8 },
          durationInFrames: Math.round(0.9 * vfps),
        });
        const visible = t >= delay ? 1 : 0;
        return (
          <rect
            key={i}
            x={b.x}
            y={b.y}
            width={216}
            height={74}
            rx={6}
            fill={color}
            opacity={visible}
            style={{
              transform: `scaleX(${s})`,
              transformOrigin: `${b.x + 108}px ${b.y + 37}px`,
            }}
          />
        );
      })}
      <path
        d="M 264 600 C 264 776, 760 776, 760 600"
        fill="none"
        stroke={smileColor ?? color}
        strokeWidth={64}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - smileP}
        opacity={smileP > 0 ? 1 : 0}
      />
    </svg>
  );
};
