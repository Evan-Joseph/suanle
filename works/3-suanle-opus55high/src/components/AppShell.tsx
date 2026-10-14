"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { haptic, refreshUser } from "@/lib/client";
import PayModal, { type PayRequest } from "./PayModal";

type Ctx = { toast: (msg: string) => void; openPay: (req: PayRequest) => void; keyboard: boolean };
const AppCtx = createContext<Ctx>({ toast: () => {}, openPay: () => {}, keyboard: false });
export const useApp = () => useContext(AppCtx);

const TABS = [
  { href: "/", label: "聊聊", icon: (a: boolean) => <path d="M4 12.5c0-4.1 3.6-7.5 8-7.5s8 3.4 8 7.5S16.4 20 12 20c-1.2 0-2.3-.2-3.3-.6L4.5 20.5l1.2-3.4C4.6 15.8 4 14.2 4 12.5z" fill={a ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /> },
  { href: "/tools", label: "算一算", icon: (a: boolean) => <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">{[6, 10.5, 15].map((y, i) => <g key={y}>{i === 1 && !a ? <><path d={`M4 ${y}h6.5`} /><path d={`M13.5 ${y}H20`} /></> : <path d={`M4 ${y}h16`} />}</g>)}<path d="M7 19.5c1.5 1.2 8.5 1.2 10 0" /></g> },
  { href: "/letgo", label: "算了", icon: (a: boolean) => <g stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><path d="M6 8h12l-1.2 11.2a1.5 1.5 0 0 1-1.5 1.3H8.7a1.5 1.5 0 0 1-1.5-1.3L6 8z" fill={a ? "currentColor" : "none"} /><path d="M4.5 8h15" strokeLinecap="round" /><circle cx="12" cy="4.6" r="2" fill={a ? "currentColor" : "none"} /></g> },
  { href: "/me", label: "我的", icon: (a: boolean) => <g stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="8.5" r="3.6" fill={a ? "currentColor" : "none"} /><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" strokeLinecap="round" fill={a ? "currentColor" : "none"} /></g> },
];

function TabBar() {
  const path = usePathname();
  return (
    <nav className="relative z-30 shrink-0 border-t border-line/80 bg-paper/95 backdrop-blur" style={{ paddingBottom: "var(--safe-b)" }}>
      <div className="grid grid-cols-4">
        {TABS.map((t) => {
          const active = t.href === "/" ? path === "/" : path.startsWith(t.href);
          return (
            <Link key={t.href} href={t.href} onClick={() => haptic(6)} className={`flex flex-col items-center gap-0.5 pt-2 pb-1.5 transition-colors ${active ? "text-ink" : "text-faint"}`}>
              <svg width="24" height="24" viewBox="0 0 24 24">{t.icon(active)}</svg>
              <span className="text-[10.5px] tracking-wide">{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [pay, setPay] = useState<PayRequest | null>(null);
  const [keyboard, setKeyboard] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    refreshUser();
    const vv = window.visualViewport;
    const apply = () => {
      const h = vv ? vv.height : window.innerHeight;
      document.documentElement.style.setProperty("--app-h", `${h}px`);
      setKeyboard(vv ? window.innerHeight - vv.height > 140 : false);
      if (vv && vv.offsetTop > 0) window.scrollTo(0, 0);
    };
    apply();
    vv?.addEventListener("resize", apply);
    vv?.addEventListener("scroll", apply);
    window.addEventListener("resize", apply);
    const online = () => refreshUser();
    window.addEventListener("online", online);
    return () => {
      vv?.removeEventListener("resize", apply);
      vv?.removeEventListener("scroll", apply);
      window.removeEventListener("resize", apply);
      window.removeEventListener("online", online);
    };
  }, []);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 2400);
  }, []);
  const openPay = useCallback((req: PayRequest) => setPay(req), []);

  const hideTabs = path.startsWith("/admin") || keyboard;

  return (
    <AppCtx.Provider value={{ toast, openPay, keyboard }}>
      <div className="fixed inset-0 bg-paper-2 sm:bg-[radial-gradient(circle_at_30%_20%,#f6f3ee,#ece7df)]" />
      <div className="relative mx-auto flex w-full max-w-[520px] flex-col bg-paper sm:shadow-[0_0_60px_rgba(0,0,0,0.06)]" style={{ height: "var(--app-h)" }}>
        <main className="relative min-h-0 flex-1">{children}</main>
        {!hideTabs && <TabBar />}
      </div>
      {toastMsg && (
        <div className="pointer-events-none fixed inset-x-0 z-[70] flex justify-center px-6" style={{ top: "calc(var(--safe-t) + 16px)" }}>
          <div className="anim-fade-up max-w-[360px] rounded-full bg-ink/90 px-4 py-2 text-center text-[13px] text-paper shadow-lg">{toastMsg}</div>
        </div>
      )}
      <PayModal req={pay} onClose={() => setPay(null)} toast={toast} />
    </AppCtx.Provider>
  );
}
