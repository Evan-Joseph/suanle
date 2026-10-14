"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Coins, Heart, MessagesSquare, Moon, ScrollText, Trash2, X } from "lucide-react";
import { Reading, ReadingType, useApp } from "@/store/app";
import { cn, relTime } from "@/lib/utils";

const TYPE_META: Record<ReadingType, { name: string; icon: typeof Coins; hue: string }> = {
  liuyao: { name: "六爻", icon: Coins, hue: "#5b6e5a" },
  tarot: { name: "塔罗", icon: Moon, hue: "#7a5c8e" },
  bazi: { name: "八字", icon: ScrollText, hue: "#8a6d3b" },
};

export function ArchiveView() {
  const readings = useApp((s) => s.readings);
  const toggleFav = useApp((s) => s.toggleFavReading);
  const removeReading = useApp((s) => s.removeReading);
  const askAbout = useApp((s) => s.askAboutReading);
  const toast = useApp((s) => s.toast);
  const [opened, setOpened] = useState<Reading | null>(null);
  const [confirmDel, setConfirmDel] = useState(false);

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-y-auto">
      <header className="px-5 pb-2 pt-6">
        <p className="text-[10px] tracking-[0.4em] text-cinnabar/70">命 运 资 产</p>
        <h2 className="mt-1.5 font-display text-[24px] tracking-[0.2em] text-ink">存档阁</h2>
        <p className="mt-1 text-[12px] text-mist">
          流水账说过就算了；这些认真起过的课，替你收在阁里。
        </p>
      </header>

      <div className="mx-auto w-full max-w-[640px] flex-1 px-4 pb-28 pt-3 lg:pb-10">
        {readings.length === 0 ? (
          <div className="mt-16 flex flex-col items-center text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/img/welcome-ink.png"
              alt=""
              className="h-40 w-40 rounded-3xl object-cover opacity-70 mix-blend-multiply"
            />
            <p className="mt-6 font-display text-[15px] leading-loose tracking-wider text-ink-2">
              阁中还空着。
            </p>
            <p className="mt-2 max-w-[240px] text-[12px] leading-relaxed text-mist">
              去「起卦」间摇一卦、抽张牌或排个盘，值得回看的，都存在这里。
            </p>
          </div>
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {readings.map((r, i) => {
              const meta = TYPE_META[r.type];
              return (
                <motion.button
                  key={r.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.05, 0.3) }}
                  onClick={() => {
                    setOpened(r);
                    setConfirmDel(false);
                  }}
                  className="no-tap-highlight group rounded-2xl border border-line bg-paper-2 p-4 text-left shadow-[0_2px_10px_rgba(38,35,29,0.04)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(38,35,29,0.08)]"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-lg"
                      style={{ background: `${meta.hue}16`, color: meta.hue }}
                    >
                      <meta.icon size={14} />
                    </span>
                    <span className="text-[10.5px] tracking-wider text-mist">{meta.name}</span>
                    <span className="ml-auto flex items-center gap-1.5">
                      {r.favorite && <Heart size={12} className="fill-cinnabar text-cinnabar" />}
                      <span className="text-[10px] text-mist/70">{relTime(r.createdAt)}</span>
                    </span>
                  </div>
                  <p className="mt-2.5 truncate font-display text-[14.5px] tracking-wide text-ink">
                    {r.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-mist">
                    {r.question ? `问：${r.question}` : r.summary.split("\n")[0]}
                  </p>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* detail sheet */}
      <AnimatePresence>
        {opened && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] bg-ink/35 backdrop-blur-[2px]"
              onClick={() => setOpened(null)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 34 }}
              className="fixed inset-x-0 bottom-0 z-[71] mx-auto max-h-[82dvh] w-full max-w-[560px] safe-b overflow-hidden rounded-t-[28px] border-t border-line bg-paper-2 shadow-2xl"
            >
              <div className="mx-auto mt-3 h-1 w-9 rounded-full bg-line" />
              <div className="flex items-center gap-2 px-5 pt-3">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{
                    background: `${TYPE_META[opened.type].hue}16`,
                    color: TYPE_META[opened.type].hue,
                  }}
                >
                  {(() => {
                    const I = TYPE_META[opened.type].icon;
                    return <I size={15} />;
                  })()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-[16px] tracking-wide text-ink">
                    {opened.title}
                  </p>
                  <p className="text-[10.5px] text-mist">{relTime(opened.createdAt)} 起课</p>
                </div>
                <button onClick={() => setOpened(null)} className="no-tap-highlight text-mist" aria-label="关闭">
                  <X size={18} />
                </button>
              </div>
              <div className="max-h-[46dvh] overflow-y-auto px-5 py-4">
                <p className="whitespace-pre-wrap text-[13.5px] leading-[1.9] text-ink-2">
                  {opened.summary}
                </p>
              </div>
              <div className="space-y-2 px-5 pb-6">
                <button
                  onClick={() => {
                    askAbout(opened);
                    setOpened(null);
                  }}
                  className="no-tap-highlight flex w-full items-center justify-center gap-2 rounded-2xl bg-cinnabar py-3 text-[14px] tracking-wider text-paper-2 shadow-sm transition-all active:scale-[0.98]"
                >
                  <MessagesSquare size={15} />
                  拿去小馆请大师再讲讲
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleFav(opened.id)}
                    className={cn(
                      "no-tap-highlight flex flex-1 items-center justify-center gap-1.5 rounded-2xl border py-2.5 text-[12.5px] transition-colors active:scale-[0.98]",
                      opened.favorite
                        ? "border-cinnabar/40 bg-cinnabar/[0.06] text-cinnabar"
                        : "border-line text-ink-2"
                    )}
                  >
                    <Heart size={13} className={opened.favorite ? "fill-cinnabar" : ""} />
                    {opened.favorite ? "已藏入贴身锦囊" : "藏入贴身锦囊"}
                  </button>
                  <button
                    onClick={() => {
                      if (!confirmDel) {
                        setConfirmDel(true);
                        return;
                      }
                      removeReading(opened.id);
                      setOpened(null);
                      toast("这一页，帮你烧了。往事随风。");
                    }}
                    className={cn(
                      "no-tap-highlight flex flex-1 items-center justify-center gap-1.5 rounded-2xl border py-2.5 text-[12.5px] transition-colors active:scale-[0.98]",
                      confirmDel ? "border-cinnabar bg-cinnabar text-paper-2" : "border-line text-mist"
                    )}
                  >
                    <Trash2 size={13} />
                    {confirmDel ? "点第二下，就烧了" : "付之一炬"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
