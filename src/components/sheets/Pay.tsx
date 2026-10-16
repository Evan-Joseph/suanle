"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check } from "lucide-react";
import { profileHint, useApp, useUI } from "@/lib/store";
import { fmt, LAMP_PLANS, localAnalogy, TIP_TIERS, yuan } from "@/lib/meter";
import { haptic, playBowl } from "@/lib/sound";
import { Logo } from "../brand/Logo";
import { Icon } from "../icons";
import { GhostButton, PrimaryButton, Sheet } from "../ui";

interface Channel {
  id: "wechat" | "alipay";
  label: string;
  url: string;
  image: string;
}

let channelCache: Channel[] | null = null;

function useChannels(): Channel[] | null {
  const [list, setList] = useState<Channel[] | null>(channelCache);
  useEffect(() => {
    if (channelCache) return;
    let alive = true;
    fetch("/api/orders")
      .then((r) => r.json())
      .then((j: { channels?: Channel[] }) => {
        channelCache = j.channels ?? [];
        if (alive) setList(channelCache);
      })
      .catch(() => {
        if (alive) setList([]);
      });
    return () => {
      alive = false;
    };
  }, []);
  return list;
}

interface ClientEnv {
  inWeChat: boolean;
  inAlipay: boolean;
  inMiniProgram: boolean;
  isMobile: boolean;
}

function useClientEnv(): ClientEnv {
  const [env, setEnv] = useState<ClientEnv>({
    inWeChat: false,
    inAlipay: false,
    inMiniProgram: false,
    isMobile: false,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = navigator.userAgent.toLowerCase();
    const inWeChat = /micromessenger/.test(ua);
    const inAlipay = /alipayclient/.test(ua);
    const inMiniProgram =
      /miniprogram/.test(ua) ||
      (window as unknown as { __wxjs_environment?: string }).__wxjs_environment === "miniprogram";
    const isMobile = /mobile|android|iphone|ipad|phone/i.test(ua);
    setEnv({ inWeChat, inAlipay, inMiniProgram, isMobile });
  }, []);

  return env;
}

