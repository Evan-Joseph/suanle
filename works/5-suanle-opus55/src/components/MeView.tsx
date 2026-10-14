"use client";
import { ChevronRight, Download, ExternalLink, Heart, Trash2, Volume2, VolumeX } from "lucide-react";
import { useState } from "react";
import { useApp, dayKey } from "@/lib/store";
import { analogize, DAILY_FREE, fmt } from "@/lib/analogy";
import { computeBazi } from "@/lib/divination";
import { emptyProfile, type Profile } from "@/lib/types";
import { setMuted, sfx } from "@/lib/sound";
import { Logo, Sheet, useToast } from "./ui";

export default function MeView({ onTip }: { onTip: () => void }) {
  const { state, set } = useApp();
  const toast = useToast();
  const [edit, setEdit] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [now] = useState(() => Date.now());
  const p = state.profile;
  const bz = p.birthDate ? computeBazi(p.birthDate, p.birthTime) : null;
  const member = state.support.memberUntil > now;
  const today = state.usage.byDay[dayKey()] || 0;
  const chats = state.sessions.filter((s) => s.messages.length > 1).length;
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now - (6 - i) * 86400000);
    return { d, v: state.usage.byDay[dayKey(d)] || 0 };
  });
  const max = Math.max(1, ...last7.map((x) => x.v));

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `suanle-${dayKey()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 pb-8 safe-t">
        {/* profile */}
        <button onClick={() => setEdit(true)} className="w-full mt-6 flex items-center gap-4 text-left">
          <div className={`w-16 h-16 rounded-full bg-paper-2 border-2 ${member ? "border-gold" : "border-paper-3"} flex items-center justify-center text-ink`}><Logo size={38} blink /></div>
          <div className="flex-1 min-w-0">
            <div className="font-serif text-[22px] font-bold truncate">{p.name || "还没取名的朋友"}</div>
            <div className="text-[12px] text-ink-3 mt-0.5 truncate">
              {bz ? `${bz.dayMaster}${bz.dayEl}日主 · 属${bz.zodiac} · ${bz.sign}` : "聊着聊着，算了就会慢慢认识你"}
            </div>
            {member && <div className="mt-1 inline-block text-[10px] rounded-full bg-gold/15 text-gold px-2 py-0.5">常客 · 至 {new Date(state.support.memberUntil).toLocaleDateString("zh-CN")}</div>}
          </div>
          <ChevronRight size={18} className="text-ink-3" />
        </button>

        {p.concerns.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            <span className="text-[11px] text-ink-3 mr-1 py-1">最近挂心</span>
            {p.concerns.map((c) => <span key={c} className="rounded-full bg-paper-2 px-2.5 py-1 text-[11px] text-ink-2">{c}</span>)}
          </div>
        )}

        {/* stats */}
        <div className="grid grid-cols-3 gap-2 mt-5">
          {[["聊过", chats, "次"], ["推演", state.records.filter((r) => r.kind !== "letgo").length, "回"], ["放下", state.letgo, "件"]].map(([k, v, u]) => (
            <div key={k as string} className="rounded-3xl bg-paper-2/70 py-3.5 text-center">
              <div className="font-serif text-2xl font-bold">{v as number}<span className="text-[11px] font-normal text-ink-3 ml-0.5">{u as string}</span></div>
              <div className="text-[11px] text-ink-3 mt-0.5">{k as string}</div>
            </div>
          ))}
        </div>

        {/* usage */}
        <div className="mt-3 rounded-[26px] bg-paper-2/70 p-5">
          <div className="flex items-baseline justify-between">
            <div className="text-[12px] text-ink-3">累计算力</div>
            <div className="text-[11px] text-ink-3">今天 {fmt(today)}{member ? "" : ` / 建议 ${fmt(DAILY_FREE)}`}</div>
          </div>
          <div className="font-serif text-[30px] font-bold mt-1">{fmt(state.usage.total)}</div>
          <div className="text-[13px] text-ink-2 mt-0.5">{state.usage.total ? `≈ ${analogize(state.usage.total, p, "me-total", 2)}` : "还没开始呢，先去聊两句？"}</div>
          <div className="flex items-end gap-1.5 h-16 mt-4">
            {last7.map(({ d, v }) => (
              <div key={d.toDateString()} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t-md bg-ink/80 transition-all" style={{ height: `${Math.max(3, (v / max) * 48)}px`, opacity: v ? 1 : 0.15 }} />
                <div className="text-[9px] text-ink-3">{"日一二三四五六"[d.getDay()]}</div>
              </div>
            ))}
          </div>
          <button onClick={onTip} className="mt-4 w-full rounded-full bg-cinnabar text-paper py-2.5 text-[14px] inline-flex items-center justify-center gap-1.5 active:scale-[0.98] transition">
            <Heart size={14} fill="currentColor" />{state.support.count ? `再请一杯（已随喜 ${state.support.count} 次）` : "请算了喝杯热的"}
          </button>
        </div>

        {/* settings */}
        <div className="mt-5 rounded-[26px] bg-paper-2/70 divide-y divide-paper-3/70 overflow-hidden">
          <Row icon={state.muted ? <VolumeX size={16} /> : <Volume2 size={16} />} label="仪式音效" right={state.muted ? "关" : "开"}
            onClick={() => { const m = !state.muted; setMuted(m); set((s) => ({ ...s, muted: m })); if (!m) sfx.chime(); }} />
          <Row icon={<Download size={16} />} label="把我的记录带走" right="JSON" onClick={exportData} />
          <Row icon={<Trash2 size={16} />} label={confirmClear ? "真的全部算了？再点一次" : "清空所有记录"} danger={confirmClear}
            onClick={() => {
              if (!confirmClear) { setConfirmClear(true); setTimeout(() => setConfirmClear(false), 3000); return; }
              set((s) => ({ ...s, profile: { ...emptyProfile }, sessions: [], activeId: null, records: [], usage: { total: 0, byDay: {} }, letgo: 0 }));
              setTimeout(() => location.reload(), 100);
            }} />
        </div>
        <a href="https://github.com/Evan-Joseph/suanle" target="_blank" rel="noreferrer" className="mt-3 flex items-center gap-3 rounded-[26px] bg-paper-2/70 px-5 py-4">
          <Logo size={22} className="text-ink" />
          <div className="flex-1"><div className="text-[14px]">关于算了</div><div className="text-[11px] text-ink-3">算一算，然后，算了。</div></div>
          <ExternalLink size={14} className="text-ink-3" />
        </a>
        <p className="text-center text-[11px] text-ink-3 mt-6 leading-relaxed">你的聊天和档案只存在这台设备上。<br />占算是镜子，不是判决书。</p>
      </div>
      <ProfileSheet open={edit} onClose={() => setEdit(false)} onSave={(np) => { set((s) => ({ ...s, profile: np })); setEdit(false); toast("记下了"); }} profile={p} />
    </div>
  );
}

function Row({ icon, label, right, onClick, danger }: { icon: React.ReactNode; label: string; right?: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-5 py-3.5 text-left active:bg-paper-3/40 ${danger ? "text-cinnabar" : ""}`}>
      <span className="text-ink-2">{icon}</span>
      <span className="flex-1 text-[14px]">{label}</span>
      {right && <span className="text-[12px] text-ink-3">{right}</span>}
    </button>
  );
}

