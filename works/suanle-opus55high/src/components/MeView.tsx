import { useState } from "react";
import { ChevronRight, Flame, Heart, MessageCircle, Pencil, Trash2, Volume2, VolumeX, X } from "lucide-react";
import { useApp, useUI, lampActive, deepLeft, dayKey } from "@/lib/store";
import { computeBazi } from "@/lib/divination";
import { analogize, fmt } from "@/lib/meter";
import { bringToChat } from "@/lib/engine";
import { Card, Logo, SectionTitle, timeAgo, useCountUp } from "./ui";
import { WX_COLOR } from "./tools";

const KIND = { coins: { e: "🪙", n: "卦" }, tarot: { e: "🃏", n: "塔罗" }, bazi: { e: "📜", n: "命盘" }, kline: { e: "📈", n: "K线" } } as const;

export default function MeView() {
  const profile = useApp((s) => s.profile);
  const sessions = useApp((s) => s.sessions);
  const records = useApp((s) => s.records);
  const usage = useApp((s) => s.usage);
  const letgo = useApp((s) => s.letgo);
  const merit = useApp((s) => s.merit);
  const sound = useApp((s) => s.sound);
  const lit = useApp((s) => lampActive(s));
  const left = useApp((s) => deepLeft(s));
  const [filter, setFilter] = useState<"all" | keyof typeof KIND>("all");
  const [confirmReset, setConfirmReset] = useState(false);
  const total = useCountUp(usage.total);
  const b = computeBazi(profile.birth);
  const talks = sessions.filter((s) => s.messages.some((m) => m.role === "user")).length;
  const days = Math.max(1, Math.ceil((Date.now() - profile.firstSeen) / 86400000));
  const items = analogize(usage.total, usage.basis);
  const list = records.filter((r) => filter === "all" || r.kind === filter);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between px-5">
        <h2 className="font-song text-[18px] font-bold tracking-[0.12em]">我的</h2>
        <button onClick={() => useApp.getState().toggleSound()} aria-label="声音" className="grid h-9 w-9 place-items-center rounded-full text-ink-2 active:bg-black/5">
          {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
      </header>
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-8">
        <div className="mx-auto max-w-[560px]">
          {/* 画像 */}
          <Card className="p-5">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[18px] bg-ink font-song text-[24px] text-paper">{(profile.name || "友").slice(0, 1)}</div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-song text-[19px] font-bold">{profile.name || "朋友"}</div>
                <div className="mt-0.5 truncate text-[12.5px] text-mute">
                  {[profile.gender, b ? `${b.shengxiao} · ${b.zodiac}` : null, profile.city].filter(Boolean).join(" · ") || "认识的第 " + days + " 天"}
                </div>
              </div>
              <button onClick={() => useUI.getState().open("profile")} aria-label="编辑资料" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black/[0.04] text-ink-2 active:scale-95">
                <Pencil size={15} />
              </button>
            </div>
            {b && (
              <div className="mt-4 flex items-center justify-between rounded-2xl bg-paper-2/70 px-4 py-3">
                {b.pillars.map((p) => (
                  <div key={p.label} className="text-center">
                    <div className="text-[10.5px] text-mute">{p.label}</div>
                    <div className="mt-0.5 font-song text-[17px] font-bold tracking-wider">{p.gz}</div>
                  </div>
                ))}
                <div className="h-8 w-px bg-line" />
                <div className="text-center">
                  <div className="text-[10.5px] text-mute">日主</div>
                  <div className="mt-0.5 font-song text-[17px] font-bold" style={{ color: WX_COLOR[b.dayMasterWx] }}>{b.dayMaster}{b.dayMasterWx}</div>
                </div>
              </div>
            )}
            {(profile.tags.length > 0 || profile.facts.length > 0) && (
              <div className="mt-4">
                <div className="mb-2 text-[12px] text-mute">算了记得的你</div>
                {profile.tags.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {profile.tags.map((t, i) => (
                      <span key={t} className="inline-flex items-center gap-1 rounded-full bg-black/[0.04] py-1 pl-2.5 pr-1.5 text-[12px] text-ink-2">
                        {t}
                        <button onClick={() => useApp.getState().removeTag(i)} aria-label="移除" className="text-faint"><X size={11} /></button>
                      </span>
                    ))}
                  </div>
                )}
                <ul className="space-y-1">
                  {profile.facts.slice(-6).map((f) => {
                    const idx = profile.facts.indexOf(f);
                    return (
                      <li key={f} className="flex items-start gap-2 text-[13px] leading-relaxed text-ink-2">
                        <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-seal" />
                        <span className="min-w-0 flex-1">{f}</span>
                        <button onClick={() => useApp.getState().removeFact(idx)} aria-label="忘掉这条" className="mt-1 shrink-0 text-faint"><X size={13} /></button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            {!profile.name && !profile.facts.length && (
              <button onClick={() => useUI.getState().setTab("chat")} className="mt-4 w-full rounded-2xl border border-dashed border-line py-3 text-[13px] text-mute">
                去聊几句吧，聊着聊着，算了就懂你了
              </button>
            )}
          </Card>

          {/* 统计 */}
          <div className="mt-3 grid grid-cols-3 gap-2.5">
            {[
              { n: talks, l: "聊过的事" },
              { n: records.length, l: "算过的卦" },
              { n: letgo.total, l: "放下的心事" },
            ].map((s) => (
              <Card key={s.l} className="py-3.5 text-center">
                <div className="font-song text-[22px] font-bold tabular-nums">{s.n}</div>
                <div className="mt-0.5 text-[11.5px] text-mute">{s.l}</div>
              </Card>
            ))}
          </div>

          {/* 算力 */}
          <SectionTitle>算力账本</SectionTitle>
          <Card className="p-5" onClick={() => useUI.getState().open("tip")}>
            <div className="flex items-baseline justify-between">
              <div>
                <span className="font-song text-[28px] font-bold tabular-nums">{fmt(total)}</span>
                <span className="ml-1 text-[12.5px] text-mute">算力</span>
              </div>
              <span className="text-[12px] text-mute">今日 {fmt(usage.day === dayKey() ? usage.today : 0)}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-ink-2">
              {items.map((it) => (
                <span key={it.name}>
                  {it.emoji} ≈ {it.qty} {it.unit}{it.name}
                </span>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-dashed border-line pt-3">
              <span className="text-[12.5px] text-mute">{merit.count ? `已随喜 ${merit.count} 次，谢谢你` : "陪你算了这么久，请掌柜喝杯茶？"}</span>
              <span className="flex items-center gap-1 text-[13px] text-seal">
                <Heart size={14} /> 随喜
              </span>
            </div>
          </Card>

          <Card className="mt-2.5 flex items-center gap-3.5 p-4" onClick={() => useUI.getState().open("lamp")}>
            <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${lit ? "bg-[#f6c76b]/25 text-[#c98a1f]" : "bg-black/[0.04] text-mute"}`}>
              <Flame size={20} className={lit ? "flame" : ""} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[14.5px] font-medium">{lit ? "长明灯亮着" : "点一盏长明灯"}</div>
              <div className="mt-0.5 text-[12px] text-mute">{lit ? "深度推演不限" : `深度推演今日还剩 ${left} 次`}</div>
            </div>
            <ChevronRight size={18} className="shrink-0 text-faint" />
          </Card>

          {/* 档案 */}
          <SectionTitle>推演档案</SectionTitle>
          {records.length > 0 && (
            <div className="no-scrollbar -mx-4 mb-2.5 flex gap-1.5 overflow-x-auto px-4">
              {(["all", "coins", "tarot", "bazi", "kline"] as const).map((k) => (
                <button key={k} onClick={() => setFilter(k)} className={`h-7 shrink-0 rounded-full px-3 text-[12px] transition ${filter === k ? "bg-ink text-paper" : "bg-black/[0.04] text-ink-2"}`}>
                  {k === "all" ? "全部" : KIND[k].n}
                </button>
              ))}
            </div>
          )}
          {list.length === 0 ? (
            <Card className="px-6 py-8 text-center text-[13px] leading-relaxed text-mute">
              {records.length ? "这一类还没有记录" : "摇过的卦、抽过的牌，都会收在这里。"}
            </Card>
          ) : (
            <div className="space-y-2">
              {list.slice(0, 30).map((r) => (
                <Card key={r.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-[18px]">{KIND[r.kind].e}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px]">{r.title}</div>
                    <div className="truncate text-[11.5px] text-mute">{r.summary} · {timeAgo(r.createdAt)}</div>
                  </div>
                  <button onClick={() => bringToChat(r.text)} aria-label="带去聊聊" className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-2 active:bg-black/5">
                    <MessageCircle size={15} />
                  </button>
                  <button onClick={() => useApp.getState().removeRecord(r.id)} aria-label="删除" className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-faint active:bg-black/5">
                    <Trash2 size={14} />
                  </button>
                </Card>
              ))}
            </div>
          )}

          {/* 底部 */}
          <div className="mt-10 flex flex-col items-center text-center">
            <Logo size={34} className="text-ink/70" />
            <div className="mt-2 font-song text-[13px] tracking-[0.2em] text-ink-2">算一算，然后，算了。</div>
            <button
              onClick={() => {
                if (confirmReset) {
                  useApp.getState().resetAll();
                  setConfirmReset(false);
                  useUI.getState().toast("都算了，重新开始");
                } else {
                  setConfirmReset(true);
                  setTimeout(() => setConfirmReset(false), 3000);
                }
              }}
              className={`mt-6 h-9 rounded-full px-4 text-[12.5px] transition ${confirmReset ? "bg-seal text-white" : "text-faint"}`}
            >
              {confirmReset ? "再点一次，清空所有记录" : "清空所有记录"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
