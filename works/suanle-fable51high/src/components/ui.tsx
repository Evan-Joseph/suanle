"use client";

import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useUI } from "@/store/app";

/**
 * 算了 Logo —— 坤卦六断爻为双眼，一弧为笑。
 * 左侧三根爻线是一个整体「左眼」，右侧三根是一个整体「右眼」。
 * 眨眼时整只眼睛（三根爻线）作为一个 <g> 同步缩放，绝不拆开。
 */
export function Logo({ size = 40, blink = true, className = "", color = "currentColor", bg }: { size?: number; blink?: boolean; className?: string; color?: string; bg?: string }) {
  const eye = (x: number, side: "l" | "r") => (
    <g className={blink ? "logo-eye" : undefined} style={blink && side === "r" ? { animationDelay: "0s" } : undefined} fill={color}>
      <rect x={x} y="248" width="216" height="74" rx="22" />
      <rect x={x} y="356" width="216" height="74" rx="22" />
      <rect x={x} y="464" width="216" height="74" rx="22" />
    </g>
  );
  return (
    <svg viewBox="0 0 1024 1024" width={size} height={size} className={className} aria-label="算了" role="img">
      {bg && <rect width="1024" height="1024" rx="220" fill={bg} />}
      <g className={blink ? "logo-breathe" : undefined}>
        {eye(248, "l")}
        {eye(560, "r")}
        <path d="M 264 600 C 264 776, 760 776, 760 600" fill="none" stroke={color} strokeWidth="64" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function Sheet({ open, onClose, title, children, tall }: { open: boolean; onClose: () => void; title?: string; children: ReactNode; tall?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-[60] bg-ink/30 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            role="dialog"
            className={`fixed inset-x-0 bottom-0 z-[61] mx-auto w-full max-w-lg rounded-t-[28px] bg-paper shadow-[0_-10px_40px_rgba(43,42,40,0.15)] sm:bottom-6 sm:rounded-[28px] ${tall ? "max-h-[92dvh]" : "max-h-[86dvh]"} flex flex-col`}
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
          >
            <div className="flex items-center justify-between px-5 pt-3 pb-1">
              <div className="w-9" />
              <div className="h-1.5 w-10 rounded-full bg-ink-4" />
              <button onClick={onClose} aria-label="关闭" className="grid h-9 w-9 place-items-center rounded-full text-ink-3 hover:bg-paper-2"><X size={18} /></button>
            </div>
            {title && <h3 className="px-6 pb-2 text-center font-serif text-lg font-semibold tracking-wide">{title}</h3>}
            <div className="scroll-thin flex-1 overflow-y-auto px-5 pb-[calc(20px+var(--sab))]">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function Toasts() {
  const toasts = useUI((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[calc(14px+var(--sat))] z-[80] flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div key={t.id} initial={{ opacity: 0, y: -10, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.98 }}
            className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm text-paper shadow-soft">
            {t.icon && <span>{t.icon}</span>}<span>{t.text}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function Pill({ children, active, onClick, className = "" }: { children: ReactNode; active?: boolean; onClick?: () => void; className?: string }) {
  return (
    <button onClick={onClick} className={`press shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[13px] transition ${active ? "border-ink bg-ink text-paper" : "border-ink/10 bg-white/60 text-ink-2 hover:border-ink/25"} ${className}`}>
      {children}
    </button>
  );
}

export function SectionTitle({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <div className="mb-3 flex items-end justify-between">
      <h2 className="font-serif text-[17px] font-semibold tracking-wide text-ink">{children}</h2>
      {sub && <span className="text-xs text-ink-3">{sub}</span>}
    </div>
  );
}

/** 卦象小图：自下而上六爻 */
export function HexGlyph({ lines, size = 28, moving = [] as number[], color = "currentColor" }: { lines: number[]; size?: number; moving?: number[]; color?: string }) {
  const h = size, w = size, gap = h / 6;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden>
      {lines.map((v, i) => {
        const y = h - gap * (i + 1) + gap * 0.25;
        const th = gap * 0.5;
        const mv = moving.includes(i + 1);
        const fill = mv ? "#c4553a" : color;
        return v ? <rect key={i} x={0} y={y} width={w} height={th} rx={th / 2} fill={fill} /> : (
          <g key={i}><rect x={0} y={y} width={w * 0.42} height={th} rx={th / 2} fill={fill} /><rect x={w * 0.58} y={y} width={w * 0.42} height={th} rx={th / 2} fill={fill} /></g>
        );
      })}
    </svg>
  );
}
