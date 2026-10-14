"use client";

import { useState } from "react";
import { computeBazi, todayAlmanac, type BaziResult } from "@/lib/divination";
import { Pill } from "../ui";

const WX_COLOR: Record<string, string> = { 木: "#7d9a6f", 火: "#c4553a", 土: "#c9a45c", 金: "#a9b4bd", 水: "#3f5a73" };
const WX_PLAIN: Record<string, string> = {
  木: "像一棵树，向上生长，有主见也有韧性",
  火: "像一盏灯，热情外放，感染力强",
  土: "像一块地，稳重可靠，能托住别人",
  金: "像一把刀，干脆利落，讲原则",
  水: "像一条河，聪明灵活，心思细腻",
};

export function BaziChart({ b }: { b: BaziResult }) {
  const max = Math.max(...Object.values(b.wuxing), 1);
  return (
    <div>
      <div className="grid grid-cols-4 gap-2">
        {b.pillars.map((p) => (
          <div key={p.label} className={`rounded-2xl border border-line bg-white/70 py-3 text-center ${p.label === "日柱" ? "ring-1 ring-seal/40" : ""}`}>
            <div className="text-[11px] text-mute">{p.label}</div>
            <div className="mt-1 font-song text-[22px] font-bold leading-tight tracking-wider" style={{ writingMode: "vertical-rl", margin: "4px auto 0", height: 52 }}>
              {p.gz}
            </div>
            <div className="mt-1 text-[11px] text-ink-2">{p.wx || "—"}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        {Object.entries(b.wuxing).map(([k, v]) => (
          <div key={k} className="flex items-center gap-3 text-[13px]">
            <span className="w-4 font-song font-bold" style={{ color: WX_COLOR[k] }}>
              {k}
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/5">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(v / max) * 100}%`, background: WX_COLOR[k] }} />
            </div>
            <span className="w-4 text-right text-mute">{v}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-2xl bg-paper-2 p-3.5 text-[13.5px] leading-relaxed text-ink-2">
        日主 <b className="font-song text-ink">{b.dayMaster}{b.dayMasterWx}</b>——{WX_PLAIN[b.dayMasterWx] ?? "自有一番气象"}。
        <div className="mt-1 text-[12.5px] text-mute">
          {b.lunarText} · 属{b.shengxiao} · {b.zodiac} · {b.nayin}
          {!b.hourKnown && " · 时辰不详"}
        </div>
      </div>
    </div>
  );
}

export function BirthForm({ onSave, initialGender }: { onSave: (birth: string, gender?: string) => void; initialGender?: string }) {
  const [date, setDate] = useState("1996-06-18");
  const [time, setTime] = useState("12:00");
  const [noTime, setNoTime] = useState(false);
  const [gender, setGender] = useState<string | undefined>(initialGender);
  const preview = computeBazi(noTime ? date : `${date} ${time}`);
  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-[12.5px] text-mute">出生日期（公历）</span>
        <input
          type="date"
          value={date}
          max="2030-12-31"
          min="1920-01-01"
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 block w-full rounded-xl border border-line bg-white px-3 py-2.5 text-ink outline-none focus:border-ink/40"
        />
      </label>
      <div className="flex items-end gap-3">
        <label className="block flex-1">
          <span className="text-[12.5px] text-mute">出生时间</span>
          <input
            type="time"
            value={time}
            disabled={noTime}
            onChange={(e) => setTime(e.target.value)}
            className="mt-1 block w-full rounded-xl border border-line bg-white px-3 py-2.5 text-ink outline-none disabled:opacity-40"
          />
        </label>
        <Pill active={noTime} onClick={() => setNoTime(!noTime)} className="mb-1">
          不记得了
        </Pill>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[12.5px] text-mute">性别</span>
        {["女", "男", "不说"].map((g) => (
          <Pill key={g} active={gender === g} onClick={() => setGender(g)}>
            {g}
          </Pill>
        ))}
      </div>
      {preview && (
        <div className="text-[12px] text-mute">
          预览：{preview.pillars.map((p) => p.gz).join(" ")} · 属{preview.shengxiao}
        </div>
      )}
      <button
        disabled={!preview}
        onClick={() => onSave(noTime ? date : `${date} ${time}`, gender && gender !== "不说" ? gender : undefined)}
        className="w-full rounded-2xl bg-ink py-3 text-[15px] text-paper transition active:scale-[0.98] disabled:opacity-40"
      >
        排盘
      </button>
      <p className="text-center text-[11.5px] text-mute">只存在你自己的手机里。</p>
    </div>
  );
}

export function AlmanacCard({ compact = false }: { compact?: boolean }) {
  const [a] = useState(() => todayAlmanac());
  return (
    <div className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-[#fffdf8] to-[#f4efe4] p-4">
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-25 blur-2xl" style={{ background: a.color.hex }} />
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[12px] tracking-widest text-mute">
            {a.weekday} · {a.jieqi ? `${a.jieqi}后` : "今日"}
          </div>
          <div className={`font-song font-bold ${compact ? "text-[24px]" : "text-[34px]"} leading-tight`}>{a.dateText}</div>
          <div className="text-[13px] text-ink-2">农历{a.lunarText}</div>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-mute">今日色</div>
          <div className="mt-1 flex items-center justify-end gap-1.5">
            <span className="h-4 w-4 rounded-full border border-black/10" style={{ background: a.color.hex }} />
            <span className="font-song text-[14px]">{a.color.name}</span>
          </div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[13px]">
        <div className="rounded-xl bg-white/70 px-3 py-2">
          <span className="mr-1.5 inline-grid h-5 w-5 place-items-center rounded-full bg-sage text-[11px] text-white">宜</span>
          <span className="text-ink-2">{a.yi.slice(0, compact ? 2 : 4).join(" ")}</span>
        </div>
        <div className="rounded-xl bg-white/70 px-3 py-2">
          <span className="mr-1.5 inline-grid h-5 w-5 place-items-center rounded-full bg-seal text-[11px] text-white">忌</span>
          <span className="text-ink-2">{a.ji.slice(0, compact ? 2 : 4).join(" ")}</span>
        </div>
      </div>
      <div className="mt-3 font-song text-[14.5px] text-ink">「{a.line}」</div>
      {!compact && <div className="mt-1 text-[11px] text-mute">{a.ganzhi}</div>}
    </div>
  );
}