/** 扫码随喜 / 点灯的共用流程 */
function PayStep({ cents, label, kind, tier, onPaid, onBack }: { cents: number; label: string; kind: "tip" | "lamp"; tier: string; onPaid: () => void; onBack: () => void }) {
  const channels = useChannels();
  const [ch, setCh] = useState<"wechat" | "alipay">("wechat");
  const [busy, setBusy] = useState(false);
  const env = useClientEnv();
  const cur = channels?.find((c) => c.id === ch) ?? channels?.[0];

  const isInsideContainer = env.inWeChat || env.inAlipay || env.inMiniProgram;
  const canShowJump = env.isMobile && !isInsideContainer;

  const alipayDeepLink = cur?.url
    ? `alipays://platformapi/startapp?saId=10000007&qrcode=${encodeURIComponent(cur.url)}`
    : "";

  return (
    <div className="pb-2">
      <div className="mx-auto grid w-[220px] grid-cols-2 rounded-full bg-ink/[0.05] p-1">
        {(["wechat", "alipay"] as const).map((id) => (
          <button key={id} type="button" onClick={() => setCh(id)} className={`h-8 rounded-full text-[13px] transition ${ch === id ? "bg-card font-semibold text-ink shadow-sm" : "text-mute"}`}>
            {id === "wechat" ? "微信" : "支付宝"}
          </button>
        ))}
      </div>
      <div className="mt-5 flex flex-col items-center">
        <div className="relative grid h-[212px] w-[212px] place-items-center rounded-[24px] bg-white p-4 shadow-[0_6px_24px_rgba(0,0,0,0.08)]">
          {cur?.url ? (
            <QRCodeSVG
              value={cur.url}
              size={180}
              level="M"
              bgColor="#ffffff"
              fgColor="#1a1a1a"
              className="h-full w-full"
            />
          ) : (
            <div className="skeleton h-full w-full rounded-xl" />
          )}
        </div>
        <div className="mt-4 font-song text-[22px] font-bold">{yuan(cents)}</div>
        <div className="mt-0.5 text-[13px] text-ink-2">{label}</div>

        {/* 智能情境提示与跳转超链接（检测到微信、支付宝或小程序时自动隐藏跳转超链接） */}
        {env.inWeChat && ch === "wechat" && (
          <p className="mt-3 max-w-[280px] text-center text-[12px] leading-relaxed text-ink-2">
            当前在微信内，<b>长按上方二维码</b>即可直接识别并随喜。
          </p>
        )}
        {env.inWeChat && ch === "alipay" && (
          <p className="mt-3 max-w-[280px] text-center text-[12px] leading-relaxed text-mute">
            当前在微信内，可截图保存上方二维码后，使用支付宝扫码。
          </p>
        )}
        {env.inAlipay && ch === "alipay" && (
          <p className="mt-3 max-w-[280px] text-center text-[12px] leading-relaxed text-ink-2">
            当前在支付宝内，<b>长按上方二维码</b>即可直接付款。
          </p>
        )}
        {env.inAlipay && ch === "wechat" && (
          <p className="mt-3 max-w-[280px] text-center text-[12px] leading-relaxed text-mute">
            当前在支付宝内，可截图保存上方二维码后，使用微信扫码。
          </p>
        )}
        {env.inMiniProgram && (
          <p className="mt-3 max-w-[280px] text-center text-[12px] leading-relaxed text-ink-2">
            当前在小程序中，请长按或截图保存二维码进行支付。
          </p>
        )}
        {!isInsideContainer && (
          <>
            <p className="mt-3 max-w-[280px] text-center text-[12px] leading-relaxed text-mute">
              {env.isMobile ? "长按保存二维码，或点击下方按钮直接打开 App 支付：" : `用手机${ch === "wechat" ? "微信" : "支付宝"}扫一扫，填上这个金额就好。`}
            </p>
            {canShowJump && ch === "alipay" && alipayDeepLink && (
              <a
                href={alipayDeepLink}
                className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[12.5px] font-medium text-on-ink shadow-sm transition hover:opacity-90 active:scale-[0.98]"
              >
                <span>打开支付宝 App 支付 →</span>
              </a>
            )}
            {canShowJump && ch === "wechat" && (
              <a
                href="weixin://"
                className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-ink/[0.08] px-4 py-2 text-[12.5px] font-medium text-ink transition hover:bg-ink/[0.12] active:scale-[0.98]"
              >
                <span>打开微信（相册扫码）→</span>
              </a>
            )}
          </>
        )}
      </div>
      <div className="mt-5 space-y-1">
        <PrimaryButton
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ anonId: useApp.getState().anonId, kind, tier, amountCents: cents, channel: ch }) });
            } catch {
              /* 心意已到 */
            }
            setBusy(false);
            onPaid();
          }}
        >
          {kind === "lamp" ? "我已付好，点灯" : "我已完成随喜"}
        </PrimaryButton>
        <GhostButton onClick={onBack}>换个心意</GhostButton>
      </div>
    </div>
  );
}

function Thanks({ title, sub, onClose }: { title: string; sub: string; onClose: () => void }) {
  return (
    <div className="flex flex-col items-center pb-4 pt-4 text-center">
      <div className="text-ink">
        <Logo size={76} mood="smile" />
      </div>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 font-song text-[24px] font-bold">
        {title}
      </motion.div>
      <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="mt-2 max-w-[290px] text-[14px] leading-relaxed text-ink-2">
        {sub}
      </motion.p>
      <PrimaryButton onClick={onClose} className="mt-8">
        好
      </PrimaryButton>
    </div>
  );
}

