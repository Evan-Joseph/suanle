"use client";

import { motion, useAnimationControls, useReducedMotion } from "motion/react";
import { useEffect } from "react";

/**
 * 「算了」Logo 的解剖学：
 * 左侧三条短横 = 左眼（整体开合），右侧三条短横 = 右眼（整体开合），下方弧线 = 微笑。
 * 任何动效都只以「一只眼」为单位，绝不让六条短横各自抽动。
 */
export type LogoMood = "idle" | "listen" | "smile" | "rest" | "still";

const EYE_STYLE = { transformBox: "fill-box", transformOrigin: "50% 50%" } as const;
const MOUTH_STYLE = { transformBox: "fill-box", transformOrigin: "50% 0%" } as const;

const LEFT_EYE = [248, 356, 464];

export function Logo({
  size = 40,
  mood = "idle",
  greet = false,
  tile = false,
  className = "",
  label = "算了",
}: {
  size?: number;
  mood?: LogoMood;
  greet?: boolean;
  tile?: boolean;
  className?: string;
  label?: string;
}) {
  const left = useAnimationControls();
  const right = useAnimationControls();
  const mouth = useAnimationControls();
  const reduce = useReducedMotion();

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const both = (v: Parameters<typeof left.start>[0]) => Promise.all([left.start(v), right.start(v)]);

    if (reduce || mood === "still") {
      left.set({ scaleY: mood === "smile" ? 0.3 : 1, y: 0 });
      right.set({ scaleY: mood === "smile" ? 0.3 : 1, y: 0 });
      mouth.set({ scaleY: mood === "smile" ? 1.25 : 1, scaleX: 1 });
      return;
    }

    const blink = async (double: boolean) => {
      await both({ scaleY: [1, 0.08, 1], transition: { duration: 0.24, times: [0, 0.45, 1], ease: "easeInOut" } });
      if (double && alive) await both({ scaleY: [1, 0.08, 1], transition: { duration: 0.22, times: [0, 0.45, 1], ease: "easeInOut", delay: 0.08 } });
    };
    const loop = () => {
      timer = setTimeout(async () => {
        if (!alive) return;
        await blink(Math.random() < 0.18);
        if (alive) loop();
      }, 2600 + Math.random() * 3600);
    };

    if (mood === "idle") {
      void both({ scaleY: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } });
      void mouth.start({ scaleY: 1, scaleX: 1, transition: { duration: 0.4 } });
      if (greet) {
        // 会心一眨：右眼整体合上再睁开，嘴角跟着上扬
        timer = setTimeout(async () => {
          if (!alive) return;
          void mouth.start({ scaleY: [1, 1.24, 1.24, 1], scaleX: [1, 1.04, 1.04, 1], transition: { duration: 1.2, times: [0, 0.25, 0.7, 1] } });
          await right.start({ scaleY: [1, 0.08, 0.08, 1], transition: { duration: 0.55, times: [0, 0.3, 0.62, 1], ease: "easeInOut" } });
          if (alive) loop();
        }, 700);
      } else loop();
    } else if (mood === "listen") {
      // 倾听：双眼微阖，随呼吸轻轻起伏
      void both({ scaleY: [0.4, 0.56, 0.4], y: 0, transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut" } });
      void mouth.start({ scaleY: 0.8, scaleX: 0.96, transition: { duration: 0.5 } });
    } else if (mood === "smile") {
      // 释然：眯眼一笑
      void both({ scaleY: 0.3, y: -26, transition: { type: "spring", stiffness: 260, damping: 18 } });
      void mouth.start({ scaleY: 1.3, scaleX: 1.05, transition: { type: "spring", stiffness: 220, damping: 14 } });
    } else if (mood === "rest") {
      void both({ scaleY: 0.1, y: 10, transition: { duration: 0.6 } });
      void mouth.start({ scaleY: 0.7, scaleX: 1, transition: { duration: 0.6 } });
    }
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
      left.stop();
      right.stop();
      mouth.stop();
    };
  }, [mood, greet, reduce, left, right, mouth]);

  return (
    <svg viewBox="0 0 1024 1024" width={size} height={size} className={`shrink-0 ${className}`} role="img" aria-label={label}>
      {tile && <rect width="1024" height="1024" rx="232" fill="var(--card)" />}
      <motion.g animate={left} style={EYE_STYLE} fill="currentColor">
        {LEFT_EYE.map((y) => (
          <rect key={y} x="248" y={y} width="216" height="74" rx="8" />
        ))}
      </motion.g>
      <motion.g animate={right} style={EYE_STYLE} fill="currentColor">
        {LEFT_EYE.map((y) => (
          <rect key={y} x="560" y={y} width="216" height="74" rx="8" />
        ))}
      </motion.g>
      <motion.path animate={mouth} style={MOUTH_STYLE} d="M 264 600 C 264 776, 760 776, 760 600" fill="none" stroke="currentColor" strokeWidth="64" strokeLinecap="round" />
    </svg>
  );
}
