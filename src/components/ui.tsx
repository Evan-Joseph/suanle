"use client";

import { useEffect, useState, type ReactNode } from "react";

export function Logo({ size = 40, blink = false, bg = false, className = "", onClick }: { size?: number; blink?: boolean; bg?: boolean; className?: string; onClick?: () => void }) {
  return (
    <svg viewBox="0 0 1024 1024" width={size} height={size} className={`${blink ? "logo-blink" : ""} ${className}`} aria-label="算了" onClick={onClick} style={onClick ? { cursor: "pointer" } : undefined}>
      {bg && <rect width="1024" height="1024" rx="230" fill="#FAF9F6" />}
      <g fill="currentColor">
        <g className="eye eye-left">
          <rect x="248" y="248" width="216" height="74" rx="10" />
          <rect x="248" y="356" width="216" height="74" rx="10" />
          <rect x="248" y="464" width="216" height="74" rx="10" />
        </g>
        <g className="eye eye-right">
          <rect x="560" y="248" width="216" height="74" rx="10" />
          <rect x="560" y="356" width="216" height="74" rx="10" />
          <rect x="560" y="464" width="216" height="74" rx="10" />
        </g>
      </g>
      <path d="M 264 600 C 264 776, 760 776, 760 600" fill="none" stroke="currentColor" strokeWidth="64" strokeLinecap="round" />
    </svg>
  );
}

type IconName =
  | "menu" | "plus" | "send" | "stop" | "copy" | "refresh" | "quote" | "share" | "chev" | "close" | "trash"
  | "chat" | "compass" | "me" | "search" | "down" | "check" | "sparkle" | "lamp" | "volume" | "mute" | "download" | "arrow";

const PATHS: Record<IconName, ReactNode> = {
  menu: <path d="M4 7h16M4 12h10M4 17h16" />,
  plus: <path d="M12 5v14M5 12h14" />,
  send: <path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" />,
  stop: <rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" stroke="none" />,
  copy: (<><rect x="8" y="8" width="12" height="12" rx="3" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>),
  refresh: <path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6" />,
  quote: <path d="M7 17c-1.7 0-3-1.3-3-3V11c0-2.8 1.6-4.6 4-5M17 17c-1.7 0-3-1.3-3-3V11c0-2.8 1.6-4.6 4-5M4 11h4v4M14 11h4v4" />,
  share: <path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />,
  chev: <path d="m9 6 6 6-6 6" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  trash: <path d="M5 7h14M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />,
  chat: <path d="M5 18.5V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8.5L5 18.5Z" />,
  compass: (<><circle cx="12" cy="12" r="8.5" /><path d="m15 9-1.8 4.2L9 15l1.8-4.2L15 9Z" /></>),
  me: (<><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" /></>),
  search: (<><circle cx="11" cy="11" r="6" /><path d="m20 20-4.5-4.5" /></>),
  down: <path d="M12 5v14M5.5 12.5 12 19l6.5-6.5" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  sparkle: <path d="M12 3c.6 4.2 2.8 6.4 7 7-4.2.6-6.4 2.8-7 7-.6-4.2-2.8-6.4-7-7 4.2-.6 6.4-2.8 7-7Z" />,
  lamp: <path d="M12 3c2 2.5 3 4.3 3 6a3 3 0 0 1-6 0c0-1.7 1-3.5 3-6ZM8 14h8l-1 6H9l-1-6Z" />,
  volume: <path d="M4 10v4h4l5 4V6L8 10H4ZM16.5 8.5a5 5 0 0 1 0 7" />,
  mute: <path d="M4 10v4h4l5 4V6L8 10H4ZM17 10l4 4M21 10l-4 4" />,
  download: <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19h14" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
};

export function Icon({ name, size = 20, className = "", stroke = 1.7 }: { name: IconName; size?: number; className?: string; stroke?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {PATHS[name]}
    </svg>
  );
}

/** 底部抽屉：带进出动效与遮罩 */
export function Sheet({ open, onClose, children, title, full = false }: { open: boolean; onClose: () => void; children: ReactNode; title?: ReactNode; full?: boolean }) {
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);
  useEffect(() => {
    if (open) {
      setMounted(true);
      setClosing(false);
    } else if (mounted) {
      setClosing(true);
      const t = setTimeout(() => {
        setMounted(false);
        setClosing(false);
      }, 260);
      return () => clearTimeout(t);
    }
  }, [open, mounted]);
  if (!mounted) return null;
  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      <div className={`absolute inset-0 bg-[#2b2b2b]/35 backdrop-blur-[2px] ${closing ? "opacity-0 transition-opacity duration-200" : "anim-fade-in"}`} onClick={onClose} />
      <div
        className={`paper-grain relative flex flex-col rounded-t-[28px] shadow-[0_-10px_40px_rgba(0,0,0,0.12)] ${full ? "h-[92%]" : "max-h-[88%]"}`}
        style={{ animation: `${closing ? "sheet-down" : "sheet-up"} 0.28s cubic-bezier(0.2,0.8,0.2,1) both` }}
      >
        <div className="flex shrink-0 items-center justify-between px-5 pt-3">
          <div className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-[#d8d3c8]" />
          <div className="pt-3 font-song text-[17px] font-bold">{title}</div>
          <button onClick={onClose} className="mt-2 grid h-8 w-8 place-items-center rounded-full bg-black/5 text-ink-2 active:scale-95" aria-label="关闭">
            <Icon name="close" size={16} />
          </button>
        </div>
        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-safe pt-2">{children}</div>
      </div>
    </div>
  );
}

export function Pill({ children, onClick, active = false, className = "" }: { children: ReactNode; onClick?: () => void; active?: boolean; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] transition active:scale-95 ${active ? "border-ink bg-ink text-paper" : "border-line bg-white/70 text-ink-2"} ${className}`}
    >
      {children}
    </button>
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
