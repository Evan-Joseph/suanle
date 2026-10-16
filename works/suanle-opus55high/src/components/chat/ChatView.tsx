import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowDown, Menu, SquarePen } from "lucide-react";
import { useApp, useUI } from "@/lib/store";
import { todayAlmanac } from "@/lib/divination";
import { sendMessage } from "@/lib/engine";
import { Logo, WordMark } from "../ui";
import { AssistantMessage, UserMessage } from "./Message";
import { Composer } from "./Composer";

const STARTERS = [
  { t: "最近有点烦", d: "说出来，就轻了一半", q: "最近有点烦，想找人说说" },
  { t: "帮我摇一卦", d: "一件事 · 六次铜钱", q: "帮我摇一卦，我想问一件事" },
  { t: "看看我的命盘", d: "八字 · 五行 · 性格", q: "想看看我的八字命盘" },
  { t: "今天宜什么", d: "黄历 · 幸运色", q: "今天的黄历和运势怎么样？" },
];

function greet(name?: string) {
  const h = new Date().getHours();
  const t = h < 5 ? "夜深了" : h < 9 ? "早上好" : h < 12 ? "上午好" : h < 14 ? "中午好" : h < 18 ? "下午好" : h < 22 ? "晚上好" : "夜深了";
  return name ? `${t}，${name}` : t;
}

function Welcome() {
  const name = useApp((s) => s.profile.name);
  const a = todayAlmanac();
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 pb-6 pt-4 text-center">
      <div className="relative mb-6 grid place-items-center">
        <div className="anim-ring absolute h-[132px] w-[132px] rounded-full bg-[radial-gradient(circle,rgba(196,85,58,0.10),transparent_70%)]" />
        <div className="relative grid h-[92px] w-[92px] place-items-center rounded-[28px] bg-white shadow-[0_8px_30px_rgba(60,40,10,0.08)]">
          <Logo size={62} draw />
        </div>
      </div>
      <h1 className="font-song text-[26px] font-bold tracking-wide">{greet(name)}</h1>
      <p className="mt-2 text-[14px] tracking-[0.2em] text-mute">算一算，然后，算了。</p>
      <div className="mt-8 grid w-full max-w-[400px] grid-cols-2 gap-2.5">
        {STARTERS.map((s, i) => (
          <button
            key={s.t}
            onClick={() => void sendMessage(s.q)}
            className="anim-fade-up rounded-[20px] border border-line bg-white/75 px-4 py-3.5 text-left shadow-[0_2px_10px_rgba(60,40,10,0.03)] transition active:scale-[0.97]"
            style={{ animationDelay: `${0.15 + i * 0.06}s` }}
          >
            <div className="text-[14.5px] font-medium text-ink">{s.t}</div>
            <div className="mt-0.5 text-[12px] text-mute">{s.d}</div>
          </button>
        ))}
      </div>
      <div className="mt-7 max-w-[320px] font-song text-[13px] leading-relaxed text-ink-2/80">
        <span className="text-mute">{a.lunarText} · </span>「{a.line}」
      </div>
    </div>
  );
}

export default function ChatView() {
  const currentId = useApp((s) => s.currentId);
  const session = useApp((s) => s.sessions.find((x) => x.id === s.currentId) ?? null);
  const live = useUI((s) => s.live);
  const scroller = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const [showDown, setShowDown] = useState(false);

  const messages = session?.messages ?? [];
  const liveHere = live && live.sessionId === currentId ? live : null;
  const empty = messages.length === 0 && !liveHere;

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    stick.current = dist < 80;
    setShowDown(dist > 240);
  };

  const toBottom = (smooth = false) => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  };

  useLayoutEffect(() => {
    stick.current = true;
    toBottom();
  }, [currentId]);

  useEffect(() => {
    if (stick.current) toBottom();
  }, [messages.length, liveHere?.content]);

  // 键盘弹起、视口变化时保持贴底
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const fn = () => stick.current && toBottom();
    vv.addEventListener("resize", fn);
    return () => vv.removeEventListener("resize", fn);
  }, []);

  const lastAssistantId = [...messages].reverse().find((m) => m.role === "assistant")?.id;

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <header className="relative z-10 flex h-14 shrink-0 items-center justify-between px-2">
        <button onClick={() => useUI.getState().setDrawer(true)} aria-label="对话记录" className="grid h-10 w-10 place-items-center rounded-full text-ink-2 active:bg-black/5">
          <Menu size={21} />
        </button>
        <div className="min-w-0 flex-1 px-2 text-center">
          {session && !empty ? (
            <div className="truncate text-[15px] font-medium">
              <span className="mr-1">{session.emoji}</span>
              {session.title}
            </div>
          ) : (
            <div className="flex justify-center">
              <WordMark small />
            </div>
          )}
        </div>
        <button
          onClick={() => {
            useApp.getState().setCurrent(null);
            useUI.getState().setQuote(null);
          }}
          disabled={empty}
          aria-label="新对话"
          className="grid h-10 w-10 place-items-center rounded-full text-ink-2 active:bg-black/5 disabled:opacity-30"
        >
          <SquarePen size={19} />
        </button>
      </header>

      <div ref={scroller} onScroll={onScroll} className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {empty ? (
          <Welcome />
        ) : (
          <div className="mx-auto w-full max-w-[680px] space-y-6 px-4 pb-6 pt-2">
            {messages.map((m) => (m.role === "user" ? <UserMessage key={m.id} msg={m} /> : <AssistantMessage key={m.id} msg={m} sessionId={session!.id} isLast={m.id === lastAssistantId && !liveHere} />))}
            {liveHere && <AssistantMessage key={liveHere.msgId} live msg={{ id: liveHere.msgId, role: "assistant", content: liveHere.content, createdAt: liveHere.started }} sessionId={liveHere.sessionId} />}
          </div>
        )}
      </div>

      {showDown && !empty && (
        <button onClick={() => toBottom(true)} aria-label="回到最新" className="anim-fade-in absolute bottom-[132px] left-1/2 z-20 grid h-9 w-9 -translate-x-1/2 place-items-center rounded-full border border-line bg-white text-ink-2 shadow-md">
          <ArrowDown size={16} />
        </button>
      )}

      <div className="mx-auto w-full max-w-[680px]">
        <Composer showQuick={!empty} />
      </div>
    </div>
  );
}
