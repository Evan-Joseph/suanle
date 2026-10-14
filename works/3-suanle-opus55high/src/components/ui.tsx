"use client";

import { useEffect, useState, type ReactNode } from "react";

export function Logo({ size = 32, blink = false, className = "" }: { size?: number; blink?: boolean; className?: string }) {
  return (
    <svg viewBox="200 200 624 560" width={size} height={size * (560 / 624)} className={className} aria-label="算了">
      <g fill="currentColor" className={blink ? "logo-blink" : ""}>
        {[248, 356, 464].map((y) => (
          <g key={y}>
            <rect x="248" y={y} width="216" height="74" rx="10" />
            <rect x="560" y={y} width="216" height="74" rx="10" />
          </g>
        ))}
      </g>
      <path d="M 264 600 C 264 776, 760 776, 760 600" fill="none" stroke="currentColor" strokeWidth="64" strokeLinecap="round" />
    </svg>
  );
}

export function Sheet({ open, onClose, children, title, full = false }: { open: boolean; onClose: () => void; children: ReactNode; title?: ReactNode; full?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ height: "var(--app-h)" }}>
      <div className="anim-fade absolute inset-0 bg-ink/30 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={`anim-sheet relative flex w-full max-w-[520px] flex-col rounded-t-[28px] bg-paper shadow-[0_-10px_40px_rgba(0,0,0,0.08)] ${full ? "h-[92%]" : "max-h-[90%]"}`}
        style={{ paddingBottom: "max(var(--safe-b), 12px)" }}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex shrink-0 items-center justify-between px-5 pt-3">
          <div className="w-8" />
          <div className="h-1 w-10 rounded-full bg-line" />
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-sub hover:bg-sand" aria-label="关闭">
            <svg width="16" height="16" viewBox="0 0 16 16"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
        </div>
        {title && <div className="shrink-0 px-6 pb-2 pt-1 text-center font-serif text-[17px] text-ink">{title}</div>}
        <div className="scroll-area min-h-0 flex-1 px-5 pb-3">{children}</div>
      </div>
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl bg-white/60 p-4">
          <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Empty({ icon = "☷", title, desc, action }: { icon?: ReactNode; title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-8 py-12 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sand/70 font-serif text-2xl text-sub">{icon}</div>
      <div className="font-serif text-[16px] text-ink">{title}</div>
      {desc && <div className="mt-1.5 max-w-[260px] text-[13px] leading-relaxed text-sub">{desc}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ onRetry, text = "网有点不顺，像极了周一早上的地铁。" }: { onRetry?: () => void; text?: string }) {
  return (
    <div className="flex flex-col items-center px-8 py-10 text-center">
      <div className="text-[13px] text-sub">{text}</div>
      {onRetry && (
        <button onClick={onRetry} className="mt-4 rounded-full border border-line bg-white px-5 py-2 text-[13px] text-ink active:scale-95">
          再试一次
        </button>
      )}
    </div>
  );
}

export function ThinkingCard({ text, done, ms, defaultOpen = false }: { text: string; done: boolean; ms?: number; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (done) return;
    const s = Date.now();
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - s) / 1000)), 500);
    return () => clearInterval(t);
  }, [done]);
  const secs = done ? Math.max(1, Math.round((ms ?? elapsed * 1000) / 1000)) : elapsed;
  if (!text && done) return null;
  return (
    <div className="mb-2 min-w-0">
      <button onClick={() => setOpen((o) => !o)} className="inline-flex items-center gap-1.5 rounded-full bg-sand/70 px-3 py-1 text-[12px] text-sub active:scale-[0.98]">
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${done ? "bg-sage" : "bg-clay breathe"}`} />
        {done ? <span>已梳理心绪（用时 {secs}s）</span> : <span className="shimmer-text">正在梳理卦象与心绪{secs > 0 ? ` · ${secs}s` : ""}</span>}
        <svg width="10" height="10" viewBox="0 0 10 10" className={`transition-transform ${open ? "rotate-180" : ""}`}><path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" /></svg>
      </button>
      {open && text && (
        <div className="anim-fade mt-2 border-l-2 border-line pl-3 text-[12.5px] leading-relaxed whitespace-pre-wrap text-sub">{text}</div>
      )}
    </div>
  );
}

export function Pill({ children, onClick, active = false, className = "" }: { children: ReactNode; onClick?: () => void; active?: boolean; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] whitespace-nowrap transition active:scale-95 ${active ? "border-ink bg-ink text-paper" : "border-line bg-white/80 text-ink-2 hover:border-faint"} ${className}`}
    >
      {children}
    </button>
  );
}

export function PageHeader({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3 px-5 pb-3" style={{ paddingTop: "calc(var(--safe-t) + 18px)" }}>
      <div className="min-w-0">
        <h1 className="truncate font-serif text-[24px] text-ink">{title}</h1>
        {sub && <p className="mt-0.5 truncate text-[13px] text-sub">{sub}</p>}
      </div>
      {right}
    </div>
  );
}
