"use client";

import { ChevronRight, Coins, Grid3x3, Layers, ScrollText, Sparkles } from "lucide-react";
import { useApp, useUI } from "@/lib/store";
import { yearGanzhi } from "@/lib/divination";
import type { AnnualReport } from "@/lib/annual";
import { Icon } from "../icons";
import { Card, SectionTitle } from "../ui";
import { AlmanacCard } from "./Charts";

function ToolCard({ icon, title, sub, onClick }: { icon: typeof Coins; title: string; sub: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-[116px] flex-col items-start rounded-[22px] border border-line bg-card/80 p-4 text-left shadow-[0_2px_14px_rgba(60,40,10,0.04)] transition-transform active:scale-[0.97]">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-paper-2 text-ink">
        <Icon as={icon} size={21} />
      </span>
      <span className="mt-3 block w-full">
        <span className="block text-[14.5px] font-semibold text-ink">{title}</span>
        <span className="mt-0.5 block text-[12px] leading-snug text-mute">{sub}</span>
      </span>
    </button>
  );
}

export default function ExploreView() {
  const openPanel = useUI((s) => s.openPanel);
  const year = new Date().getFullYear();
  const { gz } = yearGanzhi(year);
  const annual = useApp((s) => s.records.find((r) => r.kind === "annual" && r.key?.startsWith(`annual:${year}:`) && r.key.endsWith(s.profile.birth ?? "∅")));
  const keyword = (annual?.payload as AnnualReport | undefined)?.keyword;

  return (
    <div data-scroll-root className="no-scrollbar h-full overflow-y-auto overscroll-contain">
      <header className="pt-safe">
        <div className="px-5 pb-1 pt-5">
          <h1 className="font-song text-[26px] font-bold tracking-wide text-ink">占一占</h1>
          <p className="mt-1 text-[13px] text-mute">算一算，心里有个数；然后，就算了。</p>
        </div>
      </header>
      <div className="px-4 pb-10">
        <div className="mt-4">
          <AlmanacCard />
        </div>

        <SectionTitle>问一件事</SectionTitle>
        <div className="grid grid-cols-2 gap-2.5">
          <ToolCard icon={Coins} title="六爻 · 摇一卦" sub="三枚铜钱，问一件具体的事" onClick={() => openPanel("coins")} />
          <ToolCard icon={Layers} title="塔罗 · 三张牌" sub="此刻、阻碍与建议" onClick={() => openPanel("tarot")} />
        </div>

        <SectionTitle>看看自己</SectionTitle>
        <div className="grid grid-cols-2 gap-2.5">
          <ToolCard icon={ScrollText} title="八字 · 四柱" sub="五行、十神与大运" onClick={() => openPanel("bazi")} />
          <ToolCard icon={Grid3x3} title="紫微 · 十二宫" sub="命宫与三方四正" onClick={() => openPanel("ziwei")} />
        </div>
        <Card onClick={() => openPanel("annual")} className="mt-2.5 flex items-center gap-3.5 p-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-ink text-on-ink">
            <Icon as={Sparkles} size={20} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14.5px] font-semibold text-ink">
              {year} {gz}年 · 年度盘
            </span>
            <span className="mt-0.5 block truncate text-[12px] text-mute">{keyword ? `关键词「${keyword}」· 点开回看` : "流年十二个月的起伏，和每段日子该怎么过"}</span>
          </span>
          <Icon as={ChevronRight} size={18} className="text-faint" />
        </Card>

        <p className="mt-10 text-center text-[11.5px] leading-relaxed text-faint">
          术数是一面镜子，照见的是倾向，不是定局。
          <br />
          看完了，就把它放下。
        </p>
      </div>
    </div>
  );
}
