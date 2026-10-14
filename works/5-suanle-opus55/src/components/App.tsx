"use client";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Sparkles, User } from "lucide-react";
import { useEffect, useState } from "react";
import { StoreProvider, useApp } from "@/lib/store";
import { setMuted, sfx } from "@/lib/sound";
import ChatView from "./ChatView";
import ExploreView from "./ExploreView";
import MeView from "./MeView";
import { SessionDrawer, ShareSheet, TipSheet } from "./sheets";
import { Logo, ToastProvider } from "./ui";

type Tab = "chat" | "explore" | "me";

function Shell() {
  const { ready, state } = useApp();
  const [tab, setTab] = useState<Tab>("chat");
  const [drawer, setDrawer] = useState(false);
  const [tip, setTip] = useState(false);
  const [share, setShare] = useState<{ q: string; a: string } | null>(null);
  const [typing, setTyping] = useState(false);
  const [pendingTick, setPendingTick] = useState(0);
  const [splash, setSplash] = useState(true);

  useEffect(() => {
    if (ready) setMuted(state.muted);
  }, [ready, state.muted]);
  useEffect(() => {
    const t = setTimeout(() => setSplash(false), 900);
    return () => clearTimeout(t);
  }, []);

  const tabs: { id: Tab; label: string; icon: typeof MessageCircle }[] = [
    { id: "chat", label: "聊聊", icon: MessageCircle },
    { id: "explore", label: "小仪式", icon: Sparkles },
    { id: "me", label: "我", icon: User },
  ];

  return (
    <div className="app-frame paper-grain">
      <AnimatePresence>
        {(!ready || splash) && (
          <motion.div key="splash" className="absolute inset-0 z-[60] bg-paper flex flex-col items-center justify-center" exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }} className="text-ink"><Logo size={84} blink /></motion.div>
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="font-serif text-[15px] tracking-[0.3em] text-ink-2 mt-6">算一算，然后，算了。</motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {ready && (
        <>
          <main className="flex-1 min-h-0 relative">
            <div className={`absolute inset-0 ${tab === "chat" ? "" : "invisible pointer-events-none"}`} aria-hidden={tab !== "chat"}>
              <ChatView pendingTick={pendingTick} onOpenDrawer={() => setDrawer(true)} onTip={() => setTip(true)} onShare={(q, a) => setShare({ q, a })} onFocusChange={setTyping} />
            </div>
            {tab === "explore" && <div className="absolute inset-0"><ExploreView goChat={() => { setTab("chat"); setPendingTick((x) => x + 1); }} /></div>}
            {tab === "me" && <div className="absolute inset-0"><MeView onTip={() => setTip(true)} /></div>}
          </main>

          {!(typing && tab === "chat") && (
            <nav className="shrink-0 border-t border-paper-3/70 bg-paper/90 backdrop-blur-md safe-b">
              <div className="flex h-[54px]">
                {tabs.map(({ id, label, icon: Icon }) => (
                  <button key={id} onClick={() => { if (tab !== id) sfx.tap(); setTab(id); }} className="flex-1 flex flex-col items-center justify-center gap-0.5 relative">
                    <Icon size={21} strokeWidth={tab === id ? 2.3 : 1.7} className={tab === id ? "text-ink" : "text-ink-3"} />
                    <span className={`text-[10px] ${tab === id ? "text-ink font-medium" : "text-ink-3"}`}>{label}</span>
                    {tab === id && <motion.span layoutId="tabdot" className="absolute top-1 w-1 h-1 rounded-full bg-cinnabar" />}
                  </button>
                ))}
              </div>
            </nav>
          )}

          <SessionDrawer open={drawer} onClose={() => setDrawer(false)} onPick={() => { setDrawer(false); setTab("chat"); }} />
          <TipSheet open={tip} onClose={() => setTip(false)} />
          <ShareSheet data={share} onClose={() => setShare(null)} />
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <Shell />
      </ToastProvider>
    </StoreProvider>
  );
}
