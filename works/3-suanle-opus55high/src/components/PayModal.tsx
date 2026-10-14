"use client";

import { useEffect, useState } from "react";
import { api, getUid, haptic, refreshUser, setLocalUser, type ClientUser } from "@/lib/client";
import { PASS_PRICE, TIPS, UNLOCK_PRICE, yuan } from "@/lib/pricing";
import { Logo, Sheet, Skeleton } from "./ui";

export type PayRequest = {
  kind: "tip" | "unlock" | "pass";
  readingId?: string;
  title?: string;
  reason?: string;
  onSuccess?: (kind: "tip" | "unlock" | "pass") => void;
};

type Config = { qr: { wechat: string | null; alipay: string | null }; payee: string };

export default function PayModal({ req, onClose, toast }: { req: PayRequest | null; onClose: () => void; toast: (m: string) => void }) {
  const [cfg, setCfg] = useState<Config | null>(null);
  const [cfgErr, setCfgErr] = useState(false);
  const [tip, setTip] = useState<string>(TIPS[1].id);
  const [plan, setPlan] = useState<"unlock" | "pass">("unlock");
  const [channel, setChannel] = useState<"wechat" | "alipay">("wechat");
  const [step, setStep] = useState<"choose" | "done">("choose");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!req) return;
    setStep("choose");
    setPlan(req.kind === "pass" ? "pass" : "unlock");
    setCfgErr(false);
    api<Config>(`/api/pay?userId=${getUid()}`).then(setCfg).catch(() => setCfgErr(true));
  }, [req]);

  if (!req) return null;
  const kind = req.kind === "tip" ? "tip" : plan;
  const amount = kind === "tip" ? TIPS.find((t) => t.id === tip)!.amount : kind === "pass" ? PASS_PRICE : UNLOCK_PRICE;
  const qr = cfg?.qr[channel];

  const confirm = async () => {
    setBusy(true);
    haptic([8, 40, 8]);
    try {
      const r = await api<{ user: ClientUser }>("/api/pay", { body: { userId: getUid(), kind, item: tip, readingId: req.readingId, channel } });
      setLocalUser(r.user);
      refreshUser();
      setStep("done");
      req.onSuccess?.(kind);
    } catch {
      toast("没连上，钱没丢，稍后再点一次就好");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={!!req} onClose={onClose} title={step === "done" ? undefined : req.kind === "tip" ? "给小算添点香油" : req.title ?? "解锁深度详批"}>
      {step === "done" ? (
        <div className="anim-fade-up flex flex-col items-center py-8 text-center">
          <Logo size={64} blink className="text-ink" />
          <div className="mt-5 font-serif text-[19px]">收到啦，谢谢你</div>
          <div className="mt-2 max-w-[260px] text-[13.5px] leading-relaxed text-sub">
            {kind === "tip" ? "愿你今天少想一点，多睡一点。" : kind === "pass" ? "接下来三十天，深度详批随便看。" : "这份详批已经为你打开了。"}
          </div>
          <button onClick={onClose} className="mt-7 rounded-full bg-ink px-8 py-3 text-[14px] text-paper active:scale-95">好嘞</button>
        </div>
      ) : (
        <div className="space-y-4 pb-2">
          {req.reason && <p className="text-center text-[13px] leading-relaxed text-sub">{req.reason}</p>}
          {req.kind === "tip" ? (
            <div className="grid grid-cols-2 gap-2.5">
              {TIPS.map((t) => (
                <button key={t.id} onClick={() => { setTip(t.id); haptic(6); }} className={`min-w-0 rounded-2xl border p-3 text-left transition active:scale-[0.98] ${tip === t.id ? "border-ink bg-white" : "border-line bg-white/60"}`}>
                  <div className="text-[22px]">{t.emoji}</div>
                  <div className="mt-1 truncate text-[14px] text-ink">{t.name}</div>
                  <div className="truncate text-[11.5px] text-sub">{t.desc}</div>
                  <div className="mt-1.5 font-mono text-[13px] text-clay">¥{yuan(t.amount)}</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-2.5">
              {([
                ["unlock", "单次详批", "只解锁这一份，永久保存在档案里", UNLOCK_PRICE],
                ["pass", "松弛月卡", "30 天内所有深度详批随便看", PASS_PRICE],
              ] as const).map(([k, name, desc, price]) => (
                <button key={k} onClick={() => setPlan(k)} disabled={req.kind === "unlock" && !req.readingId && k === "unlock"} className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition active:scale-[0.99] disabled:opacity-40 ${plan === k ? "border-ink bg-white" : "border-line bg-white/60"}`}>
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${plan === k ? "border-ink" : "border-faint"}`}>{plan === k && <span className="h-2.5 w-2.5 rounded-full bg-ink" />}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] text-ink">{name}{k === "pass" && <span className="ml-2 rounded-full bg-clay-soft px-2 py-0.5 text-[10.5px] text-clay">更划算</span>}</div>
                    <div className="mt-0.5 truncate text-[12px] text-sub">{desc}</div>
                  </div>
                  <div className="shrink-0 font-mono text-[16px] text-ink">¥{yuan(price)}</div>
                </button>
              ))}
            </div>
          )}

          <div className="rounded-3xl bg-white p-4">
            <div className="mb-3 flex justify-center gap-1 rounded-full bg-sand/70 p-1">
              {(["wechat", "alipay"] as const).map((c) => (
                <button key={c} onClick={() => setChannel(c)} className={`flex-1 rounded-full py-1.5 text-[13px] transition ${channel === c ? "bg-white text-ink shadow-sm" : "text-sub"}`}>
                  {c === "wechat" ? "微信" : "支付宝"}
                </button>
              ))}
            </div>
            <div className="flex flex-col items-center">
              {!cfg && !cfgErr ? (
                <Skeleton className="h-44 w-44" />
              ) : qr ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qr} alt="收款码" className="h-44 w-44 rounded-xl object-contain" />
              ) : (
                <div className="flex h-44 w-44 flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-paper text-center">
                  <Logo size={40} className="text-faint" />
                  <div className="mt-3 px-4 text-[12px] leading-relaxed text-sub">扫码通道整理中<br />心意先记下，也算数</div>
                </div>
              )}
              <div className="mt-3 font-mono text-[22px] text-ink">¥{yuan(amount)}</div>
              <div className="text-[11.5px] text-sub">收款方 · {cfg?.payee ?? "算了 · Suanle"}</div>
            </div>
          </div>

          <button disabled={busy} onClick={confirm} className="w-full rounded-full bg-ink py-3.5 text-[15px] text-paper transition active:scale-[0.98] disabled:opacity-60">
            {busy ? "确认中…" : "我已付好了"}
          </button>
          <p className="text-center text-[11px] text-faint">自愿随喜，量力而行。付不付，小算都一样陪你。</p>
        </div>
      )}
    </Sheet>
  );
}
