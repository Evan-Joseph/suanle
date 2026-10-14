"use client";

import { useEffect, useState } from "react";
import { useApp, useUI, lampActive } from "@/lib/store";
import { Icon, Sheet } from "../ui";
import { PayStep, Thanks } from "./TipSheet";

const PLANS = [
  { key: "month", name: "长明灯 · 一月", cents: 1800, days: 30, note: "一天六毛，比一根烤肠便宜" },
  { key: "year", name: "长明灯 · 一年", cents: 12800, days: 365, note: "约等于一年少喝 9 杯奶茶" },
];

const PERKS = [
  ["深度推演，不限次", "层层递进的长篇解读，适合真正想弄明白的事"],
  ["年度大盘，随时生成", "结合命盘，按季度说清这一年的节奏"],
  ["灯一直亮着", "你的每一次随喜，都让算了能继续免费陪更多人"],
];

export default function LampSheet() {
  const open = useUI((s) => s.sheet === "lamp");
  const payload = useUI((s) => s.sheetPayload);
  const close = useUI((s) => s.close);
  const active = useApp((s) => lampActive(s));
  const until = useApp((s) => s.merit.lampUntil);
  const [plan, setPlan] = useState<(typeof PLANS)[number] | null>(null);
  const [step, setStep] = useState<"pick" | "pay" | "thanks">("pick");

  useEffect(() => {
    if (open) {
      setStep("pick");
      setPlan(PLANS[0]);
    }
  }, [open]);

  const reason = payload?.reason === "deep" ? "今天的 3 次免费深度推演用完啦。" : payload?.reason === "annual" ? "年度大盘的免费体验已经用过了。" : null;

  return (
    <Sheet open={open} onClose={close} title={step === "thanks" ? "" : "点一盏长明灯"}>
      {step === "pick" && (
        <div className="pb-4">
          <div className="relative overflow-hidden rounded-3xl bg-ink p-5 text-paper">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gold/30 blur-3xl" />
            <Icon name="lamp" size={28} className="text-gold" />
            <div className="mt-2 font-song text-[20px] font-bold">{active ? "你的灯亮着" : "灯亮着，就有人在"}</div>
            <div className="mt-1 text-[12.5px] text-paper/70">
              {active ? `有效期至 ${new Date(until).toLocaleDateString("zh-CN")}` : reason ?? "给想得多的人，多一点耐心。"}
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {PERKS.map(([t, d]) => (
              <div key={t} className="flex gap-3">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-seal/10 text-seal">
                  <Icon name="check" size={13} stroke={2.4} />
                </span>
                <div>
                  <div className="text-[14.5px] font-medium">{t}</div>
                  <div className="text-[12.5px] text-mute">{d}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {PLANS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPlan(p)}
                className={`rounded-2xl border p-3.5 text-left transition active:scale-[0.98] ${plan?.key === p.key ? "border-ink bg-white shadow-sm" : "border-line bg-white/50"}`}
              >
                <div className="text-[12.5px] text-ink-2">{p.name}</div>
                <div className="font-song text-[24px] font-bold">¥{p.cents / 100}</div>
                <div className="text-[11px] leading-snug text-mute">{p.note}</div>
              </button>
            ))}
          </div>
          <button
            disabled={!plan}
            onClick={() => setStep("pay")}
            className="mt-4 w-full rounded-2xl bg-ink py-3.5 text-[15px] text-paper active:scale-[0.98]"
          >
            {active ? "续一盏" : "点灯"}
          </button>
          <button onClick={close} className="mt-1 w-full py-2.5 text-[13px] text-mute">
            先不了，算了
          </button>
        </div>
      )}
      {step === "pay" && plan && <PayStep item={plan.name} cents={plan.cents} kind="lamp" lampDays={plan.days} onDone={() => setStep("thanks")} />}
      {step === "thanks" && <Thanks text="灯点上了。深度推演和年度大盘都为你留着，想用就用。" />}
    </Sheet>
  );
}
