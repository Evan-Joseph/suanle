"use client";

import { useEffect } from "react";
import { useApp, useUI, type Tab } from "@/lib/store";
import { Icon, Logo } from "./ui";
import ChatView from "./chat/ChatView";
import ExploreView from "./explore/ExploreView";
import LetGoView from "./letgo/LetGoView";
import MeView from "./me/MeView";
import TipSheet from "./sheets/TipSheet";
import LampSheet from "./sheets/LampSheet";
import ShareSheet from "./sheets/ShareSheet";
import { haptic } from "@/lib/sound";

const TABS: { key: Tab; label: string; icon: "chat" | "compass" | "me" | null }[] = [
  { key: "chat", label: "聊聊", icon: "chat" },
  { key: "explore", label: "占一占", icon: "compass" },
  { key: "letgo", label: "算了", icon: null },
  { key: "me", label: "我", icon: "me" },
];

export default function AppShell() {
  const tab = useUI((s) => s.tab);
  const setTab = useUI((s) => s.setTab);
  const focused = useUI((s) => s.inputFocused);
  const toastText = useUI((s) => s.toastText);

  // 键盘弹起时，跟随可视区域高度，避免整页被顶起或抖动
  useEffect(() => {
    const vv = window.visualViewport;
    const apply = () => {
      const h = vv ? vv.height : window.innerHeight;
      document.documentElement.style.setProperty("--app-h", `${Math.round(h)}px`);
      if (vv && vv.offsetTop > 0) window.scrollTo(0, 0);
    };
    apply();
    vv?.addEventListener("resize", apply);
    vv?.addEventListener("scroll", apply);
    window.addEventListener("resize", apply);
    return () => {
      vv?.removeEventListener("resize", apply);
      vv?.removeEventListener("scroll", apply);
      window.removeEventListener("resize", apply);
    };
  }, []);

  const sessionsCount = useApp((s) => s.sessions.length);
  useEffect(() => {
    document.title = sessionsCount ? "算了 · Suanle" : "算了 · 算一算，然后，算了。";
  }, [sessionsCount]);

  return (
    <div className="flex w-full justify-center" style={{ height: "var(--app-h)" }}>
      <div className="paper-grain relative flex h-full w-full max-w-[480px] flex-col overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.06)]">
        <main className="relative min-h-0 flex-1">
          <section className={`absolute inset-0 ${tab === "chat" ? "" : "invisible pointer-events-none"}`} aria-hidden={tab !== "chat"}>
            <ChatView />
          </section>
          {tab === "explore" && (
            <section className="absolute inset-0 anim-fade-in">
              <ExploreView />
            </section>
          )}
          {tab === "letgo" && (
            <section className="absolute inset-0 anim-fade-in">
              <LetGoView />
            </section>
          )}
          {tab === "me" && (
            <section className="absolute inset-0 anim-fade-in">
              <MeView />
            </section>
          )}
        </main>

        {!focused && (
          <nav className="relative z-30 shrink-0 border-t border-line/70 bg-paper/90 backdrop-blur pb-safe">
            <div className="grid grid-cols-4 px-2 pt-1.5">
              {TABS.map((t) => {
                const active = tab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => {
                      if (tab !== t.key) haptic(6);
                      setTab(t.key);
                    }}
                    className={`flex flex-col items-center gap-0.5 py-1 transition ${active ? "text-ink" : "text-mute"}`}
                  >
                    {t.icon ? (
                      <Icon name={t.icon} size={23} stroke={active ? 2 : 1.6} />
                    ) : (
                      <span className={`grid h-[23px] w-[23px] place-items-center rounded-[7px] transition ${active ? "bg-ink text-paper" : "bg-transparent text-mute"}`}>
                        <Logo size={20} />
                      </span>
                    )}
                    <span className={`text-[10.5px] ${active ? "font-semibold" : ""}`}>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        )}

        <TipSheet />
        <LampSheet />
        <ShareSheet />

        {toastText && (
          <div className="pointer-events-none absolute inset-x-0 top-[18%] z-[60] flex justify-center">
            <div className="anim-fade-up rounded-full bg-ink/90 px-4 py-2 text-[13px] text-paper shadow-lg">{toastText}</div>
          </div>
        )}
      </div>
    </div>
  );
}
