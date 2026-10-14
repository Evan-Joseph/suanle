"use client";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowUp, Check, ChevronDown, Copy, Menu, Quote, RotateCcw, Share2, Square, SquarePen, X, Sparkles } from "lucide-react";
import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useApp, dayKey } from "@/lib/store";
import { parseAssistant, plainText, uid, type WidgetName } from "@/lib/text";
import { mockReply } from "@/lib/mock";
import { analogize, DAILY_FREE, fmt } from "@/lib/analogy";
import { todayAlmanac } from "@/lib/divination";
import type { Msg, Profile } from "@/lib/types";
import { sfx } from "@/lib/sound";
import { Chip, Logo, Markdown, useToast } from "./ui";
import { WIDGET_MAP, type RecInput } from "./widgets";

const SUGGEST = [
  { t: "最近工作好累", s: "最近工作好累，感觉自己像个陀螺" },
  { t: "帮我摇一卦", s: "帮我摇一卦吧" },
  { t: "抽三张塔罗", s: "想抽三张塔罗牌" },
  { t: "看看我的八字", s: "帮我看看八字命盘" },
  { t: "求一支签", s: "给我求一支签" },
  { t: "有件事想算了", s: "有件事我想放下，算了吧" },
];

const KIND_LABEL: Record<string, string> = { 六爻: "卦", 塔罗: "牌", 八字: "盘", 求签: "签", 纸篓: "纸团" };

interface Props {
  onOpenDrawer: () => void;
  onTip: () => void;
  onShare: (q: string, a: string) => void;
  onFocusChange: (f: boolean) => void;
  pendingTick: number;
}

