"use client";

import { cn } from "@/lib/utils";

/** 算了 Logo：坤卦六断爻为笑眼，一弧为笑 */
export function Logo({
  size = 40,
  className,
  animated = false,
}: {
  size?: number;
  className?: string;
  animated?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 1024 1024"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      aria-label="算了"
    >
      <g fill="currentColor">
        <rect x="248" y="248" width="216" height="74" rx="10" className={animated ? "anim-rise" : ""} style={{ animationDelay: "0.1s" }} />
        <rect x="248" y="356" width="216" height="74" rx="10" className={animated ? "anim-rise" : ""} style={{ animationDelay: "0.22s" }} />
        <rect x="248" y="464" width="216" height="74" rx="10" className={animated ? "anim-rise" : ""} style={{ animationDelay: "0.34s" }} />
        <rect x="560" y="248" width="216" height="74" rx="10" className={animated ? "anim-rise" : ""} style={{ animationDelay: "0.16s" }} />
        <rect x="560" y="356" width="216" height="74" rx="10" className={animated ? "anim-rise" : ""} style={{ animationDelay: "0.28s" }} />
        <rect x="560" y="464" width="216" height="74" rx="10" className={animated ? "anim-rise" : ""} style={{ animationDelay: "0.4s" }} />
      </g>
      <path
        d="M 264 600 C 264 776, 760 776, 760 600"
        fill="none"
        stroke="currentColor"
        strokeWidth="64"
        strokeLinecap="round"
        className={animated ? "smile-draw" : ""}
        pathLength={1}
        strokeDasharray={animated ? 1 : 0}
        strokeDashoffset={animated ? 1 : 0}
        style={
          animated
            ? { animation: "smile 0.9s cubic-bezier(0.22,1,0.36,1) 0.55s forwards" }
            : undefined
        }
      />
      <style>{`@keyframes smile { to { stroke-dashoffset: 0; } }`}</style>
    </svg>
  );
}

/** 大师印章：朱文方印 */
export function PersonaSeal({
  glyph,
  hue,
  size = 36,
  className,
}: {
  glyph: string;
  hue: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-[22%] border font-display select-none shrink-0",
        className
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.52,
        color: hue,
        borderColor: `${hue}66`,
        background: `linear-gradient(135deg, ${hue}14, ${hue}05)`,
        boxShadow: `inset 0 0 0 1px ${hue}22`,
      }}
    >
      {glyph}
    </span>
  );
}
