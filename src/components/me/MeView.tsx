"use client";

import { useState } from "react";
import { useApp, useUI, lampActive, deepLeft } from "@/lib/store";
import { computeBazi } from "@/lib/divination";
import { fmt } from "@/lib/meter";
import { Icon, Logo } from "../ui";
import { AnalogyView, useAnalogy } from "../sheets/TipSheet";

function Stat({ n, label }: { n: string | number; label: string }) {
  return (
    <div className="flex-1 text-center">
      <div className="font-song text-[22px] font-bold leading-tight">{n}</div>
      <div className="mt-0.5 text-[11.5px] text-mute">{label}</div>
    </div>
  );
}

function Row({ label, value, onClick, danger = false }: { label: string; value?: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} className="flex w-full items-center justify-between px-4 py-3.5 text-left transition active:bg-black/[0.03]">
      <span className={`text-[14.5px] ${danger ? "text-seal" : ""}`}>{label}</span>
      <span className="flex items-center gap-1 text-[13px] text-mute">
        {value}
        <Icon name="chev" size={15} />
      </span>
    </button>
  );
}

export default function MeView() {
  const profile = useApp((s) => s.profile);
  const sessions = useApp((s) => s.sessions);
  const letgo = useApp((s) => s.letgo);
  const usage = useApp((s) => s.usage.total);
  const merit = useApp((s) => s.merit);
  const lamp = useApp((s) => lampActive(s));
  const left = useApp((s) => deepLeft(s));
  const sound = useApp((s) => s.sound);
  const setProfile = useApp((s) => s.setProfile);
  const removeFact = useApp((s) => s.removeFact);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.name ?? "");
  const [confirmReset, setConfirmReset] = useState(false);
  const a = useAnalogy(usage, usage > 0);
  const bazi = computeBazi(profile.birth);
  const days = Math.max(1, Math.ceil((Date.now() - profile.firstSeen) / 86400000));
  const chatCount = sessions.filter((s) => s.messages.some((m) => !m.intro)).length;

  const exportData = () => {
    const raw = localStorage.getItem("suanle-v1") ?? "{}";
    const blob = new Blob([raw], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `suanle-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    useUI.getState().toast("已导出，好好收着");
  };

  return (
    <div className="no-scrollbar h-full overflow-y-auto">
      <div className="pt-safe px-4 pb-10">
        {/* 名片 */}
        <div className="mt-5 flex items-center gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-[22px] bg-ink text-paper shadow-md">
            <Logo size={40} blink />
          </div>
          <div className="min-w-0 flex-1">
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 12))}
                  className="min-w-0 flex-1 rounded-xl border border-line bg-white px-3 py-1.5 font-song text-[18px] outline-none"
                />
                <button
                  onClick={() => {
                    setProfile({ name: name.trim() || undefined });
                    setEditing(false);
                  }}
                  className="rounded-full bg-ink px-3 py-1.5 text-[13px] text-paper"
                >
                  好
                </button>
              </div>
            ) : (
              <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-left">
                <span className="font-song text-[22px] font-bold">{profile.name ?? "还没告诉它名字"}</span>
                <Icon name="chev" size={15} className="text-mute" />
              </button>
            )}
            <div className="mt-0.5 text-[12.5px] text-mute">
              和算了认识的第 {days} 天{bazi ? ` · 属${bazi.shengxiao} · ${bazi.zodiac}` : ""}
            </div>
          </div>
        </div>

        <div className="mt-5 flex rounded-3xl border border-line bg-white/70 py-4">
          <Stat n={chatCount} label="聊过的事" />
          <div className="w-px bg-line" />
          <Stat n={letgo.total} label="算了的事" />
          <div className="w-px bg-line" />
          <Stat n={usage >= 10000 ? `${(usage / 10000).toFixed(1)}万` : fmt(usage)} label="累计算力" />
        </div>

        {/* 算力拟物 */}
        {usage > 0 && (
          <div className="mt-4 rounded-3xl bg-paper-2 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="font-song text-[15px] font-bold">我们一起聊掉了</div>
              <button onClick={() => useUI.getState().open("tip")} className="rounded-full bg-ink px-3 py-1 text-[12px] text-paper active:scale-95">
                随喜一下
              </button>
            </div>
            <AnalogyView a={a} />
          </div>
        )}

        {/* 长明灯 */}
        <button
          onClick={() => useUI.getState().open("lamp")}
          className="relative mt-4 flex w-full items-center gap-3 overflow-hidden rounded-3xl bg-ink p-4 text-left text-paper active:scale-[0.99]"
        >
          <div className="absolute -right-6 -top-10 h-28 w-28 rounded-full bg-gold/30 blur-2xl" />
          <Icon name="lamp" size={26} className="text-gold" />
          <div className="flex-1">
            <div className="font-song text-[16px] font-bold">{lamp ? "长明灯 · 亮着" : "点一盏长明灯"}</div>
            <div className="text-[12px] text-paper/65">
              {lamp ? `至 ${new Date(merit.lampUntil).toLocaleDateString("zh-CN")} · 深度推演不限次` : `深度推演今日剩 ${left} 次 · 年度大盘`}
            </div>
          </div>
          <Icon name="chev" size={18} className="text-paper/60" />
        </button>

        {/* 它记得的 */}
        <div className="mt-6">
          <div className="flex items-end justify-between">
            <h2 className="font-song text-[17px] font-bold">它记得的你</h2>
            <span className="text-[11.5px] text-mute">聊着聊着就记住了，点 × 可以让它忘掉</span>
          </div>
          <div className="mt-3 rounded-3xl border border-line bg-white/70 p-4">
            <div className="grid grid-cols-2 gap-y-2 text-[13.5px]">
              <span className="text-mute">生辰</span>
              <span className="text-right">{profile.birth ?? "—"}</span>
              <span className="text-mute">性别</span>
              <span className="text-right">{profile.gender ?? "—"}</span>
              <span className="text-mute">城市</span>
              <span className="text-right">{profile.city ?? "—"}</span>
            </div>
            {profile.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {profile.tags.map((t) => (
                  <span key={t} className="rounded-full bg-paper-2 px-2.5 py-1 text-[12px] text-ink-2">
                    #{t}
                  </span>
                ))}
              </div>
            )}
            {profile.facts.length > 0 ? (
              <ul className="mt-3 space-y-1.5 border-t border-dashed border-line pt-3">
                {profile.facts.map((f, i) => (
                  <li key={f + i} className="flex items-start gap-2 text-[13.5px] leading-relaxed text-ink-2">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold" />
                    <span className="flex-1">{f}</span>
                    <button onClick={() => removeFact(i)} className="shrink-0 p-0.5 text-mute" aria-label="忘掉">
                      <Icon name="close" size={13} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 border-t border-dashed border-line pt-3 text-[12.5px] text-mute">还没记住什么。多聊几句，它会慢慢懂你。</p>
            )}
          </div>
        </div>

        {/* 设置 */}
        <div className="mt-6 divide-y divide-line overflow-hidden rounded-3xl border border-line bg-white/70">
          <Row label="音效" value={sound ? "开" : "关"} onClick={() => useApp.getState().toggleSound()} />
          <Row label="随喜记录" value={merit.count ? `${merit.count} 次 · ¥${(merit.cents / 100).toFixed(0)}` : "还没有"} onClick={() => useUI.getState().open("tip")} />
          <Row label="导出我的数据" onClick={exportData} />
          <Row
            label={confirmReset ? "真的全部清空？再点一次" : "清空所有记录"}
            danger
            onClick={() => {
              if (!confirmReset) {
                setConfirmReset(true);
                setTimeout(() => setConfirmReset(false), 3000);
                return;
              }
              useApp.getState().resetAll();
              setName("");
              setConfirmReset(false);
              useUI.getState().toast("都清空了。算了，重新开始。");
            }}
          />
        </div>

        <div className="mt-10 flex flex-col items-center text-center text-mute">
          <Logo size={34} />
          <div className="mt-2 font-song text-[14px] tracking-[0.3em] text-ink-2">算一算，然后，算了。</div>
          <div className="mt-1 text-[11px]">你的对话与命盘只保存在这台设备上</div>
          <a href="https://github.com/Evan-Joseph/suanle" target="_blank" rel="noreferrer" className="mt-2 text-[11px] underline underline-offset-2">
            github.com/Evan-Joseph/suanle
          </a>
        </div>
      </div>
    </div>
  );
}
