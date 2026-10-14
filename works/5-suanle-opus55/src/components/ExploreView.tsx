"use client";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, MessageCircle, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { computeBazi, STEMS, BRANCHES } from "@/lib/divination";
import type { RecordKind } from "@/lib/types";
import { sfx } from "@/lib/sound";
import { BaziWidget, LetGoWidget, LiuyaoWidget, QianWidget, TarotWidget, type RecInput } from "./widgets";
import { useToast } from "./ui";

const TOOLS: { id: RecordKind; name: string; sub: string; glyph: string; tone: string }[] = [
  { id: "liuyao", name: "摇一卦", sub: "三枚铜钱，问一件具体的事", glyph: "☷", tone: "from-[#efe6d3] to-[#e6dac0]" },
  { id: "tarot", name: "抽塔罗", sub: "过去 · 现在 · 建议", glyph: "✦", tone: "from-[#e6e3ec] to-[#d9d4e3]" },
  { id: "qian", name: "求支签", sub: "老天爷递来的便利贴", glyph: "籤", tone: "from-[#f2e0d8] to-[#ead0c4]" },
  { id: "bazi", name: "排八字", sub: "看看你的出厂设置", glyph: "命", tone: "from-[#e3ebe0] to-[#d3dfcf]" },
  { id: "letgo", name: "算了纸篓", sub: "写下来，揉掉，丢开", glyph: "◌", tone: "from-[#ecebe6] to-[#dddbd3]" },
];
const KIND_NAME: Record<RecordKind, string> = { liuyao: "六爻", tarot: "塔罗", qian: "签", bazi: "八字", letgo: "纸篓" };

const CYCLE = ["木", "火", "土", "金", "水"];
function yearTheme(dayEl: string, yearEl: string) {
  const d = CYCLE.indexOf(dayEl), y = CYCLE.indexOf(yearEl);
  if (d === y) return { k: "结伴同行", t: "身边会冒出不少同频的人，适合搭伙做事；也要留意别把钱和面子搅在一起。" };
  if ((y + 1) % 5 === d) return { k: "被托举", t: "贵人缘和学习运都不错，适合充电、考证、找师傅；别怕开口求助。" };
  if ((d + 1) % 5 === y) return { k: "表达输出", t: "灵感多、想说的话多，适合创作和展示自己；注意别把嘴上的锋芒用在亲近的人身上。" };
  if ((y + 2) % 5 === d) return { k: "压力即动力", t: "规矩和担子会变多，扛下来就是升级；但累了要承认累，别硬撑。" };
  return { k: "抓得住机会", t: "财星露面，机会和诱惑都多，脚踏实地的钱拿得稳；冲动消费要算了。" };
}
const STEM_EL = ["木", "木", "火", "火", "土", "土", "金", "金", "水", "水"];

