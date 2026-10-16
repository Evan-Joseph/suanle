import { useEffect, useRef, useState } from "react";
import { ArrowUp, Brain, Square, X } from "lucide-react";
import { useApp, useUI, lampActive, deepLeft } from "@/lib/store";
import { sendMessage, stopStreaming } from "@/lib/engine";
import { haptic } from "@/lib/sound";

const QUICK = [
  { label: "🪙 摇一卦", text: "帮我摇一卦，问问最近这件事" },
  { label: "🃏 抽塔罗", text: "想抽三张塔罗看看" },
  { label: "📅 看今天", text: "今天的黄历和运势怎么样？" },
  { label: "🍂 揉掉烦恼", text: "我有件事一直放不下，想把它揉掉" },
];

export function Composer({ showQuick }: { showQuick: boolean }) {
  const [text, setText] = useState("");
  const ta = useRef<HTMLTextAreaElement>(null);
  const live = useUI((s) => s.live);
  const quote = useUI((s) => s.quote);
  const deepMode = useUI((s) => s.deepMode);
  const lamp = useApp((s) => lampActive(s));
  const left = useApp((s) => deepLeft(s));

  useEffect(() => {
    const el = ta.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  }, [text]);

  useEffect(() => {
    if (quote) ta.current?.focus();
  }, [quote]);

  const submit = () => {
    const t = text.trim();
    if (!t || live) return;
    haptic(8);
    const deep = deepMode;
    if (deep && !lamp && left <= 0) {
      useUI.getState().open("lamp");
      return;
    }
    void sendMessage(t, { quote: quote ?? undefined, deep });
    setText("");
    useUI.getState().setDeepMode(false);
  };

  const toggleDeep = () => {
    if (!deepMode && !lamp && left <= 0) {
      useUI.getState().open("lamp");
      return;
    }
    haptic(6);
    useUI.getState().setDeepMode(!deepMode);
  };

  return (
    <div className="relative z-10 shrink-0 px-3 pb-2 pt-1">
      {showQuick && !text && !quote && (
        <div className="no-scrollbar -mx-3 mb-2 flex gap-2 overflow-x-auto px-3">
          {QUICK.map((q) => (
            <button key={q.label} disabled={!!live} onClick={() => void sendMessage(q.text)} className="shrink-0 rounded-full border border-line bg-white/80 px-3 py-1.5 text-[12.5px] text-ink-2 shadow-[0_1px_4px_rgba(0,0,0,0.03)] transition active:scale-95 disabled:opacity-50">
              {q.label}
            </button>
          ))}
        </div>
      )}
      <div className="rounded-[24px] border border-line bg-white shadow-[0_4px_24px_rgba(60,40,10,0.07)] focus-within:border-ink/25">
        {quote && (
          <div className="mx-3 mt-2.5 flex items-center gap-2 rounded-xl bg-paper-2 px-3 py-1.5 text-[12px] text-mute">
            <span className="min-w-0 flex-1 truncate">引用：{quote}</span>
            <button onClick={() => useUI.getState().setQuote(null)} aria-label="取消引用" className="shrink-0 text-mute">
              <X size={14} />
            </button>
          </div>
        )}
        <textarea
          ref={ta}
          value={text}
          rows={1}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => useUI.getState().setFocused(true)}
          onBlur={() => setTimeout(() => useUI.getState().setFocused(false), 120)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && window.matchMedia("(pointer: fine)").matches) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={deepMode ? "说说你想深究的事…" : "想算点什么，或者，想算了什么？"}
          className="block max-h-[140px] w-full resize-none bg-transparent px-4 pb-1 pt-3 text-[15.5px] leading-relaxed text-ink outline-none placeholder:text-faint"
        />
        <div className="flex items-center justify-between px-2 pb-2">
          <button
            onClick={toggleDeep}
            className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12.5px] transition active:scale-95 ${deepMode ? "border-seal/40 bg-seal/10 text-seal" : "border-line text-ink-2"}`}
          >
            <Brain size={14} />
            深度推演
            <span className={`text-[11px] ${deepMode ? "text-seal/80" : "text-mute"}`}>{lamp ? "· 灯下不限" : `· 今日余 ${left}`}</span>
          </button>
          {live ? (
            <button onClick={stopStreaming} aria-label="停止" className="grid h-9 w-9 place-items-center rounded-full bg-ink text-paper active:scale-90">
              <Square size={13} fill="currentColor" />
            </button>
          ) : (
            <button onClick={submit} disabled={!text.trim()} aria-label="发送" className="grid h-9 w-9 place-items-center rounded-full bg-ink text-paper transition active:scale-90 disabled:bg-ink/15 disabled:text-white">
              <ArrowUp size={18} strokeWidth={2.2} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
