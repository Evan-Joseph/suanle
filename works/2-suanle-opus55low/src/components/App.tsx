"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Markdown from "./Markdown";
import Paywall from "./Paywall";
import Drawer, { Conv } from "./Drawer";
import Profile from "./Profile";

export type User = {
  id: string; nickname: string | null; birth: string | null; concern: string | null; onboarded: boolean;
  member: boolean; plan: string; planExpires: string | null; credits: number; freeLeft: number;
};
type Msg = { id: string; role: "user" | "assistant"; content: string; deep?: boolean; pills?: string[]; date?: boolean; streaming?: boolean };

export const buzz = (ms = 8) => { try { navigator.vibrate?.(ms); } catch {} };
const rid = () => Math.random().toString(36).slice(2);

const STARTERS = ["今天有点不想上班", "帮我看看这段关系还要不要继续", "抽一卦：要不要换城市", "我又在深夜内耗了", "最近钱的事挺烦"];
const CONCERNS = ["工作", "感情", "钱", "家里", "说不上来"];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [convs, setConvs] = useState<Conv[]>([]);
  const [convId, setConvId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [deep, setDeep] = useState(false);
  const [busy, setBusy] = useState(false);
  const [onb, setOnb] = useState<number>(-1); // onboarding step
  const [drawer, setDrawer] = useState(false);
  const [pay, setPay] = useState<null | "quota" | "deep" | "browse">(null);
  const [profile, setProfile] = useState(false);
  const [toast, setToast] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const ta = useRef<HTMLTextAreaElement>(null);
  const stick = useRef(true);
  const lastSent = useRef<{ text: string; deep: boolean } | null>(null);

  const say = (t: string) => { setToast(t); setTimeout(() => setToast(""), 2200); };

  const loadConvs = useCallback(async (id: string) => {
    const r = await fetch(`/api/conversations?uid=${id}`);
    if (r.ok) setConvs(await r.json());
  }, []);

  // boot
  useEffect(() => {
    let id = localStorage.getItem("suanle.uid");
    if (!id) { id = crypto.randomUUID().replace(/-/g, ""); localStorage.setItem("suanle.uid", id); }
    fetch("/api/user", { method: "POST", body: JSON.stringify({ id }) }).then((r) => r.json()).then((u: User) => {
      setUser(u);
      loadConvs(u.id);
      if (!u.onboarded) startOnboarding();
    });
    // keyboard: keep latest message visible when viewport shrinks
    const vv = window.visualViewport;
    const onR = () => { if (stick.current) scrollDown(false); };
    vv?.addEventListener("resize", onR);
    return () => vv?.removeEventListener("resize", onR);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollDown = (smooth = true) => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  };
  useEffect(() => { if (stick.current) scrollDown(false); }, [msgs]);

  const onScroll = () => {
    const el = scroller.current!;
    stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  // ---------- onboarding (scripted, light) ----------
  const botLines = async (lines: Omit<Msg, "id" | "role">[]) => {
    for (const l of lines) {
      setMsgs((m) => [...m, { id: rid(), role: "assistant", content: "", streaming: true }]);
      await new Promise((r) => setTimeout(r, 450 + l.content.length * 14));
      setMsgs((m) => [...m.slice(0, -1), { id: rid(), role: "assistant", ...l, streaming: false }]);
    }
  };
  const startOnboarding = async () => {
    setOnb(0);
    setMsgs([]);
    await botLines([
      { content: "*擦了擦杯子，抬头看你一眼* 来了？坐。" },
      { content: "我是老算。这儿不吓人，也不卖符——就是帮你把心里那团乱麻掰扯掰扯，掰完了，**算了**。\n\n先认识一下，我该怎么叫你？", pills: ["叫我朋友就行", "先跳过"] },
    ]);
  };
  const patchUser = async (p: Partial<User>) => {
    const r = await fetch("/api/user", { method: "PATCH", body: JSON.stringify({ id: user?.id, ...p }) });
    if (r.ok) setUser(await r.json());
  };
  const onbAnswer = async (text: string) => {
    buzz();
    const skip = /跳过|不想说/.test(text);
    setMsgs((m) => [...m.map((x) => ({ ...x, pills: undefined, date: false })), { id: rid(), role: "user", content: text }]);
    if (onb === 0) {
      const name = skip ? null : text === "叫我朋友就行" ? "朋友" : text;
      await patchUser({ nickname: name });
      setOnb(1);
      await botLines([{ content: `${name ? `行，${name}，记住了。` : "不说也行，神秘感我懂。"}\n\n方便的话留个生日？知道个大概，我看事情能多一个角度。不想说也完全 OK。`, date: true, pills: ["不想说"] }]);
    } else if (onb === 1) {
      if (!skip) await patchUser({ birth: text });
      setOnb(2);
      await botLines([{ content: `${skip ? "好，那就凭感觉聊。" : "*在纸上记了一笔* 嗯，有点意思。"}\n\n最后一个——最近心里挂着点什么？点一个，或者直接说。`, pills: CONCERNS }]);
    } else if (onb === 2) {
      await patchUser({ concern: text, onboarded: true });
      setOnb(-1);
      const first = text === "说不上来" ? "说不上来，就是有点累。" : CONCERNS.includes(text) ? `最近有点被「${text}」的事困住了。` : text;
      send(first, false, true);
    }
  };

  // ---------- chat ----------
  const send = async (raw: string, deepMode = deep, keepOnb = false) => {
    const text = raw.trim();
    if (!text || busy || !user) return;
    if (onb >= 0 && !keepOnb) return onbAnswer(text);
    buzz();
    setInput("");
    if (ta.current) ta.current.style.height = "auto";
    stick.current = true;
    lastSent.current = { text, deep: deepMode };
    const aid = rid();
    setMsgs((m) => [...m.map((x) => ({ ...x, pills: undefined })), { id: rid(), role: "user", content: text, deep: deepMode }, { id: aid, role: "assistant", content: "", deep: deepMode, streaming: true }]);
    setBusy(true);
    const isNew = !convId;
    try {
      const r = await fetch("/api/chat", { method: "POST", body: JSON.stringify({ uid: user.id, conversationId: convId, content: text, deep: deepMode }) });
      if (r.status === 402) {
        const j = await r.json();
        setMsgs((m) => m.slice(0, -2));
        setInput(text);
        setPay(j.reason);
        return;
      }
      if (!r.body) throw new Error();
      const cid = r.headers.get("X-Conversation-Id");
      if (cid) setConvId(cid);
      // smooth reveal
      const reader = r.body.getReader();
      const dec = new TextDecoder();
      let target = "", shown = 0, done = false;
      const tick = () => {
        const gap = target.length - shown;
        if (gap > 0) {
          shown += Math.max(1, Math.ceil(gap / 10));
          const s = target.slice(0, shown);
          setMsgs((m) => m.map((x) => (x.id === aid ? { ...x, content: s } : x)));
        }
        if (!done || shown < target.length) requestAnimationFrame(tick);
        else setMsgs((m) => m.map((x) => (x.id === aid ? { ...x, streaming: false } : x)));
      };
      requestAnimationFrame(tick);
      for (;;) {
        const { done: d, value } = await reader.read();
        if (d) break;
        target += dec.decode(value, { stream: true });
      }
      done = true;
      buzz(12);
      if (cid && isNew) {
        fetch("/api/title", { method: "POST", body: JSON.stringify({ uid: user.id, conversationId: cid }) }).then(() => loadConvs(user.id));
      } else loadConvs(user.id);
      refreshUser();
      if (deepMode) setDeep(false);
    } catch {
      setMsgs((m) => m.map((x) => (x.id === aid ? { ...x, content: "*门口的风铃响了一下* 网络好像走丢了，再试一次？", streaming: false } : x)));
    } finally {
      setBusy(false);
    }
  };

  const refreshUser = async () => {
    if (!user) return;
    const r = await fetch("/api/user", { method: "POST", body: JSON.stringify({ id: user.id }) });
    if (r.ok) setUser(await r.json());
  };

  const openConv = async (id: string) => {
    setDrawer(false);
    if (!user) return;
    setOnb(-1);
    const r = await fetch(`/api/conversations/${id}?uid=${user.id}`);
    if (!r.ok) return;
    const j = await r.json();
    setConvId(id);
    stick.current = true;
    setMsgs(j.messages.map((m: { id: number; role: "user" | "assistant"; content: string; deep: boolean }) => ({ id: String(m.id), role: m.role, content: m.content, deep: m.deep })));
  };

  const newConv = () => { setDrawer(false); setConvId(null); setMsgs([]); setOnb(-1); setDeep(false); buzz(); };

  const toggleDeep = () => {
    buzz();
    if (!deep && user && !user.member && user.credits <= 0) { setPay("deep"); return; }
    setDeep((d) => !d);
  };

  const onPaid = (u: User, sku: string) => {
    setUser(u);
    setPay(null);
    say(sku === "single" ? "深谈已到账，想聊什么都行" : "欢迎入座。今晚的酒，记我账上");
    if (sku === "single" || u.member) setDeep(pay === "deep" ? true : deep);
  };

  const conv = convs.find((c) => c.id === convId);
  const empty = msgs.length === 0;
  const hello = (() => { const h = (new Date().getHours()); return h < 5 ? "这么晚还没睡" : h < 11 ? "早" : h < 14 ? "中午好" : h < 18 ? "下午好" : h < 22 ? "晚上好" : "夜深了"; })();

  return (
    <div className="grain fixed inset-0 flex justify-center bg-paper">
      <div className="relative flex h-[100dvh] w-full max-w-[640px] flex-col">
        {/* header */}
        <header className="pt-safe z-10 shrink-0 border-b border-ink/5 bg-paper/85 backdrop-blur-md">
          <div className="flex h-14 items-center gap-1 px-2">
            <IconBtn label="会话列表" onClick={() => { buzz(); setDrawer(true); }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M4 7h16M4 12h10M4 17h13" /></svg>
            </IconBtn>
            <div className="min-w-0 flex-1 text-center">
              <div className="truncate font-serif text-[16px] font-bold">{conv?.title || (empty ? "算了" : "新的一局")}</div>
              {user && <div className="text-[11px] text-ink3">{user.member ? "松弛会员 · 畅聊中" : `今日还能聊 ${user.freeLeft} 句`}</div>}
            </div>
            <IconBtn label="新会话" onClick={newConv}>
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M12 20h8M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" /></svg>
            </IconBtn>
          </div>
        </header>

        {/* messages */}
        <div ref={scroller} onScroll={onScroll} className="scroll-soft flex-1 overflow-y-auto px-4">
          {empty && onb < 0 ? (
            <div className="rise flex min-h-full flex-col items-center justify-center py-10 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="算了" className="h-20 w-20 rounded-[22px] shadow-[0_8px_30px_-12px_rgba(43,40,36,.35)]" />
              <h1 className="mt-6 font-serif text-[26px] font-bold tracking-wide">{hello}{user?.nickname ? `，${user.nickname}` : ""}</h1>
              <p className="mt-2 text-[14px] text-ink2">算一算，然后，算了。</p>
              <div className="mt-8 flex max-w-[360px] flex-wrap justify-center gap-2">
                {STARTERS.map((s) => (
                  <button key={s} onClick={() => send(s)} className="rounded-full border border-ink/10 bg-white/60 px-3.5 py-2 text-[13.5px] text-ink2 transition active:scale-95 active:bg-paper2">{s}</button>
                ))}
              </div>
              {user && !user.member && (
                <button onClick={() => setPay("browse")} className="mt-10 text-[12.5px] text-clay underline decoration-clay/30 underline-offset-4">开一张松弛卡，聊多久都不怕 →</button>
              )}
            </div>
          ) : (
            <div className="mx-auto flex max-w-[600px] flex-col gap-5 py-6">
              {msgs.map((m) => (
                <Bubble key={m.id} m={m} onPill={(p) => (onb >= 0 ? onbAnswer(p) : send(p))} onDate={(d) => onbAnswer(d)} />
              ))}
              {!busy && msgs.length >= 2 && onb < 0 && msgs[msgs.length - 1].role === "assistant" && (
                <div className="fade flex flex-wrap gap-2 pl-1">
                  {!deep && <Chip onClick={() => { toggleDeep(); }}>✦ 深度复盘这件事</Chip>}
                  <Chip onClick={() => send("嗯……那我该怎么办？")}>那我该怎么办</Chip>
                  <Chip onClick={() => send("好，算了。")}>好，算了。</Chip>
                </div>
              )}
              <div className="h-2" />
            </div>
          )}
        </div>

        {/* composer */}
        <div className="pb-safe shrink-0 bg-gradient-to-t from-paper via-paper to-paper/0 px-3 pt-2">
          <div className={`mx-auto max-w-[600px] rounded-[24px] border bg-white/80 shadow-[0_6px_24px_-14px_rgba(43,40,36,.35)] transition ${deep ? "border-clay/50" : "border-ink/10"}`}>
            {deep && (
              <div className="fade flex items-center justify-between px-4 pt-2.5 text-[12px] text-clay">
                <span>✦ 深度复盘 · 老算会认真摆一摆这局</span>
                <span className="text-ink3">{user?.member ? "会员畅享" : `剩 ${user?.credits ?? 0} 次`}</span>
              </div>
            )}
            <div className="flex items-end gap-1.5 p-1.5 pl-2">
              {onb < 0 && (
                <button onClick={toggleDeep} aria-label="深度复盘" className={`mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[17px] transition active:scale-90 ${deep ? "bg-clay text-white" : "text-ink3 hover:bg-paper"}`}>✦</button>
              )}
              <textarea
                ref={ta}
                rows={1}
                value={input}
                enterKeyHint="send"
                placeholder={onb === 0 ? "随便起个名字" : onb === 1 ? "比如 1998年5月 晚上" : onb === 2 ? "说说看，或者点上面的" : busy ? "老算在想……" : "跟老算说点什么"}
                onChange={(e) => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px"; }}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && window.innerWidth > 640) { e.preventDefault(); send(input); } }}
                onFocus={() => setTimeout(() => scrollDown(), 300)}
                className="max-h-[140px] min-h-[42px] flex-1 resize-none bg-transparent px-1 py-2.5 text-[16px] leading-[1.45] outline-none placeholder:text-ink3"
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || busy}
                aria-label="发送"
                className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-paper transition active:scale-90 disabled:bg-ink/15 disabled:text-white"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
              </button>
            </div>
          </div>
          <p className="mt-1.5 text-center text-[10.5px] text-ink3">命理是一面镜子，路还是你自己走的</p>
        </div>

        {toast && <div className="fade pointer-events-none absolute left-1/2 top-20 z-50 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-[13px] text-paper shadow-lg">{toast}</div>}
      </div>

      {drawer && user && (
        <Drawer
          user={user} convs={convs} current={convId}
          onClose={() => setDrawer(false)} onOpen={openConv} onNew={newConv}
          onProfile={() => { setDrawer(false); setProfile(true); }}
          onUpgrade={() => { setDrawer(false); setPay("browse"); }}
          onChanged={() => loadConvs(user.id)}
          onDeleted={(id) => { if (id === convId) newConv(); loadConvs(user.id); }}
        />
      )}
      {pay && user && <Paywall reason={pay} user={user} onClose={() => setPay(null)} onPaid={onPaid} />}
      {profile && user && (
        <Profile user={user} onClose={() => setProfile(false)} onSave={async (p) => { await patchUser(p); say("记下了"); }} onUpgrade={() => { setProfile(false); setPay("browse"); }} onRestart={() => { setProfile(false); setConvId(null); startOnboarding(); }} />
      )}
    </div>
  );
}

function Bubble({ m, onPill, onDate }: { m: Msg; onPill: (p: string) => void; onDate: (d: string) => void }) {
  const [d, setD] = useState("");
  if (m.role === "user")
    return (
      <div className="rise flex justify-end">
        <div className="max-w-[82%] rounded-[20px] rounded-br-md bg-ink px-4 py-2.5 text-[15.5px] leading-[1.65] text-paper whitespace-pre-wrap break-words">
          {m.deep && <div className="mb-0.5 text-[11px] text-paper/60">✦ 深度复盘</div>}
          {m.content}
        </div>
      </div>
    );
  return (
    <div className="rise flex gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.svg" alt="" className="mt-0.5 h-7 w-7 shrink-0 rounded-[9px]" />
      <div className="min-w-0 flex-1">
        <div className="mb-1 text-[12px] text-ink3">老算{m.deep && <span className="ml-1.5 text-clay">· 深谈</span>}</div>
        {m.streaming && !m.content ? (
          <div className="flex h-6 items-center gap-1">{[0, 1, 2].map((i) => <span key={i} className="dot h-1.5 w-1.5 rounded-full bg-ink3" style={{ animationDelay: `${i * 0.15}s` }} />)}</div>
        ) : (
          <div className={m.deep ? "rounded-2xl border border-clay/15 bg-white/50 p-4" : ""}>
            <Markdown text={m.content} streaming={m.streaming} />
          </div>
        )}
        {(m.pills || m.date) && (
          <div className="fade mt-3 flex flex-wrap items-center gap-2">
            {m.date && (
              <label className="flex items-center gap-2 rounded-full border border-ink/10 bg-white/70 py-1 pl-3.5 pr-1 text-[13.5px] text-ink2">
                <input type="date" value={d} onChange={(e) => setD(e.target.value)} max="2020-12-31" className="bg-transparent outline-none" />
                <button disabled={!d} onClick={() => onDate(d)} className="rounded-full bg-ink px-3 py-1 text-[12.5px] text-paper disabled:opacity-25">好了</button>
              </label>
            )}
            {m.pills?.map((p) => <Chip key={p} onClick={() => onPill(p)}>{p}</Chip>)}
          </div>
        )}
      </div>
    </div>
  );
}

export function Chip({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <button onClick={onClick} className="rounded-full border border-ink/10 bg-white/60 px-3.5 py-1.5 text-[13.5px] text-ink2 transition active:scale-95 active:bg-paper2">{children}</button>;
}

function IconBtn({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return <button aria-label={label} onClick={onClick} className="flex h-11 w-11 items-center justify-center rounded-full text-ink2 transition active:scale-90 active:bg-paper2">{children}</button>;
}
