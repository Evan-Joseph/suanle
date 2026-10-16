import { useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Compass, Feather, MessageCircle, UserRound } from "lucide-react";
import { useApp, useUI, type Tab } from "@/lib/store";
import { todayAlmanac } from "@/lib/divination";
import { maybeRefreshBasis } from "@/lib/engine";
import ChatView from "@/components/chat/ChatView";
import SessionDrawer from "@/components/chat/SessionDrawer";
import ExploreView from "@/components/ExploreView";
import LetGoView from "@/components/LetGoView";
import MeView from "@/components/MeView";
import { LampSheet, ProfileSheet, ShareSheet, TipSheet } from "@/components/Sheets";
import { Logo, Toast } from "@/components/ui";

const TABS: { id: Tab; label: string; Icon: typeof Compass }[] = [
  { id: "chat", label: "对话", Icon: MessageCircle },
  { id: "explore", label: "探索", Icon: Compass },
  { id: "letgo", label: "放下", Icon: Feather },
  { id: "me", label: "我的", Icon: UserRound },
];

function useViewportHeight() {
  useEffect(() => {
    const vv = window.visualViewport;
    const set = () => {
      const h = vv ? vv.height : window.innerHeight;
      document.documentElement.style.setProperty("--app-h", `${h}px`);
      if (vv && vv.offsetTop) window.scrollTo(0, 0);
    };
    set();
    vv?.addEventListener("resize", set);
    vv?.addEventListener("scroll", set);
    window.addEventListener("resize", set);
    return () => {
      vv?.removeEventListener("resize", set);
      vv?.removeEventListener("scroll", set);
      window.removeEventListener("resize", set);
    };
  }, []);
}

function TabBar() {
  const tab = useUI((s) => s.tab);
  const focused = useUI((s) => s.inputFocused);
  const live = useUI((s) => s.live);
  const hide = focused && tab === "chat";
  return (
    <nav className={`shrink-0 border-t border-line/70 bg-paper/85 backdrop-blur-md transition-[height,opacity] duration-200 ${hide ? "pointer-events-none h-0 overflow-hidden opacity-0 sm:pointer-events-auto sm:h-auto sm:opacity-100" : ""}`}>
      <div className="pb-safe mx-auto flex max-w-[560px] items-stretch justify-around px-2 pt-1.5">
        {TABS.map(({ id, label, Icon }) => {
          const active = tab === id;
          return (
            <button key={id} onClick={() => useUI.getState().setTab(id)} className={`relative flex h-12 flex-1 flex-col items-center justify-center gap-0.5 transition ${active ? "text-ink" : "text-mute"}`}>
              <span className="relative">
                <Icon size={21} strokeWidth={active ? 2.1 : 1.7} />
                {id === "chat" && live && tab !== "chat" && <span className="absolute -right-1 -top-0.5 h-2 w-2 rounded-full bg-seal" />}
              </span>
              <span className={`text-[10.5px] ${active ? "font-semibold" : ""}`}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function BrandPanel() {
  const a = useMemo(() => todayAlmanac(), []);
  return (
    <aside className="hidden max-w-[440px] flex-1 flex-col justify-center pr-16 lg:flex">
      <div className="grid h-28 w-28 place-items-center rounded-[34px] bg-paper shadow-[0_12px_40px_rgba(60,40,10,0.10)]">
        <Logo size={76} draw />
      </div>
      <h1 className="mt-10 font-song text-[64px] font-black leading-none tracking-[0.12em]">算了</h1>
      <div className="mt-3 text-[13px] tracking-[0.5em] text-mute">SUANLE</div>
      <p className="mt-8 font-song text-[22px] leading-relaxed text-ink">算一算，然后，算了。</p>
      <p className="mt-4 max-w-[340px] text-[14.5px] leading-[1.9] text-ink-2 [text-wrap:pretty]">
        “算”，是直面未知的勇气；“算了”，是拥抱当下的从容。一个懂八字、六爻、塔罗，更懂人心的老朋友。
      </p>
      <div className="mt-10 flex gap-8 border-t border-line pt-6">
        {[
          ["算一算", "卦象 · 命盘 · 塔罗"],
          ["聊一聊", "心事有人接得住"],
          ["算了", "揉皱，丢掉，放下"],
        ].map(([t, d]) => (
          <div key={t}>
            <div className="font-song text-[15px] font-bold">{t}</div>
            <div className="mt-1 text-[12px] text-mute">{d}</div>
          </div>
        ))}
      </div>
      <div className="mt-10 font-song text-[13.5px] text-ink-2/80">
        {a.dateText} · 农历{a.lunarText} · 「{a.line}」
      </div>
    </aside>
  );
}

export default function App() {
  useViewportHeight();
  const tab = useUI((s) => s.tab);

  useEffect(() => {
    const s = useApp.getState();
    if (!s.usage.basisAt) {
      const t = setTimeout(() => void maybeRefreshBasis(true), 4000);
      return () => clearTimeout(t);
    }
  }, []);

  return (
    <div className="flex h-[var(--app-h,100dvh)] w-full items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_top_left,#f4f1ea,#e9e4d8_60%,#e2dccd)] sm:p-6">
      <BrandPanel />
      <main className="paper-grain relative flex h-full w-full flex-col overflow-hidden sm:h-[min(100%,900px)] sm:max-w-[460px] sm:rounded-[36px] sm:border sm:border-white/70 sm:shadow-[0_30px_80px_rgba(60,40,10,0.16)] lg:max-w-[440px]">
        <div className="pt-safe shrink-0" />
        <div className="relative min-h-0 flex-1">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={tab} className="absolute inset-0" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
              {tab === "chat" && <ChatView />}
              {tab === "explore" && <ExploreView />}
              {tab === "letgo" && <LetGoView />}
              {tab === "me" && <MeView />}
            </motion.div>
          </AnimatePresence>
        </div>
        <TabBar />
        <SessionDrawer />
        <TipSheet />
        <LampSheet />
        <ShareSheet />
        <ProfileSheet />
        <Toast />
      </main>
    </div>
  );
}
