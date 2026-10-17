import React, { CSSProperties, createContext, useContext } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);
export const easeOutQuint = (p: number) => 1 - Math.pow(1 - p, 5);
export const easeInOutSine = (p: number) => -(Math.cos(Math.PI * p) - 1) / 2;
export const easeInCubic = (p: number) => p * p * p;

/** 场景在全片时间线上的起点（秒），由 MainPromo 的 Scene 包装器注入 */
export const TimeOffsetContext = createContext(0);

/** 当前时间：t 为全片绝对秒数，tLocal 为所在 Sequence 的本地秒数 */
export const useSeconds = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const offset = useContext(TimeOffsetContext);
  return { t: frame / fps + offset, tLocal: frame / fps, frame, fps };
};

/** 线性进度 (from → from+duration) */
export const progressAt = (t: number, from: number, duration: number) =>
  clamp01((t - from) / Math.max(0.0001, duration));

/** 入场/退场综合透明度 */
export const presence = (
  t: number,
  from: number,
  inDur: number,
  exitAt?: number,
  outDur = 0.6,
) => {
  const i = easeOutCubic(progressAt(t, from, inDur));
  const o = exitAt === undefined ? 0 : easeInCubic(progressAt(t, exitAt, outDur));
  return { enter: i, exit: o, opacity: i * (1 - o) };
};

/**
 * 逐字浮现：墨迹由虚到实、由下而上
 */
export const Chars: React.FC<{
  text: string;
  from: number;
  stagger?: number;
  duration?: number;
  exitAt?: number;
  exitDuration?: number;
  style?: CSSProperties;
  charStyle?: CSSProperties;
  rise?: number;
  /** 退场方向：上浮消散 / 原地淡出 */
  exitMode?: "rise" | "fade";
}> = ({
  text,
  from,
  stagger = 0.07,
  duration = 0.8,
  exitAt,
  exitDuration = 0.6,
  style,
  charStyle,
  rise = 18,
  exitMode = "rise",
}) => {
  const { t } = useSeconds();
  const chars = Array.from(text);
  const ep = exitAt === undefined ? 0 : easeInCubic(progressAt(t, exitAt, exitDuration));
  return (
    <span style={{ display: "inline-block", whiteSpace: "pre", ...style }}>
      {chars.map((c, i) => {
        const p = easeOutQuint(progressAt(t, from + i * stagger, duration));
        const y = rise * (1 - p) - (exitMode === "rise" ? 12 * ep : 0);
        const blur = 10 * (1 - p) + 6 * ep;
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: p * (1 - ep),
              transform: `translateY(${y}px)`,
              filter: `blur(${blur.toFixed(2)}px)`,
              ...charStyle,
            }}
          >
            {c === " " ? "\u00A0" : c}
          </span>
        );
      })}
    </span>
  );
};

/**
 * 区块浮现（整体淡入上移、可选退场）
 */
export const Block: React.FC<{
  from: number;
  duration?: number;
  exitAt?: number;
  exitDuration?: number;
  rise?: number;
  blur?: boolean;
  style?: CSSProperties;
  children: React.ReactNode;
}> = ({
  from,
  duration = 0.9,
  exitAt,
  exitDuration = 0.7,
  rise = 24,
  blur = true,
  style,
  children,
}) => {
  const { t } = useSeconds();
  const { enter, exit, opacity } = presence(t, from, duration, exitAt, exitDuration);
  return (
    <div
      style={{
        opacity,
        transform: `translateY(${rise * (1 - enter) - 14 * exit}px)`,
        filter: blur ? `blur(${(8 * (1 - enter) + 6 * exit).toFixed(2)}px)` : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** 细墨线：横向生长的分隔线 */
export const InkLine: React.FC<{
  from: number;
  width: number;
  duration?: number;
  color?: string;
  thickness?: number;
  exitAt?: number;
  style?: CSSProperties;
}> = ({ from, width, duration = 1, color = "#2B2B2B", thickness = 1.5, exitAt, style }) => {
  const { t } = useSeconds();
  const p = easeOutQuint(progressAt(t, from, duration));
  const ep = exitAt === undefined ? 0 : easeInCubic(progressAt(t, exitAt, 0.6));
  return (
    <div
      style={{
        width: width * p,
        height: thickness,
        background: `linear-gradient(90deg, ${color} 0%, ${color} 70%, rgba(0,0,0,0) 100%)`,
        opacity: 0.8 * (1 - ep),
        ...style,
      }}
    />
  );
};
