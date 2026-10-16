import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { MoreHorizontal, Pin, PinOff, Search, SquarePen, Trash2 } from "lucide-react";
import { useApp, useUI } from "@/lib/store";
import { Logo, timeAgo } from "../ui";

export default function SessionDrawer() {
  const open = useUI((s) => s.drawer);
  const sessions = useApp((s) => s.sessions);
  const currentId = useApp((s) => s.currentId);
  const profile = useApp((s) => s.profile);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("全部");
  const [menu, setMenu] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);

  const visible = sessions.filter((s) => s.messages.some((m) => m.role === "user"));
  const cats = useMemo(() => {
    const m = new Map<string, number>();
    visible.forEach((s) => m.set(s.category, (m.get(s.category) ?? 0) + 1));
    return ["全部", ...[...m.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k)];
  }, [visible]);

  const list = visible
    .filter((s) => (cat === "全部" || s.category === cat) && (!q || s.title.includes(q) || s.messages.some((m) => m.content.includes(q))))
    .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.updatedAt - a.updatedAt);

  const close = () => {
    useUI.getState().setDrawer(false);
    setMenu(null);
    setConfirm(null);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="absolute inset-0 z-40">
          <motion.div className="absolute inset-0 bg-[#1f1d1a]/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} />
          <motion.aside
            className="paper-grain absolute inset-y-0 left-0 flex w-[84%] max-w-[340px] flex-col shadow-[8px_0_40px_rgba(0,0,0,0.12)]"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 340 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0.5, right: 0 }}
            onDragEnd={(_, i) => {
              if (i.offset.x < -80 || i.velocity.x < -500) close();
            }}
          >
            <div className="pt-safe" />
            <div className="flex items-center justify-between px-4 pb-2 pt-4">
              <div className="flex items-center gap-2.5">
                <Logo size={26} />
                <span className="font-song text-[17px] font-bold tracking-[0.14em]">算了</span>
              </div>
              <button
                onClick={() => {
                  useApp.getState().setCurrent(null);
                  useUI.getState().setTab("chat");
                  close();
                }}
                className="flex h-9 items-center gap-1.5 rounded-full bg-ink px-3.5 text-[13px] text-paper active:scale-95"
              >
                <SquarePen size={14} /> 新对话
              </button>
            </div>
            <div className="px-4 pt-1">
              <label className="flex h-10 items-center gap-2 rounded-2xl bg-black/[0.04] px-3 text-mute">
                <Search size={15} />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="找找聊过的话" className="min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-faint" />
              </label>
            </div>
            {cats.length > 2 && (
              <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-4 pt-3">
                {cats.map((c) => (
                  <button key={c} onClick={() => setCat(c)} className={`h-7 shrink-0 rounded-full px-3 text-[12px] transition ${cat === c ? "bg-ink text-paper" : "bg-black/[0.04] text-ink-2"}`}>
                    {c}
                  </button>
                ))}
              </div>
            )}
            <div className="no-scrollbar mt-2 min-h-0 flex-1 overflow-y-auto px-2 pb-3">
              {list.length === 0 && (
                <div className="whitespace-pre-line px-6 pt-16 text-center text-[13px] leading-relaxed text-mute">{q ? "没找到相关的对话" : "还没有聊过天。\n想说什么，随时都在。"}</div>
              )}
              {list.map((s) => (
                <div key={s.id} className="relative">
                  <div
                    role="button"
                    onClick={() => {
                      useApp.getState().setCurrent(s.id);
                      useUI.getState().setTab("chat");
                      close();
                    }}
                    className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 transition ${s.id === currentId ? "bg-black/[0.055]" : "active:bg-black/[0.04]"}`}
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-[17px] shadow-[0_1px_4px_rgba(0,0,0,0.05)]">{s.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1 truncate text-[14px] text-ink">
                        {s.pinned && <Pin size={11} className="shrink-0 text-seal" />}
                        <span className="truncate">{s.title}</span>
                      </div>
                      <div className="mt-0.5 text-[11.5px] text-mute">
                        {s.category} · {timeAgo(s.updatedAt)}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenu(menu === s.id ? null : s.id);
                        setConfirm(null);
                      }}
                      aria-label="更多"
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-mute active:bg-black/5"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                  <AnimatePresence>
                    {menu === s.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="flex gap-2 px-3 pb-2 pl-[60px]">
                          <button
                            onClick={() => {
                              useApp.getState().patchSession(s.id, { pinned: !s.pinned });
                              setMenu(null);
                            }}
                            className="flex h-8 items-center gap-1 rounded-full bg-white px-3 text-[12px] text-ink-2 shadow-sm"
                          >
                            {s.pinned ? <PinOff size={13} /> : <Pin size={13} />} {s.pinned ? "取消置顶" : "置顶"}
                          </button>
                          <button
                            onClick={() => {
                              if (confirm === s.id) {
                                useApp.getState().deleteSession(s.id);
                                setMenu(null);
                                setConfirm(null);
                                useUI.getState().toast("这段对话，算了");
                              } else setConfirm(s.id);
                            }}
                            className={`flex h-8 items-center gap-1 rounded-full px-3 text-[12px] shadow-sm transition ${confirm === s.id ? "bg-seal text-white" : "bg-white text-seal"}`}
                          >
                            <Trash2 size={13} /> {confirm === s.id ? "确定删除" : "删除"}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                useUI.getState().setTab("me");
                close();
              }}
              className="pb-safe mx-3 mb-1 flex items-center gap-3 rounded-2xl border-t border-line px-2 pt-3 text-left"
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-ink font-song text-[15px] text-paper">{(profile.name || "友").slice(0, 1)}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px]">{profile.name || "还没告诉我怎么称呼"}</div>
                <div className="truncate text-[11.5px] text-mute">{profile.tags.slice(0, 3).join(" · ") || "聊着聊着，就熟了"}</div>
              </div>
            </button>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
