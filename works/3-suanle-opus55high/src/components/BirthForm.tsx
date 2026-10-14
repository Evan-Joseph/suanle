"use client";

import { useState } from "react";
import { Pill } from "./ui";

export const SHICHEN = [
  { label: "不知道", value: -1 },
  { label: "子时 23-1点", value: 0 },
  { label: "丑时 1-3点", value: 2 },
  { label: "寅时 3-5点", value: 4 },
  { label: "卯时 5-7点", value: 6 },
  { label: "辰时 7-9点", value: 8 },
  { label: "巳时 9-11点", value: 10 },
  { label: "午时 11-13点", value: 12 },
  { label: "未时 13-15点", value: 14 },
  { label: "申时 15-17点", value: 16 },
  { label: "酉时 17-19点", value: 18 },
  { label: "戌时 19-21点", value: 20 },
  { label: "亥时 21-23点", value: 22 },
];

export default function BirthForm({
  initial,
  submitLabel = "排盘",
  onSubmit,
}: {
  initial?: { birthday?: string; birthHour?: number | null; gender?: string };
  submitLabel?: string;
  onSubmit: (v: { birthday: string; birthHour: number | null; gender?: string }) => void;
}) {
  const [birthday, setBirthday] = useState(initial?.birthday ?? "");
  const [hour, setHour] = useState<number>(initial?.birthHour ?? -1);
  const [gender, setGender] = useState<string | undefined>(initial?.gender);
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(birthday) && Number(birthday.slice(0, 4)) >= 1920 && new Date(birthday) <= new Date();

  return (
    <div className="space-y-5">
      <div>
        <label className="mb-1.5 block text-[12.5px] text-sub">公历生日</label>
        <input type="date" value={birthday} min="1920-01-01" max={new Date().toISOString().slice(0, 10)} onChange={(e) => setBirthday(e.target.value)} className="w-full appearance-none rounded-2xl border border-line bg-white px-4 py-3 text-[16px] text-ink outline-none focus:border-faint" />
      </div>
      <div>
        <label className="mb-1.5 block text-[12.5px] text-sub">出生时辰 <span className="text-faint">（不知道也能排，只是少一柱）</span></label>
        <select value={hour} onChange={(e) => setHour(Number(e.target.value))} className="w-full appearance-none rounded-2xl border border-line bg-white px-4 py-3 text-[16px] text-ink outline-none focus:border-faint">
          {SHICHEN.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-[12.5px] text-sub">性别 <span className="text-faint">（可不选）</span></label>
        <div className="flex gap-2">
          {["女", "男", "不说"].map((g) => <Pill key={g} active={gender === g} onClick={() => setGender(g)}>{g}</Pill>)}
        </div>
      </div>
      <button disabled={!valid} onClick={() => onSubmit({ birthday, birthHour: hour < 0 ? null : hour, gender: gender === "不说" ? undefined : gender })} className="w-full rounded-full bg-ink py-3.5 text-[15px] text-paper transition active:scale-[0.98] disabled:opacity-40">
        {submitLabel}
      </button>
      <p className="text-center text-[11.5px] leading-relaxed text-faint">生日只用来排盘，存在你自己的档案里。<br />节气交接那几天出生的，月柱可能要再细看。</p>
    </div>
  );
}
