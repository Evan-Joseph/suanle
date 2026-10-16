"use client";

import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useEffect } from "react";
import { Compass, MessageCircle, UserRound } from "lucide-react";
import { useApp, useUI, type Tab } from "@/lib/store";
import { haptic } from "@/lib/sound";
import { Icon, SuanleGlyph } from "./icons";
import ChatView from "./chat/ChatView";
import SessionDrawer from "./chat/SessionDrawer";
import ExploreView from "./tools/ExploreView";
import ToolPanels from "./tools/ToolPanels";
import LetGoView from "./letgo/LetGoView";
import MeView from "./me/MeView";
import Sheets from "./sheets/Sheets";

const TABS: { key: Tab; label: string }[] = [
  { key: "chat", label: "聊聊" },
  { key: "explore", label: "占一占" },
  { key: "letgo", label: "算了" },
  { key: "me", label: "我" },
];

function TabIcon({ tab, active }: { tab: Tab; active: boolean }) {
  if (tab === "letgo") return <SuanleGlyph size={24} strong={active} />;
  const C = tab === "chat" ? MessageCircle : tab === "explore" ? Compass : UserRound;
  return <Icon as={C} size={24} strong={active} />;
}

function TabBar() {
  const tab = useUI((s) => s.tab);
  const setTab = useUI((s) => s.setTab);
  return (
    <nav className="pb-safe relative z-30 shrink-0 border-t border-line/80 bg-paper/90 backdrop-blur-md">
      <div className="grid h-[56px] grid-cols-4">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              aria-label={t.label}
              aria-current={active ? "page" : undefined}
              onClick={() => {
                if (!active) haptic(6);
                setTab(t.key);
                if (active && t.key !== "chat") document.querySelector("[data-scroll-root]")?.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`relative flex flex-col items-center justify-center gap-[3px] transition-colors duration-200 ${active ? "text-ink" : "text-mute"}`}
            >
              {active && <motion.span layoutId="tab-indicator" className="absolute top-0 h-[2px] w-7 rounded-full bg-ink" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
              <span className="grid h-6 w-6 place-items-center">
                <TabIcon tab={t.key} active={active} />
              </span>
              <span className={`text-[10.5px] leading-none tracking-wide ${active ? "font-semibold" : ""}`}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function Toast() {
  const text = useUI((s) => s.toastText);
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[16%] z-[70] flex justify-center px-6">
      <AnimatePresence>
        {text && (
          <motion.div
            key={text}
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6 }}
            className="max-w-full rounded-full bg-ink/90 px-4 py-2 text-center text-[13px] text-on-ink shadow-lg"
          >
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AppShell() {
  const tab = useUI((s) => s.tab);
  const keyboard = useUI((s) => s.keyboard);
  const theme = useApp((s) => s.settings.theme);

  // 日夜主题
  useEffect(() => {
    try {
      localStorage.setItem("suanle-theme", theme);
    } catch {
      /* 隐私模式 */
    }
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const night = theme === "night" || (theme === "system" && mq.matches);
      document.documentElement.setAttribute("data-theme", night ? "night" : "day");
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme]);

  // 键盘弹起：跟随可视区域高度，不让整页被顶飞
  useEffect(() => {
    const vv = window.visualViewport;
    let maxH = vv ? vv.height : window.innerHeight;
    const apply = () => {
      const h = vv ? vv.height : window.innerHeight;
      if (h > maxH) maxH = h;
      document.documentElement.style.setProperty("--app-h", `${Math.round(h)}px`);
      const el = document.activeElement;
      const typing = !!el && (el.tagName === "TEXTAREA" || (el.tagName === "INPUT" && (el as HTMLInputElement).type !== "range"));
      const kb = typing && maxH - h > 140;
      if (useUI.getState().keyboard !== kb) useUI.getState().setKeyboard(kb);
      if (vv && vv.offsetTop > 0) window.scrollTo(0, 0);
    };
    const onOrient = () => {
      maxH = 0;
      setTimeout(apply, 350);
    };
    const onFocus = () => setTimeout(apply, 60);
    apply();
    vv?.addEventListener("resize", apply);
    vv?.addEventListener("scroll", apply);
    window.addEventListener("resize", apply);
    window.addEventListener("orientationchange", onOrient);
    document.addEventListener("focusin", onFocus);
    document.addEventListener("focusout", onFocus);
    return () => {
      vv?.removeEventListener("resize", apply);
      vv?.removeEventListener("scroll", apply);
      window.removeEventListener("resize", apply);
      window.removeEventListener("orientationchange", onOrient);
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("focusout", onFocus);
    };
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex w-full justify-center" style={{ height: "var(--app-h)" }}>
        <div className="paper-grain relative flex h-full w-full max-w-[480px] flex-col overflow-hidden sm:border-x sm:border-line/60 sm:shadow-[0_0_80px_rgba(0,0,0,0.07)]">
          <main className="relative min-h-0 flex-1">
            <section
              className={`absolute inset-0 transition-[opacity,visibility] duration-200 ${tab === "chat" ? "visible opacity-100" : "pointer-events-none invisible opacity-0"}`}
              aria-hidden={tab !== "chat"}
            >
              <ChatView />
            </section>
            <AnimatePresence mode="wait" initial={false}>
              {tab !== "chat" && (
                <motion.section
                  key={tab}
                  className="absolute inset-0"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
                >
                  {tab === "explore" ? <ExploreView /> : tab === "letgo" ? <LetGoView /> : <MeView />}
                </motion.section>
              )}
            </AnimatePresence>
            <ToolPanels />
          </main>
          {!keyboard && <TabBar />}
          <SessionDrawer />
          <Sheets />
          <Toast />
        </div>
      </div>
    </MotionConfig>
  );
}
