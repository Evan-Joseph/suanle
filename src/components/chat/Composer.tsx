"use client";

import { useEffect, useRef, useState } from "react";
import { useApp, useUI, lampActive, deepLeft } from "@/lib/store";
import { Icon } from "../ui";
import { canDeep, sendMessage, stopStreaming } from "./engine";
import { haptic } from "@/lib/sound";

export default function Composer() {
  const [text, setText] = useState("");
  const [deep, setDeep] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  const live = useUI((s) => s.live);
  const quote = useUI((s) => s.quote);
  const setQuote = useUI((s) => s.setQuote);
  const setFocused = useUI((s) => s.setFocused);
  const lamp = useApp((s) => lampActive(s));
  const left = useApp((s) => deepLeft(s));
  const busy = !!live;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  }, [text]);

  useEffect(() => {
    const f = () => ref.current?.focus();
    window.addEventListener("suanle:focus", f);
    return () => window.removeEventListener("suanle:focus", f);
  }, []);

  const submit = () => {
    const t = text.trim();
    if (!t || busy) return;
    haptic(8);
    const useDeep = deep && canDeep();
    setText("");
    setDeep(false);
    void sendMessage(t, { quote: quote ?? undefined, deep: useDeep });
  };

  const toggleDeep = () => {
    if (deep) return setDeep(false);
    if (!canDeep()) {
      useUI.getState().open("lamp", { reason: "deep" });
      return;
    }
    setDeep(true);
    useUI.getState().toast(lamp ? "深度推演 · 长明灯不限次" : `深度推演 · 今日还剩 ${left} 次`);
  };

  return (
    <div className="shrink-0 px-3 pb-2 pt-1">
      {quote && (
        <div className="anim-fade-up mb-1.5 flex items-center gap-2 rounded-2xl bg-black/[0.04] px-3 py-2 text-[12.5px] text-ink-2">
          <Icon name="quote" size={14} className="shrink-0 text-mute" />
          <span className="min-w-0 flex-1 truncate">{quote}</span>
          <button onClick={() => setQuote(null)} className="shrink-0 text-mute" aria-label="取消引用">
            <Icon name="close" size={14} />
          </button>
        </div>
      )}
      <div className="rounded-[26px] border border-line bg-white px-2 pb-2 pt-1.5 shadow-[0_4px_24px_rgba(60,40,10,0.07)] transition focus-within:border-ink/25">
        <textarea
          ref={ref}
          value={text}
          rows={1}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 120)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && window.matchMedia("(pointer:fine)").matches) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={busy ? "它在想，稍等……" : "说点什么，或者，算了……"}
          className="no-scrollbar block max-h-[132px] w-full resize-none bg-transparent px-2.5 py-1.5 text-[16px] leading-6 text-ink outline-none placeholder:text-mute"
        />
        <div className="mt-1 flex items-center justify-between">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={toggleDeep}
            className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-[12.5px] transition active:scale-95 ${
              deep ? "border-seal/40 bg-seal/10 text-seal" : "border-line text-ink-2"
            }`}
          >
            <Icon name="sparkle" size={13} />
            深度推演
            {!lamp && <span className="text-[10.5px] opacity-60">{left}/3</span>}
          </button>
          {busy ? (
            <button onClick={stopStreaming} className="grid h-9 w-9 place-items-center rounded-full bg-ink text-paper active:scale-90" aria-label="停止">
              <Icon name="stop" size={16} />
            </button>
          ) : (
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={submit}
              disabled={!text.trim()}
              className="grid h-9 w-9 place-items-center rounded-full bg-ink text-paper transition active:scale-90 disabled:bg-[#d9d5cc]"
              aria-label="发送"
            >
              <Icon name="send" size={18} stroke={2.2} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
