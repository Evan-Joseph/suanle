"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Coins, Sparkles, Compass, Flame, Trash2, ChevronLeft, Clock3 } from "lucide-react";
import { useApp, useUI } from "@/store/app";
import { CoinsWidget, TarotWidget, BaziWidget, AlmanacWidget } from "@/components/chat/Widgets";
import { bringToChat } from "@/lib/engine";
import { SectionTitle, HexGlyph } from "@/components/ui";
import { HEXAGRAMS, hexLines } from "@/lib/divination";

type Tool = "coins" | "tarot" | "bazi";

const TOOLS: { id: Tool | "letgo" | "lamp"; name: string; desc: string; icon: React.ReactNode; tint: string }[] = [
  { id: "coins", name: "摇一卦", desc: "三枚铜钱，六爻定局", icon: <Coins size={20} />, tint: "from-[#f3e5c3] to-[#e8d3a0]" },
  { id: "tarot", name: "抽三张", desc: "此刻 · 卡住 · 可以试试", icon: <Sparkles size={20} />, tint: "from-[#d9e0ea] to-[#c3cedd]" },
  { id: "bazi", name: "排八字", desc: "四柱五行，看看底色", icon: <Compass size={20} />, tint: "from-[#d9e4d2] to-[#c4d4b9]" },
  { id: "letgo", name: "放下", desc: "写下来，揉掉，扔了", icon: <Trash2 size={20} />, tint: "from-[#f1d9d1] to-[#e7c3b7]" },
  { id: "lamp", name: "点一盏灯", desc: "三十天的长明与安心", icon: <Flame size={20} />, tint: "from-[#f6e3c8] to-[#efcf9e]" },
];

export default function ExploreView() {
  const [tool, setTool] = useState<Tool | null>(null);
  const [question, setQuestion] = useState("");
  const setTab = useUI((s) => s.setTab);
  const setSheet = useUI((s) => s.setSheet);
  const readings = useApp((s) => s.readings);
  const daily = useMemo(() => { const d = new Date(); return HEXAGRAMS[(d.getFullYear() * 366 + d.getMonth() * 31 + d.getDate()) % 64]; }, []);

  const submit = (text: string) => { setTool(null); setQuestion(""); bringToChat(text, { fresh: true }); };

  return (
    <div className="scroll-thin h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-2xl px-5 pb-[calc(24px+var(--sab))] pt-[calc(14px+var(--sat))]">
        <AnimatePresence mode="wait">
          {tool ? (
            <motion.div key={tool} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }}>
              <button onClick={() => setTool(null)} className="mb-2 -ml-2 flex items-center gap-0.5 rounded-full px-2 py-1 text-sm text-ink-2 hover:bg-white/60"><ChevronLeft size={16} /> 返回</button>
              {tool !== "bazi" && (
                <input value={question} onChange={(e) => setQuestion(e.target.value.slice(0, 40))} placeholder="想问的事（可以不写）" className="h-11 w-full rounded-xl border border-ink/10 bg-white/70 px-4 text-[15px] outline-none focus:border-ink/40" />
              )}
              {tool === "coins" && <CoinsWidget question={question || undefined} onSubmit={submit} />}
              {tool === "tarot" && <TarotWidget question={question || undefined} onSubmit={submit} />}
              {tool === "bazi" && <BaziWidget onSubmit={submit} standalone />}
            </motion.div>
          ) : (
            <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h1 className="font-serif text-[22px] font-semibold tracking-[0.12em]">探一探</h1>
              <p className="mt-0.5 text-xs text-ink-3">工具都在，用哪个，看今天的心情。</p>

              <div className="mt-5"><AlmanacWidget onSubmit={(t) => bringToChat(t, { fresh: true })} /></div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                {TOOLS.map((t, i) => (
                  <motion.button key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i }}
                    onClick={() => (t.id === "letgo" ? setTab("letgo") : t.id === "lamp" ? setSheet({ kind: "lamp" }) : setTool(t.id))}
                    className={`press flex flex-col items-start gap-3 rounded-2xl border border-white/60 bg-gradient-to-br ${t.tint} p-4 text-left shadow-card ${i === TOOLS.length - 1 && TOOLS.length % 2 ? "col-span-2 flex-row items-center" : ""}`}>
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/70 text-ink">{t.icon}</span>
                    <span className="min-w-0"><span className="block font-serif text-[16px] font-semibold">{t.name}</span><span className="block text-xs text-ink-2">{t.desc}</span></span>
                  </motion.button>
                ))}
              </div>

              <div className="paper-card mt-6 flex items-center gap-4 rounded-2xl p-4">
                <HexGlyph lines={hexLines(daily)} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] tracking-wider text-ink-3">今日一卦</div>
                  <div className="font-serif text-[17px] font-semibold">{daily.full}</div>
                  <p className="mt-0.5 text-[13px] leading-snug text-ink-2">{daily.gist}</p>
                </div>
              </div>

              {readings.length > 0 && (
                <div className="mt-7">
                  <SectionTitle sub={`${readings.length} 次`}>推演存档</SectionTitle>
                  <div className="space-y-2">
                    {readings.slice(0, 8).map((r) => (
                      <div key={r.id} className="flex items-center gap-3 rounded-xl bg-white/60 px-3.5 py-2.5">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-paper-2 text-ink-2">{r.kind === "coins" ? <Coins size={15} /> : r.kind === "tarot" ? <Sparkles size={15} /> : <Compass size={15} />}</span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[14px]">{r.title}</div>
                          <div className="truncate text-[11px] text-ink-3">{r.summary}</div>
                        </div>
                        <span className="flex shrink-0 items-center gap-1 text-[11px] text-ink-4"><Clock3 size={11} />{new Date(r.createdAt).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
