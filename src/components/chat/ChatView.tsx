"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, CalendarDays, Coins, History, Layers, MessageCircle, ScrollText, SquarePen } from "lucide-react";
import { dayKey, lampActive, profileHint, todayUsage, useApp, useUI, type Msg } from "@/lib/store";
import { greeting } from "@/lib/mock";
import { compact, localAnalogy, NUDGE_TOKENS } from "@/lib/meter";
import { Logo } from "../brand/Logo";
import { Icon } from "../icons";
import { IconButton } from "../ui";
import Composer from "./Composer";
import MessageItem from "./Message";
import { newChat, openWidget, sendMessage } from "./engine";

function Welcome() {
  const name = useApp((s) => s.profile.name);
  const birth = useApp((s) => s.profile.birth);
  const g = greeting(name);
  const cards = [
    { icon: MessageCircle, title: "聊聊心事", sub: "说出来就轻了", run: () => void sendMessage("最近心里有点乱，想找人说说。") },
    { icon: Coins, title: "摇一卦", sub: "问一件具体的事", run: () => openWidget("coins") },
    { icon: Layers, title: "三张塔罗", sub: "看看此刻的心境", run: () => openWidget("tarot") },
    birth
      ? { icon: ScrollText, title: "我的命盘", sub: "八字与大运", run: () => openWidget("bazi") }
      : { icon: CalendarDays, title: "今日黄历", sub: "宜忌与小确定", run: () => openWidget("almanac") },
  ];
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 pb-8 pt-4 text-center">
      <div className="text-ink">
        <Logo size={84} greet />
      </div>
      <h1 className="mt-6 font-song text-[25px] font-bold tracking-wide text-ink">{g.title}</h1>
      <p className="mt-2.5 max-w-[320px] text-[14.5px] leading-relaxed text-ink-2">{g.sub}</p>
      <div className="mt-8 grid w-full max-w-[360px] grid-cols-2 gap-2.5">
        {cards.map((c, i) => (
          <motion.button
            key={c.title}
            type="button"
            onClick={c.run}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.06, duration: 0.32 }}
            className="flex items-center gap-3 rounded-[20px] border border-line bg-card/80 p-3.5 text-left transition-transform active:scale-[0.97]"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-paper-2 text-ink">
              <Icon as={c.icon} size={19} />
            </span>
            <span className="min-w-0">
              <span className="block text-[14px] font-semibold text-ink">{c.title}</span>
              <span className="mt-0.5 block truncate text-[11.5px] text-mute">{c.sub}</span>
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function Nudge() {
  const tokens = useApp((s) => todayUsage(s));
  const hint = useApp((s) => profileHint(s.profile));
  const items = localAnalogy(tokens, hint, 2, 3);
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-4 rounded-[22px] border border-line bg-card/85 p-4">
      <p className="text-[13.5px] leading-relaxed text-ink-2">
        今天陪你聊了 <b className="font-semibold text-ink">{compact(tokens)}</b> 算力，差不多是{items.map((i) => i.text).join("、")}。要是觉得有点用，随喜一下，小馆的灯就一直亮着。
      </p>
      <div className="mt-3 flex items-center gap-2">
        <button type="button" onClick={() => useUI.getState().open("tip", { from: "nudge" })} className="h-9 rounded-full bg-ink px-4 text-[13px] text-on-ink transition active:scale-95">
          随喜一下
        </button>
        <button type="button" onClick={() => useApp.getState().dismissNudge()} className="h-9 rounded-full px-3 text-[13px] text-mute">
          下次吧
        </button>
      </div>
    </motion.div>
  );
}

export default function ChatView() {
  const session = useApp((s) => s.sessions.find((x) => x.id === s.currentId) ?? null);
  const live = useUI((s) => s.live);
  const [mountedAt] = useState(() => Date.now());
  const lastTipAt = useApp((s) => s.merit.lastAt);
  const nudgeDue = useApp((s) => todayUsage(s) >= NUDGE_TOKENS && s.nudgeDay !== dayKey() && !lampActive(s));
  const showNudge = nudgeDue && mountedAt - lastTipAt > 3 * 86400000;
  const scrollRef = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const [showDown, setShowDown] = useState(false);

  const messages = useMemo(() => session?.messages ?? [], [session]);
  const liveHere = live && session && live.sessionId === session.id ? live : null;
  const list: Msg[] = useMemo(
    () => (liveHere ? [...messages, { id: liveHere.msgId, role: "assistant", content: liveHere.content, createdAt: liveHere.started, deep: liveHere.deep }] : messages),
    [messages, liveHere],
  );
  const hasMsgs = messages.length > 0;

  useEffect(() => {
    const el = scrollRef.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [list.length, liveHere?.content]);

  useEffect(() => {
    stick.current = true;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [session?.id]);

  useEffect(() => {
    const f = () => {
      stick.current = true;
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }));
    };
    window.addEventListener("suanle:sent", f);
    return () => window.removeEventListener("suanle:sent", f);
  }, []);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    stick.current = dist < 80;
    setShowDown(dist > 260);
  };

  return (
    <div className="flex h-full flex-col">
      <header className="pt-safe relative z-10 shrink-0">
        <div className="flex h-12 items-center px-1.5">
          <IconButton label="聊过的事" onClick={() => useUI.getState().open("sessions")}>
            <Icon as={History} size={20} />
          </IconButton>
          <div className="min-w-0 flex-1 px-2 text-center">
            {hasMsgs && session ? (
              <div className="truncate text-[15px] font-semibold text-ink">{session.title}</div>
            ) : (
              <div className="inline-flex items-center gap-1.5 text-ink">
                <Logo size={20} mood="still" />
                <span className="font-song text-[16px] font-bold tracking-wider">算了</span>
              </div>
            )}
          </div>
          <IconButton label="新对话" onClick={newChat} disabled={!hasMsgs}>
            <Icon as={SquarePen} size={20} />
          </IconButton>
        </div>
      </header>
      <div className="relative min-h-0 flex-1">
        <div ref={scrollRef} onScroll={onScroll} className="no-scrollbar absolute inset-0 overflow-y-auto overscroll-contain">
          {hasMsgs && session ? (
            <div className="space-y-6 pb-5 pt-2">
              {list.map((m, i) => (
                <MessageItem
                  key={m.id}
                  msg={m}
                  sessionId={session.id}
                  isLast={i === list.length - 1}
                  streaming={!!liveHere && m.id === liveHere.msgId}
                  prevUser={
                    m.role === "assistant"
                      ? list
                          .slice(0, i)
                          .reverse()
                          .find((x) => x.role === "user")?.content
                      : undefined
                  }
                />
              ))}
              {showNudge && !liveHere && <Nudge />}
            </div>
          ) : (
            <Welcome />
          )}
        </div>
        <AnimatePresence>
          {showDown && (
            <motion.button
              type="button"
              aria-label="回到最新"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              onClick={() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })}
              className="absolute bottom-3 left-1/2 grid h-9 w-9 -translate-x-1/2 place-items-center rounded-full border border-line bg-card text-ink-2 shadow-[0_4px_14px_rgba(0,0,0,0.1)]"
            >
              <Icon as={ArrowDown} size={17} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
      <Composer />
    </div>
  );
}
