import React from "react";
import { COLORS } from "../theme";
import { easeOutCubic, useSeconds } from "./Reveal";

/**
 * 颂钵声波 —— 以细墨线同心圆向外扩散，象征余音荡漾。
 */
export const Ripples: React.FC<{
  cx: number;
  cy: number;
  from: number;
  count?: number;
  interval?: number;
  maxRadius?: number;
  life?: number;
  color?: string;
}> = ({
  cx,
  cy,
  from,
  count = 6,
  interval = 0.42,
  maxRadius = 1100,
  life = 4.2,
  color = COLORS.ink,
}) => {
  const { t } = useSeconds();
  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible" }}
    >
      {Array.from({ length: count }).map((_, i) => {
        const age = t - from - i * interval;
        if (age < 0 || age > life) return null;
        const k = age / life;
        const r = 40 + maxRadius * easeOutCubic(k);
        const o = (1 - k) * (1 - k) * 0.42;
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={1.4 - k}
            opacity={o}
          />
        );
      })}
    </svg>
  );
};