function TipContent({ tokens, single, onClose }: { tokens: number; single: boolean; onClose: () => void }) {
  const hint = useApp((s) => profileHint(s.profile));
  const count = useApp((s) => s.merit.count);
  const [tier, setTier] = useState<string>("latte");
  const [custom, setCustom] = useState("");
  const [step, setStep] = useState<"choose" | "pay" | "thanks">("choose");
  const items = localAnalogy(tokens, hint, 3, 1);
  const chosen = TIP_TIERS.find((t) => t.id === tier);
  const customCents = Math.round((Number(custom) || 0) * 100);
  const cents = tier === "custom" ? customCents : chosen?.cents ?? 0;
  const label = tier === "custom" ? "一份随心的心意" : chosen?.label ?? "";

  if (step === "thanks") return <Thanks title="收到啦。" sub={count > 1 ? `这是你第 ${count} 次随喜。小馆的灯，因为你又亮了一些。` : "这份心意，小馆记着。愿你今天也轻松一点。"} onClose={onClose} />;
  if (step === "pay")
    return (
      <PayStep
        cents={cents}
        label={label}
        kind="tip"
        tier={tier}
        onBack={() => setStep("choose")}
        onPaid={() => {
          useApp.getState().addMerit(cents);
          haptic([10, 40, 20]);
          playBowl();
          setStep("thanks");
        }}
      />
    );
  return (
    <div className="pb-2">
      {tokens > 0 ? (
        <div className="rounded-[20px] bg-paper-2/70 p-4">
          <div className="text-[13px] text-ink-2">
            {single ? "这一条回复用了" : "到现在，你在这里用了"} <b className="font-song text-[17px] text-ink">{fmt(tokens)}</b> 算力，大约是
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {items.map((it) => (
              <span key={it.text} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-card px-3 text-[13px] text-ink">
                <span aria-hidden>{it.emoji}</span>
                {it.text}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-[14px] leading-relaxed text-ink-2">小馆一直开着，靠的是每一份自愿的心意。</p>
      )}
      <div className="mb-2.5 mt-5 text-[13px] text-mute">觉得有点用的话，随喜一份心意：</div>
      <div className="grid grid-cols-2 gap-2.5">
        {TIP_TIERS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTier(t.id)}
            className={`relative flex items-center gap-3 rounded-[18px] border p-3 text-left transition active:scale-[0.97] ${tier === t.id ? "border-ink bg-card shadow-[0_4px_14px_rgba(0,0,0,0.06)]" : "border-line bg-card/60"}`}
          >
            <span className="text-[24px] leading-none" aria-hidden>
              {t.emoji}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13.5px] font-semibold text-ink">{t.label}</span>
              <span className="mt-0.5 block text-[11.5px] text-mute">
                {yuan(t.cents)} · {t.sub}
              </span>
            </span>
            {tier === t.id && (
              <span className="absolute right-2 top-2 grid h-4 w-4 place-items-center rounded-full bg-ink text-on-ink">
                <Icon as={Check} size={10} strong />
              </span>
            )}
          </button>
        ))}
      </div>
      <label className={`mt-2.5 flex h-12 items-center gap-2 rounded-[18px] border px-4 transition ${tier === "custom" ? "border-ink bg-card" : "border-line bg-card/60"}`}>
        <span className="text-[13.5px] text-ink-2">随心</span>
        <span className="text-[15px] text-mute">¥</span>
        <input
          inputMode="decimal"
          value={custom}
          onFocus={() => setTier("custom")}
          onChange={(e) => setCustom(e.target.value.replace(/[^\d.]/g, "").slice(0, 7))}
          placeholder="自己定"
          className="h-full min-w-0 flex-1 bg-transparent text-[16px] text-ink outline-none placeholder:text-faint"
        />
      </label>
      <PrimaryButton onClick={() => setStep("pay")} disabled={cents < 100} className="mt-5">
        随喜 {cents >= 100 ? yuan(cents) : ""}
      </PrimaryButton>
      <p className="mt-3 text-center text-[11.5px] text-mute">全凭心意。不随喜，也一样好好陪你。</p>
    </div>
  );
}

export function TipSheet() {
  const open = useUI((s) => s.sheet === "tip");
  const payload = useUI((s) => s.sheetPayload);
  const close = useUI((s) => s.close);
  const total = useApp((s) => s.usage.total);
  const single = typeof payload?.tokens === "number";
  const tokens = single ? (payload?.tokens as number) : total;
  return (
    <Sheet open={open} onClose={close} title="随喜">
      <TipContent tokens={tokens} single={single} onClose={close} />
    </Sheet>
  );
}

