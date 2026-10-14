"use client";

import { memo, useState } from "react";
import type { Msg } from "@/lib/store";
import { useUI } from "@/lib/store";
import { parseAssistant, plainText } from "@/lib/parse";
import { fmt } from "@/lib/meter";
import Markdown from "./Markdown";
import { Icon, Logo } from "../ui";
import { regenerate } from "./engine";

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
    } catch {
      /* ignore */
    }
    ta.remove();
  }
  useUI.getState().toast("已复制");
}

function ThinkCapsule({ text, open: thinking, sec }: { text: string; open: boolean; sec?: number }) {
  const [expanded, setExpanded] = useState(false);
  const show = expanded || thinking;
  return (
    <div className="mb-2.5">
      <button
        onClick={() => setExpanded(!expanded)}
        className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white/70 px-3 py-1 text-[12.5px] text-ink-2 transition active:scale-95"
      >
        <span className={`inline-block h-3 w-3 rounded-full border-[1.5px] border-ink ${thinking ? "animate-spin border-t-transparent" : "bg-[linear-gradient(90deg,#2b2b2b_50%,transparent_50%)]"}`} />
        {thinking ? <span className="shimmer-text">正在推演</span> : <span>已推演{sec ? ` · ${sec} 秒` : ""}</span>}
        <Icon name="chev" size={13} className={`transition-transform ${show ? "rotate-90" : ""}`} />
      </button>
      {show && text && (
        <div className="anim-fade-in mt-2 whitespace-pre-wrap border-l-2 border-line pl-3 text-[13px] leading-relaxed text-mute">{text}</div>
      )}
    </div>
  );
}

function ActionBtn({ icon, label, onClick }: { icon: "copy" | "refresh" | "quote" | "share"; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label={label} title={label} className="grid h-8 w-8 place-items-center rounded-full text-mute transition hover:bg-black/5 hover:text-ink active:scale-90">
      <Icon name={icon} size={16} />
    </button>
  );
}

function Assistant({ msg, sessionId, isLast, streaming, prevUser }: { msg: Msg; sessionId: string; isLast: boolean; streaming: boolean; prevUser?: string }) {
  const p = parseAssistant(msg.content, streaming);
  const empty = !p.body && !p.think;
  return (
    <div className="anim-fade-up flex gap-2.5 px-4">
      <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line bg-white text-ink">
        <Logo size={18} blink={streaming} />
      </div>
      <div className={`min-w-0 flex-1 ${streaming ? "streaming" : ""}`}>
        {p.think !== null && <ThinkCapsule text={p.think} open={streaming && p.thinkOpen} sec={msg.thinkSec} />}
        {empty && streaming ? (
          <div className="flex h-7 items-center gap-1">
            {[0, 1, 2].map((i) => (
              <span key={i} className="typing-dot h-1.5 w-1.5 rounded-full bg-ink-2" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        ) : p.body ? (
          <Markdown text={p.body} msgId={msg.id} widgets={streaming ? "pending" : "live"} />
        ) : null}
        {streaming && p.widgetPending && <div className="my-3 h-20 animate-pulse rounded-3xl border border-line bg-white/50" />}
        {!streaming && !msg.intro && p.body && (
          <div className="mt-1.5 flex items-center justify-between">
            <div className="-ml-1.5 flex items-center">
              <ActionBtn icon="copy" label="复制" onClick={() => void copyText(plainText(p.body))} />
              {isLast && <ActionBtn icon="refresh" label="重新生成" onClick={() => void regenerate(sessionId)} />}
              <ActionBtn
                icon="quote"
                label="引用"
                onClick={() => {
                  useUI.getState().setQuote(plainText(p.body).replace(/\s+/g, " ").slice(0, 80));
                  window.dispatchEvent(new Event("suanle:focus"));
                }}
              />
              <ActionBtn icon="share" label="分享长图" onClick={() => useUI.getState().open("share", { question: prevUser ?? "", answer: p.body })} />
            </div>
            {msg.tokens ? (
              <button
                onClick={() => useUI.getState().open("tip", { tokens: msg.tokens })}
                className="flex items-center gap-1 rounded-full bg-black/[0.035] px-2.5 py-1 text-[11.5px] text-mute transition active:scale-95"
              >
                <span>🍵</span>
                {fmt(msg.tokens)} 算力
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function User({ msg }: { msg: Msg }) {
  return (
    <div className="anim-fade-up flex flex-col items-end gap-1 px-4">
      {msg.quote && (
        <div className="max-w-[78%] truncate rounded-xl bg-black/[0.04] px-3 py-1.5 text-[12px] text-mute">「{msg.quote}」</div>
      )}
      <div className="max-w-[82%] whitespace-pre-wrap break-words rounded-[20px] rounded-br-md bg-ink px-4 py-2.5 text-[15px] leading-relaxed text-paper shadow-sm">
        {msg.content.replace(/\*\*/g, "")}
      </div>
    </div>
  );
}

function MessageItem(props: { msg: Msg; sessionId: string; isLast: boolean; streaming?: boolean; prevUser?: string }) {
  if (props.msg.role === "user") return <User msg={props.msg} />;
  return <Assistant {...props} streaming={!!props.streaming} />;
}

export default memo(MessageItem);
