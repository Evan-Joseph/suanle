"use client";

import { AnimatePresence, motion } from "motion/react";
import { memo, useEffect, useState } from "react";
import { ChevronDown, Copy, Quote, RotateCcw, Share2 } from "lucide-react";
import { profileHint, useApp, useUI, type Msg } from "@/lib/store";
import { letgoLine, parseAssistant, plainText, segmentBody } from "@/lib/parse";
import { shortAnalogy } from "@/lib/meter";
import { Logo } from "../brand/Logo";
import { Icon } from "../icons";
import { copyText, Skeleton } from "../ui";
import Markdown from "./Markdown";
import WidgetBlock from "./Widgets";
import { regenerate } from "./engine";

function ThinkBar({ text, thinking, sec }: { text: string; thinking: boolean; sec?: number }) {
  const [open, setOpen] = useState(false);
  const show = open || thinking;
  return (
    <div className="mb-2.5">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex h-8 items-center gap-2 rounded-full border border-line bg-card/70 pl-2.5 pr-3 text-[12.5px] text-ink-2 transition active:scale-95"
      >
        <span className="grid h-4 w-4 place-items-center">
          {thinking ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-[1.5px] border-ink border-t-transparent" />
          ) : (
            <span className="h-3 w-3 rounded-full border-[1.5px] border-ink bg-[linear-gradient(90deg,var(--ink)_50%,transparent_50%)]" />
          )}
        </span>
        {thinking ? <span className="shimmer-text">正在推演</span> : <span>已推演 {sec ?? 1} 秒</span>}
        <Icon as={ChevronDown} size={14} className={`transition-transform duration-200 ${show ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {show && text && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
            <div className="mt-2 whitespace-pre-wrap border-l-2 border-line pl-3 text-[13px] leading-relaxed text-mute">{text}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const WAIT_LINES = ["在听你说…", "想一想…", "斟酌一下怎么说…"];
const WAIT_DEEP = ["排一排盘…", "翻一翻古书…", "把星曜一颗颗摆好…", "想想怎么跟你说…"];

function Waiting({ deep }: { deep: boolean }) {
  const lines = deep ? WAIT_DEEP : WAIT_LINES;
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % lines.length), 1700);
    return () => clearInterval(t);
  }, [lines.length]);
  return (
    <div className="flex h-8 items-center gap-2.5 text-[13px] text-mute">
      <span className="flex gap-1">
        {[0, 1, 2].map((k) => (
          <span key={k} className="breathe-dot h-1.5 w-1.5 rounded-full bg-ink-2" style={{ animationDelay: `${k * 0.18}s` }} />
        ))}
      </span>
      <AnimatePresence mode="wait">
        <motion.span key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>
          {lines[i]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

function ActionBtn({ icon, label, onClick }: { icon: typeof Copy; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid h-8 w-8 place-items-center rounded-full text-mute transition hover:bg-ink/[0.05] hover:text-ink active:scale-90"
    >
      <Icon as={icon} size={16} />
    </button>
  );
}

function Assistant({ msg, sessionId, isLast, streaming, prevUser }: { msg: Msg; sessionId: string; isLast: boolean; streaming: boolean; prevUser?: string }) {
  const hint = useApp((s) => profileHint(s.profile));
  const p = parseAssistant(msg.content, streaming);
  const { segments, widgetPending } = segmentBody(p.body, streaming);
  const empty = !p.body && !p.think;
  const toast = useUI((s) => s.toast);
  const lastMd = segments.length - 1;
  // 本地摆出的卡片引导语不需要复制/分享这些操作
  const showActions = !streaming && !msg.intro && !!p.body && !(msg.local && segments.some((s) => s.kind === "widget"));

  return (
    <div className="px-4">
      <div className="mb-1.5 flex h-6 items-center gap-2 text-ink">
        <Logo size={22} mood={streaming ? "listen" : "still"} />
        <span className="text-[12.5px] font-medium text-ink-2">算了</span>
        {msg.deep && <span className="rounded-full bg-seal/10 px-1.5 py-px text-[10.5px] leading-4 text-seal">深度推演</span>}
      </div>
      {p.think !== null && <ThinkBar text={p.think} thinking={streaming && p.thinkOpen} sec={msg.thinkSec} />}
      {empty && streaming ? (
        <Waiting deep={!!msg.deep} />
      ) : (
        <div className="space-y-3">
          {segments.map((seg, i) =>
            seg.kind === "md" ? (
              <Markdown key={`m${i}`} text={seg.text} streaming={streaming && i === lastMd} />
            ) : (
              <WidgetBlock key={`w${seg.idx}`} raw={seg.raw} wkey={`${msg.id}:${seg.idx}`} interactive={!streaming} />
            ),
          )}
        </div>
      )}
      {streaming && widgetPending && <Skeleton className="mt-3 h-28 rounded-[22px]" />}
      {showActions && (
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <div className="-ml-2 flex items-center">
            <ActionBtn
              icon={Copy}
              label="复制"
              onClick={() => {
                void copyText(plainText(p.body)).then((ok) => toast(ok ? "已复制" : "复制没成功，长按文字试试"));
              }}
            />
            {isLast && <ActionBtn icon={RotateCcw} label="换个说法" onClick={() => void regenerate(sessionId)} />}
            <ActionBtn
              icon={Quote}
              label="引用"
              onClick={() => {
                useUI.getState().setQuote(plainText(p.body).replace(/\s+/g, " ").slice(0, 80));
                window.dispatchEvent(new Event("suanle:focus"));
              }}
            />
            <ActionBtn
              icon={Share2}
              label="做成卡片"
              onClick={() => useUI.getState().open("share", { kicker: prevUser ? `关于「${prevUser.slice(0, 16)}」` : "算了说", body: plainText(p.body).replace(/^>.*$/gm, "").slice(0, 300), line: letgoLine(p.body) })}
            />
          </div>
          {msg.tokens ? (
            <button
              type="button"
              onClick={() => useUI.getState().open("tip", { tokens: msg.tokens })}
              className="inline-flex h-7 max-w-[52%] items-center gap-1 truncate rounded-full bg-ink/[0.04] px-2.5 text-[11.5px] text-mute transition active:scale-95"
            >
              算力 ≈ {shortAnalogy(msg.tokens, hint)}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}

function User({ msg }: { msg: Msg }) {
  return (
    <div className="flex flex-col items-end gap-1 px-4">
      {msg.quote && <div className="max-w-[78%] truncate rounded-xl bg-ink/[0.045] px-3 py-1.5 text-[12px] text-mute">「{msg.quote}」</div>}
      <div className="max-w-[82%] whitespace-pre-wrap break-words rounded-[20px] rounded-br-[6px] bg-ink px-4 py-2.5 text-[15px] leading-relaxed text-on-ink">
        {msg.content.replace(/\*\*/g, "")}
      </div>
    </div>
  );
}

function MessageItem(props: { msg: Msg; sessionId: string; isLast: boolean; streaming?: boolean; prevUser?: string }) {
  return (
    <motion.div initial={props.streaming || props.msg.role === "user" ? { opacity: 0, y: 8 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}>
      {props.msg.role === "user" ? <User msg={props.msg} /> : <Assistant {...props} streaming={!!props.streaming} />}
    </motion.div>
  );
}

export default memo(MessageItem);
