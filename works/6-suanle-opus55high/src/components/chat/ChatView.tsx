"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useApp, useUI, type Msg } from "@/lib/store";
import { Icon, Logo } from "../ui";
import MessageItem from "./Message";
import Composer from "./Composer";
import SessionDrawer from "./SessionDrawer";
import Markdown from "./Markdown";
import { introText, sendMessage } from "./engine";

const CHIPS_NEW = ["最近有点烦", "帮我摇一卦", "今天运势怎么样", "抽三张塔罗", "看看我的命盘"];
const CHIPS_BACK = ["今天运势怎么样", "帮我摇一卦", "抽三张塔罗", "有件事想不通", "看看我的命盘"];

export default function ChatView() {
  const currentId = useApp((s) => s.currentId);
  const session = useApp((s) => s.sessions.find((x) => x.id === s.currentId));
  const name = useApp((s) => s.profile.name);
  const live = useUI((s) => s.live);
  const [drawer, setDrawer] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const [showDown, setShowDown] = useState(false);

  const messages: Msg[] = useMemo(() => session?.messages ?? [], [session]);
  const liveHere = live && live.sessionId === currentId ? live : null;
  const empty = messages.length === 0 && !liveHere;
  const intro = useMemo(() => introText(), [name, currentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const toBottom = useCallback((smooth = false) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, []);

  // 切换会话时回到底部
  useLayoutEffect(() => {
    stick.current = true;
    toBottom();
  }, [currentId, toBottom]);

  // 新消息/流式时跟随（用户上滑阅读时不打扰）
  useLayoutEffect(() => {
    if (stick.current) toBottom();
  }, [messages.length, liveHere?.content, toBottom]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      if (stick.current) toBottom();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [toBottom]);

  // 当用户发送时强制贴底
  useEffect(() => {
    if (liveHere && !liveHere.content) {
      stick.current = true;
      toBottom(true);
    }
  }, [liveHere, toBottom]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    stick.current = dist < 80;
    setShowDown(dist > 300);
  };

  const lastIdx = messages.length - 1;
  let prevUser = "";

  return (
    <div className="relative flex h-full flex-col">
      <header className="pt-safe relative z-10 shrink-0">
        <div className="flex h-12 items-center justify-between px-2">
          <button onClick={() => setDrawer(true)} className="grid h-10 w-10 place-items-center rounded-full text-ink active:bg-black/5" aria-label="会话列表">
            <Icon name="menu" size={22} />
          </button>
          <div className="min-w-0 flex-1 px-2 text-center">
            {session && !empty ? (
              <div className="anim-fade-in truncate text-[15px] font-medium">
                <span className="mr-1">{session.emoji}</span>
                {session.title}
              </div>
            ) : (
              <div className="font-song text-[16px] font-bold tracking-[0.2em]">算了</div>
            )}
          </div>
          <button
            onClick={() => useApp.getState().setCurrent(null)}
            className="grid h-10 w-10 place-items-center rounded-full text-ink active:bg-black/5"
            aria-label="新的对话"
          >
            <Icon name="plus" size={22} />
          </button>
        </div>
      </header>

      <div ref={scrollRef} onScroll={onScroll} className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {empty ? (
          <div className="flex min-h-full flex-col px-4 pb-4">
            <div className="flex flex-1 flex-col items-center justify-center pt-6 text-center">
              <div className="anim-breathe text-ink">
                <Logo size={88} blink />
              </div>
              <div className="mt-4 font-song text-[26px] font-bold tracking-[0.3em]">算了</div>
              <div className="mt-1 text-[13px] tracking-[0.25em] text-mute">算一算，然后，算了。</div>
            </div>
            <div className="anim-fade-up mt-8 flex gap-2.5" style={{ animationDelay: "0.15s" }}>
              <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line bg-white">
                <Logo size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <Markdown text={intro} msgId="intro" widgets="hidden" />
              </div>
            </div>
            <div className="anim-fade-up no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1" style={{ animationDelay: "0.3s" }}>
              {(name ? CHIPS_BACK : CHIPS_NEW).map((c) => (
                <button
                  key={c}
                  onClick={() => void sendMessage(c)}
                  className="shrink-0 rounded-full border border-line bg-white/80 px-3.5 py-2 text-[13.5px] text-ink-2 shadow-sm transition active:scale-95"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6 pb-6 pt-2">
            {messages.map((m, i) => {
              const pu = prevUser;
              if (m.role === "user") prevUser = m.content;
              return <MessageItem key={m.id} msg={m} sessionId={session!.id} isLast={i === lastIdx && !liveHere} prevUser={pu} />;
            })}
            {liveHere && (
              <MessageItem
                key={liveHere.msgId}
                msg={{ id: liveHere.msgId, role: "assistant", content: liveHere.content, createdAt: liveHere.started }}
                sessionId={liveHere.sessionId}
                isLast
                streaming
              />
            )}
          </div>
        )}
      </div>

      {showDown && (
        <button
          onClick={() => {
            stick.current = true;
            toBottom(true);
          }}
          className="anim-fade-in absolute bottom-[118px] left-1/2 z-10 grid h-9 w-9 -translate-x-1/2 place-items-center rounded-full border border-line bg-white text-ink-2 shadow-md"
          aria-label="回到底部"
        >
          <Icon name="down" size={17} />
        </button>
      )}

      <Composer />
      <SessionDrawer open={drawer} onClose={() => setDrawer(false)} />
    </div>
  );
}
