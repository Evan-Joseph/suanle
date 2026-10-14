"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Eraser, Flame, Sparkles, Wine } from "lucide-react";
import { usePaywall } from "@/components/paywall";
import { PERSONAS, buildReply, type Persona } from "@/lib/chat";
import { useStore } from "@/lib/store";

// ————————— 双轨叙事渲染：*动作* 与 台词 —————————
function DualTrack({ text }: { text: string }) {
  const parts = text.split(/(\*[^*\n]+\*)/g).filter(Boolean);
  return (
    <div className="space-y-1.5">
      {parts.map((p, i) =>
        p.startsWith("*") && p.endsWith("*") ? (
          <p key={i} className="text-[12px] font-light leading-relaxed tracking-[0.08em] text-faint">
            {p.slice(1, -1)}
          </p>
        ) : (
          <p key={i} className="whitespace-pre-wrap text-[14px] leading-[1.9] text-ink">{p}</p>
        ),
      )}
    </div>
  );
}

function Typing({ aura }: { aura: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-1 py-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: aura }}
          animate={{ opacity: [0.25, 1, 0.25], y: [0, -3, 0] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}
        />
      ))}
    </span>
  );
}

export default function TavernPage() {
  const store = useStore();
  const { open } = usePaywall();
  const [pid, setPid] = useState(PERSONAS[0].id);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState("");
  const streaming = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const persona: Persona = PERSONAS.find((p) => p.id === pid) ?? PERSONAS[0];
  const log = store.state.chatLog[pid] ?? [];

  const scrollDown = useCallback(() => {
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }));
  }, []);
  useEffect(scrollDown, [log.length, draft, typing, scrollDown]);

  // 入座问候
  useEffect(() => {
    if (!store.ready || log.length > 0) return;
    setTyping(true);
    const t = setTimeout(() => {
      if (streaming.current) { setTyping(false); return; }
      streaming.current = true;
      store.chatAppend(pid, "assistant", persona.greeting(store.state.profile?.name?.trim() || ""));
      setTyping(false);
      streaming.current = false;
    }, 900);
    return () => { clearTimeout(t); setTyping(false); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid, store.ready]);

  const localTypewriter = useCallback((full: string) => {
    return new Promise<void>((resolve) => {
      let i = 0;
      setDraft("");
      const timer = setInterval(() => {
        i += 1 + Math.floor(Math.random() * 2);
        setDraft(full.slice(0, i));
        if (i >= full.length) {
          clearInterval(timer);
          resolve();
        }
      }, 18);
    });
  }, []);

  const send = async (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || streaming.current) return;
    if (!store.isPro && store.chatLeft <= 0) {
      open({ context: "tavern" });
      return;
    }
    streaming.current = true;
    setInput("");
    store.chatAppend(pid, "user", text);
    store.chatUse();
    setTyping(true);

    const history = [...(store.state.chatLog[pid] ?? []), { role: "user" as const, text }];
    let full = "";

    // 已接入私有智囊 → 走流式接口
    if (store.state.api?.apiKey) {
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history.map((m) => ({ role: m.role, content: m.text })),
            config: store.state.api,
            persona: { name: persona.name, title: persona.title, bio: persona.bio },
          }),
        });
        if (!res.ok || !res.body) throw new Error("upstream");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        setTyping(false);
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const events = buf.split("\n\n");
          buf = events.pop() ?? "";
          for (const ev of events) {
            const line = ev.trim();
            if (!line.startsWith("data:")) continue;
            const payload = line.slice(5).trim();
            if (payload === "[DONE]") continue;
            try {
              const json = JSON.parse(payload);
              const delta = json.choices?.[0]?.delta?.content ?? "";
              if (delta) { full += delta; setDraft(full); }
            } catch { /* 跳过非 JSON 帧 */ }
          }
        }
      } catch { full = ""; }
    }

    // 本地挚友语料（酒馆自酿）
    if (!full) {
      const turn = history.length;
      const reply = buildReply(pid, text, turn);
      await new Promise((r) => setTimeout(r, 700));
      setTyping(false);
      await localTypewriter(reply);
      full = reply;
    }

    setDraft("");
    store.chatAppend(pid, "assistant", full);
    streaming.current = false;
  };

  if (!store.ready) return <div className="h-[72vh]" />;

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-200px)] max-w-[760px] flex-col">
      {/* 头部 */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-[11px] tracking-[0.42em] text-faint">
            <Wine size={13} className="text-terra" /> 宿命酒馆 · 今晚不打烊
          </p>
          <h1 className="mt-4 font-display text-[30px] font-black tracking-[0.05em] sm:text-[36px]">
            推门，落座，把心事摊开<span className="text-terra">。</span>
          </h1>
        </div>
        <button
          onClick={() => store.chatClear(pid)}
          className="btn-ghost mt-2 h-9 shrink-0 px-3.5 text-[12px]"
          title="清空这一桌"
        >
          <Eraser size={13} /> 换一桌
        </button>
      </div>

      {/* 坐台挚友 */}
      <div className="no-scrollbar -mx-5 mt-7 flex gap-3 overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0">
        {PERSONAS.map((p) => {
          const active = p.id === pid;
          return (
            <button
              key={p.id}
              onClick={() => setPid(p.id)}
              className={`relative flex min-w-[190px] flex-col rounded-3xl border p-4 text-left transition-all ${
                active ? "border-ink bg-card shadow-soft" : "border-line bg-paper hover:border-faint/60"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 font-display text-[16px] font-bold"
                  style={{ background: p.aura }}
                >
                  {p.name[0]}
                </span>
                <div>
                  <p className="font-display text-[15px] font-bold">{p.name}</p>
                  <p className="text-[10.5px] text-faint">{p.title}</p>
                </div>
              </div>
              <p className="mt-2.5 line-clamp-2 text-[11px] leading-relaxed text-ink2">{p.bio}</p>
              {active && <motion.span layoutId="persona-dot" className="absolute right-4 top-4 h-2 w-2 rounded-full bg-mint" />}
            </button>
          );
        })}
      </div>

      {/* 对话区 */}
      <div className="mt-6 flex-1 space-y-5 pb-6">
        {log.map((m, i) =>
          m.role === "user" ? (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
              <div className="max-w-[80%] rounded-[1.4rem] rounded-br-md bg-ink px-5 py-3.5 text-paper shadow-soft">
                <p className="whitespace-pre-wrap text-[14px] leading-[1.85]">{m.text}</p>
              </div>
            </motion.div>
          ) : (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3">
              <span
                className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink/10 font-display text-[14px] font-bold"
                style={{ background: persona.aura }}
              >
                {persona.name[0]}
              </span>
              <div className="max-w-[84%] rounded-[1.4rem] rounded-tl-md border border-line px-5 py-4" style={{ background: persona.mist }}>
                <DualTrack text={m.text} />
              </div>
            </motion.div>
          ),
        )}

        {(typing || draft) && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3">
            <span
              className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink/10 font-display text-[14px] font-bold"
              style={{ background: persona.aura }}
            >
              {persona.name[0]}
            </span>
            <div className="max-w-[84%] rounded-[1.4rem] rounded-tl-md border border-line px-5 py-4" style={{ background: persona.mist }}>
              {draft ? <DualTrack text={draft} /> : <Typing aura={persona.aura} />}
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} className="h-1" />
      </div>

      {/* 引子 */}
      <AnimatePresence>
        {log.length <= 1 && !typing && !draft && (
          <motion.div exit={{ opacity: 0, y: 8 }} className="mb-3 flex flex-wrap gap-2">
            {persona.suggestions.map((s) => (
              <button key={s} onClick={() => send(s)} className="chip transition hover:border-ink/40 hover:text-ink">
                <Sparkles size={11} className="text-gold" /> {s}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 输入台 */}
      <div className="sticky bottom-24 lg:bottom-6">
        <div className="rounded-full border border-line bg-paper/95 p-1.5 shadow-lift backdrop-blur">
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) send(); }}
              placeholder={store.isPro || store.chatLeft > 0 ? `和${persona.name}说说……` : "今日份额已尽，加一席再聊"}
              className="h-11 flex-1 bg-transparent px-5 text-[14px] outline-none placeholder:text-faint"
            />
            <button
              onClick={() => send()}
              disabled={!input.trim()}
              className="btn-ink h-11 w-11 rounded-full p-0 disabled:opacity-40"
              aria-label="发送"
            >
              <ArrowUp size={17} strokeWidth={2.2} />
            </button>
          </div>
        </div>
        <div className="mt-2 flex justify-center">
          {store.isPro ? (
            <span className="text-[10.5px] tracking-[0.24em] text-faint">PRO 席位 · 今晚聊到天亮也不算多</span>
          ) : store.chatLeft > 0 ? (
            <span className="flex items-center gap-1.5 text-[10.5px] tracking-[0.24em] text-faint">
              <Flame size={11} className="text-terra" /> 今日还可深聊 {store.chatLeft} 次 · 升级后不限次
            </span>
          ) : (
            <button onClick={() => open({ context: "tavern" })} className="text-[10.5px] tracking-[0.24em] text-terra">
              今日份已尽 · 加一席热茶 →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
