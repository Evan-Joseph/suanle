"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useApp, useUI } from "@/lib/store";
import { fmt, localAnalogy, type Analogy } from "@/lib/meter";
import { playBowl, haptic } from "@/lib/sound";
import { Icon, Sheet } from "../ui";

export const TIP_URL = process.env.NEXT_PUBLIC_TIP_URL || "https://github.com/Evan-Joseph/suanle";

const OPTIONS = [
  { emoji: "🪔", name: "一炷清心香", cents: 300 },
  { emoji: "🥟", name: "两个肉包子", cents: 700 },
  { emoji: "☕", name: "一杯热拿铁", cents: 1500 },
];

export function useAnalogy(tokens: number, enabled: boolean) {
  const tags = useApp((s) => s.profile.tags);
  const facts = useApp((s) => s.profile.facts);
  const [a, setA] = useState<Analogy | null>(null);
  useEffect(() => {
    if (!enabled || tokens <= 0) return;
    let alive = true;
    setA(null);
    fetch("/api/analogy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tokens, tags, facts }) })
      .then((r) => r.json())
      .then((j: Analogy) => alive && setA(j?.items?.length ? j : localAnalogy(tokens, tags)))
      .catch(() => alive && setA(localAnalogy(tokens, tags)));
    return () => {
      alive = false;
    };
  }, [tokens, enabled]); // eslint-disable-line react-hooks/exhaustive-deps
  return a;
}

export function AnalogyView({ a }: { a: Analogy | null }) {
  if (!a)
    return (
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[66px] flex-1 animate-pulse rounded-2xl bg-black/5" />
        ))}
      </div>
    );
  return (
    <div className="anim-fade-in">
      <div className="flex gap-2">
        {a.items.map((it) => (
          <div key={it.name} className="min-w-0 flex-1 rounded-2xl bg-white/80 px-2 py-2.5 text-center">
            <div className="text-[22px] leading-none">{it.emoji}</div>
            <div className="mt-1.5 font-song text-[15px] font-bold">
              {it.qty}
              <span className="text-[11px] font-normal text-ink-2"> {it.unit}</span>
            </div>
            <div className="truncate text-[11px] text-mute">{it.name}</div>
          </div>
        ))}
      </div>
      <div className="mt-2.5 text-center font-song text-[13.5px] text-ink-2">「{a.line}」</div>
    </div>
  );
}

/** 扫码 + 确认（随喜 / 点灯 共用） */
export function PayStep({ item, cents, kind, lampDays, onDone }: { item: string; cents: number; kind: "tip" | "lamp"; lampDays?: number; onDone: () => void }) {
  const [qr, setQr] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const anonId = useApp((s) => s.anonId);
  useEffect(() => {
    const url = `${TIP_URL}${TIP_URL.includes("?") ? "&" : "?"}amount=${(cents / 100).toFixed(2)}&item=${encodeURIComponent(item)}`;
    QRCode.toDataURL(url, { margin: 1, width: 360, color: { dark: "#2b2b2b", light: "#fffdf8" } })
      .then(setQr)
      .catch(() => setQr(""));
  }, [cents, item]);

  const confirm = async () => {
    setBusy(true);
    try {
      await fetch("/api/tips", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ anonId, kind, item, amountCents: cents }) });
    } catch {
      /* 心意到了就行 */
    }
    useApp.getState().addMerit(cents, lampDays);
    playBowl();
    haptic(30);
    setBusy(false);
    onDone();
  };

  return (
    <div className="anim-fade-up flex flex-col items-center pb-4 text-center">
      <div className="text-[13px] text-mute">{item}</div>
      <div className="font-song text-[34px] font-bold">¥{(cents / 100).toFixed(cents % 100 ? 2 : 0)}</div>
      <div className="mt-3 rounded-3xl border border-line bg-[#fffdf8] p-3 shadow-sm">
        {qr ? <img src={qr} alt="随喜码" width={180} height={180} className="h-[180px] w-[180px]" /> : <div className="h-[180px] w-[180px] animate-pulse rounded-2xl bg-black/5" />}
      </div>
      <div className="mt-3 text-[12.5px] text-mute">长按或扫一扫 · 随喜随心，不扫也算了</div>
      <button onClick={confirm} disabled={busy} className="mt-5 w-full rounded-2xl bg-ink py-3.5 text-[15px] text-paper active:scale-[0.98] disabled:opacity-60">
        {busy ? "……" : kind === "lamp" ? "我已点灯" : "我已随喜"}
      </button>
    </div>
  );
}

