"use client";

import Link from "next/link";
import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { MessageMeta } from "@/db/schema";
import { api, getUid, haptic, parseAssistant, postSSE, refreshUser, relTime, setLocalUser, useUserState, patchUser, greetingByHour } from "@/lib/client";
import { getPersona, PERSONA_LIST, QUICK_TOPICS, type PersonaId } from "@/lib/personas";
import { chunkText, mockReply } from "@/lib/mock-oracle";
import type { CastResult } from "@/lib/iching";
import { SPREADS, type TarotResult, type TarotSpread } from "@/lib/tarot";
import { Markdown } from "../Markdown";
import { Empty, ErrorState, ListSkeleton, Logo, Pill, Sheet, Skeleton, ThinkingCard } from "../ui";
import { HexagramCast, HexagramResult, TarotDraw, TarotResultView } from "../divination";
import { useApp } from "../AppShell";

type Cast = { kind: "hexagram"; data: CastResult } | { kind: "tarot"; data: TarotResult };
type Msg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  raw?: string;
  reasoning?: string;
  thinking?: string | null;
  meta?: MessageMeta;
  streaming?: boolean;
  thinkStart?: number;
  thinkMs?: number;
  failed?: boolean;
  retryText?: string;
  retryCast?: Cast | null;
};
type ConvItem = { id: string; title: string | null; persona: string; letGo: boolean; updatedAt: string; preview: string | null };

const tmpId = () => "t_" + Math.random().toString(36).slice(2, 10);

/* ---------- 消息 ---------- */

const UserBubble = memo(function UserBubble({ m }: { m: Msg }) {
  const cast = m.meta?.cast as Cast | undefined;
  return (
    <div className="anim-fade-up flex justify-end pl-12">
      <div className="min-w-0 max-w-full space-y-2">
        {cast && (
          <div className="rounded-3xl rounded-br-lg border border-line bg-white px-4 py-4">
            <div className="mb-3 text-center text-[11.5px] text-sub">{cast.kind === "hexagram" ? "亲手摇了一卦" : `抽了${SPREADS[cast.data.spread].name}`}</div>
            {cast.kind === "hexagram" ? <HexagramResult cast={cast.data} compact /> : <TarotResultView result={cast.data} compact />}
          </div>
        )}
        {m.content && (
          <div className="ml-auto w-fit max-w-full rounded-3xl rounded-br-lg bg-[#ebe6dd] px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap break-words text-ink">{m.content}</div>
        )}
      </div>
    </div>
  );
});

const AssistantMsg = memo(function AssistantMsg({ m, persona, isLast, onCast, onRetry }: { m: Msg; persona: string; isLast: boolean; onCast: (k: "hexagram" | "tarot") => void; onRetry: (m: Msg) => void }) {
  const p = getPersona(persona);
  const live = m.raw !== undefined;
  const parsed = parseAssistant(live ? m.raw! : m.content);
  const thinking = [m.reasoning?.trim(), live ? parsed.thinking : m.thinking].filter(Boolean).join("\n");
  const thinkingDone = !m.streaming || (parsed.thinkingDone && parsed.body.length > 0);
  const showThinking = live ? (m.streaming || !!thinking) : !!m.thinking;
  return (
    <div className="anim-fade-up flex gap-2.5 pr-2">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-serif text-[13px] text-paper" style={{ background: p.tint }}>{p.avatar}</div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2 text-[12px] text-sub">
          <span>{p.name}</span>
          {m.meta?.offline && <span className="rounded-full bg-sand px-1.5 py-px text-[10px]">离线</span>}
        </div>
        {showThinking && <ThinkingCard text={thinking} done={thinkingDone} ms={m.thinkMs ?? m.meta?.thinkMs} />}
        {(parsed.body || (m.streaming && thinkingDone)) && <Markdown text={parsed.body} streaming={!!m.streaming} />}
        {m.streaming && !parsed.body && !thinkingDone && !thinking && (
          <div className="flex gap-1 py-2">{[0, 1, 2].map((i) => <span key={i} className="breathe h-1.5 w-1.5 rounded-full bg-faint" style={{ animationDelay: `${i * 0.3}s`, animationDuration: "1.4s" }} />)}</div>
        )}
        {m.failed && (
          <button onClick={() => onRetry(m)} className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-[12.5px] text-sub active:scale-95">
            <svg width="12" height="12" viewBox="0 0 12 12"><path d="M10 6a4 4 0 1 1-1.2-2.8M10 1.5V4H7.5" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" /></svg>
            信号飘走了一下，再说一次
          </button>
        )}
        {isLast && !m.streaming && parsed.cast && (
          <button onClick={() => onCast(parsed.cast!)} className="anim-fade-up mt-3 flex w-full items-center gap-3 rounded-2xl border border-line bg-white p-3.5 text-left active:scale-[0.99]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sand font-serif text-[18px] text-ink">{parsed.cast === "hexagram" ? "☯" : "✦"}</div>
            <div className="min-w-0 flex-1">
              <div className="text-[14.5px] text-ink">{parsed.cast === "hexagram" ? "亲手摇一卦" : "亲手抽三张牌"}</div>
              <div className="truncate text-[12px] text-sub">{parsed.cast === "hexagram" ? "三枚铜钱，六次，心静一点" : "凭直觉选，别想太多"}</div>
            </div>
            <span className="text-faint">›</span>
          </button>
        )}
      </div>
    </div>
  );
});

