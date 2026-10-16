"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { MessageCircle, Compass, Trash2, UserRound } from "lucide-react";
import { useApp, useUI, pullCloud, type Tab } from "@/store/app";
import ChatView from "@/components/chat/ChatView";
import ExploreView from "@/components/explore/ExploreView";
import LetGoView from "@/components/letgo/LetGoView";
import MeView from "@/components/me/MeView";
import SessionDrawer from "@/components/chat/SessionDrawer";
import Sheets from "@/components/sheets/Sheets";
import { Logo, Toasts } from "@/components/ui";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "chat", label: "聊", icon: <MessageCircle size={21} /> },
  { id: "explore", label: "探", icon: <Compass size={21} /> },
  { id: "letgo", label: "放", icon: <Trash2 size={21} /> },
  { id: "me", label: "我", icon: <UserRound size={21} /> },
];

export default function App() {
  const tab = useUI((s) => s.tab);
  const setTab = useUI((s) => s.setTab);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // 等待 localStorage 水合，避免闪烁
    const unsub = useApp.persist.onFinishHydration(() => setReady(true));
    const t = setTimeout(() => { setReady(true); void pullCloud(); }, useApp.persist.hasHydrated() ? 0 : 400);
    return () => { unsub(); clearTimeout(t); };
  }, []);

  if (!ready) {
    return (
      <div className="grid h-full place-items-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3 text-ink"><Logo size={72} /><span className="font-serif text-xs tracking-[0.3em] text-ink-3">算了</span></motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-[1100px] sm:px-4 sm:py-4">
      {/* 桌面侧栏 */}
      <nav className="hidden w-[200px] shrink-0 flex-col pr-4 sm:flex">
        <button onClick={() => setTab("chat")} className="flex items-center gap-2.5 px-3 py-3 text-left">
          <Logo size={30} />
          <span><span className="block font-serif text-[17px] font-semibold tracking-wide">算了</span><span className="block text-[10px] tracking-widest text-ink-3">SUANLE</span></span>
        </button>
        <div className="mt-4 flex flex-col gap-1">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] transition ${tab === t.id ? "bg-ink text-paper" : "text-ink-2 hover:bg-white/60"}`}>
              {t.icon}<span>{t.label}{{ chat: "一聊", explore: "一探", letgo: "下", me: "" }[t.id]}</span>
            </button>
          ))}
        </div>
        <p className="mt-auto px-3 pb-2 font-serif text-[11px] leading-relaxed tracking-wider text-ink-4">算一算，<br />然后，算了。</p>
      </nav>

      {/* 主区域 */}
      <main className="relative flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-paper/60 sm:rounded-[28px] sm:border sm:border-ink/8 sm:shadow-card">
        <div className="relative min-h-0 flex-1">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={tab} className="absolute inset-0" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
              {tab === "chat" && <ChatView />}
              {tab === "explore" && <ExploreView />}
              {tab === "letgo" && <LetGoView />}
              {tab === "me" && <MeView />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 移动端底栏 */}
        <nav className="flex shrink-0 items-stretch justify-around border-t border-ink/8 bg-paper/90 pb-[var(--sab)] backdrop-blur sm:hidden">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] transition ${tab === t.id ? "text-ink" : "text-ink-4"}`}>
              {tab === t.id && <motion.span layoutId="tab-dot" className="absolute top-0 h-[2px] w-8 rounded-full bg-ink" />}
              {t.icon}<span>{t.label}</span>
            </button>
          ))}
        </nav>
      </main>

      <SessionDrawer />
      <Sheets />
      <Toasts />
    </div>
  );
}
