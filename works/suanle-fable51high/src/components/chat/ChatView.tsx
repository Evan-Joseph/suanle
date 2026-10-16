"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowUp, Square, Sparkles, Menu, Plus, ChevronDown } from "lucide-react";
import { useApp, useUI, lampActive, deepLeft, type Message } from "@/store/app";
import { sendMessage, regenerate, stopStreaming, canDeep } from "@/lib/engine";
import { MessageItem } from "./Message";
import { Logo } from "@/components/ui";
import { todayAlmanac } from "@/lib/divination";

const STARTERS = [
  { t: "最近有点迷茫，不知道在忙什么", e: "🌫️" },
  { t: "帮我看看今天的运势", e: "🌤️" },
  { t: "有件事纠结很久了，要不要做", e: "🪙" },
  { t: "想看看我的八字", e: "🧭" },
  { t: "一段关系让我很累", e: "🫧" },
  { t: "就想找个人说说话", e: "☕" },
];

export default function ChatView() {
  const sessions = useApp((s) => s.sessions);
  const currentId = useApp((s) => s.currentId);
  const live = useUI((s) => s.live);
  const setDrawer = useUI((s) => s.setDrawer);
  const setSheet = useUI((s) => s.setSheet);
  const toast = useUI((s) => s.toast);
  const session = sessions.find((s) => s.id === currentId) ?? null;
  const name = useApp((s) => s.profile.name);
  const lamp = useApp(lampActive);
  const left = useApp(deepLeft);

  const [text, setText] = useState("");
  const [deep, setDeep] = useState(false);
  const [stuck, setStuck] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const messages: Message[] = useMemo(() => {
    const base = session?.messages ?? [];
    if (live && live.sessionId === session?.id) return [...base, { id: live.msgId, role: "assistant", content: live.content, createdAt: live.started }];
    return base;
  }, [session, live]);

  // 滚动跟随
  const onScroll = () => {
    const el = listRef.current; if (!el) return;
    setStuck(el.scrollHeight - el.scrollTop - el.clientHeight < 80);
  };
  useLayoutEffect(() => {
    const el = listRef.current; if (!el) return;
    if (stuck) el.scrollTop = el.scrollHeight;
  }, [messages, stuck]);
  useEffect(() => {
    const id = requestAnimationFrame(() => { const el = listRef.current; if (el) el.scrollTop = el.scrollHeight; setStuck(true); });
    return () => cancelAnimationFrame(id);
  }, [currentId]);

  const submit = (t?: string) => {
    const v = (t ?? text).trim();
    if (!v || live) return;
    if (deep && !canDeep()) { setSheet({ kind: "lamp" }); toast("今日深度推演已用完"); return; }
    setText("");
    setDeep(false);
    if (taRef.current) taRef.current.style.height = "auto";
    void sendMessage(v, { deep });
    setStuck(true);
  };

  const autoGrow = (el: HTMLTextAreaElement) => { el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 160) + "px"; };
  const isStreaming = !!live && live.sessionId === session?.id;
  const almanac = useMemo(() => todayAlmanac(), []);
  const empty = !session || session.messages.length === 0;

  return (
    <div className="relative flex h-full flex-col">
      {/* 顶栏 */}
      <header className="flex items-center justify-between px-3 pt-[calc(8px+var(--sat))] pb-2">
        <button onClick={() => setDrawer(true)} aria-label="会话列表" className="grid h-10 w-10 place-items-center rounded-full text-ink-2 hover:bg-white/60"><Menu size={20} /></button>
        <div className="flex min-w-0 items-center gap-2">
          <Logo size={22} />
          <span className="truncate font-serif text-[15px] font-semibold tracking-wide">{session && !empty ? session.title : "算了"}</span>
        </div>
        <button onClick={() => useApp.getState().setCurrent(null)} aria-label="新对话" className="grid h-10 w-10 place-items-center rounded-full text-ink-2 hover:bg-white/60"><Plus size={20} /></button>
      </header>

      {/* 消息流 */}
      <div ref={listRef} onScroll={onScroll} className="scroll-thin relative flex-1 overflow-y-auto overflow-x-hidden px-4 pb-4">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
          {empty ? (
            <Empty name={name} line={almanac.line} onPick={(t) => submit(t)} />
          ) : (
            messages.map((m, i) => (
              <MessageItem key={m.id} msg={m} sessionId={session!.id} streaming={isStreaming && m.id === live?.msgId} isLast={i === messages.length - 1 && !isStreaming}
                onSubmit={(t) => submit(t)} onRegenerate={() => void regenerate(session!.id)} />
            ))
          )}
        </div>
      </div>

      {/* 回到底部 */}
      <AnimatePresence>
        {!stuck && !empty && (
          <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} onClick={() => { setStuck(true); const el = listRef.current; if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }); }}
            className="absolute bottom-[132px] left-1/2 z-10 -translate-x-1/2 rounded-full border border-ink/10 bg-white/90 p-2 text-ink-2 shadow-soft"><ChevronDown size={16} /></motion.button>
        )}
      </AnimatePresence>

      {/* 输入区 */}
      <div className="px-3 pb-[calc(8px+var(--sab))] pt-1">
        <div className="mx-auto w-full max-w-2xl">
          <div className="rounded-[24px] border border-ink/10 bg-white/85 p-2 shadow-card backdrop-blur">
            <textarea
              ref={taRef} value={text} rows={1} placeholder={name ? `${name}，想说点什么` : "想说什么，就说什么"}
              onChange={(e) => { setText(e.target.value); autoGrow(e.target); }}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && window.matchMedia("(min-width: 640px)").matches) { e.preventDefault(); submit(); } }}
              className="block max-h-40 w-full resize-none bg-transparent px-3 py-2 text-[16px] leading-6 outline-none placeholder:text-ink-4"
            />
            <div className="flex items-center justify-between px-1">
              <button onClick={() => setDeep((d) => !d)} className={`flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs transition ${deep ? "border-cinnabar bg-cinnabar-soft text-cinnabar" : "border-ink/10 text-ink-3 hover:border-ink/25"}`}>
                <Sparkles size={13} /> 深度推演{lamp ? "" : ` · 今日剩 ${left}`}
              </button>
              {isStreaming ? (
                <button onClick={stopStreaming} aria-label="停止" className="grid h-9 w-9 place-items-center rounded-full bg-ink text-paper"><Square size={14} fill="currentColor" /></button>
              ) : (
                <button onClick={() => submit()} disabled={!text.trim()} aria-label="发送" className="grid h-9 w-9 place-items-center rounded-full bg-ink text-paper transition disabled:bg-ink/15 disabled:text-white"><ArrowUp size={18} /></button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Empty({ name, line, onPick }: { name?: string; line: string; onPick: (t: string) => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center pt-[6vh] text-center">
      <Logo size={88} className="text-ink" />
      <h1 className="mt-5 font-serif text-[26px] font-semibold tracking-[0.08em]">{name ? `${name}，来了。` : "嘿，来了。"}</h1>
      <p className="mt-3 max-w-[300px] text-[15px] leading-relaxed text-ink-2">
        {name ? "今天是想算点什么，还是就坐一会儿，随便聊聊？" : "这里不赶时间。最近在忙什么，或者有什么事在心里绕来绕去，都可以说。想算的，咱们认真算；算完了，该放的也就放了。"}
      </p>
      <p className="mt-4 font-serif text-[13px] tracking-wide text-ink-3">今日一句 · {line}</p>
      <div className="mt-8 grid w-full max-w-md grid-cols-2 gap-2.5 px-1">
        {STARTERS.map((s) => (
          <button key={s.t} onClick={() => onPick(s.t)} className="press flex items-center gap-2.5 rounded-2xl border border-ink/8 bg-white/70 px-3.5 py-3 text-left text-[13.5px] leading-snug text-ink-2 shadow-sm hover:border-ink/20">
            <span className="text-lg">{s.e}</span><span className="min-w-0 flex-1">{s.t}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
