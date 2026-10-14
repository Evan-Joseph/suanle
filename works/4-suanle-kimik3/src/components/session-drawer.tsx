"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Coins,
  Moon,
  PanelLeftClose,
  Pencil,
  Pin,
  Plus,
  ScrollText,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { Session, useApp } from "@/store/app";
import { personaById } from "@/lib/personas";
import { Logo, PersonaSeal } from "./logo";
import { cn, relTime } from "@/lib/utils";

function KindIcon({ kind }: { kind: Session["kind"] }) {
  const cls = "text-mist/80";
  if (kind === "tarot") return <Moon size={11} className={cls} />;
  if (kind === "liuyao") return <Coins size={11} className={cls} />;
  if (kind === "bazi") return <ScrollText size={11} className={cls} />;
  return <Sparkles size={11} className={cls} />;
}

export function SessionList({ onNavigate }: { onNavigate?: () => void }) {
  const sessions = useApp((s) => s.sessions);
  const messages = useApp((s) => s.messages);
  const activeId = useApp((s) => s.activeSessionId);
  const newSession = useApp((s) => s.newSession);
  const openSession = useApp((s) => s.openSession);
  const deleteSession = useApp((s) => s.deleteSession);
  const renameSession = useApp((s) => s.renameSession);
  const pinSession = useApp((s) => s.pinSession);
  const setTab = useApp((s) => s.setTab);

  const [q, setQ] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    const sorted = [...sessions].sort((a, b) => {
      if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
      return b.updatedAt - a.updatedAt;
    });
    if (!kw) return sorted;
    return sorted.filter((s) => {
      const inTitle = s.title.toLowerCase().includes(kw);
      const inMsgs = (messages[s.id] ?? []).some((m) => m.content.toLowerCase().includes(kw));
      return inTitle || inMsgs;
    });
  }, [sessions, messages, q]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* brand */}
      <div className="flex items-center gap-2.5 px-4 pb-3 pt-4">
        <Logo size={30} className="text-ink night:text-gold-2" />
        <div className="min-w-0 flex-1">
          <div className="font-display text-[16px] tracking-[0.14em] text-ink night:text-moon">
            算了 · Suanle
          </div>
          <div className="truncate text-[10px] tracking-[0.2em] text-mist">算一算，然后，算了</div>
        </div>
        <button
          onClick={() => {
            newSession();
            onNavigate?.();
          }}
          className="no-tap-highlight flex h-9 items-center gap-1.5 rounded-full bg-cinnabar px-3 text-[12px] text-paper-2 shadow-sm transition-all active:scale-95 night:bg-gold-2 night:text-night"
        >
          <Plus size={14} strokeWidth={2.5} />
          新起一炉
        </button>
      </div>

      {/* search */}
      <div className="px-4 pb-2">
        <div className="flex items-center gap-2 rounded-xl border border-line/70 bg-paper-2 px-3 py-2 night:border-white/10 night:bg-white/[0.04]">
          <Search size={14} className="shrink-0 text-mist" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜一搜聊过的心事…"
            className="w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-mist/60 night:text-moon"
          />
          {q && (
            <button onClick={() => setQ("")} className="no-tap-highlight text-mist" aria-label="清空">
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* list */}
      <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2.5 pb-3 night-scroll">
        {filtered.length === 0 && (
          <div className="px-4 py-10 text-center text-[12.5px] leading-relaxed text-mist">
            {q ? "没搜到这回事。或许它真的该算了。" : "炉里还空着。\n点「新起一炉」，说点什么吧。"}
          </div>
        )}
        {filtered.map((s) => {
          const p = personaById(s.personaId);
          const active = s.id === activeId;
          const editing = editingId === s.id;
          return (
            <div
              key={s.id}
              className={cn(
                "group relative flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition-colors",
                active
                  ? "bg-cinnabar/[0.08] night:bg-gold-2/10"
                  : "hover:bg-ink/[0.04] night:hover:bg-white/[0.05]"
              )}
            >
              <button
                className="no-tap-highlight flex min-w-0 flex-1 items-center gap-2.5"
                onClick={() => {
                  openSession(s.id);
                  onNavigate?.();
                }}
              >
                <PersonaSeal glyph={p.glyph} hue={p.hue} size={30} />
                <span className="min-w-0 flex-1">
                  {editing ? (
                    <span className="flex items-center gap-1">
                      <input
                        autoFocus
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            renameSession(s.id, editText.trim() || s.title);
                            setEditingId(null);
                          }
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="w-full rounded-lg border border-cinnabar/40 bg-paper-2 px-1.5 py-0.5 text-[13px] outline-none night:bg-night-3 night:text-moon"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        className="no-tap-highlight shrink-0 text-cinnabar night:text-gold-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          renameSession(s.id, editText.trim() || s.title);
                          setEditingId(null);
                        }}
                        aria-label="确定"
                      >
                        <Check size={14} />
                      </button>
                    </span>
                  ) : (
                    <>
                      <span className="flex items-center gap-1.5">
                        {s.pinned && <Pin size={10} className="shrink-0 -rotate-45 text-cinnabar night:text-gold-2" />}
                        <span className="truncate text-[13.5px] text-ink night:text-moon/90">
                          {s.title}
                        </span>
                        <KindIcon kind={s.kind} />
                      </span>
                      <span className="mt-0.5 block text-[10.5px] text-mist/80">
                        {p.name} · {relTime(s.updatedAt)}
                      </span>
                    </>
                  )}
                </span>
              </button>
              {!editing && (
                <span className="flex shrink-0 items-center gap-0.5 opacity-45 transition-opacity group-hover:opacity-100 lg:opacity-0">
                  <button
                    className="no-tap-highlight rounded-md p-1.5 text-mist transition-colors hover:bg-ink/5 hover:text-ink night:hover:bg-white/10 night:hover:text-moon"
                    onClick={() => pinSession(s.id)}
                    aria-label="置顶"
                  >
                    <Pin size={13} className={s.pinned ? "-rotate-45 text-cinnabar night:text-gold-2" : ""} />
                  </button>
                  <button
                    className="no-tap-highlight rounded-md p-1.5 text-mist transition-colors hover:bg-ink/5 hover:text-ink night:hover:bg-white/10 night:hover:text-moon"
                    onClick={() => {
                      setEditingId(s.id);
                      setEditText(s.title);
                    }}
                    aria-label="改名"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    className="no-tap-highlight rounded-md p-1.5 text-mist transition-colors hover:bg-cinnabar/10 hover:text-cinnabar"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(s.id);
                    }}
                    aria-label="焚毁"
                  >
                    <Trash2 size={13} />
                  </button>
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="border-t border-line/60 px-4 py-3 night:border-white/10">
        <button
          onClick={() => setTab("me")}
          className="no-tap-highlight text-[11px] tracking-wider text-mist transition-colors hover:text-cinnabar night:hover:text-gold-2"
        >
          此处只存心事，不存评判 → 知己
        </button>
      </div>
    </div>
  );
}

/** 抽屉外壳（移动端） + 固定栏（桌面端在 page 中渲染） */
export function SessionDrawer() {
  const open = useApp((s) => s.drawerOpen);
  const setDrawer = useApp((s) => s.setDrawer);
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[75] bg-ink/35 backdrop-blur-[2px] lg:hidden"
            onClick={() => setDrawer(false)}
          />
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 36 }}
            className="fixed inset-y-0 left-0 z-[76] flex w-[300px] flex-col border-r border-line bg-paper shadow-2xl night:border-white/10 night:bg-night-2 lg:hidden"
          >
            <div className="absolute right-2 top-3">
              <button
                onClick={() => setDrawer(false)}
                className="no-tap-highlight rounded-full p-1.5 text-mist"
                aria-label="收起"
              >
                <PanelLeftClose size={17} />
              </button>
            </div>
            <SessionList onNavigate={() => setDrawer(false)} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
