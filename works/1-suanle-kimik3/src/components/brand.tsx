"use client";

import { motion } from "framer-motion";

/** 品牌标识：坤卦六断爻（一双微眯的笑眼）+ 温暖笃定的微笑曲线 */
export function LogoMark({
  size = 64,
  color = "#262626",
  animated = false,
  className = "",
}: {
  size?: number;
  color?: string;
  animated?: boolean;
  className?: string;
}) {
  const bars = [
    { x: 248, y: 248 }, { x: 560, y: 248 },
    { x: 248, y: 356 }, { x: 560, y: 356 },
    { x: 248, y: 464 }, { x: 560, y: 464 },
  ];
  if (!animated) {
    return (
      <svg viewBox="0 0 1024 1024" width={size} height={size} className={className} aria-label="算了">
        <g fill={color}>
          {bars.map((b, i) => (
            <rect key={i} x={b.x} y={b.y} width={216} height={74} rx={6} />
          ))}
        </g>
        <path d="M 264 600 C 264 776, 760 776, 760 600" fill="none" stroke={color} strokeWidth={64} strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 1024 1024" width={size} height={size} className={className} aria-label="算了">
      <g fill={color}>
        {bars.map((b, i) => (
          <motion.rect
            key={i}
            x={b.x} y={b.y} width={216} height={74} rx={6}
            initial={{ opacity: 0, scaleX: 0.2 }}
            animate={{ opacity: 1, scaleX: 1 }}
            style={{ originX: `${b.x + 108}px`, originY: `${b.y + 37}px` }}
            transition={{ delay: 0.12 * i, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
        ))}
      </g>
      <motion.path
        d="M 264 600 C 264 776, 760 776, 760 600"
        fill="none" stroke={color} strokeWidth={64} strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.8, duration: 0.8, ease: [0.65, 0, 0.35, 1] }}
      />
    </svg>
  );
}

export function WordMark({ className = "", small = false }: { className?: string; small?: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span className={`font-display font-bold tracking-[0.18em] ${small ? "text-lg" : "text-2xl"}`}>算了</span>
      <span className={`font-display tracking-[0.32em] text-faint ${small ? "text-[10px]" : "text-xs"}`}>SUANLE</span>
    </div>
  );
}

/** 六爻细纹章：用于装饰性水印 */
export function KunStrip({ color = "#262626", className = "" }: { color?: string; className?: string }) {
  return (
    <svg viewBox="0 0 512 322" width="100%" height="100%" className={className} aria-hidden>
      <g fill={color}>
        {[0, 1, 2].map((r) => (
          <g key={r}>
            <rect x={0} y={r * 108} width={216} height={74} rx={6} />
            <rect x={296} y={r * 108} width={216} height={74} rx={6} />
          </g>
        ))}
      </g>
    </svg>
  );
}