function ProfileSheet({ open, onClose, onSave, profile }: { open: boolean; onClose: () => void; onSave: (p: Profile) => void; profile: Profile }) {
  const [f, setF] = useState<Profile>(profile);
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) { setPrevOpen(open); if (open) setF(profile); }
  const field = "mt-1 w-full rounded-2xl bg-paper-2 px-4 py-2.5 outline-none border border-paper-3 min-h-[44px] text-[15px]";
  return (
    <Sheet open={open} onClose={onClose} title="让算了更懂你">
      <div className="space-y-3 pb-4">
        <label className="block"><span className="text-xs text-ink-3">怎么称呼你</span><input className={field} value={f.name} maxLength={12} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="小名、外号都行" /></label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block"><span className="text-xs text-ink-3">公历生日</span><input type="date" className={field} value={f.birthDate} onChange={(e) => setF({ ...f, birthDate: e.target.value })} /></label>
          <label className="block"><span className="text-xs text-ink-3">出生时间</span><input type="time" className={field} value={f.birthTime} onChange={(e) => setF({ ...f, birthTime: e.target.value })} /></label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="block"><span className="text-xs text-ink-3">性别</span>
            <select className={field} value={f.gender} onChange={(e) => setF({ ...f, gender: e.target.value })}><option value="">不说也行</option><option>女</option><option>男</option><option>其他</option></select>
          </label>
          <label className="block"><span className="text-xs text-ink-3">所在城市</span><input className={field} value={f.city} maxLength={12} onChange={(e) => setF({ ...f, city: e.target.value })} /></label>
        </div>
        <label className="block"><span className="text-xs text-ink-3">喜欢的小东西</span><input className={field} value={f.likes} maxLength={30} onChange={(e) => setF({ ...f, likes: e.target.value })} placeholder="拿铁、猫、烤红薯……" /></label>
        <label className="block"><span className="text-xs text-ink-3">想让算了记住的事</span><textarea className={`${field} resize-none`} rows={2} value={f.notes} maxLength={60} onChange={(e) => setF({ ...f, notes: e.target.value })} /></label>
        <button onClick={() => onSave(f)} className="w-full rounded-full bg-ink text-paper py-3 text-[15px] mt-2">记下了</button>
      </div>
    </Sheet>
  );
}
