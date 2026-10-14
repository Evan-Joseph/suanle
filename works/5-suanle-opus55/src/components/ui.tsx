"use client";
import { AnimatePresence, motion } from "framer-motion";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { safeMarkdown } from "@/lib/text";

export function Logo({ size = 32, blink = false, bg = false, className = "" }: { size?: number; blink?: boolean; bg?: boolean; className?: string }) {
  return (
    <svg viewBox="200 200 624 624" width={size} height={size} className={`${blink ? "logo-blink" : ""} ${className}`} aria-label="算了">
      {bg && <rect x="200" y="200" width="624" height="624" rx="140" fill="#FAF9F6" />}
      <g fill="currentColor">
        {[248, 356, 464].map((y) => (
          <g key={y} className="brow">
            <rect x="248" y={y} width="216" height="74" rx="10" />
            <rect x="560" y={y} width="216" height="74" rx="10" />
          </g>
        ))}
      </g>
      <path d="M 264 600 C 264 776, 760 776, 760 600" fill="none" stroke="currentColor" strokeWidth="64" strokeLinecap="round" />
    </svg>
  );
}

export function Sheet({ open, onClose, children, title, tall = false }: { open: boolean; onClose: () => void; children: ReactNode; title?: ReactNode; tall?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="absolute inset-0 z-50 flex flex-col justify-end" initial={{ opacity: 1 }} exit={{ opacity: 1 }}>
          <motion.div
            className="absolute inset-0 bg-[#2b2b2b]/30 backdrop-blur-[2px]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            className={`relative bg-paper rounded-t-[28px] shadow-2xl flex flex-col ${tall ? "max-h-[92%]" : "max-h-[86%]"}`}
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, i) => { if (i.offset.y > 120 || i.velocity.y > 600) onClose(); }}
          >
            <div className="pt-2.5 pb-1 flex justify-center shrink-0"><div className="w-10 h-1 rounded-full bg-paper-3" /></div>
            {title && <div className="px-6 pt-1 pb-3 font-serif text-lg font-bold shrink-0">{title}</div>}
            <div className="overflow-y-auto no-scrollbar px-5 safe-b" onPointerDownCapture={(e) => e.stopPropagation()}>{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const ToastC = createContext<(s: string) => void>(() => {});
export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<{ id: number; text: string } | null>(null);
  const show = useCallback((text: string) => setMsg({ id: Date.now(), text }), []);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 1800);
    return () => clearTimeout(t);
  }, [msg]);
  return (
    <ToastC.Provider value={show}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-[18%] z-[100] flex justify-center">
        <AnimatePresence>
          {msg && (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6 }}
              className="rounded-full bg-ink/90 text-paper text-sm px-4 py-2 shadow-lg">
              {msg.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToastC.Provider>
  );
}
export const useToast = () => useContext(ToastC);

export function Markdown({ text, streaming = false }: { text: string; streaming?: boolean }) {
  return (
    <div className={`md ${streaming ? "caret-last" : ""}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer noopener">{children}</a>
          ),
          img: () => null,
        }}
      >
        {safeMarkdown(text, streaming)}
      </ReactMarkdown>
    </div>
  );
}

export function Chip({ children, onClick, active = false }: { children: ReactNode; onClick?: () => void; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] transition active:scale-95 ${active ? "bg-ink text-paper border-ink" : "border-paper-3 bg-paper text-ink-2 hover:bg-paper-2"}`}
    >
      {children}
    </button>
  );
}
