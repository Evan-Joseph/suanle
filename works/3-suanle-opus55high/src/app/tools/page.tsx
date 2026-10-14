"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api, getUid, relTime, useUserState } from "@/lib/client";
import { dailyCast, isYang } from "@/lib/iching";
import { computeBazi } from "@/lib/bazi";
import { Empty, ErrorState, ListSkeleton, PageHeader, Skeleton } from "@/components/ui";
import { HexFigure } from "@/components/divination";

type Reading = { id: string; kind: string; title: string; question: string | null; createdAt: string; pinned: boolean };

const TOOLS = [
  { href: "/tools/liuyao", glyph: "☯", name: "六爻摇卦", desc: "纠结的时候，亲手摇一卦", tint: "bg-clay-soft text-clay" },
  { href: "/tools/tarot", glyph: "✦", name: "塔罗牌阵", desc: "单张、圣三角、二选一", tint: "bg-[#ece8f2] text-[#8a7fa6]" },
  { href: "/tools/bazi", glyph: "☷", name: "八字命盘", desc: "看看自己是什么材质", tint: "bg-sage-soft text-sage" },
  { href: "/tools/kline", glyph: "⌇", name: "人生波动图", desc: "一生起伏，一张图看完", tint: "bg-mist-soft text-mist", badge: "详批" },
];

import { KIND_LABEL } from "@/components/ToolFrame";

export default function ToolsPage() {
  const { user } = useUserState();
  const [readings, setReadings] = useState<Reading[] | null>(null);
  const [err, setErr] = useState(false);
  const [mounted, setMounted] = useState(false);

  const load = () => {
    setErr(false);
    api<{ readings: Reading[] }>(`/api/readings?userId=${getUid()}`).then((r) => setReadings(r.readings.slice(0, 6))).catch(() => setErr(true));
  };
  useEffect(() => { setMounted(true); load(); }, []);

  const today = useMemo(() => new Date(), []);
  const dateKey = today.toLocaleDateString("sv-SE");
  const daily = useMemo(() => (mounted ? dailyCast(getUid() + dateKey) : null), [mounted, dateKey]);
  const dayPillar = useMemo(() => computeBazi(dateKey, 12).pillars.day.label, [dateKey]);

  return (
    <div className="scroll-area h-full pb-8">
      <PageHeader title="算一算" sub="先算一算，再决定要不要算了" />

      <div className="px-4">
        <div className="rounded-[28px] bg-ink p-5 text-paper">
          <div className="flex items-center justify-between text-[12px] text-paper/60">
            <span>今日一卦 · {today.getMonth() + 1}月{today.getDate()}日</span>
            <span className="font-serif">{dayPillar}日</span>
          </div>
          {daily ? (
            <div className="mt-4 flex items-center gap-5">
              <div className="shrink-0 rounded-2xl bg-paper/10 p-3 [&_div.bg-ink]:bg-paper">
                <HexFigure lines={daily.original ? daily.lines.map((v) => (isYang(v) ? 1 : 0)) : []} w={46} h={5} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-serif text-[22px]">{daily.original.full}</div>
                <div className="mt-1 text-[13px] leading-relaxed text-paper/75">{daily.original.modern}</div>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex gap-5"><Skeleton className="h-16 w-16 opacity-20" /><div className="flex-1 space-y-2"><Skeleton className="h-5 w-24 opacity-20" /><Skeleton className="h-3 w-full opacity-20" /></div></div>
          )}
          {daily && (
            <div className="mt-4 rounded-2xl bg-paper/10 px-4 py-3 text-[13px]">
              <span className="text-[#e3b8a4]">算了 · </span>{daily.original.letgo}
            </div>
          )}
          <div className="mt-3 text-[11px] text-paper/40">{user?.nickname ? `给${user.nickname}的` : "给你的"}，每天一卦，零点更新</div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {TOOLS.map((t) => (
            <Link key={t.href} href={t.href} className="relative min-w-0 rounded-3xl bg-white p-4 transition active:scale-[0.98]">
              <div className={`flex h-10 w-10 items-center justify-center rounded-2xl font-serif text-[18px] ${t.tint}`}>{t.glyph}</div>
              <div className="mt-3 truncate text-[15px] text-ink">{t.name}</div>
              <div className="mt-0.5 truncate text-[12px] text-sub">{t.desc}</div>
              {t.badge && <span className="absolute top-4 right-4 rounded-full bg-clay-soft px-2 py-0.5 text-[10px] text-clay">{t.badge}</span>}
            </Link>
          ))}
        </div>

        <div className="mt-7 mb-2 flex items-center justify-between px-1">
          <div className="font-serif text-[16px]">最近算过</div>
          <Link href="/me#archive" className="text-[12.5px] text-sub">全部档案 ›</Link>
        </div>
        {err ? (
          <ErrorState onRetry={load} />
        ) : readings === null ? (
          <ListSkeleton rows={3} />
        ) : readings.length === 0 ? (
          <Empty icon="☯" title="还没算过呢" desc="不急。等哪天真纠结了，再来摇一卦。" />
        ) : (
          <div className="space-y-2">
            {readings.map((r) => (
              <Link key={r.id} href={`/me/r/${r.id}`} className="flex items-center gap-3 rounded-2xl bg-white p-3.5 active:scale-[0.99]">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sand font-serif text-[13px] text-ink-2">{KIND_LABEL[r.kind]}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] text-ink">{r.title}</div>
                  <div className="truncate text-[12px] text-sub">{r.question || relTime(r.createdAt)}</div>
                </div>
                {r.pinned && <span className="shrink-0 text-[11px] text-clay">已归档</span>}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
