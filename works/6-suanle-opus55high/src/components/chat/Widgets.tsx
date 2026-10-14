"use client";

import type { ReactNode } from "react";
import { useApp, useUI } from "@/lib/store";
import { baziToText, castToText, computeBazi, tarotToText, TAROT, type CastResult, type TarotDraw } from "@/lib/divination";
import { CoinCaster, TarotPicker } from "../tools/Divine";
import { AlmanacCard, BaziChart, BirthForm } from "../tools/Charts";
import { isBusy, sendMessage } from "./engine";
import { Icon, Logo } from "../ui";

function Frame({ title, children, hint }: { title: string; children: ReactNode; hint?: string }) {
  return (
    <div className="not-prose my-3 overflow-hidden rounded-3xl border border-line bg-white/75 p-4 shadow-[0_2px_14px_rgba(60,40,10,0.05)] anim-fade-up">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 font-song text-[14.5px] font-bold">
          <span className="grid h-6 w-6 place-items-center rounded-lg bg-ink text-paper">
            <Logo size={15} />
          </span>
          {title}
        </div>
        {hint && <div className="text-[11.5px] text-mute">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

export default function WidgetBlock({ raw, msgId, interactive }: { raw: string; msgId: string; interactive: boolean }) {
  let data: { widget?: string; question?: string; text?: string } = {};
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  const key = `${msgId}:${data.widget}`;
  return <WidgetInner data={data} k={key} interactive={interactive} />;
}

function WidgetInner({ data, k, interactive }: { data: { widget?: string; question?: string; text?: string }; k: string; interactive: boolean }) {
  const result = useApp((s) => s.widgetResults[k]);
  const birth = useApp((s) => s.profile.birth);
  const gender = useApp((s) => s.profile.gender);
  const setResult = useApp((s) => s.setWidgetResult);
  const addRecord = useApp((s) => s.addRecord);
  const setProfile = useApp((s) => s.setProfile);
  const question = data.question?.trim() || undefined;

  if (data.widget === "coins") {
    return (
      <Frame title="摇一卦" hint={question ? `问：${question.slice(0, 12)}` : "三枚铜钱 · 六次"}>
        <CoinCaster
          question={question}
          initial={(result as CastResult) ?? null}
          onDone={(r) => {
            if (result || !interactive) return;
            setResult(k, r);
            addRecord({
              kind: "coins",
              title: r.changed ? `${r.primary.full} → ${r.changed.full}` : r.primary.full,
              summary: r.primary.gist,
              text: castToText(r),
              payload: r,
            });
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
          initial={(result as TarotDraw) ?? null}
          onDone={(d) => {
            if (result || !interactive) return;
            setResult(k, d);
            addRecord({
              kind: "tarot",
              title: d.cards.map((c) => TAROT[c.id].name + (c.reversed ? "(逆)" : "")).join(" · "),
              summary: d.cards.map((c) => (c.reversed ? TAROT[c.id].rev : TAROT[c.id].up)).join("；"),
              text: tarotToText(d),
              payload: d,
            });
            if (!isBusy()) void sendMessage(tarotToText(d));
          }}
        />
      </Frame>
    );
  }

  if (data.widget === "bazi") {
    const b = computeBazi(birth);
    return (
      <Frame title="你的命盘" hint={birth ?? "填一下生辰"}>
        {b && birth ? (
          <>
            <BaziChart b={b} />
            {!result && interactive && (
              <button
                onClick={() => {
                  setResult(k, true);
                  void sendMessage(baziToText(b, birth));
                }}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-2xl bg-ink py-3 text-[14.5px] text-paper active:scale-[0.98]"
              >
                请它细看 <Icon name="arrow" size={16} />
              </button>
            )}
          </>
        ) : (
          <BirthForm
            initialGender={gender}
            onSave={(bt, g) => {
              setProfile({ birth: bt, ...(g ? { gender: g } : {}) });
              const nb = computeBazi(bt);
              if (nb) {
                addRecord({ kind: "bazi", title: nb.pillars.map((p) => p.gz).join(" "), summary: `日主${nb.dayMaster}${nb.dayMasterWx} · 属${nb.shengxiao}`, text: baziToText(nb, bt), payload: { birth: bt } });
                setResult(k, true);
                if (interactive && !isBusy()) void sendMessage(baziToText(nb, bt));
              }
            }}
          />
        )}
      </Frame>
    );
  }

  if (data.widget === "almanac") {
    return (
      <div className="my-3 anim-fade-up">
        <AlmanacCard compact />
      </div>
    );
  }

  if (data.widget === "letgo") {
    return (
      <div className="lined-paper my-3 rounded-3xl border border-line p-4 anim-fade-up">
        <div className="font-song text-[15px] leading-8 text-ink-2">{data.text ? `「${data.text}」` : "那件放不下的事"}</div>
        <button
          onClick={() => {
            useUI.getState().setLetgoDraft(data.text ?? "");
            useUI.getState().setTab("letgo");
          }}
          className="mt-2 flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[13.5px] text-paper active:scale-95"
        >
          揉成一团，丢掉 <Icon name="arrow" size={15} />
        </button>
      </div>
    );
  }
  return null;
}
