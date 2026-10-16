import { useCallback, type ReactNode } from "react";
import { Feather } from "lucide-react";
import { useApp, useUI } from "@/lib/store";
import { baziToText, castToText, computeBazi, tarotToText, todayAlmanac, TAROT, type CastResult, type TarotDraw } from "@/lib/divination";
import { AlmanacCard, BaziChart, BirthForm, CoinCaster, TarotPicker } from "../tools";
import { sendMessage } from "@/lib/engine";
import { Logo } from "../ui";

function Frame({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div className="anim-fade-up my-3 overflow-hidden rounded-[22px] border border-line bg-white/80 p-4 shadow-[0_2px_16px_rgba(60,40,10,0.05)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-song text-[14.5px] font-bold">
          <span className="grid h-6 w-6 place-items-center rounded-lg bg-ink text-paper">
            <Logo size={15} mode="static" />
          </span>
          {title}
        </div>
        {hint && <div className="truncate text-[11.5px] text-mute">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

type WidgetData = { widget?: string; question?: string; text?: string };

export default function WidgetBlock({ raw, msgId }: { raw: string; msgId: string }) {
  let data: WidgetData = {};
  try {
    data = JSON.parse(raw.trim());
  } catch {
    return null;
  }
  return <WidgetInner data={data} k={`${msgId}:${data.widget}`} />;
}

function WidgetInner({ data, k }: { data: WidgetData; k: string }) {
  const result = useApp((s) => s.widgetResults[k]);
  const birth = useApp((s) => s.profile.birth);
  const gender = useApp((s) => s.profile.gender);
  const question = data.question?.trim() || undefined;

  const onCast = useCallback(
    (r: CastResult) => {
      const st = useApp.getState();
      if (st.widgetResults[k]) return;
      st.setWidgetResult(k, r);
      st.addRecord({ kind: "coins", title: r.changed ? `${r.primary.full} → ${r.changed.full}` : r.primary.full, summary: r.primary.gist, text: castToText(r) });
      setTimeout(() => void sendMessage(castToText(r)), 900);
    },
    [k],
  );
  const onTarot = useCallback(
    (d: TarotDraw) => {
      const st = useApp.getState();
      if (st.widgetResults[k]) return;
      st.setWidgetResult(k, d);
      st.addRecord({ kind: "tarot", title: d.cards.map((c) => TAROT[c.id].name + (c.reversed ? "(逆)" : "")).join(" · "), summary: d.question || "三张牌", text: tarotToText(d) });
      setTimeout(() => void sendMessage(tarotToText(d)), 900);
    },
    [k],
  );

  if (data.widget === "coins") {
    return (
      <Frame title="摇一卦" hint={question ? `问：${question.slice(0, 14)}` : "三枚铜钱 · 六次成卦"}>
        <CoinCaster question={question} initial={(result as CastResult) ?? null} onDone={onCast} compact />
      </Frame>
    );
  }
  if (data.widget === "tarot") {
    return (
      <Frame title="三张塔罗" hint={question ? `问：${question.slice(0, 14)}` : "此刻 · 阻碍 · 出路"}>
        <TarotPicker question={question} initial={(result as TarotDraw) ?? null} onDone={onTarot} />
      </Frame>
    );
  }
  if (data.widget === "bazi") {
    const b = computeBazi(birth);
    return (
      <Frame title="生辰命盘" hint={birth ? birth : "时辰不知道也没关系"}>
        {b && birth ? (
          <>
            <BaziChart b={b} />
            {!result && (
              <button
                onClick={() => {
                  useApp.getState().setWidgetResult(k, true);
                  useApp.getState().addRecord({ kind: "bazi", title: b.pillars.map((p) => p.gz).join(" "), summary: `日主${b.dayMaster}${b.dayMasterWx} · ${b.shengxiao}`, text: baziToText(b, birth) });
                  void sendMessage(baziToText(b, birth));
                }}
                className="mt-3 h-10 w-full rounded-full bg-ink text-[14px] text-paper active:scale-[0.98]"
              >
                帮我看看这张盘
              </button>
            )}
          </>
        ) : (
          <BirthForm
            gender={gender}
            onSubmit={(bd, g) => {
              useApp.getState().setProfile({ birth: bd, ...(g ? { gender: g } : {}) });
              const nb = computeBazi(bd);
              if (nb) {
                useApp.getState().setWidgetResult(k, true);
                useApp.getState().addRecord({ kind: "bazi", title: nb.pillars.map((p) => p.gz).join(" "), summary: `日主${nb.dayMaster}${nb.dayMasterWx} · ${nb.shengxiao}`, text: baziToText(nb, bd) });
                setTimeout(() => void sendMessage(baziToText(nb, bd)), 400);
              }
            }}
          />
        )}
      </Frame>
    );
  }
  if (data.widget === "almanac") {
    return (
      <Frame title="今日黄历">
        <AlmanacCard a={todayAlmanac()} compact />
      </Frame>
    );
  }
  if (data.widget === "letgo") {
    const text = data.text?.trim() || "那件让你拧巴的事";
    return (
      <Frame title="写下来，揉掉它">
        <div className="rounded-2xl bg-paper-2 px-4 py-3 font-song text-[14.5px] leading-relaxed text-ink-2">「{text}」</div>
        <button
          onClick={() => {
            useUI.getState().setLetgoDraft(text);
            useUI.getState().setTab("letgo");
          }}
          className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-full bg-ink text-[14px] text-paper active:scale-[0.98]"
        >
          <Feather size={15} /> 去纸篓边，揉掉它
        </button>
      </Frame>
    );
  }
  return null;
}
