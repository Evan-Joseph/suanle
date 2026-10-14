"use client";

import Link from "next/link";
import { useState } from "react";
import { TarotDraw, TarotResultView } from "@/components/divination";
import InterpretPanel from "@/components/Interpret";
import { PinButton, saveReading, ToolFrame } from "@/components/ToolFrame";
import { Pill } from "@/components/ui";
import { SPREADS, type TarotResult, type TarotSpread } from "@/lib/tarot";
import { interpretTarot } from "@/lib/mock-oracle";

export default function TarotPage() {
  const [spread, setSpread] = useState<TarotSpread>("triangle");
  const [q, setQ] = useState("");
  const [result, setResult] = useState<TarotResult | null>(null);
  const [rid, setRid] = useState<string | null>(null);
  const [pinned, setPinned] = useState(false);
  const [round, setRound] = useState(0);

  const onDone = async (r: TarotResult) => {
    setResult(r);
    const saved = await saveReading({ kind: "tarot", title: `${SPREADS[r.spread].name} · ${r.cards.map((c) => c.card.name).join(" ")}`, question: r.question, data: r });
    setRid(saved.id);
  };

  return (
    <ToolFrame title="塔罗牌阵" sub="二十二张大阿卡纳">
      {!result ? (
        <div className="anim-fade-up space-y-5 pt-3">
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
            {(Object.keys(SPREADS) as TarotSpread[]).map((s) => <Pill key={s} active={spread === s} onClick={() => setSpread(s)}>{SPREADS[s].name}</Pill>)}
          </div>
          <div className="text-center text-[12.5px] text-sub">{SPREADS[spread].desc}</div>
          <input value={q} onChange={(e) => setQ(e.target.value)} maxLength={60} placeholder="想问什么？（可以不写）" className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-[15px] outline-none placeholder:text-faint focus:border-faint" />
          <TarotDraw key={`${spread}-${round}`} spread={spread} question={q.trim() || undefined} onDone={onDone} />
        </div>
      ) : (
        <div className="anim-fade-up space-y-4 pt-2">
          {result.question && <div className="text-center text-[13px] text-sub">所问 · {result.question}</div>}
          <TarotResultView result={result} />
          <InterpretPanel readingId={rid} localFallback={() => interpretTarot(result, result.question)} />
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <PinButton id={rid} pinned={pinned} onChange={setPinned} />
            <button onClick={() => { setResult(null); setRid(null); setPinned(false); setRound((r) => r + 1); }} className="rounded-full border border-line bg-white px-4 py-2 text-[13px] text-ink-2 active:scale-95">重新洗牌</button>
            <Link href={`/?q=${encodeURIComponent(`刚抽到${result.cards.map((c) => c.card.name + (c.reversed ? "逆位" : "")).join("、")}，想聊聊`)}`} className="rounded-full border border-line bg-white px-4 py-2 text-[13px] text-ink-2 active:scale-95">接着聊聊</Link>
          </div>
        </div>
      )}
    </ToolFrame>
  );
}