export default function ChatView({ onOpenDrawer, onTip, onShare, onFocusChange, pendingTick }: Props) {
  const { state, active, updateSession, mergeProfile, addUsage, addRecord, startSession } = useApp();
  const toast = useToast();
  const [input, setInput] = useState("");
  const [quote, setQuote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [atBottom, setAtBottom] = useState(true);
  const [quotaHidden, setQuotaHidden] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const session = active;
  const msgs = session?.messages || [];

  /* ---------- scrolling ---------- */
  const toBottom = useCallback((smooth = false) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, []);
  useLayoutEffect(() => {
    stick.current = true;
    toBottom();
  }, [session?.id, toBottom]);
  useEffect(() => {
    const inner = innerRef.current;
    if (!inner) return;
    const ro = new ResizeObserver(() => { if (stick.current) toBottom(); });
    ro.observe(inner);
    const outer = scrollRef.current;
    if (outer) ro.observe(outer);
    return () => ro.disconnect();
  }, [toBottom]);
  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    stick.current = near;
    if (near !== atBottom) setAtBottom(near);
  };

  /* ---------- meta (title / tag / analogy) ---------- */
  const refreshMeta = useCallback(async (sid: string) => {
    const s = stateRef.current.sessions.find((x) => x.id === sid);
    if (!s) return;
    const payload = s.messages.filter((m) => m.status !== "streaming").map((m) => ({ role: m.role, content: m.content }));
    try {
      const r = await fetch("/api/meta", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: stateRef.current.deviceId, messages: payload, tokens: s.tokens, profile: stateRef.current.profile }),
      });
      if (!r.ok) throw new Error();
      const j = await r.json();
      updateSession(sid, (x) => ({ ...x, title: j.title || x.title, tag: j.tag || x.tag, analogy: j.analogy || x.analogy, metaAt: x.messages.length }));
    } catch {
      const first = payload.find((m) => m.role === "user")?.content || "";
      updateSession(sid, (x) => ({ ...x, title: x.title === "新的对话" ? first.replace(/【.*?】/g, "").slice(0, 12) || "随便聊聊" : x.title, metaAt: x.messages.length }));
    }
  }, [updateSession]);

  /* ---------- streaming ---------- */
  const runAssistant = useCallback(async (sid: string, history: Msg[]) => {
    const aid = uid();
    const placeholder: Msg = { id: aid, role: "assistant", content: "", createdAt: Date.now(), status: "streaming" };
    updateSession(sid, (s) => ({ ...s, messages: [...history, placeholder], updatedAt: Date.now() }));
    setBusy(true);
    stick.current = true;
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    let content = "";
    let reasoning = "";
    let tokens = 0;
    let offline = false;
    let raf = 0;
    const flush = () => {
      raf = 0;
      updateSession(sid, (s) => ({ ...s, messages: s.messages.map((m) => (m.id === aid ? { ...m, content, reasoning, offline } : m)) }));
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(flush); };

    let firstAssistant = 0;
    while (firstAssistant < history.length && history[firstAssistant].role === "assistant") firstAssistant++;
    const apiMsgs = history.slice(firstAssistant).map((m) => ({ role: m.role, content: m.quote ? `> ${m.quote.slice(0, 200)}\n\n${m.content}` : m.content }));
    const profile: Profile = stateRef.current.profile;

    const localFallback = async () => {
      offline = true;
      const text = mockReply(apiMsgs, profile);
      for (const ch of text.match(/[\s\S]{1,5}/g) || []) {
        if (ctrl.signal.aborted) break;
        content += ch;
        schedule();
        await new Promise((r) => setTimeout(r, 16));
      }
      tokens = Math.round(JSON.stringify(apiMsgs).length / 1.6 + text.length);
    };

    try {
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: stateRef.current.deviceId, messages: apiMsgs, profile }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) throw new Error("bad");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() || "";
        for (const p of parts) {
          const line = p.trim();
          if (!line.startsWith("data:")) continue;
          try {
            const e = JSON.parse(line.slice(5));
            if (e.t === "c") content += e.d;
            else if (e.t === "r") reasoning += e.d;
            else if (e.t === "u") tokens = e.d;
            else if (e.t === "meta" && e.offline) offline = true;
          } catch { /* ignore */ }
        }
        schedule();
      }
    } catch {
      if (!ctrl.signal.aborted && !content) await localFallback();
    }
    if (raf) cancelAnimationFrame(raf);
    const stopped = ctrl.signal.aborted;
    const parsed = parseAssistant(content, reasoning);
    if (parsed.profile) mergeProfile(parsed.profile);
    if (!tokens) tokens = Math.round(content.length * 1.3 + 400);
    updateSession(sid, (s) => ({
      ...s,
      tokens: s.tokens + tokens,
      updatedAt: Date.now(),
      messages: s.messages.map((m) => (m.id === aid ? { ...m, content: content || (stopped ? "（话说到一半，算了。）" : "刚刚走神了，再说一遍好吗？"), reasoning, offline, tokens, status: stopped ? "stopped" : content ? "done" : "error" } : m)),
    }));
    addUsage(tokens);
    setBusy(false);
    abortRef.current = null;
    // meta refresh: first exchange, then every 3 user turns
    const userTurns = history.filter((m) => m.role === "user").length;
    if (userTurns === 1 || userTurns % 3 === 0) setTimeout(() => refreshMeta(sid), 50);
  }, [updateSession, mergeProfile, addUsage, refreshMeta]);

  const send = useCallback((text: string, extra?: Partial<Msg>) => {
    const t = text.trim();
    if (!t || busy || !session) return;
    sfx.send();
    const um: Msg = { id: uid(), role: "user", content: t, createdAt: Date.now(), status: "done", ...(quote && !extra?.fromWidget ? { quote } : {}), ...extra };
    const history = [...(stateRef.current.sessions.find((x) => x.id === session.id)?.messages || []), um];
    setInput("");
    setQuote(null);
    if (taRef.current) taRef.current.style.height = "auto";
    runAssistant(session.id, history);
  }, [busy, session, quote, runAssistant]);

  const stop = () => abortRef.current?.abort();

  const regenerate = (mid: string) => {
    if (busy || !session) return;
    const idx = session.messages.findIndex((m) => m.id === mid);
    if (idx < 1) return;
    runAssistant(session.id, session.messages.slice(0, idx));
  };

  const onWidgetDone = (mid: string, w: WidgetName, rec: RecInput) => {
    if (!session) return;
    addRecord(rec);
    updateSession(session.id, (s) => ({ ...s, messages: s.messages.map((m) => (m.id === mid ? { ...m, usedWidgets: [...(m.usedWidgets || []), w] } : m)) }));
    setTimeout(() => send(rec.detail, { fromWidget: rec.title }), 350);
  };

  const newChat = () => {
    if (busy) stop();
    startSession();
    sfx.tap();
  };

  // pending prompt from Explore tab
  useEffect(() => {
    const p = sessionStorage.getItem("suanle:pending");
    if (p && session && !busy && session.messages.length <= 1) {
      sessionStorage.removeItem("suanle:pending");
      try {
        const { text, title } = JSON.parse(p);
        send(text, title ? { fromWidget: title } : undefined);
      } catch { /* noop */ }
    }
  }, [session, busy, send, pendingTick]);

  const autosize = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  };

  const today = state.usage.byDay[dayKey()] || 0;
  const member = state.support.memberUntil > Date.now();
  const showQuota = !member && !quotaHidden && today > DAILY_FREE && msgs.length > 2;
  const isFresh = msgs.length <= 1;
  const lastAssistantId = [...msgs].reverse().find((m) => m.role === "assistant")?.id;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* header */}
      <header className="safe-t shrink-0 bg-paper/85 backdrop-blur-md z-10">
        <div className="h-12 flex items-center px-2 gap-1">
          <button onClick={onOpenDrawer} className="w-10 h-10 rounded-full flex items-center justify-center active:bg-paper-2" aria-label="会话列表"><Menu size={20} /></button>
          <div className="flex-1 min-w-0 text-center">
            <div className="truncate font-serif font-bold text-[15px]">{isFresh ? "算了" : session?.title}</div>
            {!isFresh && session && (
              <div className="text-[10px] text-ink-3 truncate">{session.tag} · {fmt(session.tokens)} 算力{session.analogy ? ` ${session.analogy}` : ""}</div>
            )}
          </div>
          <button onClick={newChat} className="w-10 h-10 rounded-full flex items-center justify-center active:bg-paper-2" aria-label="新对话"><SquarePen size={19} /></button>
        </div>
      </header>

      {/* messages */}
      <div ref={scrollRef} onScroll={onScroll} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden no-scrollbar overscroll-contain">
        <div ref={innerRef} className="px-4 pt-2 pb-4">
          {isFresh && <Welcome name={state.profile.name} />}
          {msgs.map((m) => (
            <MessageItem
              key={m.id}
              m={m}
              profile={state.profile}
              isLast={m.id === lastAssistantId}
              busy={busy}
              onRegenerate={() => regenerate(m.id)}
              onQuote={(t) => { setQuote(t); taRef.current?.focus(); }}
              onCopy={async (t) => { try { await navigator.clipboard.writeText(t); toast("已复制"); } catch { toast("复制失败，长按文字试试"); } }}
              onShare={(a) => {
                const i = msgs.findIndex((x) => x.id === m.id);
                const q = [...msgs.slice(0, i)].reverse().find((x) => x.role === "user")?.content || "";
                onShare(q, a);
              }}
              onTip={onTip}
              onWidgetDone={(w, rec) => onWidgetDone(m.id, w, rec)}
              onProfile={mergeProfile}
            />
          ))}
          {showQuota && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-3xl bg-cinnabar-soft/60 border border-cinnabar/15 p-4 relative">
              <button onClick={() => setQuotaHidden(true)} className="absolute right-3 top-3 text-ink-3" aria-label="关闭"><X size={16} /></button>
              <div className="font-serif font-bold text-[15px]">今天聊得挺投入的</div>
              <p className="text-[13px] text-ink-2 mt-1 leading-relaxed">今天一共用了 {fmt(today)} 算力，{analogize(today, state.profile, "quota", 1)}的分量。小店不打烊，你接着聊；要是觉得被陪到了，随手请杯热的就好。</p>
              <div className="flex gap-2 mt-3">
                <button onClick={onTip} className="rounded-full bg-cinnabar text-paper px-4 py-1.5 text-[13px]">随喜一下</button>
                <button onClick={() => setQuotaHidden(true)} className="rounded-full px-4 py-1.5 text-[13px] text-ink-2">下次吧</button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* composer */}
      <div className="shrink-0 relative bg-gradient-to-t from-paper via-paper to-paper/0 pt-1">
        <AnimatePresence>
          {!atBottom && (
            <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              onClick={() => { stick.current = true; toBottom(true); }}
              className="absolute -top-11 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-paper border border-paper-3 shadow-md flex items-center justify-center text-ink-2" aria-label="回到底部">
              <ArrowDown size={16} />
            </motion.button>
          )}
        </AnimatePresence>
        {isFresh && !input && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 pb-2">
            {SUGGEST.map((s) => <Chip key={s.t} onClick={() => send(s.s)}>{s.t}</Chip>)}
          </div>
        )}
        <div className="px-3 pb-2">
          <div className="rounded-[26px] bg-paper-2 border border-paper-3/80 shadow-[0_2px_14px_rgba(60,50,30,0.06)] focus-within:border-ink-3/60 transition">
            <AnimatePresence>
              {quote && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="mx-3 mt-2.5 flex items-start gap-2 rounded-2xl bg-paper px-3 py-2 text-[12px] text-ink-2">
                    <Quote size={12} className="mt-0.5 shrink-0 text-cinnabar" />
                    <span className="line-clamp-2 flex-1">{quote}</span>
                    <button onClick={() => setQuote(null)} aria-label="取消引用"><X size={14} /></button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="flex items-end gap-1 pl-4 pr-1.5 py-1.5">
              <textarea
                ref={taRef}
                rows={1}
                value={input}
                onChange={(e) => { setInput(e.target.value); autosize(e.target); }}
                onFocus={() => { onFocusChange(true); setTimeout(() => { if (stick.current) toBottom(); }, 250); }}
                onBlur={() => onFocusChange(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && window.matchMedia("(pointer:fine)").matches) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                placeholder={busy ? "算了正在说……" : "说说看，什么都行"}
                className="flex-1 bg-transparent resize-none outline-none py-2 leading-6 max-h-[140px] placeholder:text-ink-3 min-w-0"
              />
              {busy ? (
                <button onClick={stop} className="w-10 h-10 shrink-0 rounded-full bg-ink text-paper flex items-center justify-center active:scale-90 transition" aria-label="停止">
                  <Square size={14} fill="currentColor" />
                </button>
              ) : (
                <button onMouseDown={(e) => e.preventDefault()} onClick={() => send(input)} disabled={!input.trim()}
                  className="w-10 h-10 shrink-0 rounded-full bg-ink text-paper flex items-center justify-center active:scale-90 transition disabled:bg-paper-3 disabled:text-ink-3" aria-label="发送">
                  <ArrowUp size={19} strokeWidth={2.4} />
                </button>
              )}
            </div>
          </div>
          {!member && state.support.count === 0 && msgs.length > 6 && !busy && (
            <button onClick={onTip} className="w-full text-center text-[11px] text-ink-3 mt-1.5">聊得舒服的话，<span className="underline underline-offset-2">请算了喝杯热的</span></button>
          )}
        </div>
      </div>
    </div>
  );
}

