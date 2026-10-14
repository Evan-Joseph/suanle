"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp, useUI } from "@/lib/store";
import { parseAssistant } from "@/lib/parse";
import { Icon, Logo, timeAgo } from "../ui";

const ORDER = ["心事", "感情", "事业", "学业", "财运", "健康", "卦象", "命盘", "日常"];

export default function SessionDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const sessions = useApp((s) => s.sessions);
  const currentId = useApp((s) => s.currentId);
  const setCurrent = useApp((s) => s.setCurrent);
  const del = useApp((s) => s.deleteSession);
  const [q, setQ] = useState("");
  const [confirm, setConfirm] = useState<string | null>(null);
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const r = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
      return () => cancelAnimationFrame(r);
    }
    setShown(false);
    const t = setTimeout(() => setMounted(false), 300);
    return () => clearTimeout(t);
  }, [open]);

  const groups = useMemo(() => {
    const list = sessions
      .filter((s) => s.messages.some((m) => !m.intro))
      .filter((s) => !q || s.title.includes(q) || s.messages.some((m) => m.content.includes(q)));
    const recent = list.filter((s) => Date.now() - s.updatedAt < 86400000 * 2).slice(0, 4);
    const rest = list.filter((s) => !recent.includes(s));
    const byCat: Record<string, typeof list> = {};
    rest.forEach((s) => (byCat[s.category] ??= []).push(s));
    const out: { label: string; items: typeof list }[] = [];
    if (recent.length) out.push({ label: "最近", items: recent });
    ORDER.forEach((c) => byCat[c]?.length && out.push({ label: c, items: byCat[c] }));
    Object.keys(byCat)
      .filter((c) => !ORDER.includes(c))
      .forEach((c) => out.push({ label: c, items: byCat[c] }));
    return out;
  }, [sessions, q]);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 z-40">
      <div className={`absolute inset-0 bg-ink/30 transition-opacity duration-300 ${shown ? "opacity-100" : "opacity-0"}`} onClick={onClose} />
      <aside
        className={`paper-grain absolute inset-y-0 left-0 flex w-[84%] max-w-[360px] flex-col shadow-2xl transition-transform duration-300 ease-out ${shown ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="pt-safe px-4 pt-4">
          <div className="flex items-center gap-2.5">
            <Logo size={30} />
            <div>
              <div className="font-song text-[17px] font-bold leading-tight">算了</div>
              <div className="text-[11px] text-mute">算一算，然后，算了。</div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-black/[0.045] px-3 py-2">
            <Icon name="search" size={16} className="text-mute" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="找找聊过的事" className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-mute" />
          </div>
          <button
            onClick={() => {
              setCurrent(null);
              onClose();
            }}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-ink/80 py-2.5 text-[14px] font-medium active:scale-[0.98]"
          >
            <Icon name="plus" size={16} /> 新的对话
          </button>
        </div>
        <div className="no-scrollbar mt-3 min-h-0 flex-1 overflow-y-auto px-2 pb-6">
          {groups.length === 0 && <div className="px-3 py-10 text-center text-[13px] leading-relaxed text-mute">还没有聊过的事。<br />聊过的，会按心事自动归好类。</div>}
          {groups.map((g) => (
            <div key={g.label} className="mb-2">
              <div className="px-3 pb-1 pt-3 text-[11.5px] tracking-widest text-mute">{g.label}</div>
              {g.items.map((s) => {
                const last = [...s.messages].reverse().find((m) => m.role === "assistant" && !m.intro);
                const snippet = last ? parseAssistant(last.content).body.replace(/```[\s\S]*?```/g, "").replace(/[*>#\n]/g, " ").slice(0, 40) : "";
                return (
                  <div
                    key={s.id}
                    className={`group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 transition ${s.id === currentId ? "bg-white shadow-sm" : "active:bg-black/5"}`}
                  >
                    <button
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      onClick={() => {
                        setCurrent(s.id);
                        useUI.getState().setQuote(null);
                        onClose();
                      }}
                    >
                      <span className="text-[20px]">{s.emoji}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14.5px] text-ink">{s.title}</span>
                        <span className="block truncate text-[11.5px] text-mute">
                          {timeAgo(s.updatedAt)} · {snippet}
                        </span>
                      </span>
                    </button>
                    {confirm === s.id ? (
                      <button
                        onClick={() => {
                          del(s.id);
                          setConfirm(null);
                        }}
                        className="shrink-0 rounded-full bg-seal px-2.5 py-1 text-[11.5px] text-white"
                      >
                        删掉
                      </button>
                    ) : (
                      <button onClick={() => setConfirm(s.id)} className="shrink-0 p-1 text-mute/70 active:text-seal" aria-label="删除">
                        <Icon name="trash" size={15} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
