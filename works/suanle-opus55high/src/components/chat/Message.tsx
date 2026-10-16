import { memo, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronDown, Copy, Quote, RotateCcw, Share2, Sparkles } from "lucide-react";
import { parseAssistant, plainText } from "@/lib/parse";
import { useApp, useUI, type Msg } from "@/lib/store";
import { bestItem } from "@/lib/meter";
import { Markdown } from "../Markdown";
import { Logo, copyText } from "../ui";
import WidgetBlock from "./Widgets";
import { regenerate } from "@/lib/engine";

function ThinkCapsule({ text, open: streamingOpen, sec, live }: { text: string; open: boolean; sec?: number; live: boolean }) {
  const [open, setOpen] = useState(false);
  const show = open || (live && streamingOpen);
  return (
    <div className="mb-2.5">
      <button onClick={() => setOpen((o) => !o)} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper-2/70 py-1 pl-2.5 pr-2 text-[12.5px] text-ink-2 transition active:scale-[0.97]">
        <Sparkles size={13} className={live && streamingOpen ? "text-seal" : "text-mute"} />
        {live && streamingOpen ? <span className="text-shimmer">正在推演…</span> : <span>已推演{sec ? `（用时 ${sec} 秒）` : ""}</span>}
        <ChevronDown size={14} className={`text-mute transition-transform ${show ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {show && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <div className="mt-2 border-l-2 border-line pl-3 text-[13px] leading-relaxed text-mute">
              <Markdown text={text} className="!text-[13px] !leading-[1.7] !text-mute" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function splitBody(body: string): { type: "md" | "widget"; v: string }[] {
  const out: { type: "md" | "widget"; v: string }[] = [];
  const re = /```suanle\s*([\s\S]*?)```/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) {
    if (m.index > last) out.push({ type: "md", v: body.slice(last, m.index) });
    out.push({ type: "widget", v: m[1] });
    last = m.index + m[0].length;
  }
  if (last < body.length) out.push({ type: "md", v: body.slice(last) });
  return out.filter((s) => s.v.trim());
}

function extractQuote(body: string) {
  const m = body.match(/^>\s?(.+)$/m);
  return m ? m[1].replace(/\*\*/g, "").trim() : "";
}

export const AssistantMessage = memo(function AssistantMessage({ msg, live = false, isLast = false, sessionId }: { msg: Msg; live?: boolean; isLast?: boolean; sessionId: string }) {
  const parsed = useMemo(() => parseAssistant(msg.content, live), [msg.content, live]);
  const segs = useMemo(() => splitBody(parsed.body), [parsed.body]);
  const basis = useApp((s) => s.usage.basis);
  const [copied, setCopied] = useState(false);
  const empty = live && !parsed.body && !parsed.think;

  return (
    <div className="anim-fade-up flex gap-2.5">
      <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink text-paper">
        <Logo size={17} mode={live ? "think" : "static"} />
      </div>
      <div className="min-w-0 flex-1 pt-[3px]">
        {parsed.think !== null && parsed.think !== "" && <ThinkCapsule text={parsed.think} open={parsed.thinkOpen} sec={msg.thinkSec} live={live} />}
        {empty && (
          <div className="flex h-6 items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <span key={i} className="typing-dot h-1.5 w-1.5 rounded-full bg-ink/50" style={{ animationDelay: `${i * 0.16}s` }} />
            ))}
          </div>
        )}
        {segs.map((s, i) =>
          s.type === "md" ? (
            <Markdown key={i} text={s.v} className={live && i === segs.length - 1 && !parsed.widgetPending ? "caret-last" : ""} />
          ) : (
            <WidgetBlock key={i} raw={s.v} msgId={msg.id} />
          ),
        )}
        {live && parsed.widgetPending && <div className="my-3 h-24 animate-pulse rounded-[22px] bg-paper-2" />}
        {!live && !msg.intro && (
          <div className="-ml-1.5 mt-1.5 flex flex-wrap items-center gap-0.5 text-mute">
            <button
              aria-label="复制"
              onClick={async () => {
                await copyText(plainText(parsed.body));
                setCopied(true);
                setTimeout(() => setCopied(false), 1400);
              }}
              className="grid h-8 w-8 place-items-center rounded-full transition hover:bg-black/5 active:scale-90"
            >
              {copied ? <Check size={15} className="text-sage" /> : <Copy size={15} />}
            </button>
            <button aria-label="引用" onClick={() => useUI.getState().setQuote(plainText(parsed.body).slice(0, 60))} className="grid h-8 w-8 place-items-center rounded-full transition hover:bg-black/5 active:scale-90">
              <Quote size={15} />
            </button>
            <button
              aria-label="分享"
              onClick={() => useUI.getState().open("share", { quote: extractQuote(parsed.body) || plainText(parsed.body).split("\n")[0].slice(0, 60) })}
              className="grid h-8 w-8 place-items-center rounded-full transition hover:bg-black/5 active:scale-90"
            >
              <Share2 size={15} />
            </button>
            {isLast && (
              <button aria-label="重新回答" onClick={() => void regenerate(sessionId)} className="grid h-8 w-8 place-items-center rounded-full transition hover:bg-black/5 active:scale-90">
                <RotateCcw size={15} />
              </button>
            )}
            {msg.tokens && !msg.offline ? (
              <button
                onClick={() => useUI.getState().open("tip", { tokens: msg.tokens })}
                className="ml-auto inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[11.5px] text-mute transition hover:bg-black/5 active:scale-95"
              >
                {(() => {
                  const it = bestItem(msg.tokens, basis);
                  return (
                    <>
                      <span>{it.emoji}</span>≈ {it.qty} {it.unit}{it.name}
                    </>
                  );
                })()}
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
});

export const UserMessage = memo(function UserMessage({ msg }: { msg: Msg }) {
  return (
    <div className="anim-fade-up flex flex-col items-end">
      {msg.quote && <div className="mb-1 max-w-[78%] truncate rounded-xl bg-black/[0.04] px-3 py-1 text-[12px] text-mute">「{msg.quote}」</div>}
      <div className="max-w-[82%] whitespace-pre-wrap break-words rounded-[20px] rounded-br-[6px] bg-ink px-4 py-2.5 text-[15px] leading-[1.65] text-paper">
        <UserText text={msg.content} />
      </div>
    </div>
  );
});

function UserText({ text }: { text: string }) {
  // 用户消息里的 **加粗** 只做轻量处理，不暴露符号
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) => (p.startsWith("**") && p.endsWith("**") ? <b key={i} className="font-semibold">{p.slice(2, -2)}</b> : <span key={i}>{p}</span>))}
    </>
  );
}