function Flame() {
  return (
    <svg viewBox="0 0 64 96" width="56" height="84" aria-hidden>
      <motion.path
        d="M32 8 C40 24 48 32 48 48 C48 58 41 66 32 66 C23 66 16 58 16 48 C16 34 26 26 32 8 Z"
        fill="#e8a24a"
        animate={{ scaleY: [1, 1.06, 0.97, 1.04, 1], scaleX: [1, 0.96, 1.03, 0.98, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
      />
      <motion.path
        d="M32 30 C36 38 40 42 40 50 C40 56 36 60 32 60 C28 60 24 56 24 50 C24 43 29 39 32 30 Z"
        fill="#fbe3a6"
        animate={{ scaleY: [1, 1.08, 0.95, 1] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
      />
      <rect x="22" y="66" width="20" height="22" rx="3" fill="var(--ink)" />
      <rect x="16" y="86" width="32" height="5" rx="2.5" fill="var(--ink)" />
    </svg>
  );
}

function LampContent({ reason, onClose }: { reason?: string; onClose: () => void }) {
  const lampUntil = useApp((s) => s.merit.lampUntil);
  const [plan, setPlan] = useState<string>("month");
  const [step, setStep] = useState<"choose" | "pay" | "thanks">("choose");
  const p = LAMP_PLANS.find((x) => x.id === plan) ?? LAMP_PLANS[1];
  const [now] = useState(() => Date.now());
  const lit = lampUntil > now;
  const until = new Date(lampUntil);
  const untilText = `${until.getFullYear()}.${until.getMonth() + 1}.${until.getDate()}`;

  if (step === "thanks") return <Thanks title="灯点上了。" sub={`会一直亮到 ${untilText}。这段日子，想深聊的时候，随时来。`} onClose={onClose} />;
  if (step === "pay")
    return (
      <PayStep
        cents={p.cents}
        label={`${p.label} · ${p.days} 天`}
        kind="lamp"
        tier={p.id}
        onBack={() => setStep("choose")}
        onPaid={() => {
          useApp.getState().addMerit(p.cents, p.days);
          haptic([10, 40, 20]);
          playBowl();
          setStep("thanks");
        }}
      />
    );
  return (
    <div className="pb-2">
      <div className="flex flex-col items-center text-center">
        <Flame />
        <div className="mt-2 font-song text-[19px] font-bold">
          {reason === "deep" ? "今天的三次深度推演用完了" : reason === "annual" ? "年度盘需要一次深度推演" : lit ? `长明灯亮着，至 ${untilText}` : "点一盏长明灯"}
        </div>
        <p className="mt-1.5 max-w-[300px] text-[13.5px] leading-relaxed text-ink-2">灯亮着的日子里，想往深处聊多少次都行。</p>
      </div>
      <ul className="mt-5 space-y-2 rounded-[20px] bg-paper-2/70 p-4 text-[13.5px] text-ink">
        {["深度推演不限次数，篇幅更从容", "年度盘随时重排，不占次数", "续灯时间自动顺延，不会浪费"].map((t) => (
          <li key={t} className="flex items-center gap-2.5">
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ink text-on-ink">
              <Icon as={Check} size={11} strong />
            </span>
            {t}
          </li>
        ))}
      </ul>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {LAMP_PLANS.map((x) => (
          <button
            key={x.id}
            type="button"
            onClick={() => setPlan(x.id)}
            className={`relative flex flex-col items-center rounded-[18px] border px-1 pb-3 pt-4 transition active:scale-[0.97] ${plan === x.id ? "border-ink bg-card shadow-[0_4px_14px_rgba(0,0,0,0.06)]" : "border-line bg-card/60"}`}
          >
            {"hot" in x && x.hot && <span className="absolute -top-2 rounded-full bg-seal px-2 py-px text-[10px] text-white">常选</span>}
            <span className="text-[13px] text-ink-2">{x.label}</span>
            <span className="mt-1 font-song text-[20px] font-bold">{yuan(x.cents)}</span>
            <span className="mt-0.5 text-[10.5px] text-mute">{x.sub}</span>
          </button>
        ))}
      </div>
      <PrimaryButton onClick={() => setStep("pay")} className="mt-5">
        {lit ? "续一盏" : "点灯"} {yuan(p.cents)}
      </PrimaryButton>
      <p className="mt-3 text-center text-[11.5px] text-mute">不点灯也没关系：每天 3 次深度推演，明天就回来。</p>
    </div>
  );
}

export function LampSheet() {
  const open = useUI((s) => s.sheet === "lamp");
  const payload = useUI((s) => s.sheetPayload);
  const close = useUI((s) => s.close);
  return (
    <Sheet open={open} onClose={close} title="长明灯">
      <LampContent reason={typeof payload?.reason === "string" ? payload.reason : undefined} onClose={close} />
    </Sheet>
  );
}
