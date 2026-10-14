"use client";

import { memo, useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy, RefreshCcw } from "lucide-react";
import { ChatMessage, useApp } from "@/store/app";
import { Markdown } from "./markdown";
import { Thinking } from "./thinking";
import { PersonaSeal } from "./logo";
import { personaById } from "@/lib/personas";
import { cn } from "@/lib/utils";

export const MessageItem = memo(function MessageItem({
  msg,
  personaId,
  isLastAssistant,
}: {
  msg: ChatMessage;
  personaId: string;
  isLastAssistant?: boolean;
}) {
  const toast = useApp((s) => s.toast);
  const regenerate = useApp((s) => s.regenerate);
  const [copied, setCopied] = useState(false);
  const persona = personaById(personaId);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(msg.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast("剪贴板被风挡住了，手动选中复制吧");
    }
  };

  if (msg.role === "user") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="flex justify-end pl-10"
      >
        <div className="max-w-[82%] rounded-[20px] rounded-br-md bg-ink px-4 py-2.5 text-[15px] leading-relaxed text-paper-2 shadow-sm night:bg-gold-2/90 night:text-night">
          {msg.content}
        </div>
      </motion.div>
    );
  }

  const typing = msg.streaming && !msg.content && !msg.thinking;

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="group flex w-full gap-2.5 pr-2"
    >
      <div className="pt-0.5">
        <PersonaSeal glyph={persona.glyph} hue={persona.hue} size={32} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-baseline gap-2">
          <span className="font-display text-[13px] tracking-wider text-ink-2 night:text-gold-2/85">
            {persona.name}
          </span>
          <span className="text-[10px] tracking-wide text-mist/70">{persona.title}</span>
        </div>

        {(!!msg.thinking || msg.thinkStreaming) && (
          <Thinking thinking={msg.thinking ?? ""} live={msg.thinkStreaming} />
        )}

        {typing ? (
          <div className="flex items-center gap-1.5 py-2 pl-0.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="typing-dot h-1.5 w-1.5 rounded-full bg-mist"
                style={{ animationDelay: `${i * 0.18}s` }}
              />
            ))}
          </div>
        ) : (
          <Markdown
            text={msg.content}
            className={cn("text-ink night:text-moon/90", msg.streaming && "caret-pulse")}
          />
        )}

        {msg.streaming && msg.content && (
          <span className="mt-1 inline-block h-3.5 w-[7px] animate-pulse rounded-[2px] bg-cinnabar/70 night:bg-gold-2/70" />
        )}

        {!msg.streaming && msg.content && (
          <div
            className={cn(
              "mt-1.5 flex items-center gap-1 transition-opacity",
              isLastAssistant ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}
          >
            <button
              onClick={() => void copy()}
              className="no-tap-highlight flex items-center gap-1 rounded-full px-2 py-1 text-[11px] text-mist transition-colors hover:bg-ink/5 hover:text-ink-2 night:hover:bg-white/10 night:hover:text-moon"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? "已抄录" : "抄录"}
            </button>
            {isLastAssistant && (
              <button
                onClick={() => void regenerate()}
                className="no-tap-highlight flex items-center gap-1 rounded-full px-2 py-1 text-[11px] text-mist transition-colors hover:bg-ink/5 hover:text-ink-2 night:hover:bg-white/10 night:hover:text-moon"
              >
                <RefreshCcw size={12} />
                再算一版
              </button>
            )}
          </div>
        )}
      </div>
    </motion.article>
  );
});
