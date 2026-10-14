"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PanelLeftOpen, SquarePen, X } from "lucide-react";
import { useApp, useActiveSession } from "@/store/app";
import { PERSONAS, personaById } from "@/lib/personas";
import { MessageItem } from "./message-item";
import { Composer } from "./composer";
import { Logo, PersonaSeal } from "./logo";
import { DAILY_LINES } from "@/lib/brand";
import { dayOfYear, uid } from "@/lib/utils";
import { ChatMessage } from "@/store/app";

export function ChatView() {
  const session = useActiveSession();
  const messages = useApp((s) => s.messages);
  const newSession = useApp((s) => s.newSession);
  const openSession = useApp((s) => s.openSession);
  const sessions = useApp((s) => s.sessions);
  const activeId = useApp((s) => s.activeSessionId);
  const setDrawer = useApp((s) => s.setDrawer);
  const send = useApp((s) => s.send);
  const setTab = useApp((s) => s.setTab);
  const setSessionPersona = useApp((s) => s.setSessionPersona);
  const toast = useApp((s) => s.toast);

  const [personaSheet, setPersonaSheet] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);

  const list = session ? messages[session.id] ?? [] : [];
  const persona = personaById(session?.personaId);

  // 确保永远有一个打开的会话；空会话时放入大师招呼语
  useEffect(() => {
    if (!activeId) {
      if (sessions.length > 0) openSession(sessions[0].id);
      else newSession();
      return;
    }
    const msgs = useApp.getState().messages[activeId];
    if (msgs && msgs.length === 0) {
      const s = useApp.getState().sessions.find((x) => x.id === activeId);
      const p = personaById(s?.personaId);
      const greet: ChatMessage = {
        id: uid("m"),
        role: "assistant",
        content: p.greeting,
        ts: Date.now(),
      };
      useApp.setState((st) => ({
        messages: { ...st.messages, [activeId]: [greet] },
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  // 自动吸底
  useEffect(() => {
    const el = scrollRef.current;
    if (el && nearBottom.current) el.scrollTop = el.scrollHeight;
  }, [list.length, list[list.length - 1]?.content, list[list.length - 1]?.thinking]);

  const daily = DAILY_LINES[dayOfYear() % DAILY_LINES.length];
  const lastAssistantId = useMemo(
    () => [...list].reverse().find((m) => m.role === "assistant")?.id,
    [list]
  );

  const switchPersona = (pid: string) => {
    if (!session || pid === session.personaId) {
      setPersonaSheet(false);
      return;
    }
    setSessionPersona(session.id, pid);
    const p = personaById(pid);
    const greet: ChatMessage = {
      id: uid("m"),
      role: "assistant",
      content: `*换了把椅子坐下，掸了掸衣袖*\n\n${p.greeting}`,
      ts: Date.now(),
    };
    useApp.setState((st) => ({
      messages: {
        ...st.messages,
        [session.id]: [...(st.messages[session.id] ?? []), greet],
      },
    }));
    toast(`已请${p.name}入座`);
    setPersonaSheet(false);
  };

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col">
      {/* header */}
      <header className="z-10 flex h-[54px] items-center gap-1 border-b border-line/60 bg-paper/85 px-2 backdrop-blur-md night:border-gold-2/10 night:bg-night/80">
        <button
          onClick={() => setDrawer(true)}
          className="no-tap-highlight flex h-9 w-9 items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-ink/5 night:text-moon night:hover:bg-white/10 lg:hidden"
          aria-label="会话列表"
        >
          <PanelLeftOpen size={19} />
        </button>
        <button
          onClick={() => setPersonaSheet(true)}
          className="no-tap-highlight flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-1.5 py-1 text-left transition-colors hover:bg-ink/[0.04] night:hover:bg-white/5"
        >
          <PersonaSeal glyph={persona.glyph} hue={persona.hue} size={34} />
          <span className="min-w-0">
            <span className="block truncate font-display text-[15px] font-medium tracking-wide text-ink night:text-moon">
              {persona.name}
            </span>
            <span className="block truncate text-[11px] text-mist">
              {session?.title && session.title !== "新起一炉" ? session.title : persona.tagline}
            </span>
          </span>
        </button>
        <button
          onClick={() => setTab("divine")}
          className="no-tap-highlight mr-1 hidden items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[12px] text-ink-2 transition-colors hover:border-cinnabar/40 hover:text-cinnabar night:border-gold-2/20 night:text-moon/80 night:hover:border-gold-2/50 night:hover:text-gold-2 sm:flex"
        >
          起一卦
        </button>
        <button
          onClick={() => newSession()}
          className="no-tap-highlight flex h-9 w-9 items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-ink/5 night:text-moon night:hover:bg-white/10"
          aria-label="新开一炉"
        >
          <SquarePen size={18} />
        </button>
      </header>

      {/* messages */}
      <div
        ref={scrollRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 90;
        }}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        {list.length <= 1 ? (
          <WelcomePanel
            dailyText={daily.text}
            dailyTag={daily.tag}
            suggestions={persona.suggestions}
            onSuggest={(s) => void send(s)}
          />
        ) : null}
        <div className="mx-auto w-full max-w-[720px] space-y-6 px-4 pb-6 pt-5">
          {list.map((m) => (
            <MessageItem
              key={m.id}
              msg={m}
              personaId={session?.personaId ?? "keeper"}
              isLastAssistant={m.id === lastAssistantId}
            />
          ))}
        </div>
      </div>

      <Composer onFocusChat={() => { nearBottom.current = true; }} />

      {/* persona bottom sheet */}
      <AnimatePresence>
        {personaSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] bg-ink/35 backdrop-blur-[2px]"
              onClick={() => setPersonaSheet(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 34 }}
              className="fixed inset-x-0 bottom-0 z-[71] safe-b rounded-t-[28px] border-t border-line bg-paper-2 px-4 pb-6 pt-3 shadow-2xl night:border-gold-2/15 night:bg-night-2"
            >
              <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-line night:bg-white/15" />
              <div className="mb-4 flex items-center justify-between px-1">
                <h3 className="font-display text-[17px] tracking-wider text-ink night:text-moon">
                  今夜谁当值？
                </h3>
                <button
                  onClick={() => setPersonaSheet(false)}
                  className="no-tap-highlight text-mist"
                  aria-label="关闭"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {PERSONAS.map((p) => {
                  const active = p.id === session?.personaId;
                  return (
                    <button
                      key={p.id}
                      onClick={() => switchPersona(p.id)}
                      className={
                        "no-tap-highlight flex flex-col items-center gap-1.5 rounded-2xl border px-3 py-3.5 text-center transition-all active:scale-[0.97] " +
                        (active
                          ? "border-cinnabar/50 bg-cinnabar/[0.06] shadow-sm night:border-gold-2/50 night:bg-gold-2/10"
                          : "border-line bg-paper hover:border-mist/50 night:border-white/10 night:bg-white/[0.03] night:hover:border-gold-2/30")
                      }
                    >
                      <PersonaSeal glyph={p.glyph} hue={p.hue} size={40} />
                      <span className="font-display text-[14px] tracking-wide text-ink night:text-moon">
                        {p.name}
                      </span>
                      <span className="text-[10.5px] leading-tight text-mist">{p.tagline}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function WelcomePanel({
  dailyText,
  dailyTag,
  suggestions,
  onSuggest,
}: {
  dailyText: string;
  dailyTag: string;
  suggestions: string[];
  onSuggest: (s: string) => void;
}) {
  return (
    <div className="mx-auto flex max-w-[560px] flex-col items-center px-6 pb-2 pt-8 text-center">
      <Logo size={64} animated className="text-ink night:text-gold-2" />
      <h1 className="mt-4 font-display text-[26px] tracking-[0.2em] text-ink night:text-moon">
        算了 · Suanle
      </h1>
      <p className="mt-1.5 text-[13px] tracking-[0.3em] text-mist">算一算，然后，算了</p>

      <div className="anim-rise mt-6 w-full rounded-2xl border border-line/80 bg-paper-2/80 px-4 py-3.5 text-left shadow-sm night:border-gold-2/15 night:bg-white/[0.03]">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[11px] tracking-[0.25em] text-cinnabar night:text-gold-2">
            今日一签
          </span>
          <span className="rounded-full bg-cinnabar/10 px-2 py-0.5 text-[10px] text-cinnabar night:bg-gold-2/10 night:text-gold-2">
            {dailyTag}
          </span>
        </div>
        <p className="font-display text-[14.5px] leading-relaxed text-ink-2 night:text-moon/85">
          {dailyText}
        </p>
      </div>

      <div className="mt-5 flex w-full flex-wrap items-center justify-center gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => onSuggest(s)}
            className="no-tap-highlight rounded-full border border-line bg-paper-2 px-3.5 py-2 text-[13px] text-ink-2 transition-all hover:-translate-y-0.5 hover:border-cinnabar/40 hover:text-cinnabar hover:shadow-sm active:scale-95 night:border-white/10 night:bg-white/[0.04] night:text-moon/85 night:hover:border-gold-2/40 night:hover:text-gold-2"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
