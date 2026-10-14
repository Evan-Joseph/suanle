"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CircleUserRound, Compass, MessagesSquare, Sun } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useStore } from "@/lib/store";
import { LogoMark, WordMark } from "./brand";

const NAV = [
  { href: "/", label: "今日", en: "TODAY", icon: Sun },
  { href: "/reading", label: "推演", en: "READING", icon: Compass },
  { href: "/tavern", label: "酒馆", en: "TAVERN", icon: MessagesSquare },
  { href: "/me", label: "我的", en: "MINE", icon: CircleUserRound },
];

function Splash() {
  const { ready } = useStore();
  const [show, setShow] = useState(true);
  useEffect(() => {
    if (ready) {
      const t = setTimeout(() => setShow(false), 650);
      return () => clearTimeout(t);
    }
  }, [ready]);
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-paper"
          exit={{ opacity: 0, y: -14 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <LogoMark size={88} animated />
          <motion.p
            className="mt-8 font-display text-sm tracking-[0.6em] text-ink2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
          >
            算一算，然后，算了
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="min-h-dvh">
      <Splash />
      <div className="grain" aria-hidden />

      {/* ————— 桌面左侧栏 ————— */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[232px] flex-col border-r border-line/70 bg-paper/80 px-8 py-10 backdrop-blur lg:flex">
        <Link href="/" className="group flex flex-col gap-4">
          <LogoMark size={54} className="transition-transform duration-500 group-hover:rotate-[4deg]" />
          <WordMark />
        </Link>

        <nav className="mt-16 flex flex-col gap-1.5">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex items-center gap-3.5 rounded-2xl px-4 py-3"
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-2xl bg-card border border-line"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <item.icon
                  size={19}
                  strokeWidth={1.8}
                  className={`relative z-10 transition-colors ${active ? "text-ink" : "text-faint"}`}
                />
                <span className={`relative z-10 text-[15px] tracking-[0.14em] transition-colors ${active ? "text-ink font-medium" : "text-ink2"}`}>
                  {item.label}
                </span>
                <span className={`relative z-10 ml-auto text-[9px] tracking-[0.3em] transition-colors ${active ? "text-faint" : "text-line"}`}>
                  {item.en}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex items-end justify-between">
          <p className="vertical-rl font-display text-xs tracking-[0.5em] text-faint">
            算一算 · 然后算了吧
          </p>
          <span className="text-[10px] tracking-[0.2em] text-line">EST.2026</span>
        </div>
      </aside>

      {/* ————— 主内容 ————— */}
      <main className="relative mx-auto w-full max-w-[1080px] px-5 pb-32 pt-8 sm:px-8 lg:pl-[280px] lg:pr-10 lg:pt-12 lg:max-w-none">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>
      </main>

      {/* ————— 移动端底部导航 ————— */}
      <nav className="fixed inset-x-4 bottom-4 z-40 lg:hidden">
        <div className="mx-auto flex max-w-md items-center justify-between rounded-[1.6rem] border border-line bg-paper/90 px-2 py-2 shadow-lift backdrop-blur-xl">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-1 flex-col items-center gap-1 rounded-[1.2rem] py-2"
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill-m"
                    className="absolute inset-0 rounded-[1.2rem] bg-card border border-line"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <item.icon size={19} strokeWidth={1.8} className={`relative z-10 ${active ? "text-ink" : "text-faint"}`} />
                <span className={`relative z-10 text-[10px] tracking-[0.2em] ${active ? "text-ink font-medium" : "text-faint"}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