export default function ExploreView({ goChat }: { goChat: () => void }) {
  const { state, addRecord, mergeProfile, set, startSession } = useApp();
  const toast = useToast();
  const [tool, setTool] = useState<RecordKind | null>(null);
  const [openRec, setOpenRec] = useState<string | null>(null);

  const toChat = (text: string, title: string) => {
    startSession();
    sessionStorage.setItem("suanle:pending", JSON.stringify({ text, title }));
    setTool(null);
    setTimeout(goChat, 30);
  };

  const done = (r: RecInput) => {
    addRecord(r);
    if (r.kind === "letgo") { toast("又放下了一件"); return; }
    toChat(r.detail, r.title);
  };

  const y = new Date().getFullYear();
  const yi = (((y - 4) % 60) + 60) % 60;
  const yearGZ = STEMS[yi % 10] + BRANCHES[yi % 12];
  const bz = state.profile.birthDate ? computeBazi(state.profile.birthDate, state.profile.birthTime) : null;
  const theme = bz ? yearTheme(bz.dayEl, STEM_EL[yi % 10]) : null;

  const W = tool === "liuyao" ? LiuyaoWidget : tool === "tarot" ? TarotWidget : tool === "qian" ? QianWidget : tool === "bazi" ? BaziWidget : tool === "letgo" ? LetGoWidget : null;

  return (
    <div className="h-full flex flex-col min-h-0 relative">
      <header className="safe-t shrink-0 px-5 pt-4 pb-2">
        <div className="font-serif text-[26px] font-bold">小仪式</div>
        <div className="text-[13px] text-ink-3 mt-0.5">不必全信，就当给心里的事找个由头。</div>
      </header>
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 pb-6">
        {/* 年度大盘 */}
        <div className="mt-3 rounded-[28px] bg-ink text-paper p-5 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 font-serif text-[120px] leading-none opacity-[0.06] select-none">{yearGZ}</div>
          <div className="text-[11px] opacity-60 tracking-widest">{y} · {yearGZ}年 · 年度大盘</div>
          {theme && bz ? (
            <>
              <div className="font-serif text-[22px] font-bold mt-2">「{theme.k}」的一年</div>
              <p className="text-[13px] opacity-80 mt-2 leading-relaxed">{bz.dayMaster}{bz.dayEl}日主遇上{yearGZ}年：{theme.t}</p>
              <button onClick={() => toChat(`帮我写一份 ${y} 年的年度大盘长卷吧：按季度说说事业、感情、钱财和身体要注意的事，最后给我一句全年的“算了”箴言。我的年度关键词是「${theme.k}」。`, "")}
                className="mt-4 inline-flex items-center gap-1 rounded-full bg-paper text-ink px-4 py-2 text-[13px] font-medium">展开年度长卷 <ChevronRight size={14} /></button>
            </>
          ) : (
            <>
              <div className="font-serif text-[20px] font-bold mt-2">你的年度关键词，还差一个生日</div>
              <p className="text-[13px] opacity-75 mt-2 leading-relaxed">告诉算了你的生日，就能看到这一年属于你的节奏。</p>
              <button onClick={() => setTool("bazi")} className="mt-4 inline-flex items-center gap-1 rounded-full bg-paper text-ink px-4 py-2 text-[13px] font-medium">填个生日 <ChevronRight size={14} /></button>
            </>
          )}
        </div>

        {/* tools */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          {TOOLS.map((t, i) => (
            <motion.button key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              onClick={() => { sfx.tap(); setTool(t.id); }}
              className={`rounded-[26px] bg-gradient-to-br ${t.tone} p-4 text-left active:scale-[0.97] transition relative overflow-hidden ${i === 4 ? "col-span-2" : ""}`}>
              <div className="absolute right-3 top-2 font-serif text-[44px] text-ink/10 leading-none">{t.glyph}</div>
              <div className="font-serif font-bold text-[17px] mt-6">{t.name}</div>
              <div className="text-[12px] text-ink-2 mt-0.5">{t.sub}</div>
              {t.id === "letgo" && state.letgo > 0 && <div className="text-[11px] text-ink-3 mt-1">你已经放下了 {state.letgo} 件心事</div>}
            </motion.button>
          ))}
        </div>

        {/* history */}
        <div className="mt-7 flex items-baseline justify-between px-1">
          <div className="font-serif font-bold text-[17px]">推演簿</div>
          <div className="text-[11px] text-ink-3">{state.records.length} 页</div>
        </div>
        {state.records.length === 0 ? (
          <div className="text-[13px] text-ink-3 text-center py-10">还没有记录。摇过的卦、抽过的牌，都会夹在这里。</div>
        ) : (
          <div className="mt-2 space-y-2">
            {state.records.slice(0, 60).map((r) => (
              <div key={r.id} className="rounded-2xl bg-paper-2/70 border border-paper-3/60">
                <button onClick={() => setOpenRec(openRec === r.id ? null : r.id)} className="w-full flex items-center gap-3 px-4 py-3 text-left">
                  <span className="seal text-[11px] shrink-0">{KIND_NAME[r.kind]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-medium truncate">{r.title}</div>
                    <div className="text-[11px] text-ink-3 truncate">{new Date(r.createdAt).toLocaleDateString("zh-CN", { month: "short", day: "numeric" })} · {r.summary}</div>
                  </div>
                  <ChevronRight size={15} className={`text-ink-3 transition ${openRec === r.id ? "rotate-90" : ""}`} />
                </button>
                <AnimatePresence initial={false}>
                  {openRec === r.id && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="px-4 pb-3">
                        <div className="text-[12px] text-ink-2 whitespace-pre-wrap leading-relaxed break-words">{r.kind === "letgo" ? "那件事已经揉成纸团丢掉了，这里不留底。" : r.detail.replace(/^【.*?】/, "")}</div>
                        <div className="flex gap-2 mt-3">
                          {r.kind !== "letgo" && <button onClick={() => toChat(r.detail, r.title)} className="inline-flex items-center gap-1 rounded-full bg-ink text-paper px-3 py-1.5 text-[12px]"><MessageCircle size={12} />带去聊聊</button>}
                          <button onClick={() => set((s) => ({ ...s, records: s.records.filter((x) => x.id !== r.id) }))} className="inline-flex items-center gap-1 rounded-full border border-paper-3 px-3 py-1.5 text-[12px] text-ink-3"><Trash2 size={12} />撕掉这页</button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* tool panel */}
      <AnimatePresence>
        {W && tool && (
          <motion.div className="absolute inset-0 z-30 bg-paper flex flex-col" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 32, stiffness: 320 }}>
            <div className="safe-t shrink-0 flex items-center px-3 h-14">
              <button onClick={() => setTool(null)} className="w-10 h-10 rounded-full flex items-center justify-center active:bg-paper-2" aria-label="关闭"><X size={20} /></button>
              <div className="flex-1 text-center font-serif font-bold">{TOOLS.find((t) => t.id === tool)?.name}</div>
              <div className="w-10" />
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-10 pt-2">
              <W key={tool} onDone={done} profile={state.profile} onProfile={mergeProfile} doneLabel={tool === "letgo" ? undefined : "存进推演簿，请算了解读"} />
              {tool === "letgo" && <p className="text-center text-[12px] text-ink-3 mt-4">写下的字不会被保存，也不会被任何人看到。</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
