"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, CircleStop, Sparkles } from "lucide-react";
import { useApp } from "@/store/app";
import { COMPOSER_PLACEHOLDERS } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { sfxSend } from "@/lib/audio";

export function Composer({ onFocusChat }: { onFocusChat?: () => void }) {
  const [value, setValue] = useState("");
  const [ph, setPh] = useState(0);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const send = useApp((s) => s.send);
  const stop = useApp((s) => s.stop);
  const activeId = useApp((s) => s.activeSessionId);
  const messages = useApp((s) => s.messages);
  const toast = useApp((s) => s.toast);

  const list = activeId ? messages[activeId] ?? [] : [];
  const last = list[list.length - 1];
  const streaming = !!last?.streaming;

  useEffect(() => {
    const t = setInterval(() => setPh((p) => (p + 1) % COMPOSER_PLACEHOLDERS.length), 6000);
    return () => clearInterval(t);
  }, []);

  const autosize = () => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  };

  const submit = async () => {
    const text = value.trim();
    if (!text || streaming) return;
    setValue("");
    requestAnimationFrame(autosize);
    sfxSend();
    onFocusChat?.();
    void send(text);
  };

  return (
    <div className="safe-b w-full px-3 pb-3 pt-1">
      <div
        className={cn(
          "mx-auto w-full max-w-[720px] overflow-hidden rounded-[26px] border transition-shadow",
          "border-line bg-paper-2/95 shadow-[0_8px_30px_rgba(38,35,29,0.10)] backdrop-blur-md",
          "focus-within:border-cinnabar/40 focus-within:shadow-[0_10px_36px_rgba(181,64,42,0.14)]",
          "night:border-gold-2/20 night:bg-night-2/90 night:shadow-[0_10px_40px_rgba(0,0,0,0.45)]"
        )}
      >
        <textarea
          ref={taRef}
          value={value}
          rows={1}
          onChange={(e) => {
            setValue(e.target.value);
            autosize();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              void submit();
            }
          }}
          placeholder={COMPOSER_PLACEHOLDERS[ph]}
          className="max-h-[132px] w-full resize-none bg-transparent px-4 pb-1.5 pt-3.5 text-[15px] leading-relaxed text-ink outline-none placeholder:text-mist/70 night:text-moon"
        />
        <div className="flex items-center gap-1.5 px-3 pb-2.5">
          <button
            className="no-tap-highlight flex items-center gap-1 rounded-full px-2 py-1 text-[11px] text-mist transition-colors hover:text-cinnabar night:hover:text-gold-2"
            onClick={() => {
              setValue((v) => (v ? v : "帮我看看最近的运势"));
              toast("替你起了个头，说完心里话就发吧");
            }}
            title="灵感一句"
          >
            <Sparkles size={13} />
            <span className="hidden sm:inline">没想好？点我</span>
          </button>
          <div className="ml-auto" />
          {streaming ? (
            <button
              onClick={stop}
              className="no-tap-highlight flex h-9 w-9 items-center justify-center rounded-full bg-ink/85 text-paper-2 transition-transform active:scale-90 night:bg-gold-2/80 night:text-night"
              aria-label="停止生成"
            >
              <CircleStop size={17} />
            </button>
          ) : (
            <button
              onClick={() => void submit()}
              disabled={!value.trim()}
              className={cn(
                "no-tap-highlight flex h-9 w-9 items-center justify-center rounded-full transition-all active:scale-90",
                value.trim()
                  ? "bg-cinnabar text-paper-2 shadow-[0_4px_14px_rgba(181,64,42,0.35)] night:bg-gold-2 night:text-night"
                  : "bg-line/60 text-mist night:bg-white/10"
              )}
              aria-label="发送"
            >
              <ArrowUp size={17} strokeWidth={2.4} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
