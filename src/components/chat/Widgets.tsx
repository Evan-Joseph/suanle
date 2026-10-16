"use client";

import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { useApp, useUI } from "@/lib/store";
import { baziToText, castToText, computeBazi, tarotToText, type CastResult, type TarotDraw } from "@/lib/divination";
import { starLabel, ziweiToText, type ZPalace } from "@/lib/ziwei-core";
import { CoinCaster } from "../tools/CoinCaster";
import { TarotPicker } from "../tools/TarotPicker";
import { AlmanacCard, BaziChart, BirthForm } from "../tools/Charts";
import { useZiwei } from "../tools/Ziwei";
import { saveBazi, saveCast, saveTarot, saveZiwei } from "../tools/records";
import { Logo } from "../brand/Logo";
import { Icon } from "../icons";
import { Skeleton } from "../ui";
import { isBusy, sendMessage } from "./engine";

function Frame({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div className="rounded-[22px] border border-line bg-card/85 p-4 shadow-[0_2px_14px_rgba(60,40,10,0.05)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex shrink-0 items-center gap-2 font-song text-[15px] font-bold">
          <span className="grid h-6 w-6 place-items-center rounded-lg bg-ink text-on-ink">
            <Logo size={15} mood="still" />
          </span>
          {title}
        </div>
        {hint && <div className="min-w-0 truncate text-[11.5px] text-mute">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function AskButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="mt-3 flex h-11 w-full items-center justify-center gap-1.5 rounded-2xl bg-ink text-[14.5px] text-on-ink transition active:scale-[0.98]">
      {children} <Icon as={ArrowRight} size={16} />
    </button>
  );
}

function MiniPalace({ p }: { p?: ZPalace }) {
  if (!p) return null;
  return (
    <div className="rounded-2xl bg-paper-2/70 px-3 py-2.5">
      <div className="text-[11.5px] text-mute">{p.name}</div>
      <div className="mt-0.5 truncate font-song text-[14.5px] font-bold">{p.major.map(starLabel).join(" ") || "借对宫"}</div>
    </div>
  );
}

function ZiweiWidget({ k, interactive }: { k: string; interactive: boolean }) {
  const birth = useApp((s) => s.profile.birth);
  const gender = useApp((s) => s.profile.gender);
  const city = useApp((s) => s.profile.city);
  const asked = useApp((s) => s.widgetResults[k]);
  const chart = useZiwei(birth, gender, city);
  if (!birth)
    return (
      <Frame title="紫微命盘" hint="填一下生辰">
        <BirthForm
          initialGender={gender}
          initialCity={city}
          onSave={(b, g, c) => useApp.getState().setProfile({ birth: b, gender: g, city: c ?? city })}
        />
      </Frame>
    );
  if (chart === undefined)
    return (
      <Frame title="紫微命盘" hint="排盘中">
        <div className="grid grid-cols-2 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[58px] rounded-2xl" />
          ))}
        </div>
      </Frame>
    );
  if (!chart)
    return (
      <Frame title="紫微命盘">
        <p className="text-[13.5px] text-mute">这个生辰排不出来，去「我」里改一下试试。</p>
      </Frame>
    );
  const by = (n: string) => chart.palaces.find((p) => p.name === n);
  return (
    <Frame title="紫微命盘" hint={`${chart.fiveElements} · 命主${chart.soul}`}>
      <div className="grid grid-cols-2 gap-2">
        <MiniPalace p={by("命宫")} />
        <MiniPalace p={by("官禄")} />
        <MiniPalace p={by("夫妻")} />
        <MiniPalace p={by("财帛")} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => useUI.getState().openPanel("ziwei")} className="h-11 rounded-2xl border border-line text-[14px] text-ink-2 transition active:scale-[0.98]">
          展开十二宫
        </button>
        <button
          type="button"
          disabled={!!asked || !interactive}
          onClick={() => {
            useApp.getState().setWidgetResult(k, true);
            saveZiwei(birth, chart);
            if (!isBusy()) void sendMessage(ziweiToText(chart));
          }}
          className="h-11 rounded-2xl bg-ink text-[14px] text-on-ink transition active:scale-[0.98] disabled:opacity-40"
        >
          {asked ? "已请它细看" : "请它细看"}
        </button>
      </div>
    </Frame>
  );
}

