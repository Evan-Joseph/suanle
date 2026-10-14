"use client";

import { useState } from "react";
import type { User } from "./App";
import { buzz } from "./App";

export type Conv = { id: string; title: string | null; category: string | null; updatedAt: string };

const CATS = ["全部", "工作", "感情", "钱", "家人", "自己", "闲聊"];

function when(s: string) {
  const d = new Date(s), now = new Date();
  const days = Math.floor((now.setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) / 86400e3);
  return days <= 0 ? "今天" : days === 1 ? "昨天" : days < 7 ? "这周" : "更早";
}

export default function Drawer(p: {
  user: User; convs: Conv[]; current: string | null; onClose: () => void; onOpen: (id: string) => void; onNew: () => void;
  onProfile: () => void; onUpgrade: () => void; onChanged: () => void; onDeleted: (id: string) => void;
}) {
  const [cat, setCat] = useState("全部");
  const [menu, setMenu] = useState<string | null>(null);
  const list = p.convs.filter((c) => cat === "全部" || c.category === cat);
  const groups: Record<string, Conv[]> = {};
  list.forEach((c) => (groups[when(c.updatedAt)] ||= []).push(c));

  const rename = async (c: Conv) => {
    const t = prompt("给这局起个名字", c.title || "");
    setMenu(null);
    if (!t?.trim()) return;
    await fetch(`/api/conversations/${c.id}`, { method: "PATCH", body: JSON.stringify({ uid: p.user.id, title: t.trim() }) });
    p.onChanged();
  };
  const del = async (c: Conv) => {
    setMenu(null);
    if (!confirm("把这页草稿丢进纸篓？")) return;
    buzz(15);
    await fetch(`/api/conversations/${c.id}?uid=${p.user.id}`, { method: "DELETE" });
    p.onDeleted(c.id);
  };

  return (
    <div className="fixed inset-0 z-40">
      <div className="fade absolute inset-0 bg-ink/30" onClick={p.onClose} />
      <aside className="drawer pt-safe pb-safe absolute inset-y-0 left-0 flex w-[84%] max-w-[340px] flex-col bg-paper shadow-2xl">
        <div className="flex items-center gap-3 px-5 pb-3 pt-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" className="h-9 w-9 rounded-xl" />
          <div>
            <div className="font-serif text-[18px] font-bold leading-tight">算了</div>
            <div className="text-[11.5px] text-ink3">算一算，然后，算了。</div>
          </div>
        </div>
        <div className="px-4">
          <button onClick={p.onNew} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-ink py-3 text-[14.5px] text-paper active:scale-[.98]">＋ 开一局新的</button>
        </div>
        <div className="scroll-soft mt-3 flex gap-1.5 overflow-x-auto px-4 pb-1">
          {CATS.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`shrink-0 rounded-full px-3 py-1 text-[12.5px] transition ${cat === c ? "bg-ink/85 text-paper" : "bg-paper2 text-ink2"}`}>{c}</button>
          ))}
        </div>
        <div className="scroll-soft mt-2 flex-1 overflow-y-auto px-2">
          {list.length === 0 && <div className="px-4 py-14 text-center text-[13px] leading-6 text-ink3">还没有心事落在这儿。<br />聊过的每一局，都会安静地放在这里。</div>}
          {Object.entries(groups).map(([g, cs]) => (
            <div key={g} className="mb-2">
              <div className="px-3 pb-1 pt-3 text-[11.5px] text-ink3">{g}</div>
              {cs.map((c) => (
                <div key={c.id} className={`group relative flex items-center rounded-xl ${p.current === c.id ? "bg-paper2" : ""}`}>
                  <button onClick={() => p.onOpen(c.id)} className="min-w-0 flex-1 px-3 py-2.5 text-left">
                    <div className="truncate text-[14.5px]">{c.title || "正在起名…"}</div>
                    {c.category && <div className="mt-0.5 text-[11px] text-ink3">{c.category}</div>}
                  </button>
                  <button aria-label="更多" onClick={() => setMenu(menu === c.id ? null : c.id)} className="h-10 w-10 shrink-0 text-ink3">···</button>
                  {menu === c.id && (
                    <div className="fade absolute right-2 top-11 z-10 w-32 overflow-hidden rounded-xl bg-white text-[14px] shadow-xl">
                      <button onClick={() => rename(c)} className="block w-full px-4 py-2.5 text-left active:bg-paper">重命名</button>
                      <button onClick={() => del(c)} className="block w-full px-4 py-2.5 text-left text-clay active:bg-paper">丢进纸篓</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="border-t border-ink/5 px-4 pt-3">
          {!p.user.member && (
            <button onClick={p.onUpgrade} className="mb-2 w-full rounded-2xl bg-gradient-to-br from-[#efe2cf] to-[#e6d3bb] p-3.5 text-left active:scale-[.98]">
              <div className="text-[14px] font-semibold text-ink">松弛卡 · 聊到天亮</div>
              <div className="mt-0.5 text-[12px] text-ink2">无限畅聊、深度复盘、年度全景，首月 ¥28</div>
            </button>
          )}
          <button onClick={p.onProfile} className="flex w-full items-center gap-3 rounded-xl px-2 py-2 active:bg-paper2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-paper2 font-serif text-[15px]">{(p.user.nickname || "友")[0]}</div>
            <div className="min-w-0 flex-1 text-left">
              <div className="truncate text-[14px]">{p.user.nickname || "无名客人"}</div>
              <div className="text-[11.5px] text-ink3">{p.user.member ? `松弛会员 · ${new Date(p.user.planExpires!).toLocaleDateString("zh-CN")} 到期` : `深谈券 ${p.user.credits} 张`}</div>
            </div>
            <span className="text-ink3">›</span>
          </button>
        </div>
      </aside>
    </div>
  );
}
