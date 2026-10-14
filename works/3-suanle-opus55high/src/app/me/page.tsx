"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, getUid, haptic, patchUser, refreshUser, relTime, useUserState } from "@/lib/client";
import { PERSONA_LIST, getPersona } from "@/lib/personas";
import { yuan } from "@/lib/pricing";
import { Empty, ErrorState, ListSkeleton, Logo, Pill, Skeleton } from "@/components/ui";
import { useApp } from "@/components/AppShell";
import { KIND_LABEL } from "@/components/ToolFrame";

type Usage = { today: number; total: number; days: { day: string; tokens: number }[]; analogy: { text: string; emoji: string } | null; yuanToday: number };
type Reading = { id: string; kind: string; title: string; question: string | null; pinned: boolean; unlocked: boolean; createdAt: string };
type Donation = { id: string; item: string; amount: number; createdAt: string; kind: string };

const FILTERS = [
  { id: "all", label: "全部" },
  { id: "pinned", label: "已归档" },
  { id: "life", label: "本命盘" },
  { id: "hexagram", label: "卦" },
  { id: "tarot", label: "牌" },
];

export default function MePage() {
  const { user, stats, loading } = useUserState();
  const { openPay, toast } = useApp();
  const [usage, setUsage] = useState<Usage | null>(null);
  const [usageErr, setUsageErr] = useState(false);
  const [readings, setReadings] = useState<Reading[] | null>(null);
  const [readErr, setReadErr] = useState(false);
  const [filter, setFilter] = useState("all");
  const [donations, setDonations] = useState<Donation[]>([]);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);

  const loadUsage = () => { setUsageErr(false); api<Usage>(`/api/usage?userId=${getUid()}`, { timeout: 25000 }).then(setUsage).catch(() => setUsageErr(true)); };
  const loadReadings = () => { setReadErr(false); api<{ readings: Reading[] }>(`/api/readings?userId=${getUid()}`).then((r) => setReadings(r.readings)).catch(() => setReadErr(true)); };
  const loadDonations = () => api<{ history: Donation[] }>(`/api/pay?userId=${getUid()}`).then((r) => setDonations(r.history)).catch(() => {});
  useEffect(() => { loadUsage(); loadReadings(); loadDonations(); refreshUser(); }, []);

  const shown = (readings ?? []).filter((r) =>
    filter === "all" ? true : filter === "pinned" ? r.pinned : filter === "life" ? r.kind === "bazi" || r.kind === "kline" : r.kind === filter,
  );
  const maxDay = Math.max(1, ...(usage?.days.map((d) => d.tokens) ?? [1]));
  const p = getPersona(user?.persona);

  const saveName = async () => {
    setEditingName(false);
    if (name.trim() === (user?.nickname ?? "")) return;
    await patchUser({ nickname: name.trim() }).catch(() => toast("没保存上，稍后再试"));
  };

  const clearAll = async () => {
    await api(`/api/user?id=${getUid()}`, { method: "DELETE" }).catch(() => null);
    setConfirmClear(false);
    toast("都清干净了，像新的一样");
    refreshUser(); loadReadings(); loadUsage();
  };

  return (
    <div className="scroll-area h-full pb-10">
      <div className="px-5 pb-4" style={{ paddingTop: "calc(var(--safe-t) + 22px)" }}>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] bg-ink text-paper"><Logo size={34} blink /></div>
          <div className="min-w-0 flex-1">
            {loading && !user ? (
              <><Skeleton className="h-5 w-28" /><Skeleton className="mt-2 h-3 w-40" /></>
            ) : editingName ? (
              <input autoFocus value={name} maxLength={20} onChange={(e) => setName(e.target.value)} onBlur={saveName} onKeyDown={(e) => e.key === "Enter" && saveName()} placeholder="怎么称呼你" className="w-full rounded-xl border border-line bg-white px-3 py-1.5 font-serif text-[18px] outline-none" />
            ) : (
              <button onClick={() => { setName(user?.nickname ?? ""); setEditingName(true); }} className="block max-w-full truncate text-left font-serif text-[21px] text-ink">
                {user?.nickname || "还没告诉我名字"} <span className="text-[12px] text-faint">✎</span>
              </button>
            )}
            <div className="mt-1 truncate text-[12.5px] text-sub">
              聊了 {stats?.conversations ?? 0} 次 · 算了 {stats?.letGo ?? 0} 件事 · 档案 {stats?.readings ?? 0} 份
            </div>
          </div>
        </div>
        {user?.pass && user.planUntil && (
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-clay-soft px-4 py-3 text-[13px] text-clay">
            <span>松弛月卡 · 深度详批随便看</span>
            <span className="font-mono text-[12px]">至 {new Date(user.planUntil).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })}</span>
          </div>
        )}
      </div>

      <div className="space-y-4 px-4">
        {/* Token 香火 */}
        <div className="rounded-3xl bg-white p-5">
          <div className="flex items-center justify-between text-[12.5px] text-sub">
            <span>今日香火</span>
            <span className="font-mono">累计 {(usage?.total ?? stats?.tokens ?? 0).toLocaleString()} tokens</span>
          </div>
          {usageErr ? (
            <ErrorState onRetry={loadUsage} text="香火账本暂时翻不开" />
          ) : !usage ? (
            <div className="mt-3 space-y-2"><Skeleton className="h-8 w-40" /><Skeleton className="h-4 w-56" /><Skeleton className="mt-3 h-14 w-full" /></div>
          ) : (
            <>
              <div className="mt-2 font-mono text-[28px] text-ink">{usage.today.toLocaleString()}<span className="ml-1 text-[13px] text-sub">tokens</span></div>
              <div className="mt-1 text-[14px] text-ink-2">
                {usage.today > 0 && usage.analogy ? <>{usage.analogy.emoji} 相当于{usage.analogy.text}</> : "今天还没开口，宇宙很安静。"}
              </div>
              <div className="mt-4 flex h-14 items-end gap-1.5">
                {usage.days.map((d, i) => (
                  <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                    <div className={`w-full rounded-md ${i === 6 ? "bg-clay" : "bg-sand"}`} style={{ height: `${Math.max(4, (d.tokens / maxDay) * 44)}px` }} />
                    <span className="text-[9.5px] text-faint">{i === 6 ? "今" : d.day.slice(8)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={() => { haptic(8); openPay({ kind: "tip", reason: "小算的每一句话都在烧算力。觉得被陪到了，可以添一点香油。", onSuccess: loadDonations }); }} className="rounded-full bg-ink py-3 text-[14px] text-paper active:scale-[0.98]">给小算添香油</button>
            <button onClick={() => openPay({ kind: "pass", title: "松弛月卡", reason: "30 天内，人生图和所有深度详批随便看。", onSuccess: loadDonations })} className="rounded-full border border-line py-3 text-[14px] text-ink-2 active:scale-[0.98]">{user?.pass ? "续一个月" : "开松弛月卡"}</button>
          </div>
        </div>

        {/* 档案 */}
        <div id="archive" className="rounded-3xl bg-white p-4">
          <div className="mb-3 flex items-center justify-between px-1">
            <div className="font-serif text-[16px] text-ink">我的档案</div>
            <Link href="/tools" className="text-[12.5px] text-sub">去算一算 ›</Link>
          </div>
          <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4">
            {FILTERS.map((f) => <Pill key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>{f.label}</Pill>)}
          </div>
          {readErr ? (
            <ErrorState onRetry={loadReadings} />
          ) : readings === null ? (
            <ListSkeleton rows={3} />
          ) : shown.length === 0 ? (
            <Empty icon="☷" title={filter === "all" ? "档案还是空的" : "这一栏还空着"} desc="本命盘、年算和你觉得重要的卦，都会收在这里，不会被闲聊淹没。" />
          ) : (
            <div className="space-y-1">
              {shown.map((r) => (
                <Link key={r.id} href={`/me/r/${r.id}`} className="flex items-center gap-3 rounded-2xl p-2.5 active:bg-paper">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-serif text-[12.5px] ${r.kind === "bazi" || r.kind === "kline" ? "bg-ink text-paper" : "bg-sand text-ink-2"}`}>{KIND_LABEL[r.kind]}</div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] text-ink">{r.title}</div>
                    <div className="truncate text-[11.5px] text-sub">{r.question ? `${r.question} · ` : ""}{relTime(r.createdAt)}</div>
                  </div>
                  {r.pinned && <span className="shrink-0 text-[10.5px] text-clay">●</span>}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* 设置 */}
        <div className="rounded-3xl bg-white p-4">
          <div className="mb-3 px-1 font-serif text-[16px] text-ink">偏好</div>
          <div className="px-1 text-[12.5px] text-sub">默认聊天对象</div>
          <div className="no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4">
            {PERSONA_LIST.map((x) => (
              <button key={x.id} onClick={() => { patchUser({ persona: x.id }).catch(() => {}); haptic(6); }} className={`flex shrink-0 items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-[12.5px] ${p.id === x.id ? "border-ink text-ink" : "border-line text-sub"}`}>
                <span className="flex h-6 w-6 items-center justify-center rounded-full font-serif text-[11px] text-paper" style={{ background: x.tint }}>{x.avatar}</span>{x.name}
              </button>
            ))}
          </div>
          <div className="mt-4 divide-y divide-line border-t border-line">
            <Link href="/tools/bazi" className="flex items-center justify-between px-1 py-3.5 text-[14px] text-ink">
              <span>生辰</span>
              <span className="truncate pl-4 text-[13px] text-sub">{user?.profile?.birthday ? `${user.profile.birthday}${user.profile.birthHour != null ? ` · ${user.profile.birthHour}时` : ""}` : "未填写"} ›</span>
            </Link>
            {user?.profile?.concern && (
              <div className="flex items-center justify-between gap-4 px-1 py-3.5 text-[14px] text-ink">
                <span className="shrink-0">小算记得你最近</span>
                <span className="min-w-0 truncate text-[13px] text-sub">{user.profile.concern}</span>
              </div>
            )}
            {confirmClear ? (
              <div className="flex items-center justify-between gap-2 px-1 py-3 text-[13px]">
                <span className="text-clay">对话、档案、记忆都会清空</span>
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => setConfirmClear(false)} className="rounded-full border border-line px-3 py-1 text-sub">算了</button>
                  <button onClick={clearAll} className="rounded-full bg-clay px-3 py-1 text-paper">清空</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setConfirmClear(true)} className="flex w-full items-center justify-between px-1 py-3.5 text-[14px] text-ink">
                <span>清除我的数据</span><span className="text-[13px] text-faint">›</span>
              </button>
            )}
          </div>
        </div>

        {donations.length > 0 && (
          <div className="rounded-3xl bg-white p-4">
            <div className="mb-2 px-1 font-serif text-[16px] text-ink">功德簿</div>
            {donations.slice(0, 8).map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-3 px-1 py-2 text-[13px]">
                <span className="min-w-0 truncate text-ink-2">{d.item}</span>
                <span className="shrink-0 font-mono text-sub">¥{yuan(d.amount)} · {relTime(d.createdAt)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col items-center pt-6 pb-2 text-center">
          <Logo size={30} className="text-faint" />
          <div className="mt-3 font-serif text-[14px] text-sub">算一算，然后，算了。</div>
          <div className="mt-1 text-[11px] text-faint">算了 · Suanle</div>
        </div>
      </div>
    </div>
  );
}
