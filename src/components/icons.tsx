"use client";

import type { LucideIcon } from "lucide-react";

/**
 * 全局图标规范：统一 24 栅格、圆头圆角、绝对线宽。
 * 无论图标渲染成 16px 还是 24px，屏幕上的线条粗细都一致，视觉重量不会失衡。
 */
export const STROKE = 1.6;
export const STROKE_STRONG = 2;

export function Icon({ as: C, size = 20, strong = false, className = "" }: { as: LucideIcon; size?: number; strong?: boolean; className?: string }) {
  return <C size={size} strokeWidth={strong ? STROKE_STRONG : STROKE} absoluteStrokeWidth className={`shrink-0 ${className}`} aria-hidden />;
}

/**
 * 「算了」线性图标：按 Logo 的结构在 24 栅格上重绘——
 * 左三横为左眼、右三横为右眼、下方一道笑弧。与其它线性图标同线宽、同视觉面积。
 */
export function SuanleGlyph({ size = 24, strong = false, className = "" }: { size?: number; strong?: boolean; className?: string }) {
  const sw = ((strong ? STROKE_STRONG : STROKE) * 24) / size;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`} aria-hidden>
      <path d="M3.75 5.25h6M3.75 8.5h6M3.75 11.75h6" />
      <path d="M14.25 5.25h6M14.25 8.5h6M14.25 11.75h6" />
      <path d="M5 15.25c0 4.6 14 4.6 14 0" />
    </svg>
  );
}
