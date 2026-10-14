"use client";

import { useState } from "react";
import type { User } from "./App";

export default function Profile({ user, onClose, onSave, onUpgrade, onRestart }: {
  user: User; onClose: () => void; onSave: (p: Partial<User>) => Promise<void>; onUpgrade: () => void; onRestart: () => void;
}) {
  const [nickname, setN] = useState(user.nickname || "");
  const [birth, setB] = useState(user.birth || "");
  const [concern, setC] = useState(user.concern || "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await onSave({ nickname: nickname || null, birth: birth || null, concern: concern || null });
    setSaving(false);
    onClose();
  };

  const field = (label: string, v: string, set: (s: string) => void, ph: string) => (
    <label className="block border-b border-ink/5 py-3">
      <div className="text-[12px] text-ink3">{label}</div>
      <input value={v} onChange={(e) => set(e.target.value)} placeholder={ph} maxLength={40} className="mt-1 w-full bg-transparent text-[16px] outline-none placeholder:text-ink3/70" />
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="fade absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className="sheet pb-safe relative w-full max-w-[640px] rounded-t-[28px] bg-paper px-5 pt-3">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-ink/15" />
        <div className="font-serif text-[21px] font-bold">老算记得的你</div>
        <p className="mt-1 text-[13px] text-ink2">这些只用来让聊天更懂你，随时可以改。</p>

        <div className={`mt-4 rounded-2xl p-4 ${user.member ? "bg-ink text-paper" : "bg-paper2"}`}>
          {user.member ? (
            <>
              <div className="text-[15px] font-semibold">{user.plan === "quarter" ? "季度 · 无忧卡" : "月度 · 松弛卡"}</div>
              <div className="mt-1 text-[12.5px] opacity-70">{new Date(user.planExpires!).toLocaleDateString("zh-CN")} 到期 · 畅聊与深谈不限次</div>
            </>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[15px] font-semibold">普通座位</div>
                <div className="mt-1 text-[12.5px] text-ink2">今日剩 {user.freeLeft} 句 · 深谈券 {user.credits} 张</div>
              </div>
              <button onClick={onUpgrade} className="rounded-full bg-ink px-4 py-2 text-[13px] text-paper">升级</button>
            </div>
          )}
        </div>

        <div className="mt-2">
          {field("怎么称呼你", nickname, setN, "随便起个名字")}
          {field("生日 / 出生时间", birth, setB, "如 1998-05-20 晚上")}
          {field("最近挂心的事", concern, setC, "工作、感情、或者说不上来")}
        </div>
        <button onClick={save} disabled={saving} className="mt-5 h-12 w-full rounded-2xl bg-ink text-[15px] text-paper active:scale-[.98] disabled:opacity-60">{saving ? "记着呢…" : "就这样"}</button>
        <button onClick={onRestart} className="mb-2 mt-1 w-full py-3 text-[13px] text-ink3">重新认识一次</button>
      </div>
    </div>
  );
}