/* ---------- 主视图 ---------- */

export default function ChatView() {
  const { user } = useUserState();
  const { toast } = useApp();
  const [convId, setConvId] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [persona, setPersona] = useState<string>("xiaosuan");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loadingConv, setLoadingConv] = useState(false);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [convs, setConvs] = useState<ConvItem[] | null>(null);
  const [convErr, setConvErr] = useState(false);
  const [castSheet, setCastSheet] = useState<null | "hexagram" | "tarot">(null);
  const [spread, setSpread] = useState<TarotSpread>("triangle");
  const [tarotQ, setTarotQ] = useState("");
  const [personaSheet, setPersonaSheet] = useState(false);
  const [crumpling, setCrumpling] = useState(false);
  const [atBottom, setAtBottom] = useState(true);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [showLetGone, setShowLetGone] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const atBottomRef = useRef(true);
  const pending = useRef<{ id: string; text: string; reasoning: string } | null>(null);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (!convId && user?.persona) setPersona(user.persona);
  }, [user?.persona, convId]);

  const scrollToBottom = useCallback((smooth = false) => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, []);

  useLayoutEffect(() => {
    if (atBottomRef.current) scrollToBottom();
  }, [msgs, scrollToBottom]);

  const onScroll = () => {
    const el = listRef.current;
    if (!el) return;
    const b = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    atBottomRef.current = b;
    if (b !== atBottom) setAtBottom(b);
  };

  const loadConvs = useCallback(async () => {
    setConvErr(false);
    try {
      const r = await api<{ conversations: ConvItem[] }>(`/api/conversations?userId=${getUid()}`);
      setConvs(r.conversations);
    } catch {
      setConvErr(true);
    }
  }, []);

  const openConv = useCallback(async (id: string) => {
    setDrawer(false);
    if (id === convId) return;
    abortRef.current?.abort();
    setLoadingConv(true);
    setMsgs([]);
    try {
      const r = await api<{ conversation: { id: string; title: string | null; persona: string }; messages: (Msg & { createdAt: string })[] }>(`/api/conversations/${id}?userId=${getUid()}`);
      setConvId(r.conversation.id);
      setTitle(r.conversation.title);
      setPersona(r.conversation.persona);
      setMsgs(r.messages.map((m) => ({ id: m.id, role: m.role, content: m.content, thinking: m.thinking, meta: m.meta })));
      window.history.replaceState(null, "", `/?c=${id}`);
      atBottomRef.current = true;
    } catch {
      toast("这段对话暂时打不开");
      window.history.replaceState(null, "", "/");
    } finally {
      setLoadingConv(false);
    }
  }, [convId, toast]);

  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get("c");
    if (c) openConv(c);
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) setInput(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const newChat = useCallback((p?: string) => {
    abortRef.current?.abort();
    setConvId(null);
    setTitle(null);
    setMsgs([]);
    setPersona(p ?? user?.persona ?? "xiaosuan");
    setDrawer(false);
    window.history.replaceState(null, "", "/");
  }, [user?.persona]);

  const patchMsg = useCallback((id: string, fn: (m: Msg) => Msg) => {
    setMsgs((list) => list.map((m) => (m.id === id ? fn(m) : m)));
  }, []);

  const flush = useCallback(() => {
    raf.current = null;
    const p = pending.current;
    if (!p || (!p.text && !p.reasoning)) return;
    const { id, text, reasoning } = p;
    p.text = "";
    p.reasoning = "";
    patchMsg(id, (m) => ({ ...m, raw: (m.raw ?? "") + text, reasoning: (m.reasoning ?? "") + reasoning }));
  }, [patchMsg]);

  const queue = useCallback((id: string, text: string, kind: "text" | "reasoning" = "text") => {
    if (!pending.current || pending.current.id !== id) pending.current = { id, text: "", reasoning: "" };
    if (kind === "text") pending.current.text += text;
    else pending.current.reasoning += text;
    if (raf.current == null) raf.current = requestAnimationFrame(flush);
  }, [flush]);

  const send = useCallback(async (text: string, cast?: Cast | null, opts: { reuseAssistant?: string } = {}) => {
    const content = text.trim();
    if ((!content && !cast) || streaming) return;
    haptic(8);
    setInput("");
    setToolsOpen(false);
    atBottomRef.current = true;
    const aid = opts.reuseAssistant ?? tmpId();
    const start = Date.now();
    if (opts.reuseAssistant) {
      patchMsg(aid, (m) => ({ ...m, raw: "", reasoning: "", streaming: true, failed: false, thinkStart: start }));
    } else {
      setMsgs((l) => [
        ...l,
        { id: tmpId(), role: "user", content, meta: cast ? { cast } : {} },
        { id: aid, role: "assistant", content: "", raw: "", streaming: true, thinkStart: start, retryText: content, retryCast: cast ?? null },
      ]);
    }
    setStreaming(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    let got = false;
    let thinkMarked = false;
    const markThink = () => {
      if (!thinkMarked) { thinkMarked = true; patchMsg(aid, (m) => ({ ...m, thinkMs: Date.now() - start })); }
    };
    let rawSoFar = "";

    try {
      await postSSE("/api/chat", { userId: getUid(), conversationId: convId, content, cast, persona }, (ev, data) => {
        if (ev === "meta") {
          const id = data.conversationId as string;
          if (id !== convId) {
            setConvId(id);
            window.history.replaceState(null, "", `/?c=${id}`);
          }
        } else if (ev === "delta") {
          got = true;
          rawSoFar += data.t as string;
          if (rawSoFar.includes("</think>") || (!rawSoFar.trimStart().startsWith("<") && rawSoFar.length > 4)) markThink();
          queue(aid, data.t as string);
        } else if (ev === "reasoning") {
          queue(aid, data.t as string, "reasoning");
        } else if (ev === "profile") {
          setLocalUser({ nickname: (data.nickname as string) ?? null, profile: data.profile as never });
        } else if (ev === "done") {
          flush();
          markThink();
          patchMsg(aid, (m) => ({ ...m, streaming: false, meta: { ...(m.meta ?? {}), offline: !!data.offline } }));
          setStreaming(false);
          haptic(6);
        } else if (ev === "title") {
          setTitle(data.title as string);
          setConvs((c) => c?.map((x) => (x.id === data.conversationId ? { ...x, title: data.title as string } : x)) ?? c);
        }
      }, ctrl.signal);
      flush();
      patchMsg(aid, (m) => (m.streaming ? { ...m, streaming: false } : m));
    } catch {
      flush();
      if (ctrl.signal.aborted) {
        patchMsg(aid, (m) => ({ ...m, streaming: false }));
      } else if (!got) {
        // 离线：本地小算接手
        const reply = mockReply({ text: content, persona, castSummary: cast ?? null });
        patchMsg(aid, (m) => ({ ...m, meta: { offline: true } }));
        for await (const piece of chunkText(reply, ctrl.signal)) {
          if (piece.includes("</think>") || reply.indexOf("</think>") < rawSoFar.length) markThink();
          rawSoFar += piece;
          queue(aid, piece);
        }
        flush();
        markThink();
        patchMsg(aid, (m) => ({ ...m, streaming: false }));
      } else {
        patchMsg(aid, (m) => ({ ...m, streaming: false, failed: true }));
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [streaming, convId, persona, patchMsg, queue, flush]);

  const retry = useCallback((m: Msg) => {
    send(m.retryText || "（接着说）", m.retryCast ?? null, { reuseAssistant: m.id });
  }, [send]);

  const stop = () => {
    abortRef.current?.abort();
    haptic(6);
  };

  const letGo = async () => {
    if (!convId || msgs.length === 0) {
      toast("还没开始呢，先聊两句？");
      return;
    }
    if (streaming) stop();
    haptic([10, 50, 10, 50, 30]);
    setCrumpling(true);
    const id = convId;
    api(`/api/conversations/${id}`, { method: "PATCH", body: { userId: getUid(), letGo: true } }).catch(() => {});
    setTimeout(() => {
      setCrumpling(false);
      newChat();
      refreshUser();
      toast("这件事，算了。");
    }, 1150);
  };

  const onCastDone = (c: Cast) => {
    setCastSheet(null);
    const q = c.data.question;
    setTimeout(() => send(q ? `我问的是：${q}` : "", c), 250);
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && window.matchMedia("(pointer: fine)").matches) {
      e.preventDefault();
      send(input);
    }
  };

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "0px";
    ta.style.height = Math.min(ta.scrollHeight, 132) + "px";
  }, [input]);

  const p = getPersona(persona);
  const lastAssistant = [...msgs].reverse().find((m) => m.role === "assistant");
  const lastIsAssistant = msgs.length > 0 && msgs[msgs.length - 1].role === "assistant";
  const askedPersonal = lastAssistant && /称呼|生日|叫你/.test(lastAssistant.raw ?? lastAssistant.content);

  const active = convs?.filter((c) => !c.letGo) ?? [];
  const gone = convs?.filter((c) => c.letGo) ?? [];
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const groups: [string, ConvItem[]][] = [
    ["今天", active.filter((c) => new Date(c.updatedAt) >= todayStart)],
    ["最近七天", active.filter((c) => new Date(c.updatedAt) < todayStart && Date.now() - new Date(c.updatedAt).getTime() < 7 * 86400000)],
    ["更早", active.filter((c) => Date.now() - new Date(c.updatedAt).getTime() >= 7 * 86400000)],
  ];

  const renameConv = async (id: string) => {
    const t = editText.trim();
    setEditing(null);
    if (!t) return;
    setConvs((c) => c?.map((x) => (x.id === id ? { ...x, title: t } : x)) ?? c);
    if (id === convId) setTitle(t);
    await api(`/api/conversations/${id}`, { method: "PATCH", body: { userId: getUid(), title: t } }).catch(() => toast("改名没成功"));
  };
  const deleteConv = async (id: string) => {
    setConvs((c) => c?.filter((x) => x.id !== id) ?? c);
    if (id === convId) newChat();
    await api(`/api/conversations/${id}?userId=${getUid()}`, { method: "DELETE" }).catch(() => toast("删除没成功"));
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="relative z-20 flex shrink-0 items-center gap-2 border-b border-transparent bg-paper/90 px-3 pb-2 backdrop-blur" style={{ paddingTop: "calc(var(--safe-t) + 10px)" }}>
        <button onClick={() => { setDrawer(true); loadConvs(); haptic(5); }} className="flex h-10 w-10 items-center justify-center rounded-full text-ink-2 active:bg-sand" aria-label="对话记录">
          <svg width="20" height="20" viewBox="0 0 20 20"><path d="M3 6h14M3 10h9M3 14h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
        </button>
        <button onClick={() => (msgs.length ? null : setPersonaSheet(true))} className="flex min-w-0 flex-1 flex-col items-center">
          <span className="flex max-w-full items-center gap-1 truncate text-[15px] text-ink">
            {title ?? p.name}
            {!msgs.length && <svg width="10" height="10" viewBox="0 0 10 10" className="shrink-0 text-faint"><path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" fill="none" /></svg>}
          </span>
          <span className="max-w-full truncate text-[11px] text-sub">{title ? `和${p.name}` : p.tagline}</span>
        </button>
        <button onClick={letGo} className="flex h-9 items-center rounded-full border border-line bg-white px-3 text-[13px] text-ink-2 active:scale-95" aria-label="算了">算了</button>
        <button onClick={() => newChat()} className="flex h-10 w-10 items-center justify-center rounded-full text-ink-2 active:bg-sand" aria-label="新对话">
          <svg width="20" height="20" viewBox="0 0 20 20"><path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
        </button>
      </header>

      {/* Messages */}
      <div ref={listRef} onScroll={onScroll} className={`scroll-area relative min-h-0 flex-1 px-4 ${crumpling ? "crumple" : ""}`}>
        <div className="mx-auto flex max-w-[640px] flex-col gap-6 pt-4 pb-6">
          {loadingConv ? (
            <div className="space-y-6 pt-4">
              <div className="flex gap-2.5"><Skeleton className="h-7 w-7 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-3.5 w-3/4" /><Skeleton className="h-3.5 w-1/2" /></div></div>
              <div className="flex justify-end"><Skeleton className="h-10 w-1/2 rounded-3xl" /></div>
              <div className="flex gap-2.5"><Skeleton className="h-7 w-7 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-3.5 w-5/6" /><Skeleton className="h-3.5 w-2/3" /><Skeleton className="h-3.5 w-1/3" /></div></div>
            </div>
          ) : msgs.length === 0 ? (
            <div className="anim-fade-up pt-6">
              <div className="mb-8 flex flex-col items-center text-center">
                <Logo size={52} blink className="text-ink" />
                <div className="mt-4 font-serif text-[20px] text-ink">{greetingByHour()}{user?.nickname ? `，${user.nickname}` : ""}</div>
                <div className="mt-1 text-[12.5px] text-sub">算一算，然后，算了。</div>
              </div>
              <div className="flex gap-2.5 pr-2">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-serif text-[13px] text-paper" style={{ background: p.tint }}>{p.avatar}</div>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="text-[12px] text-sub">{p.name}</div>
                  {p.greeting.map((g, i) => <div key={i} className="anim-fade-up" style={{ animationDelay: `${0.25 + i * 0.5}s` }}><Markdown text={g} /></div>)}
                </div>
              </div>
              <div className="anim-fade-up mt-5 flex flex-wrap gap-2 pl-9" style={{ animationDelay: "1.2s" }}>
                {QUICK_TOPICS.map((t) => <Pill key={t} onClick={() => send(t)}>{t}</Pill>)}
                <Pill onClick={() => setCastSheet("hexagram")}>☯ 直接摇一卦</Pill>
              </div>
              <div className="anim-fade-up mt-8 pl-9" style={{ animationDelay: "1.5s" }}>
                <div className="mb-2 text-[11.5px] text-faint">想换个人聊</div>
                <div className="no-scrollbar -mr-4 flex gap-2 overflow-x-auto pr-4">
                  {PERSONA_LIST.map((x) => (
                    <button key={x.id} onClick={() => { setPersona(x.id); patchUser({ persona: x.id }).catch(() => {}); haptic(6); }} className={`flex shrink-0 items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-[12.5px] transition ${persona === x.id ? "border-ink bg-white text-ink" : "border-line text-sub"}`}>
                      <span className="flex h-6 w-6 items-center justify-center rounded-full font-serif text-[11px] text-paper" style={{ background: x.tint }}>{x.avatar}</span>
                      {x.name} · {x.short}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            msgs.map((m, i) =>
              m.role === "user" ? (
                <UserBubble key={m.id} m={m} />
              ) : (
                <AssistantMsg key={m.id} m={m} persona={persona} isLast={i === msgs.length - 1} onCast={(k) => setCastSheet(k)} onRetry={retry} />
              ),
            )
          )}
          {lastIsAssistant && !streaming && !loadingConv && msgs.length > 1 && !lastAssistant?.failed && (
            <div className="anim-fade-up -mt-2 flex flex-wrap gap-2 pl-9">
              {askedPersonal && <Pill onClick={() => send("先不说啦")}>先不说</Pill>}
              <Pill onClick={() => setCastSheet("hexagram")}>帮我摇一卦</Pill>
              <Pill onClick={() => setCastSheet("tarot")}>抽张塔罗</Pill>
              <Pill onClick={letGo}>嗯，算了</Pill>
            </div>
          )}
        </div>
      </div>

      {!atBottom && msgs.length > 0 && (
        <button onClick={() => { atBottomRef.current = true; scrollToBottom(true); }} className="anim-fade absolute right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white shadow-sm" style={{ bottom: 140 }} aria-label="回到底部">
          <svg width="14" height="14" viewBox="0 0 14 14"><path d="M7 2v10M3 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>
        </button>
      )}

      {/* Composer */}
      <div className="relative shrink-0 px-3 pt-1 pb-2">
        {toolsOpen && (
          <div className="anim-fade-up absolute bottom-full left-3 mb-2 flex gap-2 rounded-2xl border border-line bg-white p-1.5 shadow-lg">
            <button onClick={() => { setToolsOpen(false); setCastSheet("hexagram"); }} className="rounded-xl px-3 py-2 text-[13px] text-ink active:bg-sand">☯ 摇一卦</button>
            <button onClick={() => { setToolsOpen(false); setCastSheet("tarot"); }} className="rounded-xl px-3 py-2 text-[13px] text-ink active:bg-sand">✦ 抽塔罗</button>
            <Link href="/tools/bazi" className="rounded-xl px-3 py-2 text-[13px] text-ink active:bg-sand">☷ 看命盘</Link>
          </div>
        )}
        <div className="mx-auto flex max-w-[640px] items-end gap-1.5 rounded-[26px] border border-line bg-white p-1.5 shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
          <button onClick={() => { setToolsOpen((o) => !o); haptic(5); }} className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-serif text-[15px] transition ${toolsOpen ? "bg-ink text-paper" : "text-sub active:bg-sand"}`} aria-label="起卦工具">☷</button>
          <textarea
            ref={taRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            onFocus={() => setTimeout(() => { if (atBottomRef.current) scrollToBottom(); }, 300)}
            rows={1}
            enterKeyHint="send"
            placeholder={streaming ? `${p.name}正在说…` : "说说看，什么都行"}
            className="max-h-[132px] min-h-9 min-w-0 flex-1 resize-none bg-transparent px-1 py-[7px] text-[16px] leading-[22px] text-ink outline-none placeholder:text-faint"
          />
          {streaming ? (
            <button onClick={stop} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-paper active:scale-90" aria-label="停止">
              <span className="h-3 w-3 rounded-[3px] bg-paper" />
            </button>
          ) : (
            <button onClick={() => send(input)} disabled={!input.trim()} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-paper transition active:scale-90 disabled:bg-sand disabled:text-faint" aria-label="发送">
              <svg width="16" height="16" viewBox="0 0 16 16"><path d="M8 13V3M3.5 7.5L8 3l4.5 4.5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          )}
        </div>
      </div>

      {/* History drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50" style={{ height: "var(--app-h)" }}>
          <div className="anim-fade absolute inset-0 bg-ink/25" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-[84%] max-w-[340px] flex-col bg-paper shadow-2xl" style={{ animation: "fade-up .3s both", paddingTop: "calc(var(--safe-t) + 14px)", paddingBottom: "var(--safe-b)" }}>
            <div className="flex items-center gap-2.5 px-5 pb-4">
              <Logo size={26} className="text-ink" />
              <div className="font-serif text-[17px]">算了</div>
            </div>
            <div className="px-4 pb-3">
              <button onClick={() => newChat()} className="flex w-full items-center gap-2 rounded-2xl bg-white px-4 py-3 text-[14px] text-ink shadow-sm active:scale-[0.99]">
                <svg width="16" height="16" viewBox="0 0 16 16"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
                新的对话
              </button>
            </div>
            <div className="scroll-area min-h-0 flex-1 px-3 pb-4">
              {convErr ? (
                <ErrorState onRetry={loadConvs} />
              ) : convs === null ? (
                <div className="px-1 pt-2"><ListSkeleton rows={5} /></div>
              ) : active.length === 0 && gone.length === 0 ? (
                <Empty icon="☁" title="这里还空着" desc="心事不分大小，想起来就来坐坐。" />
              ) : (
                <>
                  {groups.filter(([, l]) => l.length).map(([label, list]) => (
                    <div key={label} className="mb-3">
                      <div className="px-2 pb-1 text-[11.5px] text-faint">{label}</div>
                      {list.map((c) => (
                        <div key={c.id} className={`group flex items-center gap-1 rounded-xl ${c.id === convId ? "bg-sand/80" : "active:bg-sand/60"}`}>
                          {editing === c.id ? (
                            <input autoFocus value={editText} onChange={(e) => setEditText(e.target.value)} onBlur={() => renameConv(c.id)} onKeyDown={(e) => e.key === "Enter" && renameConv(c.id)} className="m-1 min-w-0 flex-1 rounded-lg border border-line bg-white px-2 py-1.5 text-[14px] outline-none" />
                          ) : (
                            <button onClick={() => openConv(c.id)} className="min-w-0 flex-1 px-2.5 py-2.5 text-left">
                              <div className="truncate text-[14px] text-ink">{c.title ?? c.preview ?? "新的对话"}</div>
                              <div className="mt-0.5 truncate text-[11px] text-faint">{getPersona(c.persona).name} · {relTime(c.updatedAt)}</div>
                            </button>
                          )}
                          {editing !== c.id && (
                            <div className="flex shrink-0 pr-1 opacity-60 group-hover:opacity-100">
                              <button onClick={() => { setEditing(c.id); setEditText(c.title ?? ""); }} className="rounded-lg p-1.5 text-sub active:bg-white" aria-label="重命名">
                                <svg width="14" height="14" viewBox="0 0 14 14"><path d="M2 12h2.5L11.5 5 9 2.5 2 9.5V12z" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round" /></svg>
                              </button>
                              <button onClick={() => deleteConv(c.id)} className="rounded-lg p-1.5 text-sub active:bg-white" aria-label="删除">
                                <svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 4h8l-.6 7.5a1 1 0 0 1-1 .9H4.6a1 1 0 0 1-1-.9L3 4zM2 4h10M5.5 4V2.5h3V4" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round" /></svg>
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                  {gone.length > 0 && (
                    <div className="mt-2 border-t border-line pt-3">
                      <button onClick={() => setShowLetGone((s) => !s)} className="flex w-full items-center justify-between px-2 pb-1 text-[11.5px] text-faint">
                        <span>已经算了的 · {gone.length}</span>
                        <span>{showLetGone ? "收起" : "看看"}</span>
                      </button>
                      {showLetGone && gone.map((c) => (
                        <button key={c.id} onClick={() => openConv(c.id)} className="block w-full truncate rounded-xl px-2.5 py-2 text-left text-[13px] text-faint line-through decoration-faint/50 active:bg-sand/60">
                          {c.title ?? c.preview ?? "一段对话"}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* Cast sheets */}
      <Sheet open={castSheet === "hexagram"} onClose={() => setCastSheet(null)} title="摇一卦">
        <div className="pt-2 pb-4"><HexagramCast onDone={(c) => onCastDone({ kind: "hexagram", data: c })} /></div>
      </Sheet>
      <Sheet open={castSheet === "tarot"} onClose={() => setCastSheet(null)} title="抽塔罗">
        <div className="space-y-4 pt-2 pb-4">
          <div className="flex justify-center gap-2">
            {(Object.keys(SPREADS) as TarotSpread[]).map((s) => <Pill key={s} active={spread === s} onClick={() => setSpread(s)}>{SPREADS[s].name}</Pill>)}
          </div>
          <input value={tarotQ} onChange={(e) => setTarotQ(e.target.value)} maxLength={60} placeholder="想问什么？（可以不写）" className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-[15px] outline-none placeholder:text-faint" />
          <TarotDraw key={spread} spread={spread} question={tarotQ.trim() || undefined} onDone={(r) => { onCastDone({ kind: "tarot", data: r }); setTarotQ(""); }} />
        </div>
      </Sheet>
      <Sheet open={personaSheet} onClose={() => setPersonaSheet(false)} title="今天想和谁聊">
        <div className="space-y-2.5 pt-2 pb-4">
          {PERSONA_LIST.map((x) => (
            <button key={x.id} onClick={() => { setPersona(x.id as PersonaId); patchUser({ persona: x.id }).catch(() => {}); setPersonaSheet(false); haptic(6); }} className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left active:scale-[0.99] ${persona === x.id ? "border-ink bg-white" : "border-line bg-white/60"}`}>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-serif text-[18px] text-paper" style={{ background: x.tint }}>{x.avatar}</span>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] text-ink">{x.name} <span className="text-[12px] text-sub">· {x.short}</span></div>
                <div className="truncate text-[12.5px] text-sub">{x.tagline}</div>
              </div>
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  );
}
