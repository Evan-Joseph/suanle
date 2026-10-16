"use client";

import { memo, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, Copy, RefreshCw, Check, Coffee, Share2 } from "lucide-react";
import { Markdown } from "./Markdown";
import { CoinsWidget, TarotWidget, BaziWidget, AlmanacWidget, LetgoWidget } from "./Widgets";
import { parseAssistant, fmtTokens } from "@/lib/parse";
import { useApp, useUI, type Message as Msg } from "@/store/app";
import { Logo } from "@/components/ui";

interface Props {
  msg: Msg; sessionId: string; streaming?: boolean; isLast?: boolean;
  onSubmit: (text: string) => void; onRegenerate?: () => void;
}

export const MessageItem = memo(function MessageItem({ msg, sessionId, streaming, isLast, onSubmit, onRegenerate }: Props) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end pl-10">
        <div className="max-w-full whitespace-pre-wrap break-words rounded-[20px] rounded-br-md bg-ink px-4 py-2.5 text-[15.5px] leading-relaxed text-paper shadow-sm">{msg.content}</div>
      </div>
    );
  }
  return <AssistantItem msg={msg} sessionId={sessionId} streaming={streaming} isLast={isLast} onSubmit={onSubmit} onRegenerate={onRegenerate} />;
});

function AssistantItem({ msg, sessionId, streaming, isLast, onSubmit, onRegenerate }: Props) {
  const parsed = useMemo(() => parseAssistant(msg.content), [msg.content]);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const toast = useUI((s) => s.toast);
  const setSheet = useUI((s) => s.setSheet);
  const updateMessage = useApp((s) => s.updateMessage);
  const thinkingLive = streaming && parsed.thinkingOpen;
  const showThink = parsed.thinking.length > 0;

  const copy = async () => {
    try { await navigator.clipboard.writeText(parsed.body); setCopied(true); toast("已复制", "📋"); setTimeout(() => setCopied(false), 1500); } catch { toast("复制失败，长按选择文字吧"); }
  };

  return (
    <div className="flex gap-2.5 pr-6">
      <div className="mt-1 hidden h-7 w-7 shrink-0 place-items-center rounded-full bg-white/70 text-ink sm:grid"><Logo size={18} blink={false} /></div>
      <div className="min-w-0 flex-1">
        {showThink && (
          <div className="mb-2">
            <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1.5 rounded-full border border-ink/10 bg-white/60 px-3 py-1 text-xs text-ink-2">
              <span className={thinkingLive ? "shimmer" : ""}>{thinkingLive ? "正在推演…" : `已推演 ${msg.thinkSec ?? 2} 秒`}</span>
              <ChevronDown size={13} className={`transition ${open || thinkingLive ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence initial={false}>
              {(open || thinkingLive) && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="mt-2 border-l-2 border-ink/15 pl-3 text-[13px] leading-relaxed text-ink-3 whitespace-pre-wrap break-words">{parsed.thinking}{thinkingLive && <span className="cursor-dot" />}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        {(parsed.body || !showThink) && (
          <div className={`text-ink ${streaming && !parsed.body ? "cursor-dot" : ""}`}>
            <Markdown text={parsed.body} streaming={streaming} />
            {streaming && parsed.body && <span className="cursor-dot" />}
          </div>
        )}
        {!streaming && parsed.widget && (
          <WidgetSwitch spec={parsed.widget} done={!!msg.widgetDone} onDone={() => updateMessage(sessionId, msg.id, { widgetDone: true })} onSubmit={onSubmit} />
        )}
        {!streaming && !msg.intro && (
          <div className="mt-2 flex flex-wrap items-center gap-x-1 gap-y-1 text-ink-3">
            <IconBtn onClick={copy} label="复制">{copied ? <Check size={14} /> : <Copy size={14} />}</IconBtn>
            {isLast && onRegenerate && <IconBtn onClick={onRegenerate} label="重新算"><RefreshCw size={14} /></IconBtn>}
            <IconBtn onClick={() => setSheet({ kind: "share", text: parsed.body })} label="分享"><Share2 size={14} /></IconBtn>
            {!!msg.tokens && (
              <button onClick={() => setSheet({ kind: "tip", tokens: msg.tokens })} className="ml-1 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] text-ink-3 hover:bg-white/60 hover:text-ink-2">
                <Coffee size={12} /> 耗 {fmtTokens(msg.tokens)} 算力{msg.offline ? " · 本地" : ""}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function IconBtn({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return <button onClick={onClick} aria-label={label} title={label} className="grid h-7 w-7 place-items-center rounded-full hover:bg-white/60 hover:text-ink-2">{children}</button>;
}

function WidgetSwitch({ spec, done, onDone, onSubmit }: { spec: NonNullable<ReturnType<typeof parseAssistant>["widget"]>; done: boolean; onDone: () => void; onSubmit: (t: string) => void }) {
  switch (spec.widget) {
    case "coins": return <CoinsWidget question={spec.question} onSubmit={onSubmit} done={done} onDone={onDone} />;
    case "tarot": return <TarotWidget question={spec.question} onSubmit={onSubmit} done={done} onDone={onDone} />;
    case "bazi": return <BaziWidget onSubmit={onSubmit} done={done} onDone={onDone} />;
    case "almanac": return <AlmanacWidget onSubmit={onSubmit} compact />;
    case "letgo": return <LetgoWidget text={spec.text} />;
    default: return null;
  }
}
