"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowUp, CalendarDays, Coins, Grid3x3, Layers, Plus, ScrollText, Sparkles, X } from "lucide-react";
import { deepLeft, lampActive, useApp, useUI } from "@/lib/store";
import { FREE_DEEP_PER_DAY } from "@/lib/meter";
import { haptic } from "@/lib/sound";
import { Icon, SuanleGlyph } from "../icons";
import { IconButton } from "../ui";
import { openWidget, sendMessage, stopStreaming, type WidgetKind } from "./engine";

const TOOLS: { kind: WidgetKind | "letgo-tab"; label: string; icon: typeof Coins | null }[] = [
  { kind: "coins", label: "摇一卦", icon: Coins },
  { kind: "tarot", label: "三张塔罗", icon: Layers },
  { kind: "bazi", label: "八字命盘", icon: ScrollText },
  { kind: "ziwei", label: "紫微命盘", icon: Grid3x3 },
  { kind: "almanac", label: "今日黄历", icon: CalendarDays },
  { kind: "letgo-tab", label: "揉掉烦恼", icon: null },
];

export default function Composer() {
  const [text, setText] = useState("");
  const [tray, setTray] = useState(false);
  const ta = useRef<HTMLTextAreaElement>(null);
  const live = useUI((s) => s.live);
  const quote = useUI((s) => s.quote);
  const deepArmed = useUI((s) => s.deepArmed);
  const lamp = useApp((s) => lampActive(s));
  const left = useApp((s) => deepLeft(s));
  const busy = !!live;

  useLayoutEffect(() => {
    const el = ta.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  }, [text]);

  useEffect(() => {
    const f = () => ta.current?.focus();
    window.addEventListener("suanle:focus", f);
    return () => window.removeEventListener("suanle:focus", f);
  }, []);

  const send = () => {
    const t = text.trim();
    if (!t || busy) return;
    haptic(8);
    setText("");
    setTray(false);
    void sendMessage(t, { quote: quote ?? undefined, deep: deepArmed });
  };

  const toggleDeep = () => {
    if (!deepArmed && !lamp && left <= 0) {
      useUI.getState().open("lamp", { reason: "deep" });
      return;
    }
    haptic(6);
    useUI.getState().setDeepArmed(!deepArmed);
  };

  return (
    <div className="relative z-10 shrink-0 px-3 pb-2.5 pt-1">
      <AnimatePresence>
        {quote && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="mb-2 flex items-center gap-2 rounded-2xl bg-ink/[0.045] py-1.5 pl-3 pr-1.5">
            <span className="min-w-0 flex-1 truncate text-[12.5px] text-mute">引用：{quote}</span>
            <IconButton label="取消引用" size={28} onClick={() => useUI.getState().setQuote(null)}>
              <Icon as={X} size={14} />
            </IconButton>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {tray && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="mb-2 grid grid-cols-3 gap-2 rounded-[22px] border border-line bg-card p-2 shadow-[0_8px_28px_rgba(60,40,10,0.08)]"
          >
            {TOOLS.map((t) => (
              <button
                key={t.kind}
                type="button"
                onClick={() => {
                  setTray(false);
                  if (t.kind === "letgo-tab") useUI.getState().setTab("letgo");
                  else openWidget(t.kind);
                }}
                className="flex h-[68px] flex-col items-center justify-center gap-1.5 rounded-2xl text-ink-2 transition hover:bg-paper-2 active:scale-95"
              >
                {t.icon ? <Icon as={t.icon} size={22} /> : <SuanleGlyph size={22} />}
                <span className="text-[12px] leading-none">{t.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="rounded-[24px] border border-line bg-card shadow-[0_4px_20px_rgba(60,40,10,0.06)]">
        <textarea
          ref={ta}
          value={text}
          rows={1}
          enterKeyHint="send"
          onChange={(e) => setText(e.target.value.slice(0, 2000))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={busy ? "等我说完这句…" : "说说心事，或者问点什么…"}
          className="block max-h-[132px] w-full resize-none bg-transparent px-4 pb-1 pt-3 text-[16px] leading-6 text-ink outline-none placeholder:text-mute"
        />
        <div className="flex items-center gap-1.5 px-2 pb-2 pt-0.5">
          <IconButton label={tray ? "收起" : "更多玩法"} size={34} onClick={() => setTray(!tray)} className={tray ? "bg-ink/[0.06] text-ink" : ""}>
            <Icon as={Plus} size={20} className={`transition-transform duration-200 ${tray ? "rotate-45" : ""}`} />
          </IconButton>
          <button
            type="button"
            onClick={toggleDeep}
            aria-pressed={deepArmed}
            className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12.5px] leading-none transition active:scale-95 ${
              deepArmed ? "border-seal/40 bg-seal/10 text-seal" : "border-line text-ink-2"
            }`}
          >
            <Icon as={Sparkles} size={15} strong={deepArmed} />
            深度推演
            {!lamp && <span className="tabular-nums opacity-60">{`${left}/${FREE_DEEP_PER_DAY}`}</span>}
          </button>
          <div className="flex-1" />
          {busy ? (
            <button type="button" aria-label="停下" onClick={stopStreaming} className="grid h-[34px] w-[34px] place-items-center rounded-full bg-ink text-on-ink transition active:scale-90">
              <span className="h-3 w-3 rounded-[3px] bg-on-ink" />
            </button>
          ) : (
            <button
              type="button"
              aria-label="发送"
              onClick={send}
              disabled={!text.trim()}
              className="grid h-[34px] w-[34px] place-items-center rounded-full bg-ink text-on-ink transition active:scale-90 disabled:bg-faint disabled:text-paper"
            >
              <Icon as={ArrowUp} size={18} strong />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
