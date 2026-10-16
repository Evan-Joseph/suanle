"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus, Trash2, Search } from "lucide-react";
import { useApp, useUI, scheduleSync } from "@/store/app";
import { Logo, Pill } from "@/components/ui";

const CATS = ["全部", "感情", "事业", "家庭", "自我", "财运", "日常"];

export default function SessionDrawer() {
  const open = useUI((s) => s.drawer);
  const setDrawer = useUI((s) => s.setDrawer);
  const sessions = useApp((s) => s.sessions);
  const currentId = useApp((s) => s.currentId);
  const setCurrent = useApp((s) => s.setCurrent);
  const deleteSession = useApp((s) => s.deleteSession);
  const [cat, setCat] = useState("全部");
  const [q, setQ] = useState("");
  const [now, setNow] = useState(0);
  useEffect(() => { if (!open) return; const id = requestAnimationFrame(() => setNow(Date.now())); return () => cancelAnimationFrame(id); }, [open]);

  const list = useMemo(() => sessions
    .filter((s) => s.messages.some((m) => !m.intro))
    .filter((s) => cat === "全部" || s.category === cat)
    .filter((s) => !q || s.title.includes(q) || s.messages.some((m) => m.content.includes(q)))
    .sort((a, b) => b.updatedAt - a.updatedAt), [sessions, cat, q]);

  const groups = useMemo(() => {
    const g: Record<string, typeof list> = { 今天: [], 最近七天: [], 更早: [] };
    for (const s of list) {
      const d = now - s.updatedAt;
      (d < 86400000 ? g["今天"] : d < 7 * 86400000 ? g["最近七天"] : g["更早"]).push(s);
    }
    return Object.entries(g).filter(([, v]) => v.length);
  }, [list, now]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-[50] bg-ink/25" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawer(false)} />
          <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", stiffness: 380, damping: 38 }}
            drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={{ left: 0.5, right: 0 }} onDragEnd={(_, i) => { if (i.offset.x < -80 || i.velocity.x < -500) setDrawer(false); }}
            className="fixed inset-y-0 left-0 z-[51] flex w-[84vw] max-w-[340px] flex-col bg-paper pt-[calc(12px+var(--sat))] shadow-[10px_0_40px_rgba(43,42,40,0.15)]">
            <div className="flex items-center justify-between px-4">
              <div className="flex items-center gap-2 font-serif text-lg font-semibold"><Logo size={22} /> 心事簿</div>
              <button onClick={() => { setCurrent(null); setDrawer(false); }} className="flex h-9 items-center gap-1 rounded-full bg-ink px-3 text-xs text-paper"><Plus size={14} /> 新对话</button>
            </div>
            <div className="mx-4 mt-3 flex h-10 items-center gap-2 rounded-xl bg-white/70 px-3">
              <Search size={15} className="text-ink-3" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="找一找" className="w-full bg-transparent text-sm outline-none placeholder:text-ink-4" />
            </div>
            <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto px-4">{CATS.map((c) => <Pill key={c} active={cat === c} onClick={() => setCat(c)}>{c}</Pill>)}</div>
            <div className="scroll-thin mt-2 flex-1 overflow-y-auto px-3 pb-[calc(16px+var(--sab))]">
              {groups.length === 0 && <p className="mt-10 text-center text-sm text-ink-3">还没有记下什么。<br />聊过的心事会自动归到这里。</p>}
              {groups.map(([label, items]) => (
                <div key={label} className="mt-3">
                  <div className="px-2 pb-1 text-[11px] tracking-wider text-ink-3">{label}</div>
                  {items.map((s) => (
                    <div key={s.id} className={`group flex items-center gap-2 rounded-xl px-2 py-2 ${s.id === currentId ? "bg-white/80 shadow-sm" : "hover:bg-white/50"}`}>
                      <button onClick={() => { setCurrent(s.id); setDrawer(false); }} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-paper-2 text-base">{s.emoji}</span>
                        <span className="min-w-0">
                          <span className="block truncate text-[14px]">{s.title}</span>
                          <span className="block truncate text-[11px] text-ink-3">{s.category} · {s.messages.filter((m) => !m.intro).length} 条</span>
                        </span>
                      </button>
                      <button onClick={() => { if (confirm("这段心事就不留了？")) { deleteSession(s.id); scheduleSync(); } }} aria-label="删除" className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-4 opacity-70 hover:bg-cinnabar-soft hover:text-cinnabar sm:opacity-0 sm:group-hover:opacity-100"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
