"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Flame, Coffee, Pencil, Check, Trash2, Share2, Sparkles } from "lucide-react";
import { useApp, useUI, lampActive, deepLeft, DEEP_FREE, scheduleSync } from "@/store/app";
import { computeBazi, WX_COLOR } from "@/lib/divination";
import { fmtTokens } from "@/lib/parse";
import { Logo, SectionTitle } from "@/components/ui";
import { mockMetaphor } from "@/lib/mock";

export default function MeView() {
  const profile = useApp((s) => s.profile);
  const setProfile = useApp((s) => s.setProfile);
  const usage = useApp((s) => s.usage);
  const sessions = useApp((s) => s.sessions);
  const letgo = useApp((s) => s.letgo);
  const lamp = useApp(lampActive);
  const lampUntil = useApp((s) => s.lampUntil);
  const left = useApp(deepLeft);
  const resetAll = useApp((s) => s.resetAll);
  const setSheet = useUI((s) => s.setSheet);
  const toast = useUI((s) => s.toast);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.name ?? "");
  const [city, setCity] = useState(profile.city ?? "");
  const [metaphor, setMetaphor] = useState(() => mockMetaphor(Math.max(usage.total, 1), profile));

  const bazi = useMemo(() => computeBazi(profile.birth), [profile.birth]);
  const total = bazi ? Object.values(bazi.wuxing).reduce((a, b) => a + b, 0) || 1 : 1;
  const talks = sessions.filter((s) => s.messages.some((m) => !m.intro)).length;

  useEffect(() => {
    if (usage.total < 1000) return;
    fetch("/api/metaphor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tokens: usage.total, profile }) })
      .then((r) => r.json()).then((j) => j?.item && setMetaphor(j)).catch(() => null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Math.floor(usage.total / 5000)]);

  const save = () => { setProfile({ name: name.trim() || undefined, city: city.trim() || undefined }); setEditing(false); scheduleSync(); toast("记住了"); };

  return (
    <div className="scroll-thin h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-2xl px-5 pb-[calc(24px+var(--sab))] pt-[calc(14px+var(--sat))]">
        {/* 名片 */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="paper-card relative overflow-hidden rounded-3xl p-5">
          <div className="absolute -right-6 -top-6 opacity-[0.06]"><Logo size={160} blink={false} /></div>
          <div className="flex items-start gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-ink text-paper"><Logo size={40} color="#f7f4ee" /></div>
            <div className="min-w-0 flex-1">
              {editing ? (
                <div className="space-y-2">
                  <input value={name} onChange={(e) => setName(e.target.value.slice(0, 12))} placeholder="怎么称呼你" className="h-10 w-full rounded-xl border border-ink/10 bg-white/80 px-3 text-[15px] outline-none focus:border-ink/40" />
                  <input value={city} onChange={(e) => setCity(e.target.value.slice(0, 12))} placeholder="在哪座城市" className="h-10 w-full rounded-xl border border-ink/10 bg-white/80 px-3 text-[15px] outline-none focus:border-ink/40" />
                  <button onClick={save} className="ink-btn flex h-9 items-center gap-1 rounded-full px-4 text-sm"><Check size={14} /> 好了</button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <h1 className="truncate font-serif text-[22px] font-semibold">{profile.name ?? "还没留下称呼"}</h1>
                    <button onClick={() => setEditing(true)} aria-label="编辑" className="grid h-7 w-7 place-items-center rounded-full text-ink-3 hover:bg-white/70"><Pencil size={13} /></button>
                  </div>
                  <p className="mt-0.5 text-[13px] text-ink-2">
                    {[profile.city, bazi ? `属${bazi.shengxiao} · ${bazi.zodiac}` : null].filter(Boolean).join(" · ") || "聊着聊着，我会慢慢认识你。"}
                  </p>
                  {lamp && <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-gold/20 px-2.5 py-1 text-[11px] text-[#8a6420]"><Flame size={11} className="anim-flame" /> 长明灯亮着 · 至 {new Date(lampUntil!).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })}</span>}
                </>
              )}
            </div>
          </div>
          {profile.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">{profile.tags.slice(0, 8).map((t) => <span key={t} className="rounded-full bg-paper-2 px-2.5 py-1 text-[11px] text-ink-2">{t}</span>)}</div>
          )}
        </motion.div>

        {/* 命盘 */}
        <div className="mt-6">
          <SectionTitle sub={profile.birth}>我的底色</SectionTitle>
          {bazi ? (
            <div className="paper-card rounded-2xl p-4">
              <div className="grid grid-cols-4 gap-1 text-center">
                {bazi.pillars.map((p) => (
                  <div key={p.label}><div className="text-[11px] text-ink-3">{p.label}柱</div><div className="font-serif text-2xl font-semibold tracking-wider">{p.gz}</div><div className="text-[11px] text-ink-3">{p.wx || "—"}</div></div>
                ))}
              </div>
              <div className="mt-4 flex items-end justify-between gap-2">
                {Object.entries(bazi.wuxing).map(([k, v]) => (
                  <div key={k} className="flex flex-1 flex-col items-center gap-1">
                    <div className="flex h-16 w-full items-end rounded-md bg-white/60"><div className="w-full rounded-md" style={{ height: `${Math.max(8, (v / total) * 100)}%`, background: WX_COLOR[k] }} /></div>
                    <span className="text-[12px] text-ink-2">{k}<span className="text-ink-4"> {v}</span></span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[13px] text-ink-2">日主 <b className="font-serif">{bazi.dayMaster}{bazi.dayMasterWx}</b> · {bazi.lunarText} · {bazi.nayin}</p>
              <button onClick={() => setSheet({ kind: "bazi" })} className="mt-3 text-xs text-ink-3 underline underline-offset-4">修改生辰</button>
            </div>
          ) : (
            <button onClick={() => setSheet({ kind: "bazi" })} className="paper-card flex w-full items-center gap-3 rounded-2xl p-4 text-left">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-paper-2 text-ink-2"><Sparkles size={18} /></span>
              <span><span className="block text-[15px]">留下生辰，排一张命盘</span><span className="block text-xs text-ink-3">年月日就够，时辰不详也行</span></span>
            </button>
          )}
        </div>

        {/* 算力 */}
        <div className="mt-6">
          <SectionTitle>这些日子</SectionTitle>
          <div className="grid grid-cols-3 gap-2.5">
            <Stat n={talks} label="段心事" />
            <Stat n={letgo.total} label="件放下了" />
            <Stat n={fmtTokens(usage.total)} label="算力" small />
          </div>
          <button onClick={() => setSheet({ kind: "tip", tokens: usage.total })} className="paper-card mt-2.5 flex w-full items-center gap-3 rounded-2xl p-4 text-left">
            <span className="text-2xl">{metaphor.emoji}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px]">一共耗了 {fmtTokens(usage.total)} 算力 ≈ {metaphor.count}{metaphor.item}</span>
              <span className="block text-xs text-ink-3">{metaphor.line}</span>
            </span>
            <Coffee size={16} className="shrink-0 text-ink-3" />
          </button>
          <div className="mt-2.5 flex items-center justify-between rounded-2xl bg-white/60 px-4 py-3 text-[13px]">
            <span className="text-ink-2">深度推演 · {lamp ? "不限次" : `今日还剩 ${left}/${DEEP_FREE} 次`}</span>
            {!lamp && <button onClick={() => setSheet({ kind: "lamp" })} className="flex items-center gap-1 text-cinnabar"><Flame size={13} /> 点灯解锁</button>}
          </div>
        </div>

        {/* 其他 */}
        <div className="mt-6 space-y-2">
          <Row icon={<Share2 size={16} />} label="把算了介绍给一个朋友" onClick={() => setSheet({ kind: "share", text: "算一算，然后，算了。\n一个懂八字六爻塔罗，但更懂人心的老朋友。" })} />
          <Row icon={<Trash2 size={16} />} label="把这里清空，重新开始" danger onClick={() => { if (confirm("所有心事、命盘和记录都会被清空，确定？")) { resetAll(); toast("清空了，像没来过一样"); } }} />
        </div>
        <p className="mt-8 text-center font-serif text-xs tracking-[0.2em] text-ink-4">算一算，然后，算了。</p>
      </div>
    </div>
  );
}

function Stat({ n, label, small }: { n: number | string; label: string; small?: boolean }) {
  return (
    <div className="paper-card rounded-2xl px-3 py-3 text-center">
      <div className={`font-serif font-semibold ${small ? "text-[18px]" : "text-2xl"}`}>{n}</div>
      <div className="text-[11px] text-ink-3">{label}</div>
    </div>
  );
}
function Row({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} className={`press flex w-full items-center gap-3 rounded-2xl bg-white/60 px-4 py-3.5 text-left text-[14px] ${danger ? "text-cinnabar" : "text-ink"}`}>
      <span className={danger ? "text-cinnabar" : "text-ink-2"}>{icon}</span>{label}
    </button>
  );
}