function WidgetInner({ data, k, interactive }: { data: { widget?: string; question?: string; text?: string }; k: string; interactive: boolean }) {
  const result = useApp((s) => s.widgetResults[k]);
  const birth = useApp((s) => s.profile.birth);
  const gender = useApp((s) => s.profile.gender);
  const question = data.question?.trim() || undefined;

  if (data.widget === "coins") {
    return (
      <Frame title="摇一卦" hint={question ? `问：${question}` : "三枚铜钱 · 六次"}>
        <CoinCaster
          question={question}
          initial={(result as CastResult | undefined) ?? null}
          onDone={(r) => {
            if (result || !interactive) return;
            useApp.getState().setWidgetResult(k, r);
            saveCast(r);
            if (!isBusy()) void sendMessage(castToText(r));
          }}
        />
      </Frame>
    );
  }

  if (data.widget === "tarot") {
    return (
      <Frame title="三张塔罗" hint="此刻 · 阻碍 · 建议">
        <TarotPicker
          question={question}
          initial={(result as TarotDraw | undefined) ?? null}
          onDone={(d) => {
            if (result || !interactive) return;
            useApp.getState().setWidgetResult(k, d);
            saveTarot(d);
            if (!isBusy()) void sendMessage(tarotToText(d));
          }}
        />
      </Frame>
    );
  }

  if (data.widget === "bazi") {
    const city = useApp((s) => s.profile.city);
    const b = computeBazi(birth, gender, city);
    return (
      <Frame title="八字命盘" hint={birth ?? "填一下生辰"}>
        {b && birth ? (
          <>
            <BaziChart b={b} compact />
            {!result && interactive && (
              <AskButton
                onClick={() => {
                  useApp.getState().setWidgetResult(k, true);
                  saveBazi(birth, b);
                  if (!isBusy()) void sendMessage(baziToText(b, birth));
                }}
              >
                请它细看
              </AskButton>
            )}
          </>
        ) : (
          <BirthForm
            initialGender={gender}
            initialCity={city}
            onSave={(bt, g, c) => {
              useApp.getState().setProfile({ birth: bt, gender: g, city: c ?? city });
              const nb = computeBazi(bt, g, c ?? city);
              if (nb) {
                saveBazi(bt, nb);
                useApp.getState().setWidgetResult(k, true);
                if (interactive && !isBusy()) void sendMessage(baziToText(nb, bt));
              }
            }}
          />
        )}
      </Frame>
    );
  }

  if (data.widget === "ziwei") return <ZiweiWidget k={k} interactive={interactive} />;

  if (data.widget === "almanac") return <AlmanacCard compact />;

  if (data.widget === "letgo") {
    return (
      <div className="lined-paper rounded-[22px] border border-line p-4">
        <div className="font-song text-[15.5px] leading-8 text-ink-2">{data.text ? `「${data.text}」` : "那件放不下的事"}</div>
        <button
          type="button"
          onClick={() => {
            useUI.getState().setLetgoDraft(data.text ?? "");
            useUI.getState().setTab("letgo");
          }}
          className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-full bg-ink px-4 text-[13.5px] text-on-ink transition active:scale-95"
        >
          揉成一团，丢掉 <Icon as={ArrowRight} size={15} />
        </button>
      </div>
    );
  }
  return null;
}

export default function WidgetBlock({ raw, wkey, interactive }: { raw: string; wkey: string; interactive: boolean }) {
  let data: { widget?: string; question?: string; text?: string } = {};
  try {
    data = JSON.parse(raw) as typeof data;
  } catch {
    return null;
  }
  if (!data || typeof data !== "object" || !data.widget) return null;
  return <WidgetInner data={data} k={wkey} interactive={interactive} />;
}