function Welcome({ name }: { name: string }) {
  const [al, setAl] = useState<ReturnType<typeof todayAlmanac> | null>(null);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setAl(todayAlmanac(new Date(), name)), [name]);
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-6 pb-4 flex flex-col items-center text-center">
      <div className="text-ink breathe"><Logo size={68} blink /></div>
      <div className="font-serif text-[22px] font-bold mt-4 tracking-wide">算一算，然后，算了。</div>
      {al && (
        <div className="mt-5 w-full rounded-3xl bg-paper-2/70 border border-paper-3/70 p-4 text-left">
          <div className="flex items-center justify-between">
            <div className="text-[12px] text-ink-3">今日小黄历 · {al.ganzhi}</div>
            <div className="text-[11px] text-ink-3">松弛指数 <span className="text-sage font-semibold">{al.energy}</span></div>
          </div>
          <div className="flex gap-3 mt-2.5 text-[13px]">
            <span className="seal text-[12px] h-fit">宜</span><span className="text-ink-2">{al.yi.join(" · ")}</span>
          </div>
          <div className="flex gap-3 mt-1.5 text-[13px]">
            <span className="seal text-[12px] h-fit !text-ink-3 !border-ink-3">忌</span><span className="text-ink-2">{al.ji.join(" · ")}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

interface MIProps {
  m: Msg; profile: Profile; isLast: boolean; busy: boolean;
  onRegenerate: () => void; onQuote: (t: string) => void; onCopy: (t: string) => void; onShare: (a: string) => void; onTip: () => void;
  onWidgetDone: (w: WidgetName, rec: RecInput) => void; onProfile: (p: Partial<Profile>) => void;
}

const MessageItem = memo(function MessageItem({ m, profile, isLast, busy, onRegenerate, onQuote, onCopy, onShare, onTip, onWidgetDone, onProfile }: MIProps) {
  if (m.role === "user") {
    if (m.fromWidget) {
      const lines = m.content.split("\n");
      return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end my-3">
          <div className="max-w-[82%] rounded-[22px] rounded-br-md bg-ink text-paper px-4 py-3">
            <div className="text-[11px] opacity-60 flex items-center gap-1"><Sparkles size={11} />{lines[0].match(/【(.*?)】/)?.[1] || "结果"}</div>
            <div className="font-serif font-bold text-[16px] mt-0.5">{m.fromWidget}</div>
            <div className="text-[12px] opacity-70 mt-1 line-clamp-3 whitespace-pre-line">{lines.slice(1).join("\n") || lines[0].replace(/【.*?】/, "")}</div>
          </div>
        </motion.div>
      );
    }
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-end my-3">
        {m.quote && <div className="max-w-[78%] mb-1 text-[11px] text-ink-3 line-clamp-1 border-l-2 border-paper-3 pl-2">{m.quote}</div>}
        <div className="max-w-[82%] rounded-[22px] rounded-br-md bg-ink text-paper px-4 py-2.5 text-[15.5px] leading-relaxed whitespace-pre-wrap break-words">{m.content}</div>
      </motion.div>
    );
  }
  return <AssistantItem m={m} profile={profile} isLast={isLast} busy={busy} onRegenerate={onRegenerate} onQuote={onQuote} onCopy={onCopy} onShare={onShare} onTip={onTip} onWidgetDone={onWidgetDone} onProfile={onProfile} />;
});

