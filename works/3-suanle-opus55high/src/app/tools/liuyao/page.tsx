"use client";

import Link from "next/link";
import { useState } from "react";
import { HexagramCast, HexagramResult } from "@/components/divination";
import InterpretPanel from "@/components/Interpret";
import { PinButton, saveReading, ToolFrame } from "@/components/ToolFrame";
import type { CastResult } from "@/lib/iching";
import { interpretCast } from "@/lib/mock-oracle";

export default function LiuyaoPage() {
  const [cast, setCast] = useState<CastResult | null>(null);
  const [rid, setRid] = useState<string | null>(null);
  const [pinned, setPinned] = useState(false);
  const [round, setRound] = useState(0);

  const onDone = async (c: CastResult) => {
    setCast(c);
    const r = await saveReading({ kind: "hexagram", title: c.resulting ? `${c.original.full} → ${c.resulting.full}` : c.original.full, question: c.question, data: c });
    setRid(r.id);
  };

  return (
    <ToolFrame title="六爻摇卦" sub="三枚铜钱 · 六次 · 自下而上">
      {!cast ? (
        <div className="anim-fade-up pt-4" key={round}>
          <HexagramCast onDone={onDone} />
          <div className="mt-8 rounded-2xl bg-white/70 p-4 text-[12.5px] leading-relaxed text-sub">
            三枚铜钱：三个背面为老阳（会变），两背一字为少阴，一背两字为少阳，三个字面为老阴（会变）。变了的爻，指向事情接下来的走向。
          </div>
        </div>
      ) : (
        <div className="anim-fade-up space-y-4 pt-2">
          {cast.question && <div className="text-center text-[13px] text-sub">所问 · {cast.question}</div>}
          <HexagramResult cast={cast} />
          <InterpretPanel readingId={rid} localFallback={() => interpretCast(cast, cast.question)} />
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <PinButton id={rid} pinned={pinned} onChange={setPinned} />
            <button onClick={() => { setCast(null); setRid(null); setPinned(false); setRound((r) => r + 1); }} className="rounded-full border border-line bg-white px-4 py-2 text-[13px] text-ink-2 active:scale-95">再摇一卦</button>
            <Link href={`/?q=${encodeURIComponent(`刚摇到${cast.original.full}${cast.resulting ? `变${cast.resulting.full}` : ""}，想再聊聊`)}`} className="rounded-full border border-line bg-white px-4 py-2 text-[13px] text-ink-2 active:scale-95">接着聊聊</Link>
          </div>
          <p className="pt-2 text-center text-[11.5px] text-faint">同一件事，一天摇一次就够了。答案摇多了，心会乱。</p>
        </div>
      )}
    </ToolFrame>
  );
}
