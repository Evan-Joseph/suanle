"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, getUid } from "@/lib/client";
import { ElementRadar, HexagramResult, PillarsView, TarotResultView } from "@/components/divination";
import InterpretPanel from "@/components/Interpret";
import { PinButton } from "@/components/ToolFrame";
import { ErrorState, Skeleton } from "@/components/ui";
import { useApp } from "@/components/AppShell";
import { computeBazi, computeKLine } from "@/lib/bazi";
import { interpretBazi, interpretCast, interpretTarot } from "@/lib/mock-oracle";
import type { CastResult } from "@/lib/iching";
import type { TarotResult } from "@/lib/tarot";

type Reading = { id: string; kind: string; title: string; question: string | null; data: unknown; interpretation: string | null; pinned: boolean; unlocked: boolean; createdAt: string };

export default function ReadingDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useApp();
  const [r, setR] = useState<Reading | null>(null);
  const [err, setErr] = useState<false | "net" | "404">(false);
  const [pinned, setPinned] = useState(false);

  const load = () => {
    setErr(false);
    api<{ reading: Reading }>(`/api/readings/${id}?userId=${getUid()}`)
      .then((x) => { setR(x.reading); setPinned(x.reading.pinned); })
      .catch((e) => setErr(e?.status === 404 ? "404" : "net"));
  };
  useEffect(load, [id]);

  const del = async () => {
    await api(`/api/readings/${id}?userId=${getUid()}`, { method: "DELETE" }).catch(() => null);
    toast("已删除");
    router.replace("/me#archive");
  };

  let body: React.ReactNode = null;
  let fallback = () => "";
  if (r) {
    if (r.kind === "hexagram") {
      const c = r.data as CastResult;
      body = <HexagramResult cast={c} />;
      fallback = () => interpretCast(c, c.question);
    } else if (r.kind === "tarot") {
      const t = r.data as TarotResult;
      body = <TarotResultView result={t} />;
      fallback = () => interpretTarot(t, t.question);
    } else {
      const d = r.data as { birthday: string; hour: number | null };
      const b = computeBazi(d.birthday, d.hour);
      const k = r.kind === "kline" ? computeKLine(b) : undefined;
      body = (
        <div className="space-y-3">
          <PillarsView bazi={b} />
          <div className="flex justify-center rounded-3xl bg-white p-4"><ElementRadar elements={b.elements} /></div>
          {r.kind === "kline" && <Link href="/tools/kline" className="block rounded-2xl bg-ink p-4 text-center text-[14px] text-paper">打开人生波动图 ›</Link>}
        </div>
      );
      fallback = () => interpretBazi(b, k);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center gap-2 px-3 pb-2" style={{ paddingTop: "calc(var(--safe-t) + 10px)" }}>
        <button onClick={() => router.back()} className="flex h-10 w-10 items-center justify-center rounded-full text-ink-2 active:bg-sand" aria-label="返回">
          <svg width="18" height="18" viewBox="0 0 18 18"><path d="M11 3L5 9l6 6" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <div className="min-w-0 flex-1 truncate text-center font-serif text-[16px] text-ink">{r?.title ?? "档案"}</div>
        <button onClick={del} disabled={!r} className="flex h-10 w-10 items-center justify-center rounded-full text-sub active:bg-sand" aria-label="删除">
          <svg width="16" height="16" viewBox="0 0 14 14"><path d="M3 4h8l-.6 7.5a1 1 0 0 1-1 .9H4.6a1 1 0 0 1-1-.9L3 4zM2 4h10M5.5 4V2.5h3V4" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round" /></svg>
        </button>
      </header>
      <div className="scroll-area min-h-0 flex-1 px-4 pb-10">
        {err === "404" ? (
          <ErrorState text="这份档案已经不在了。" />
        ) : err ? (
          <ErrorState onRetry={load} />
        ) : !r ? (
          <div className="space-y-3 pt-3"><Skeleton className="h-40 rounded-3xl" /><Skeleton className="h-64 rounded-3xl" /></div>
        ) : (
          <div className="anim-fade-up space-y-4 pt-2">
            <div className="text-center text-[12px] text-sub">{new Date(r.createdAt).toLocaleString("zh-CN", { hour12: false })}{r.question ? ` · ${r.question}` : ""}</div>
            {body}
            {r.kind === "kline" && !r.unlocked ? null : (
              <InterpretPanel readingId={r.id} initial={r.interpretation} auto={false} localFallback={fallback} />
            )}
            <div className="flex justify-center"><PinButton id={r.id} pinned={pinned} onChange={setPinned} /></div>
          </div>
        )}
      </div>
    </div>
  );
}
