"use client";

import { AnimatePresence, motion, useDragControls } from "motion/react";
import type { ReactNode } from "react";
import { ChevronLeft, X } from "lucide-react";
import { Icon } from "./icons";
import { Logo } from "./brand/Logo";

export function IconButton({
  label,
  onClick,
  children,
  className = "",
  size = 40,
  disabled = false,
}: {
  label: string;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  size?: number;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      onPointerDown={(e) => e.stopPropagation()}
      className={`grid shrink-0 place-items-center rounded-full text-ink-2 transition-[transform,background-color,color] duration-150 hover:bg-ink/[0.06] active:scale-90 disabled:opacity-35 ${className}`}
      style={{ width: size, height: size }}
    >
      {children}
    </button>
  );
}

export function Pill({ children, onClick, active = false, className = "" }: { children: ReactNode; onClick?: () => void; active?: boolean; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] leading-none transition active:scale-95 ${
        active ? "border-ink bg-ink text-on-ink" : "border-line bg-card/70 text-ink-2"
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function PrimaryButton({ children, onClick, disabled = false, className = "" }: { children: ReactNode; onClick?: () => void; disabled?: boolean; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-ink text-[15.5px] font-medium tracking-[0.08em] text-on-ink shadow-[0_6px_18px_rgba(0,0,0,0.12)] transition active:scale-[0.98] disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, onClick, className = "" }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button type="button" onClick={onClick} className={`inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-2xl text-[14px] text-ink-2 transition active:scale-[0.98] ${className}`}>
      {children}
    </button>
  );
}

export function Card({ children, className = "", onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  const cls = `rounded-[22px] border border-line bg-card/80 shadow-[0_2px_14px_rgba(60,40,10,0.04)] ${className}`;
  if (onClick)
    return (
      <button type="button" onClick={onClick} className={`${cls} block w-full text-left transition active:scale-[0.985]`}>
        {children}
      </button>
    );
  return <div className={cls}>{children}</div>;
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-2.5 mt-7 flex items-end justify-between px-1">
      <h3 className="font-song text-[16px] font-bold tracking-wide">{children}</h3>
      {action}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-xl ${className}`} />;
}

/** 底部抽屉：从把手区域下拉即可收起，带阻尼回弹 */
export function Sheet({ open, onClose, title, children, full = false }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; full?: boolean }) {
  const controls = useDragControls();
  return (
    <AnimatePresence>
      {open && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true">
          <motion.div className="absolute inset-0 bg-black/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={onClose} />
          <motion.div
            className={`paper-grain relative flex flex-col rounded-t-[28px] shadow-[0_-12px_40px_rgba(0,0,0,0.14)] ${full ? "h-[92%]" : "max-h-[90%]"}`}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            drag="y"
            dragListener={false}
            dragControls={controls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.04, bottom: 0.7 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 650) onClose();
            }}
          >
            <div className="shrink-0 cursor-grab touch-none px-5 pb-1 pt-2.5" onPointerDown={(e) => controls.start(e)}>
              <div className="mx-auto h-1 w-10 rounded-full bg-faint" />
              {title ? (
                <div className="mt-2.5 flex min-h-9 items-center justify-between gap-3">
                  <h2 className="min-w-0 truncate font-song text-[18px] font-bold">{title}</h2>
                  <IconButton label="关闭" size={34} onClick={onClose} className="bg-ink/[0.05]">
                    <Icon as={X} size={17} />
                  </IconButton>
                </div>
              ) : null}
            </div>
            <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-2">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/** 左侧抽屉 */
export function Drawer({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="absolute inset-0 z-50" role="dialog" aria-modal="true">
          <motion.div className="absolute inset-0 bg-black/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside
            className="paper-grain absolute inset-y-0 left-0 flex w-[84%] max-w-[360px] flex-col shadow-[12px_0_40px_rgba(0,0,0,0.14)]"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 40 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0.7, right: 0.04 }}
            dragDirectionLock
            onDragEnd={(_, info) => {
              if (info.offset.x < -90 || info.velocity.x < -600) onClose();
            }}
          >
            {children}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

/** 全屏面板：从右侧滑入，左缘或标题栏右滑返回 */
export function Panel({ open, onClose, title, right, children }: { open: boolean; onClose: () => void; title: ReactNode; right?: ReactNode; children: ReactNode }) {
  const controls = useDragControls();
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="paper-grain absolute inset-0 z-40 flex flex-col"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 360, damping: 40 }}
          drag="x"
          dragListener={false}
          dragControls={controls}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={{ left: 0, right: 0.85 }}
          onDragEnd={(_, info) => {
            if (info.offset.x > 100 || info.velocity.x > 600) onClose();
          }}
        >
          <div className="absolute inset-y-0 left-0 z-10 w-4 touch-none" onPointerDown={(e) => controls.start(e)} />
          <header className="pt-safe shrink-0 touch-none border-b border-line/70" onPointerDown={(e) => controls.start(e)}>
            <div className="flex h-12 items-center px-1.5">
              <IconButton label="返回" onClick={onClose}>
                <Icon as={ChevronLeft} size={22} />
              </IconButton>
              <h2 className="min-w-0 flex-1 truncate text-center font-song text-[17px] font-bold">{title}</h2>
              <div className="flex w-10 justify-center">{right}</div>
            </div>
          </header>
          <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** 首屏骨架：数据从本地取回之前的占位 */
export function Splash() {
  return (
    <div className="flex w-full justify-center" style={{ height: "var(--app-h)" }}>
      <div className="paper-grain relative flex h-full w-full max-w-[480px] flex-col overflow-hidden">
        <div className="pt-safe">
          <div className="flex h-12 items-center justify-between px-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-ink">
          <Logo size={76} mood="still" />
          <Skeleton className="mt-7 h-6 w-44" />
          <Skeleton className="mt-3 h-4 w-64" />
          <Skeleton className="mt-2 h-4 w-52" />
          <div className="mt-9 grid w-full max-w-[340px] grid-cols-2 gap-2.5">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[74px] rounded-[20px]" />
            ))}
          </div>
        </div>
        <div className="px-3 pb-3">
          <Skeleton className="h-[92px] rounded-[24px]" />
        </div>
        <div className="pb-safe border-t border-line">
          <div className="grid h-[56px] grid-cols-4 place-items-center">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-6 w-6 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function timeAgo(ts: number) {
  const d = Date.now() - ts;
  if (d < 60000) return "刚刚";
  if (d < 3600000) return `${Math.floor(d / 60000)} 分钟前`;
  if (d < 86400000) return `${Math.floor(d / 3600000)} 小时前`;
  if (d < 86400000 * 7) return `${Math.floor(d / 86400000)} 天前`;
  const t = new Date(ts);
  return `${t.getMonth() + 1}月${t.getDate()}日`;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    ta.remove();
    return ok;
  }
}
