"use client";

import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Coins, Grid3x3, Layers, ScrollText, Settings2, Sparkles } from "lucide-react";
import { deepLeft, engineHeaders, lampActive, profileHint, todayLetgo, todayUsage, useApp, useUI, type DivRecord } from "@/lib/store";
import { computeBazi } from "@/lib/divination";
import { compact, FREE_DEEP_PER_DAY, localAnalogy } from "@/lib/meter";
import { Logo } from "../brand/Logo";
import { Icon } from "../icons";
import { Card, IconButton, SectionTitle, Skeleton, timeAgo } from "../ui";
import { KIND_LABEL } from "../sheets/Sheets";

const KIND_ICON: Record<DivRecord["kind"], typeof Coins> = { coins: Coins, tarot: Layers, bazi: ScrollText, ziwei: Grid3x3, annual: Sparkles };

function Seal({ name }: { name?: string }) {
  if (!name)
    return (
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-line bg-card text-ink">
        <Logo size={36} mood="still" />
      </span>
    );
  return (
    <span className="grid h-14 w-14 shrink-0 -rotate-3 place-items-center rounded-[14px] border-2 border-seal/80 bg-seal/[0.06] font-song text-[26px] font-bold text-seal">
      {Array.from(name)[0]}
    </span>
  );
}

function Ledger() {
  const usage = useApp((s) => s.usage);
  const hint = useApp((s) => profileHint(s.profile));
  const count = useApp((s) => s.merit.count);
  const today = useApp((s) => todayUsage(s));
  const [settled, setSettled] = useState(false);
  const stale = usage.total > 0 && (!usage.analogy || usage.total - usage.analogy.at > Math.max(12000, usage.analogy.at * 0.25));
  const loading = stale && !settled;

  useEffect(() => {
    if (!stale) return;
    let alive = true;
    fetch("/api/analogy", { method: "POST", headers: { "Content-Type": "application/json", ...engineHeaders() }, body: JSON.stringify({ tokens: useApp.getState().usage.total, hint }) })
      .then((r) => r.json())
      .then((j: { items?: { emoji: string; text: string }[]; line?: string }) => {
        if (alive && j.items?.length) useApp.getState().setAnalogy({ items: j.items, line: j.line ?? "" });
      })
      .catch(() => undefined)
      .finally(() => {
        if (alive) setSettled(true);
      });
    return () => {
      alive = false;
    };
  }, [stale, hint]);

  const items = usage.analogy?.items ?? localAnalogy(usage.total, hint, 3);
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[12.5px] text-mute">算力账本</div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-song text-[28px] font-bold leading-none text-ink">{compact(usage.total)}</span>
            <span className="text-[12px] text-mute">累计 · 今日 {compact(today)}</span>
          </div>
        </div>
        <button type="button" onClick={() => useUI.getState().open("tip")} className="h-9 shrink-0 rounded-full bg-ink px-4 text-[13px] text-on-ink transition active:scale-95">
          随喜一下
        </button>
      </div>
      {usage.total > 0 ? (
        <>
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {loading && !usage.analogy
              ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-8 w-28 rounded-full" />)
              : items.map((it) => (
                  <span key={it.text} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-paper-2 px-3 text-[12.5px] text-ink">
                    <span aria-hidden>{it.emoji}</span>
                    {it.text}
                  </span>
                ))}
          </div>
          {usage.analogy?.line ? <p className="mt-2.5 font-song text-[13.5px] text-ink-2">「{usage.analogy.line}」</p> : loading ? <Skeleton className="mt-3 h-4 w-48" /> : null}
        </>
      ) : (
        <p className="mt-3 text-[13px] leading-relaxed text-mute">每一次推演和长聊都会用到算力。用了多少、差不多相当于几杯拿铁，都会记在这里。</p>
      )}
      {count > 0 && <div className="mt-3 text-[11.5px] text-mute">已随喜 {count} 次，谢谢你</div>}
    </Card>
  );
}

function Lamp() {
  const lit = useApp((s) => lampActive(s));
  const until = useApp((s) => s.merit.lampUntil);
  const left = useApp((s) => deepLeft(s));
  const d = new Date(until);
  return (
    <Card onClick={() => useUI.getState().open("lamp")} className="mt-2.5 flex items-center gap-3.5 p-4">
      <span className={`relative grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${lit ? "bg-[#e8a24a]/15" : "bg-paper-2"}`}>
        <motion.span
          className={`block h-4 w-3 rounded-[50%_50%_45%_45%/60%_60%_40%_40%] ${lit ? "bg-[#e8a24a]" : "bg-faint"}`}
          animate={lit ? { scaleY: [1, 1.12, 0.94, 1], opacity: [1, 0.85, 1] } : undefined}
          transition={{ duration: 2.2, repeat: Infinity }}
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14.5px] font-semibold text-ink">{lit ? "长明灯亮着" : "长明灯"}</span>
        <span className="mt-0.5 block truncate text-[12px] text-mute">{lit ? `至 ${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()} · 深度推演不限次` : `今日深度推演还剩 ${left}/${FREE_DEEP_PER_DAY} · 点灯不限次`}</span>
      </span>
      <Icon as={ChevronRight} size={18} className="text-faint" />
    </Card>
  );
}