function AssistantItem({ m, profile, isLast, busy, onRegenerate, onQuote, onCopy, onShare, onTip, onWidgetDone, onProfile }: MIProps) {
  const streaming = m.status === "streaming";
  const p = parseAssistant(m.content, m.reasoning);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const thinkStart = useRef<number>(0);
  const [live] = useState(streaming);
  const [thinkSecs, setThinkSecs] = useState(0);
  useEffect(() => {
    if (!live) return;
    if (p.think && !thinkStart.current) thinkStart.current = Date.now();
    if (thinkStart.current && !p.thinking && !thinkSecs && (p.body || !streaming)) {
      setThinkSecs(Math.max(1, Math.round((Date.now() - thinkStart.current) / 1000)));
    }
  }, [live, p.think, p.thinking, p.body, streaming, thinkSecs]);

  const empty = streaming && !p.body && !p.think;
  const plain = plainText(p.body);
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="my-3 flex gap-2.5">
      <div className="w-7 h-7 shrink-0 rounded-full bg-paper-2 border border-paper-3 flex items-center justify-center text-ink mt-0.5">
        <Logo size={17} blink={streaming} />
      </div>
      <div className="flex-1 min-w-0">
        {p.think && (
          <div className="mb-2">
            <button onClick={() => setOpen((o) => !o)} className="inline-flex items-center gap-1.5 rounded-full bg-paper-2 border border-paper-3/70 pl-3 pr-2.5 py-1 text-[12px] text-ink-2 active:scale-95 transition">
              <span className={`w-1.5 h-1.5 rounded-full ${p.thinking ? "bg-cinnabar breathe" : "bg-sage"}`} />
              {p.thinking ? <span className="shimmer-text">正在推演…</span> : <span>已推演{thinkSecs ? `（${thinkSecs} 秒）` : ""}</span>}
              <ChevronDown size={13} className={`transition ${open ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence initial={false}>
              {(open || p.thinking) && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="mt-2 border-l-2 border-paper-3 pl-3 text-[13px] leading-relaxed text-ink-3 whitespace-pre-wrap break-words max-h-64 overflow-y-auto no-scrollbar">{p.think}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        {empty ? (
          <div className="flex items-center gap-1 h-7 text-ink-3">
            {[0, 1, 2].map((i) => <span key={i} className="dot w-1.5 h-1.5 rounded-full bg-ink-3" style={{ animationDelay: `${i * 0.15}s` }} />)}
          </div>
        ) : (
          p.body && <div className={streaming ? "caret-wrap" : ""}><Markdown text={p.body} streaming={streaming} /></div>
        )}
        {!streaming && p.widgets.map((w) => {
          const used = m.usedWidgets?.includes(w);
          const W = WIDGET_MAP[w];
          return used ? (
            <div key={w} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-sage-soft text-sage px-3 py-1 text-[12px]"><Check size={12} />{KIND_LABEL[w]}已出，正在解读</div>
          ) : (
            <motion.div key={w} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
              <W compact profile={profile} onProfile={onProfile} onDone={(rec) => onWidgetDone(w, rec)} />
            </motion.div>
          );
        })}
        {!streaming && m.status !== "error" && p.body && (
          <div className="mt-2 flex items-center gap-0.5 -ml-1.5 text-ink-3">
            <IconBtn label="复制" onClick={() => { onCopy(plain); setCopied(true); setTimeout(() => setCopied(false), 1200); }}>{copied ? <Check size={15} /> : <Copy size={15} />}</IconBtn>
            {isLast && !busy && <IconBtn label="重新生成" onClick={onRegenerate}><RotateCcw size={15} /></IconBtn>}
            <IconBtn label="引用" onClick={() => onQuote(plain.slice(0, 120))}><Quote size={15} /></IconBtn>
            <IconBtn label="分享长图" onClick={() => onShare(p.body)}><Share2 size={15} /></IconBtn>
            {m.tokens ? (
              <button onClick={onTip} className="ml-auto text-[11px] text-ink-3 truncate max-w-[60%] text-right active:text-cinnabar">
                {fmt(m.tokens)} 算力 ≈ {analogize(m.tokens, profile, m.id)}
              </button>
            ) : null}
          </div>
        )}
        {m.status === "error" && isLast && !busy && (
          <button onClick={onRegenerate} className="mt-2 text-[12px] text-cinnabar inline-flex items-center gap-1"><RotateCcw size={12} />再试一次</button>
        )}
      </div>
    </motion.div>
  );
}

function IconBtn({ children, label, onClick }: { children: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label={label} title={label} className="w-8 h-8 rounded-full flex items-center justify-center active:bg-paper-2 hover:text-ink transition">
      {children}
    </button>
  );
}
