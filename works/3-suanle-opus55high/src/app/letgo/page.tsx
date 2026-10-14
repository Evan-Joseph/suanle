"use client";

import { useEffect, useRef, useState } from "react";
import { api, getUid, haptic, refreshUser } from "@/lib/client";
import { PageHeader } from "@/components/ui";

const LINES = [
  "丢了。它不配占用你今晚。",
  "好，这件事，算了。",
  "纸团进篓，人回被窝。",
  "想不通的，就先不想了。",
  "你已经很努力了，剩下的交给时间。",
  "放下不是认输，是腾出手来抱抱自己。",
  "地势坤，装得下，也放得下。",
  "明天的事，明天的你会处理。",
];

function Breath() {
  const [on, setOn] = useState(false);
  const [phase, setPhase] = useState<"吸气" | "停一下" | "慢慢呼气">("吸气");
  const [left, setLeft] = useState(60);
  useEffect(() => {
    if (!on) return;
    const seq: [typeof phase, number][] = [["吸气", 4000], ["停一下", 4000], ["慢慢呼气", 6000]];
    let i = 0;
    let t: ReturnType<typeof setTimeout>;
    const next = () => {
      setPhase(seq[i % 3][0]);
      haptic(i % 3 === 0 ? 12 : 4);
      t = setTimeout(next, seq[i % 3][1]);
      i++;
    };
    next();
    const c = setInterval(() => setLeft((l) => (l <= 1 ? (setOn(false), 60) : l - 1)), 1000);
    return () => { clearTimeout(t); clearInterval(c); };
  }, [on]);
  const scale = !on ? 0.8 : phase === "吸气" ? 1.1 : phase === "停一下" ? 1.1 : 0.75;
  return (
    <div className="rounded-3xl bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-serif text-[16px] text-ink">一分钟，跟着呼吸</div>
          <div className="mt-0.5 text-[12px] text-sub">吸四秒，停四秒，呼六秒</div>
        </div>
        <button onClick={() => { setOn((o) => !o); setLeft(60); }} className="rounded-full border border-line px-4 py-1.5 text-[13px] text-ink-2 active:scale-95">{on ? "停下" : "开始"}</button>
      </div>
      <div className="flex h-44 items-center justify-center">
        <div className="relative flex h-32 w-32 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-mist-soft" style={{ transform: `scale(${scale})`, transition: `transform ${phase === "慢慢呼气" ? 6 : 4}s ease-in-out` }} />
          <div className="relative text-center">
            <div className="font-serif text-[15px] text-ink">{on ? phase : "准备好了吗"}</div>
            {on && <div className="mt-1 font-mono text-[11px] text-sub">{left}s</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LetGoPage() {
  const [text, setText] = useState("");
  const [stage, setStage] = useState<"write" | "crumple" | "done">("write");
  const [line, setLine] = useState(LINES[0]);
  const [counts, setCounts] = useState<{ today: number; mine: number } | null>(null);
  const [binShake, setBinShake] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    api<{ today: number; mine: number }>(`/api/letgo?userId=${getUid()}`).then(setCounts).catch(() => {});
  }, []);

  const toss = async () => {
    if (!text.trim()) { taRef.current?.focus(); return; }
    taRef.current?.blur();
    haptic([15, 40, 15, 40, 15]);
    setStage("crumple");
    setLine(LINES[Math.floor(Math.random() * LINES.length)]);
    const req = api<{ today: number; mine: number }>("/api/letgo", { body: { userId: getUid() } }).catch(() => null);
    setTimeout(() => { setBinShake(true); haptic(30); }, 1000);
    setTimeout(async () => {
      setBinShake(false);
      setText("");
      setStage("done");
      const r = await req;
      if (r) setCounts(r); else setCounts((c) => (c ? { today: c.today + 1, mine: c.mine + 1 } : c));
      refreshUser();
    }, 1400);
  };

  return (
    <div className="scroll-area h-full pb-10">
      <PageHeader title="算了" sub="写下来，揉一揉，丢掉" />
      <div className="space-y-4 px-4">
        <div className="relative">
          {stage !== "done" ? (
            <div className={`relative rounded-[20px] border border-line bg-[#fffdf8] p-5 shadow-[0_6px_24px_rgba(0,0,0,0.04)] ${stage === "crumple" ? "crumple" : ""}`}>
              <div className="pointer-events-none absolute inset-x-5 top-[52px] bottom-5" style={{ backgroundImage: "repeating-linear-gradient(transparent 0 31px, #efe9df 31px 32px)" }} />
              <div className="relative mb-2 text-[12px] text-sub">那件让你烦的事</div>
              <textarea
                ref={taRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={500}
                rows={6}
                placeholder="比如：今天开会被当众怼了，到现在还在想该怎么回……"
                className="relative w-full resize-none bg-transparent text-[16px] leading-8 text-ink outline-none placeholder:text-faint"
              />
            </div>
          ) : (
            <div className="anim-fade-up flex flex-col items-center rounded-[20px] bg-white px-6 py-10 text-center">
              <div className="font-serif text-[20px] text-ink">{line}</div>
              {counts && <div className="mt-3 text-[12.5px] text-sub">你已经算了 {counts.mine} 件事 · 今天大家一共算了 {counts.today} 件</div>}
              <button onClick={() => { setStage("write"); setTimeout(() => taRef.current?.focus(), 50); }} className="mt-6 rounded-full border border-line px-5 py-2 text-[13px] text-ink-2 active:scale-95">还有一件</button>
            </div>
          )}
        </div>

        {stage !== "done" && (
          <div className="flex flex-col items-center">
            <button onClick={toss} disabled={stage === "crumple"} className="w-full rounded-full bg-ink py-3.5 text-[15px] text-paper transition active:scale-[0.98] disabled:opacity-60">揉成团，丢掉</button>
            <div className={`mt-4 transition-transform ${binShake ? "scale-110 -rotate-6" : ""}`}>
              <svg width="44" height="44" viewBox="0 0 24 24" className="text-faint"><path d="M6 8h12l-1.2 11.2a1.5 1.5 0 0 1-1.5 1.3H8.7a1.5 1.5 0 0 1-1.5-1.3L6 8z" fill="none" stroke="currentColor" strokeWidth="1.3" /><path d="M4.5 8h15" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /><path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" /></svg>
            </div>
            <div className="mt-1 text-[11.5px] text-faint">纸团不会被保存，丢了就是丢了</div>
          </div>
        )}

        <Breath />

        <div className="rounded-3xl bg-sand/50 p-5 text-[13px] leading-relaxed text-ink-2">
          <div className="mb-1 font-serif text-[15px] text-ink">☷ 为什么是坤</div>
          坤卦六爻皆阴，象征大地。地不争高，什么都能承接，也什么都能放下。「地势坤，君子以厚德载物」——装得下，是本事；放得下，是更大的本事。
        </div>
      </div>
    </div>
  );
}