export default function MeView() {
  const profile = useApp((s) => s.profile);
  const records = useApp((s) => s.records);
  const letgoToday = useApp((s) => todayLetgo(s));
  const letgoTotal = useApp((s) => s.letgo.total);
  const chats = useApp((s) => s.sessions.filter((x) => x.messages.some((m) => m.role === "user")).length);
  const [filter, setFilter] = useState<DivRecord["kind"] | null>(null);
  const [now] = useState(() => Date.now());
  const days = Math.max(1, Math.ceil((now - profile.firstSeen) / 86400000));
  const bazi = useMemo(() => computeBazi(profile.birth, profile.gender), [profile.birth, profile.gender]);
  const kinds = Array.from(new Set(records.map((r) => r.kind)));
  const list = records.filter((r) => !filter || r.kind === filter).sort((a, b) => (b.updatedAt ?? b.createdAt) - (a.updatedAt ?? a.createdAt));
  const open = useUI((s) => s.open);

  return (
    <div data-scroll-root className="no-scrollbar h-full overflow-y-auto overscroll-contain">
      <header className="pt-safe">
        <div className="flex items-end justify-between pb-1 pl-5 pr-3 pt-5">
          <h1 className="font-song text-[26px] font-bold tracking-wide text-ink">我</h1>
          <IconButton label="设置" onClick={() => open("settings")}>
            <Icon as={Settings2} size={20} />
          </IconButton>
        </div>
      </header>
      <div className="px-4 pb-12">
        <Card onClick={() => open("profile")} className="mt-3 p-4">
          <div className="flex items-center gap-3.5">
            <Seal name={profile.name} />
            <div className="min-w-0 flex-1">
              <div className="truncate font-song text-[19px] font-bold text-ink">{profile.name ?? "还没告诉我称呼"}</div>
              <div className="mt-0.5 truncate text-[12.5px] text-mute">{bazi ? `属${bazi.shengxiao} · ${bazi.zodiac} · 日主${bazi.dayMaster}${bazi.dayMasterWx}` : "留个生辰，命盘就能排出来"}</div>
              <div className="mt-0.5 text-[12px] text-mute">认识第 {days} 天</div>
            </div>
            <Icon as={ChevronRight} size={18} className="text-faint" />
          </div>
          {(profile.tags.length > 0 || profile.facts.length > 0) && (
            <div className="mt-3.5 flex flex-wrap items-center gap-1.5 border-t border-line pt-3">
              {profile.tags.slice(0, 4).map((t) => (
                <span key={t} className="rounded-full bg-ink/[0.05] px-2.5 py-1 text-[12px] text-ink-2">
                  {t}
                </span>
              ))}
              {profile.facts.length > 0 && <span className="text-[12px] text-mute">· 记得你的 {profile.facts.length} 件小事</span>}
            </div>
          )}
        </Card>

        <div className="mt-2.5 grid grid-cols-3 gap-2.5">
          {[
            { n: letgoToday, l: "今天算了" },
            { n: letgoTotal, l: "一共算了" },
            { n: chats, l: "聊过的事" },
          ].map((s) => (
            <div key={s.l} className="flex flex-col items-center rounded-[20px] border border-line bg-card/70 py-3.5">
              <span className="font-song text-[22px] font-bold leading-none text-ink">{s.n}</span>
              <span className="mt-1.5 text-[11.5px] text-mute">{s.l}</span>
            </div>
          ))}
        </div>

        <SectionTitle>心意</SectionTitle>
        <Ledger />
        <Lamp />

        <SectionTitle action={<span className="text-[12px] text-mute">{records.length ? `${records.length} 份` : ""}</span>}>档案</SectionTitle>
        {kinds.length > 1 && (
          <div className="no-scrollbar -mx-4 mb-2.5 flex gap-2 overflow-x-auto px-4">
            <button type="button" onClick={() => setFilter(null)} className={`h-7 shrink-0 rounded-full px-3 text-[12.5px] ${!filter ? "bg-ink text-on-ink" : "bg-ink/[0.05] text-ink-2"}`}>
              全部
            </button>
            {kinds.map((k) => (
              <button key={k} type="button" onClick={() => setFilter(k === filter ? null : k)} className={`h-7 shrink-0 rounded-full px-3 text-[12.5px] ${filter === k ? "bg-ink text-on-ink" : "bg-ink/[0.05] text-ink-2"}`}>
                {KIND_LABEL[k]}
              </button>
            ))}
          </div>
        )}
        {list.length ? (
          <div className="overflow-hidden rounded-[22px] border border-line bg-card/80">
            {list.slice(0, 60).map((r, i) => (
              <button key={r.id} type="button" onClick={() => open("record", { id: r.id })} className={`flex w-full items-center gap-3 px-4 py-3 text-left transition active:bg-ink/[0.03] ${i ? "border-t border-line" : ""}`}>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-paper-2 text-ink">
                  <Icon as={KIND_ICON[r.kind]} size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] text-ink">{r.title}</span>
                  <span className="mt-0.5 block truncate text-[11.5px] text-mute">
                    {KIND_LABEL[r.kind]} · {timeAgo(r.updatedAt ?? r.createdAt)} · {r.summary}
                  </span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-[22px] border border-dashed border-line px-6 py-8 text-center text-[13px] leading-relaxed text-mute">摇过的卦、抽过的牌、排过的盘，都会收在这里。</div>
        )}

        <div className="mt-12 flex flex-col items-center text-faint">
          <Logo size={30} mood="still" />
          <div className="mt-2 text-[11.5px] tracking-[0.2em]">算一算，然后，算了。</div>
        </div>
      </div>
    </div>
  );
}
