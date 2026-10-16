"use client";

import { useEffect, useState } from "react";
import { BRANCH_POS, PALACE_HINT, surroundIndices, type ZiweiChart, type ZPalace } from "@/lib/ziwei-core";

/** 按需加载排盘库，避免拖慢首屏；支持真太阳时城市校准 */
export function useZiwei(birth?: string, gender?: string, city?: string): ZiweiChart | null | undefined {
  const key = birth ? `${birth}|${gender ?? ""}|${city ?? ""}` : "";
  const [state, setState] = useState<{ key: string; chart: ZiweiChart | null } | null>(null);
  useEffect(() => {
    if (!key) return;
    let alive = true;
    import("@/lib/ziwei")
      .then((m) => {
        if (alive) setState({ key, chart: m.computeZiwei(birth, gender, city) });
      })
      .catch(() => {
        if (alive) setState({ key, chart: null });
      });
    return () => {
      alive = false;
    };
  }, [key, birth, gender, city]);
  if (!key) return null;
  return state?.key === key ? state.chart : undefined;
}

const MUTAGEN_COLOR: Record<string, string> = { 禄: "#6f8f5e", 权: "#a9844a", 科: "#5a7186", 忌: "#c4553a" };

function Cell({ p, selected, related, onClick }: { p: ZPalace; selected: boolean; related: boolean; onClick: () => void }) {
  const [row, col] = BRANCH_POS[p.branch] ?? [0, 0];
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ gridRow: row + 1, gridColumn: col + 1 }}
      className={`relative flex min-h-[96px] min-w-0 flex-col justify-between rounded-[10px] border p-1.5 text-left transition ${
        selected ? "border-ink bg-card shadow-[0_2px_10px_rgba(0,0,0,0.08)]" : related ? "border-line bg-ink/[0.045]" : "border-line bg-card/70"
      }`}
    >
      <div className="min-w-0 space-y-[1px]">
        {p.major.length ? (
          p.major.map((s) => (
            <div key={s.name} className="flex items-center gap-[2px] whitespace-nowrap text-[11.5px] font-semibold leading-[15px] text-ink">
              <span>{s.name}</span>
              {s.brightness && <span className="text-[9px] font-normal text-mute">{s.brightness}</span>}
              {s.mutagen && (
                <span className="rounded-[3px] px-[2px] text-[9px] font-bold leading-[12px] text-white" style={{ background: MUTAGEN_COLOR[s.mutagen] ?? "#958f86" }}>
                  {s.mutagen}
                </span>
              )}
            </div>
          ))
        ) : (
          <div className="text-[10.5px] leading-[15px] text-faint">借对宫</div>
        )}
        <div className="truncate text-[9.5px] leading-[13px] text-mute">{p.minor.slice(0, 3).map((s) => s.name).join(" ")}</div>
      </div>
      <div className="flex items-end justify-between gap-1">
        <span className={`text-[11.5px] font-bold leading-none ${p.name === "命宫" ? "text-seal" : "text-ink-2"}`}>
          {p.name}
          {p.isBody && <span className="ml-0.5 text-[9px] font-normal text-gold">身</span>}
        </span>
        <span className="text-[9px] leading-none text-mute">{p.stem + p.branch}</span>
      </div>
    </button>
  );
}

export function ZiweiBoard({ chart, selected, onSelect }: { chart: ZiweiChart; selected: number; onSelect: (i: number) => void }) {
  const related = surroundIndices(selected);
  return (
    <div className="grid grid-cols-4 gap-[5px]" style={{ gridTemplateRows: "repeat(4, minmax(96px, auto))" }}>
      {chart.palaces.map((p) => (
        <Cell key={p.index} p={p} selected={p.index === selected} related={related.includes(p.index) && p.index !== selected} onClick={() => onSelect(p.index)} />
      ))}
      <div className="flex flex-col items-center justify-center rounded-[10px] border border-line bg-paper-2/70 p-2 text-center" style={{ gridRow: "2 / span 2", gridColumn: "2 / span 2" }}>
        <div className="font-song text-[17px] font-bold">{chart.fiveElements}</div>
        <div className="mt-1.5 text-[11.5px] leading-relaxed text-ink-2">
          命主 {chart.soul} · 身主 {chart.body}
        </div>
        <div className="mt-1 text-[10.5px] leading-relaxed text-mute">{chart.chineseDate}</div>
        <div className="text-[10.5px] leading-relaxed text-mute">
          {chart.lunarDate} · {chart.time}
        </div>
        {chart.solarCalibration?.applied && (
          <div className="mt-1 rounded-full bg-seal/10 px-2 py-0.5 text-[9.5px] font-medium text-seal">
            已校准真太阳时 · {chart.solarCalibration.city}
          </div>
        )}
        <div className="mt-1.5 text-[10px] text-faint">点任意一宫看三方四正</div>
      </div>
    </div>
  );
}

export function PalaceDetail({ chart, index }: { chart: ZiweiChart; index: number }) {
  const p = chart.palaces[index];
  if (!p) return null;
  const around = surroundIndices(index)
    .slice(1)
    .map((i) => chart.palaces[i]?.name)
    .filter(Boolean);
  return (
    <div className="rounded-[20px] border border-line bg-card/80 p-4">
      <div className="flex items-baseline justify-between gap-2">
        <div className="font-song text-[18px] font-bold">
          {p.name}
          <span className="ml-2 text-[12.5px] font-normal text-mute">{PALACE_HINT[p.name]}</span>
        </div>
        <span className="shrink-0 text-[12px] text-mute">
          大限 {p.decadal[0]}–{p.decadal[1]} 岁
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {p.major.length ? (
          p.major.map((s) => (
            <span key={s.name} className="inline-flex h-7 items-center gap-1 rounded-full bg-ink/[0.05] px-2.5 text-[13px]">
              <b className="font-semibold">{s.name}</b>
              {s.brightness && <span className="text-[11px] text-mute">{s.brightness}</span>}
              {s.mutagen && (
                <span className="text-[11px] font-bold" style={{ color: MUTAGEN_COLOR[s.mutagen] }}>
                  化{s.mutagen}
                </span>
              )}
            </span>
          ))
        ) : (
          <span className="text-[13px] text-mute">本宫无主星，看对宫{chart.palaces[(index + 6) % 12]?.name}的星曜</span>
        )}
      </div>
      {p.minor.length > 0 && <div className="mt-2.5 text-[12.5px] leading-relaxed text-ink-2">辅星：{p.minor.map((s) => s.name + (s.mutagen ? `化${s.mutagen}` : "")).join("、")}</div>}
      {p.adj.length > 0 && <div className="mt-1 text-[12px] leading-relaxed text-mute">杂曜：{p.adj.join("、")}</div>}
      <div className="mt-2.5 text-[12px] text-mute">三方四正：{around.join(" · ")}</div>
    </div>
  );
}
