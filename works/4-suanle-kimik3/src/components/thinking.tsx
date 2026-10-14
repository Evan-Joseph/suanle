"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Brain, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** DeepSeek 式推演草稿卡：微光呼吸，可展开折叠 */
export function Thinking({
  thinking,
  live,
}: {
  thinking: string;
  live?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (live) setOpen(true);
  }, [live]);

  useEffect(() => {
    if (live && open && bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [thinking, live, open]);

  return (
    <div
      className={cn(
        "mb-2 overflow-hidden rounded-2xl border text-[13px] transition-colors",
        "border-line/70 bg-paper-3/50",
        "night:border-gold-2/15 night:bg-white/[0.03]"
      )}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="no-tap-highlight flex w-full items-center gap-2 px-3.5 py-2.5 text-left"
      >
        <span className={cn("relative flex h-4 w-4 items-center justify-center", live && "anim-breathe")}>
          <Brain size={14} className={live ? "text-cinnabar" : "text-mist"} />
        </span>
        <span
          className={cn(
            "font-medium tracking-wide",
            live ? "text-cinnabar" : "text-mist",
            "night:text-gold-2/80"
          )}
          style={live ? { animation: "mull-glow 1.6s ease-in-out infinite" } : undefined}
        >
          {live ? "推演中 · 正在捋线头" : "推演草稿"}
        </span>
        <span className="ml-auto flex items-center gap-1 text-[11px] text-mist/80">
          {open ? "收起" : "展开"}
          <ChevronDown
            size={13}
            className={cn("transition-transform duration-300", open && "rotate-180")}
          />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              ref={bodyRef}
              className="max-h-44 overflow-y-auto whitespace-pre-wrap border-t border-line/50 px-3.5 py-2.5 leading-relaxed text-mist night:border-gold-2/10 night:text-moon/55"
            >
              {thinking || "…"}
              {live && <span className="typing-dot ml-1 inline-block h-1.5 w-1.5 rounded-full bg-cinnabar align-middle" />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