export function Thanks({ text }: { text: string }) {
  const merit = useApp((s) => s.merit);
  return (
    <div className="anim-fade-up flex flex-col items-center pb-6 pt-2 text-center">
      <div className="relative h-[110px] w-[60px]">
        {[0, 1, 2].map((i) => (
          <span key={i} className="smoke absolute left-1/2 top-2 h-8 w-2 -translate-x-1/2 rounded-full bg-[#cfc7b4]/70 blur-[3px]" style={{ animationDelay: `${i}s` }} />
        ))}
        <div className="absolute bottom-6 left-1/2 h-[54px] w-[3px] -translate-x-1/2 rounded bg-[#8a5a3c]" />
        <div className="absolute bottom-[78px] left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-seal shadow-[0_0_10px_#c4553a]" />
        <div className="absolute bottom-0 left-1/2 h-6 w-[54px] -translate-x-1/2 rounded-b-[18px] rounded-t-md bg-ink" />
      </div>
      <div className="mt-2 font-song text-[22px] font-bold">谢谢你</div>
      <p className="mt-2 max-w-[280px] text-[14px] leading-relaxed text-ink-2">{text}</p>
      <div className="mt-4 text-[12px] text-mute">
        你已随喜 {merit.count} 次 · 共 ¥{(merit.cents / 100).toFixed(0)}
      </div>
    </div>
  );
}

export default function TipSheet() {
  const open = useUI((s) => s.sheet === "tip");
  const payload = useUI((s) => s.sheetPayload);
  const close = useUI((s) => s.close);
  const total = useApp((s) => s.usage.total);
  const [step, setStep] = useState<"pick" | "pay" | "thanks">("pick");
  const [choice, setChoice] = useState<{ name: string; cents: number } | null>(null);
  const [custom, setCustom] = useState("");
  const tokens = typeof payload?.tokens === "number" ? (payload.tokens as number) : total;
  const single = typeof payload?.tokens === "number";
  const a = useAnalogy(tokens, open);

  useEffect(() => {
    if (open) {
      setStep("pick");
      setChoice(null);
      setCustom("");
    }
  }, [open]);

  return (
    <Sheet open={open} onClose={close} title={step === "thanks" ? "" : single ? "这一次的算力" : "随喜一下"}>
      {step === "pick" && (
        <div className="pb-4">
          <div className="rounded-3xl bg-paper-2 p-4">
            <div className="text-center text-[12.5px] text-mute">{single ? "这一次推演消耗" : "我们一起聊掉了"}</div>
            <div className="mb-3 text-center font-song text-[30px] font-bold">
              {fmt(tokens)} <span className="text-[13px] font-normal text-ink-2">算力</span>
            </div>
            <div className="mb-2 text-center text-[12px] text-mute">差不多等于</div>
            <AnalogyView a={a} />
          </div>
          <p className="mt-4 text-center text-[13px] leading-relaxed text-ink-2">
            算了一直免费陪你聊。
            <br />
            如果哪句话让你松了口气，可以请它喝点什么。
          </p>
          <div className="mt-4 space-y-2">
            {OPTIONS.map((o) => (
              <button
                key={o.name}
                onClick={() => {
                  setChoice(o);
                  setStep("pay");
                }}
                className="flex w-full items-center gap-3 rounded-2xl border border-line bg-white/80 px-4 py-3 text-left transition active:scale-[0.98]"
              >
                <span className="text-[22px]">{o.emoji}</span>
                <span className="flex-1 text-[15px]">{o.name}</span>
                <span className="font-song text-[16px] font-bold">¥{o.cents / 100}</span>
                <Icon name="chev" size={16} className="text-mute" />
              </button>
            ))}
            <div className="flex items-center gap-2 rounded-2xl border border-line bg-white/80 px-4 py-2">
              <span className="text-[22px]">🧧</span>
              <input
                inputMode="decimal"
                value={custom}
                onChange={(e) => setCustom(e.target.value.replace(/[^\d.]/g, "").slice(0, 7))}
                placeholder="随心金额"
                className="min-w-0 flex-1 bg-transparent py-1.5 text-[15px] outline-none placeholder:text-mute"
              />
              <button
                disabled={!(Number(custom) >= 1)}
                onClick={() => {
                  setChoice({ name: "一份心意", cents: Math.round(Number(custom) * 100) });
                  setStep("pay");
                }}
                className="rounded-full bg-ink px-4 py-1.5 text-[13px] text-paper disabled:opacity-30"
              >
                好
              </button>
            </div>
          </div>
          <button onClick={close} className="mt-3 w-full py-2 text-[13px] text-mute">
            下次吧，算了
          </button>
        </div>
      )}
      {step === "pay" && choice && <PayStep item={choice.name} cents={choice.cents} kind="tip" onDone={() => setStep("thanks")} />}
      {step === "thanks" && <Thanks text="这炷香替你点上了。愿你今天少一点拧巴，多一点算了。" />}
    </Sheet>
  );
}
