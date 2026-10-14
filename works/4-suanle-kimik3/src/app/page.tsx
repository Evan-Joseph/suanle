"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookMarked, Coffee, Coins, MessagesSquare, User } from "lucide-react";
import { TabKey, useApp } from "@/store/app";
import { setMuted } from "@/lib/audio";
import { ChatView } from "@/components/chat-view";
import { DivineView } from "@/components/divine/divine-view";
import { ArchiveView } from "@/components/archive-view";
import { MeView } from "@/components/me-view";
import { SessionDrawer, SessionList } from "@/components/session-drawer";
import { Onboarding } from "@/components/onboarding";
import { TipModal } from "@/components/tip-modal";
import { Toaster } from "@/components/toast";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

const TABS: Array<{ key: TabKey; label: string; icon: typeof MessagesSquare }> = [
  { key: "chat", label: "聊聊", icon: MessagesSquare },
  { key: "divine", label: "起卦", icon: Coins },
  { key: "archive", label: "存档", icon: BookMarked },
  { key: "me", label: "知己", icon: User },
];

export default function Page() {
  const [mounted, setMounted] = useState(false);
  const onboarded = useApp((s) => s.onboarded);
  const tab = useApp((s) => s.tab);
  const setTab = useApp((s) => s.setTab);
  const setTipOpen = useApp((s) => s.setTipOpen);
  const muted = useApp((s) => s.muted);

  useEffect(() => setMounted(true), []);
  useEffect(() => setMuted(muted), [muted]);

  if (!mounted) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-paper">
        <Logo size={56} className="animate-pulse text-ink" />
        <p className="text-[11px] tracking-[0.4em] text-mist">炉 火 正 在 升 起 …</p>
      </div>
    );
  }

  if (!onboarded) {
    return <Onboarding />;
  }

  const night = tab === "divine";

  return (
    <div className={cn("grain flex h-dvh overflow-hidden bg-paper text-ink", night && "night grain-dark")}>
      {/* 桌面导航侧栏 */}
      <aside className="hidden w-[64px] shrink-0 flex-col items-center justify-between border-r border-line/70 py-4 lg:flex night:border-white/10">
        <div className="flex flex-col items-center gap-1.5">
          <Logo size={30} className="mb-3 text-ink night:text-gold-2" />
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "no-tap-highlight flex h-11 w-11 items-center justify-center rounded-2xl transition-all",
                  active
                    ? "bg-cinnabar/10 text-cinnabar night:bg-gold-2/15 night:text-gold-2"
                    : "text-mist hover:bg-ink/5 hover:text-ink-2 night:hover:bg-white/10 night:hover:text-moon"
                )}
                title={t.label}
              >
                <t.icon size={19} strokeWidth={active ? 2.2 : 1.8} />
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setTipOpen(true)}
          className="no-tap-highlight flex h-11 w-11 items-center justify-center rounded-2xl text-mist transition-all hover:bg-cinnabar/10 hover:text-cinnabar night:hover:text-gold-2"
          title="添香油"
        >
          <Coffee size={19} />
        </button>
      </aside>

      {/* 桌面会话侧栏（仅聊聊页展示会话列表） */}
      {tab === "chat" && (
        <aside className="hidden w-[292px] shrink-0 border-r border-line/70 bg-paper lg:block night:border-white/10 night:bg-night-2">
          <SessionList />
        </aside>
      )}

      {/* 主区 */}
      <main className="flex min-w-0 flex-1 flex-col">
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              className="flex h-full min-h-0 flex-1 flex-col"
            >
              {tab === "chat" && <ChatView />}
              {tab === "divine" && <DivineView />}
              {tab === "archive" && <ArchiveView />}
              {tab === "me" && <MeView />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 移动端底部导航 */}
        <nav className="safe-b z-40 shrink-0 border-t border-line/70 bg-paper-2/95 backdrop-blur-md lg:hidden night:border-gold-2/15 night:bg-night-2/95">
          <div className="mx-auto flex max-w-[480px] items-stretch justify-between px-6 py-1.5">
            {TABS.map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className="no-tap-highlight relative flex flex-col items-center gap-0.5 px-3 py-1.5"
                >
                  <t.icon
                    size={20}
                    strokeWidth={active ? 2.2 : 1.8}
                    className={cn(
                      "transition-colors",
                      active ? "text-cinnabar night:text-gold-2" : "text-mist"
                    )}
                  />
                  <span
                    className={cn(
                      "text-[10px] tracking-wider transition-colors",
                      active ? "text-cinnabar night:text-gold-2" : "text-mist"
                    )}
                  >
                    {t.label}
                  </span>
                  {active && (
                    <motion.span
                      layoutId="tab-dot"
                      className="absolute -top-[7px] h-1 w-1 rounded-full bg-cinnabar night:bg-gold-2"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </main>

      <SessionDrawer />
      <TipModal />
      <Toaster />
    </div>
  );
}
