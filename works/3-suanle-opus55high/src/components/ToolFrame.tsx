"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { api, getUid } from "@/lib/client";

export function ToolFrame({ title, sub, children, right }: { title: string; sub?: string; children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center gap-2 px-3 pb-2" style={{ paddingTop: "calc(var(--safe-t) + 10px)" }}>
        <Link href="/tools" className="flex h-10 w-10 items-center justify-center rounded-full text-ink-2 active:bg-sand" aria-label="返回">
          <svg width="18" height="18" viewBox="0 0 18 18"><path d="M11 3L5 9l6 6" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        <div className="min-w-0 flex-1 text-center">
          <div className="truncate font-serif text-[17px] text-ink">{title}</div>
          {sub && <div className="truncate text-[11px] text-sub">{sub}</div>}
        </div>
        <div className="flex w-10 justify-end">{right}</div>
      </header>
      <div className="scroll-area min-h-0 flex-1 px-4 pb-10">{children}</div>
    </div>
  );
}

export const KIND_LABEL: Record<string, string> = { hexagram: "卦", tarot: "牌", bazi: "命盘", kline: "人生图" };

/** 保存一次推演到档案；离线时返回本地 id */
export async function saveReading(body: { kind: string; title: string; question?: string; data: unknown }) {
  try {
    const r = await api<{ reading: { id: string; unlocked: boolean; interpretation: string | null } }>("/api/readings", { body: { userId: getUid(), ...body } });
    return r.reading;
  } catch {
    return { id: "local_" + Date.now(), unlocked: false, interpretation: null };
  }
}

export function PinButton({ id, pinned, onChange }: { id: string | null; pinned: boolean; onChange: (p: boolean) => void }) {
  if (!id || id.startsWith("local_")) return null;
  return (
    <button
      onClick={async () => {
        onChange(!pinned);
        await api(`/api/readings/${id}`, { method: "PATCH", body: { userId: getUid(), pinned: !pinned } }).catch(() => onChange(pinned));
      }}
      className={`rounded-full border px-4 py-2 text-[13px] active:scale-95 ${pinned ? "border-clay/30 bg-clay-soft text-clay" : "border-line bg-white text-ink-2"}`}
    >
      {pinned ? "已归档" : "归档到我的档案"}
    </button>
  );
}
