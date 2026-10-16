"use client";

import { useState } from "react";
import { SHICHEN, todayAlmanac, WX_COLOR, WX_ORDER, type BaziResult, parseBirth } from "@/lib/divination";

export function BaziChart({ b, compact = false }: { b: BaziResult; compact?: boolean }) {
  const age = new Date().getFullYear() - (b.dayun[0] ? b.dayun[0].startYear - b.dayun[0].startAge : new Date().getFullYear());
  const max = Math.max(1, ...WX_ORDER.map((k) => b.wuxing[k]));
  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-mute">
        <span>{b.lunarText}</span>
        <span>属{b.shengxiao}</span>
        <span>{b.zodiac}</span>
        {!b.hourKnown && <span>时辰不详</span>}
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {b.pillars.map((p) => {
          const day = p.label === "日柱";
          return (
            <div key={p.label} className={`flex flex-col items-center rounded-2xl py-2.5 ${day ? "bg-ink/[0.05] ring-1 ring-ink/10" : "bg-paper-2/70"}`}>
              <span className="text-[11px] text-mute">{p.label}</span>
              <span className={`mt-1 text-[11px] ${day ? "font-semibold text-seal" : "text-ink-2"}`}>{p.shishen || "—"}</span>
              {p.gz ? (
                <>
                  <span className="mt-1 font-song text-[24px] font-bold leading-none" style={{ color: WX_COLOR[p.wx.charAt(0)] }}>
                    {p.gan}
                  </span>
                  <span className="mt-1.5 font-song text-[24px] font-bold leading-none" style={{ color: WX_COLOR[p.wx.charAt(1)] }}>
                    {p.zhi}
                  </span>
                </>
              ) : (
                <span className="my-[13px] font-song text-[22px] leading-[2.2] text-faint">?</span>
              )}
              {!compact && <span className="mt-1.5 text-[10px] text-mute">{p.nayin || " "}</span>}
            </div>
          );
        })}
      </div>
      <div className="mt-4 space-y-1.5">
        {WX_ORDER.map((k) => (
          <div key={k} className="flex items-center gap-2.5">
            <span className="w-4 text-center font-song text-[13px] font-bold" style={{ color: WX_COLOR[k] }}>
              {k}
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink/[0.06]">
              <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${(b.wuxing[k] / max) * 100}%`, background: WX_COLOR[k] }} />
            </div>
            <span className="w-4 text-right text-[12px] tabular-nums text-mute">{b.wuxing[k]}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[13px] leading-relaxed text-ink-2">
        日主 <b className="font-song">{b.dayMaster}</b>（{b.dayMasterWx}）。{b.strongest}气最足，{b.weakest}气偏弱——多的那股是天赋也是执念，少的那股向外借。
      </p>
      {!compact && b.dayun.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 text-[12px] text-mute">大运 · 十年一步</div>
          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {b.dayun.map((d, i) => {
              const next = b.dayun[i + 1];
              const cur = age >= d.startAge && (!next || age < next.startAge);
              return (
                <div key={d.gz + d.startAge} className={`flex w-[58px] shrink-0 flex-col items-center rounded-xl py-2 ${cur ? "bg-ink text-on-ink" : "bg-paper-2/70"}`}>
                  <span className="font-song text-[15px] font-bold">{d.gz}</span>
                  <span className={`mt-0.5 text-[10.5px] ${cur ? "text-on-ink/75" : "text-mute"}`}>{d.startAge}岁</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function BirthForm({ initialBirth, initialGender, onSave, cta = "排盘" }: { initialBirth?: string; initialGender?: string; onSave: (birth: string, gender: string) => void; cta?: string }) {
  const p = parseBirth(initialBirth);
  const pad = (n: number) => String(n).padStart(2, "0");
  const [date, setDate] = useState(p ? `${p.y}-${pad(p.m)}-${pad(p.d)}` : "");
  const [hour, setHour] = useState<string>(p?.hourKnown ? String(p.h % 2 === 0 ? p.h : (p.h + 1) % 24) : "");
  const [gender, setGender] = useState(initialGender === "男" ? "男" : initialGender === "女" ? "女" : "");
  const ok = /^\d{4}-\d{2}-\d{2}$/.test(date) && !!gender;
  return (
    <div className="space-y-3">
      <label className="block">
        <span className="mb-1.5 block text-[12.5px] text-mute">阳历生日</span>
        <input type="date" value={date} min="1920-01-01" max="2030-12-31" onChange={(e) => setDate(e.target.value)} className="h-11 w-full rounded-xl border border-line bg-card px-3 text-ink outline-none focus:border-ink/40" />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[12.5px] text-mute">出生时辰</span>
        <select value={hour} onChange={(e) => setHour(e.target.value)} className="h-11 w-full appearance-none rounded-xl border border-line bg-card px-3 text-ink outline-none focus:border-ink/40">
          <option value="">不记得了（按午时）</option>
          {SHICHEN.map((s) => (
            <option key={s.label} value={String(s.hour)}>
              {s.label} · {s.range}
            </option>
          ))}
        </select>
      </label>
      <div>
        <span className="mb-1.5 block text-[12.5px] text-mute">性别（大运顺逆要用）</span>
        <div className="grid grid-cols-2 gap-2">
          {["女", "男"].map((g) => (
            <button key={g} type="button" onClick={() => setGender(g)} className={`h-11 rounded-xl border text-[15px] transition active:scale-[0.98] ${gender === g ? "border-ink bg-ink text-on-ink" : "border-line bg-card text-ink-2"}`}>
              {g}
            </button>
          ))}
        </div>
      </div>
      <button
        type="button"
        disabled={!ok}
        onClick={() => onSave(hour ? `${date} ${pad(Number(hour) === 0 ? 0 : Number(hour))}:00` : date, gender)}
        className="h-12 w-full rounded-2xl bg-ink text-[15px] font-medium tracking-[0.1em] text-on-ink transition active:scale-[0.98] disabled:opacity-35"
      >
        {cta}
      </button>
      <p className="text-center text-[11.5px] text-mute">生辰只保存在这台设备上</p>
    </div>
  );
}

export function AlmanacCard({ compact = false }: { compact?: boolean }) {
  const [a] = useState(() => todayAlmanac());
  return (
    <div className="overflow-hidden rounded-[22px] border border-line bg-card/85 shadow-[0_2px_14px_rgba(60,40,10,0.04)]">
      <div className="flex items-stretch">
        <div className="flex w-[34%] shrink-0 flex-col items-center justify-center border-r border-line py-4">
          <span className="text-[11.5px] text-mute">{a.weekday}</span>
          <span className="mt-1 font-song text-[30px] font-bold leading-none">{a.dateText.replace(/^\d+月/, "")}</span>
          <span className="mt-1.5 text-[12px] text-ink-2">{a.dateText.match(/^\d+月/)?.[0]}</span>
        </div>
        <div className="min-w-0 flex-1 px-4 py-3.5">
          <div className="font-song text-[16px] font-bold">农历{a.lunarText}</div>
          <div className="mt-0.5 truncate text-[11.5px] text-mute">{a.ganzhi}</div>
          <div className="mt-2.5 flex items-start gap-2 text-[13px]">
            <span className="mt-px grid h-5 w-5 shrink-0 place-items-center rounded-md bg-sage/15 text-[11px] font-bold text-sage">宜</span>
            <span className="text-ink-2 [word-break:keep-all]">{a.yi.slice(0, compact ? 3 : 5).join(" · ") || "诸事随心"}</span>
          </div>
          <div className="mt-1.5 flex items-start gap-2 text-[13px]">
            <span className="mt-px grid h-5 w-5 shrink-0 place-items-center rounded-md bg-seal/12 text-[11px] font-bold text-seal">忌</span>
            <span className="text-ink-2 [word-break:keep-all]">{a.ji.slice(0, compact ? 3 : 5).join(" · ") || "无甚禁忌"}</span>
          </div>
        </div>
      </div>
      {!compact && (
        <div className="grid grid-cols-2 border-t border-line text-[12.5px]">
          <div className="flex items-center gap-2 border-r border-line px-4 py-3">
            <span className="h-4 w-4 shrink-0 rounded-full ring-1 ring-ink/10" style={{ background: a.color.hex }} />
            <span className="text-ink-2">幸运色 · {a.color.name}</span>
          </div>
          <div className="truncate px-4 py-3 text-ink-2">
            冲{a.chong} · 煞{a.sha}
          </div>
        </div>
      )}
      <div className="border-t border-line bg-paper-2/60 px-4 py-3">
        <div className="text-[12px] text-mute">今日小确定</div>
        <div className="mt-0.5 text-[14px] text-ink">{a.small}</div>
        {!compact && <div className="mt-2 font-song text-[14px] text-ink-2">「{a.line}」</div>}
      </div>
    </div>
  );
}
