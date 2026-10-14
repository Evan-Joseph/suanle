"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Crown, Lock, ScanLine, Sparkles, X } from "lucide-react";
import QRCode from "qrcode";
import { PLANS, useStore, type PayMethod, type PlanId } from "@/lib/store";
import { LogoMark } from "./brand";

// ———————————————— Context ————————————————
export interface PaywallOpts {
  context?: "reading" | "tavern" | "wave" | "compat" | "general";
  readingId?: string;
  headline?: string;
  subline?: string;
}

interface PaywallCtx { open: (opts?: PaywallOpts) => void; close: () => void }
const Ctx = createContext<PaywallCtx | null>(null);

export function usePaywall(): PaywallCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePaywall 必须在 PaywallProvider 内使用");
  return ctx;
}

const HEADLINES: Record<string, { h: string; s: string }> = {
  reading: { h: "这一卦，还有下半卷", s: "解开四大板块深度解语与人生能量全波段" },
  tavern:  { h: "挚友还想陪你多聊会儿", s: "升级后，酒馆深聊不再计次" },
  wave:    { h: "看清一生的潮汐走向", s: "解开 1 – 100 岁能量波段与四大关口批注" },
  compat:  { h: "两个人的命盘，值得细看", s: "解开缘分指数、相处心法与雷区地图" },
  general: { h: "把松弛感，升个级", s: "一次解锁全部深度权益" },
};

const FREE_PERKS = ["每日解语与今日宜忌", "运势气温与幸运风物", "木鱼与纸篓解压小筑", "酒馆挚友每日 8 次深聊"];
const PRO_PERKS = ["四大板块深度解语 · 不限次", "人生能量波段（1–100 岁全图）", "双人缘分合盘 · 不限对象", "酒馆挚友不限次深聊", "专属灵验分享签 · 高清保存"];

const METHODS: { id: PayMethod; label: string; note: string; node: ReactNode }[] = [
  {
    id: "wechat", label: "微信支付", note: "推荐使用",
    node: (
      <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#07C160]">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="#fff">
          <path d="M9.2 4C5.4 4 2.5 6.5 2.5 9.7c0 1.8 1 3.4 2.5 4.5l-.6 2 2.2-1.2c.7.2 1.4.3 2.1.3h.4A5.9 5.9 0 0 1 9 14.4C9 11.3 12 8.8 15.4 8.8h.5C15.3 6 12.5 4 9.2 4Zm-2.4 3.4a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8Zm4.8 0a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8Z"/>
          <path d="M21.5 14.4c0-2.7-2.4-4.9-5.4-4.9s-5.4 2.2-5.4 4.9 2.4 4.9 5.4 4.9c.6 0 1.2-.1 1.8-.3l1.9 1-.5-1.7c1.4-1 2.2-2.4 2.2-3.9Zm-7.2-.9a.8.8 0 1 1 0-1.6.8.8 0 0 1 0 1.6Zm3.6 0a.8.8 0 1 1 0-1.6.8.8 0 0 1 0 1.6Z"/>
        </svg>
      </span>
    ),
  },
  {
    id: "alipay", label: "支付宝", note: "花呗可用",
    node: (
      <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#1677FF]">
        <span className="font-display text-[17px] font-bold leading-none text-white">支</span>
      </span>
    ),
  },
  {
    id: "apple", label: "Apple Pay", note: "面容确认",
    node: (
      <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-ink">
        <svg viewBox="0 0 24 24" width="17" height="17" fill="#FAF9F6">
          <path d="M16.7 12.9c0-2.4 2-3.6 2.1-3.6-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.1 1-4 2.4-1.7 2.9-.4 7.3 1.2 9.7.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8s1.9.8 3.2.8c1.3 0 2.2-1.2 3-2.4a10 10 0 0 0 1.4-2.8c-.1 0-2.6-1-2.6-3.9ZM14.4 5.9c.6-.8 1.1-1.9 1-3-1 0-2.1.6-2.8 1.4-.6.7-1.2 1.9-1 3 1 .1 2.1-.6 2.8-1.4Z"/>
        </svg>
      </span>
    ),
  },
];

function formatUntil(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`;
}

type Step = "plans" | "pay" | "qr" | "processing" | "success";

export function PaywallProvider({ children }: { children: ReactNode }) {
  const store = useStore();
  const [opts, setOpts] = useState<PaywallOpts>({});
  const [openFlag, setOpenFlag] = useState(false);
  const [step, setStep] = useState<Step>("plans");
  const [plan, setPlan] = useState<PlanId>("yearly");
  const [method, setMethod] = useState<PayMethod>("wechat");
  const [qrSrc, setQrSrc] = useState<string>("");
  const [orderId, setOrderId] = useState("");
  const [paidPlan, setPaidPlan] = useState<PlanId>("yearly");

  const ctx = useMemo<PaywallCtx>(() => ({
    open: (o = {}) => {
      setOpts(o);
      setPlan(o.readingId ? "single" : "yearly");
      setMethod("wechat");
      setStep("plans");
      setOpenFlag(true);
    },
    close: () => setOpenFlag(false),
  }), []);

  // 生成支付二维码 + 模拟扫码回调
  useEffect(() => {
    if (step !== "qr") return;
    const preview = "PAY" + Date.now().toString(36).toUpperCase();
    if (method !== "apple") {
      QRCode.toDataURL(`https://suanle.app/checkout/${preview}`, {
        width: 560, margin: 1,
        color: { dark: "#262626", light: "#00000000" },
      }).then(setQrSrc).catch(() => setQrSrc(""));
    }
    const t1 = setTimeout(() => setStep("processing"), method === "apple" ? 2600 : 3600);
    return () => clearTimeout(t1);
  }, [step, method]);

  // 支付成功：写入权益状态机
  useEffect(() => {
    if (step !== "processing") return;
    const t = setTimeout(() => {
      const methodLabel = METHODS.find((m) => m.id === method)?.label ?? "";
      store.purchase(plan, method, methodLabel, opts.readingId);
      setPaidPlan(plan);
      setOrderId("SL" + Date.now().toString().slice(-10));
      setStep("success");
    }, 1100);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const copy = { ...HEADLINES[opts.context ?? "general"] };
  if (opts.headline) copy.h = opts.headline;
  if (opts.subline) copy.s = opts.subline;

  const planList: PlanId[] = opts.readingId
    ? ["single", "monthly", "yearly"]
    : ["monthly", "yearly"];

  const confetti = useMemo(() => {
    if (step !== "success") return [];
    const palette = ["#B9714B", "#7E97A8", "#7FA78D", "#A9884F", "#D9A583"];
    return Array.from({ length: 18 }, (_, i) => ({
      i,
      x: 50 + (Math.sin(i * 2.7) * 46),
      y: 46 + (Math.cos(i * 1.9) * 40),
      color: palette[i % palette.length],
      size: 5 + (i % 3) * 3,
      delay: (i % 6) * 0.05,
    }));
  }, [step]);

  const planDesc = (id: PlanId) => PLANS[id];

  return (
    <Ctx.Provider value={ctx}>
      {children}
      <AnimatePresence>
        {openFlag && (
          <motion.div
            className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-6"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-ink/35 backdrop-blur-[6px]"
              onClick={() => step !== "processing" && ctx.close()}
            />
            <motion.div
              className="relative flex max-h-[92dvh] w-full max-w-[480px] flex-col overflow-hidden rounded-t-[2rem] border border-line bg-paper shadow-lift sm:rounded-[2rem]"
              initial={{ y: 60, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
            >
              {/* 头部 */}
              <div className="relative border-b border-line/70 px-7 pb-5 pt-7">
                <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-card to-transparent" aria-hidden />
                <button
                  onClick={ctx.close}
                  className="absolute right-5 top-5 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-line bg-paper text-ink2 transition hover:bg-card"
                  aria-label="关闭"
                >
                  <X size={15} />
                </button>
                <div className="relative flex items-center gap-3">
                  <LogoMark size={30} />
                  <span className="vertical-rl font-display text-[10px] tracking-[0.4em] text-faint">算了会员</span>
                </div>
                <h2 className="relative mt-3 font-display text-[26px] font-bold leading-snug tracking-wide">{copy.h}</h2>
                <p className="relative mt-1.5 text-[13px] leading-relaxed text-ink2">{copy.s}</p>
              </div>

              <div className="overflow-y-auto px-7 py-6">
                <AnimatePresence mode="wait">
                  {/* ————— 方案 ————— */}
                  {step === "plans" && (
                    <motion.div key="plans" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.28 }}>
                      <div className="flex flex-col gap-3">
                        {planList.map((id) => {
                          const p = planDesc(id);
                          const selected = plan === id;
                          const current = store.isPro && store.state.member.plan === id;
                          return (
                            <button
                              key={id}
                              onClick={() => setPlan(id)}
                              className={`relative flex items-center gap-4 rounded-3xl border p-4 text-left transition-all duration-200 ${
                                selected ? "border-ink bg-card shadow-soft" : "border-line bg-paper hover:border-faint/60"
                              }`}
                            >
                              {p.tag && (
                                <span className={`absolute -top-2.5 left-5 rounded-full px-2.5 py-0.5 text-[10px] tracking-wider text-paper ${id === "yearly" ? "bg-terra" : "bg-haze"}`}>
                                  {p.tag}
                                </span>
                              )}
                              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${selected ? "border-ink bg-ink" : "border-line"}`}>
                                {selected && <Check size={11} strokeWidth={3.5} className="text-paper" />}
                              </span>
                              <span className="flex-1">
                                <span className="flex items-baseline gap-2">
                                  <span className="text-[15px] font-medium">{p.name}</span>
                                  {current && <span className="rounded-full bg-mint2 px-2 py-0.5 text-[10px] text-ink2">当前方案</span>}
                                </span>
                                <span className="mt-0.5 block text-[11.5px] leading-relaxed text-faint">{p.desc}</span>
                              </span>
                              <span className="text-right">
                                <span className="tabular block font-display text-[22px] font-bold">
                                  <span className="text-[13px]">¥</span>{p.price}
                                </span>
                                <span className="tabular block text-[11px] text-faint line-through">¥{p.orig}</span>
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* 权益对比 */}
                      <div className="mt-5 grid grid-cols-2 gap-3 rounded-3xl border border-line bg-card/70 p-4">
                        <div>
                          <p className="flex items-center gap-1.5 text-[11px] tracking-[0.2em] text-faint"><Sparkles size={12} /> 免费体验</p>
                          <ul className="mt-2.5 space-y-1.5">
                            {FREE_PERKS.map((t) => <li key={t} className="text-[11.5px] leading-snug text-ink2">· {t}</li>)}
                          </ul>
                        </div>
                        <div className="border-l border-line pl-3">
                          <p className="flex items-center gap-1.5 text-[11px] tracking-[0.2em] text-gold"><Crown size={12} /> 深度权益</p>
                          <ul className="mt-2.5 space-y-1.5">
                            {PRO_PERKS.map((t) => <li key={t} className="text-[11.5px] leading-snug text-ink">· {t}</li>)}
                          </ul>
                        </div>
                      </div>

                      <button className="btn-ink mt-5 h-12 w-full text-[15px]" onClick={() => setStep("pay")}>
                        {store.isPro && plan !== store.state.member.plan ? "更换为" : plan === "single" ? "解锁本卦" : "开通"} · ¥{planDesc(plan).price}
                      </button>
                      <p className="mt-3 text-center text-[10.5px] leading-relaxed text-faint">
                        支付即代表同意《算了会员服务协议》· 随时可在「我的」管理
                      </p>
                    </motion.div>
                  )}

                  {/* ————— 支付方式 ————— */}
                  {step === "pay" && (
                    <motion.div key="pay" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.28 }}>
                      <div className="flex items-baseline justify-between rounded-3xl border border-line bg-card/70 px-5 py-4">
                        <div>
                          <p className="text-[13px] text-ink2">{planDesc(plan).name}</p>
                          <p className="mt-0.5 text-[11px] text-faint">{planDesc(plan).desc}</p>
                        </div>
                        <p className="tabular font-display text-2xl font-bold">¥{planDesc(plan).price}</p>
                      </div>

                      <div className="mt-4 flex flex-col gap-2.5">
                        {METHODS.map((m) => (
                          <button
                            key={m.id}
                            onClick={() => setMethod(m.id)}
                            className={`flex items-center gap-3.5 rounded-2xl border p-3.5 transition ${method === m.id ? "border-ink bg-card" : "border-line hover:border-faint/60"}`}
                          >
                            {m.node}
                            <span className="flex-1 text-left">
                              <span className="block text-[14px] font-medium">{m.label}</span>
                              <span className="text-[11px] text-faint">{m.note}</span>
                            </span>
                            <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${method === m.id ? "border-ink bg-ink" : "border-line"}`}>
                              {method === m.id && <Check size={11} strokeWidth={3.5} className="text-paper" />}
                            </span>
                          </button>
                        ))}
                      </div>

                      <button className="btn-ink mt-5 h-12 w-full text-[15px]" onClick={() => setStep("qr")}>
                        去支付 ¥{planDesc(plan).price}
                      </button>
                      <button className="mt-2.5 w-full py-1 text-center text-[12px] text-faint" onClick={() => setStep("plans")}>
                        返回修改方案
                      </button>
                    </motion.div>
                  )}

                  {/* ————— 收银台：扫码 / 确认 ————— */}
                  {step === "qr" && (
                    <motion.div key="qr" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.28 }} className="flex flex-col items-center pb-2">
                      {method !== "apple" ? (
                        <>
                          <div className="relative flex h-[228px] w-[228px] items-center justify-center overflow-hidden rounded-3xl border border-line bg-white p-4">
                            {qrSrc ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={qrSrc} alt="支付二维码" className="h-full w-full" />
                            ) : (
                              <span className="h-[180px] w-[180px] animate-pulse rounded-2xl bg-card" />
                            )}
                            <motion.span
                              className="absolute inset-x-4 h-[2px] rounded bg-terra/70"
                              animate={{ top: ["12%", "86%", "12%"] }}
                              transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                            />
                          </div>
                          <p className="mt-4 flex items-center gap-2 text-[13px] text-ink2">
                            <ScanLine size={15} className="text-terra" />
                            请使用{method === "wechat" ? "微信" : "支付宝"}扫一扫完成支付
                          </p>
                        </>
                      ) : (
                        <div className="w-full rounded-3xl border border-line bg-ink px-6 py-8 text-center text-paper">
                          <p className="font-display text-lg tracking-widest">连按侧边按钮</p>
                          <p className="mt-1.5 text-xs text-paper/60">通过面容 ID 确认支付 ¥{planDesc(plan).price}</p>
                          <div className="mx-auto mt-5 h-1.5 w-28 animate-pulse rounded-full bg-paper/30" />
                        </div>
                      )}
                      <p className="mt-3 flex items-center gap-2 text-[11px] text-faint">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-mint" />
                        正在等待支付结果…
                      </p>
                      <button className="mt-4 text-[12px] text-faint underline underline-offset-4" onClick={() => setStep("pay")}>
                        更换支付方式
                      </button>
                    </motion.div>
                  )}

                  {/* ————— 处理中 ————— */}
                  {step === "processing" && (
                    <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-12">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}>
                        <LogoMark size={52} className="opacity-80" />
                      </motion.div>
                      <p className="mt-6 text-[13px] tracking-[0.3em] text-ink2">正在确认支付结果</p>
                    </motion.div>
                  )}

                  {/* ————— 成功 ————— */}
                  {step === "success" && (
                    <motion.div key="success" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="relative flex flex-col items-center pb-2">
                      <div className="relative flex h-24 w-24 items-center justify-center">
                        {confetti.map((c) => (
                          <motion.span
                            key={c.i}
                            className="absolute left-1/2 top-1/2 rounded-full"
                            style={{ background: c.color, width: c.size, height: c.size }}
                            initial={{ x: 0, y: 0, opacity: 1 }}
                            animate={{ x: c.x - 50, y: c.y - 46, opacity: 0 }}
                            transition={{ duration: 1.1, delay: c.delay, ease: "easeOut" }}
                          />
                        ))}
                        <motion.span
                          className="flex h-20 w-20 items-center justify-center rounded-full bg-mint"
                          initial={{ scale: 0 }} animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 300, damping: 16 }}
                        >
                          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.18, type: "spring", stiffness: 400, damping: 18 }}>
                            <Check size={34} strokeWidth={3} className="text-paper" />
                          </motion.span>
                        </motion.span>
                      </div>
                      <h3 className="mt-5 font-display text-[22px] font-bold tracking-wide">
                        {paidPlan === "single" ? "本卦已解开" : "欢迎回来，Pro 旅人"}
                      </h3>
                      <p className="mt-1.5 text-[12.5px] text-ink2">
                        {paidPlan === "single" ? "这卷命书已完整向你展开，随时回看" : "深度权益已全部生效，慢慢享用"}
                      </p>

                      <div className="mt-5 w-full rounded-3xl border border-line bg-card/70 px-5 py-4 text-[12px] leading-relaxed">
                        <div className="flex justify-between"><span className="text-faint">订单编号</span><span className="tabular">{orderId}</span></div>
                        <div className="mt-2 flex justify-between"><span className="text-faint">权益内容</span><span>{planDesc(paidPlan).name}</span></div>
                        <div className="mt-2 flex justify-between"><span className="text-faint">实付金额</span><span className="tabular">¥{planDesc(paidPlan).price}</span></div>
                        {paidPlan !== "single" && (
                          <div className="mt-2 flex justify-between">
                            <span className="text-faint">有效期至</span>
                            <span>{formatUntil(store.state.member.until)}</span>
                          </div>
                        )}
                      </div>

                      <button className="btn-ink mt-5 h-12 w-full text-[15px]" onClick={ctx.close}>
                        收下这份松弛
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Ctx.Provider>
  );
}

/** 深度内容锁：模糊占位 + 解锁引导 */
export function Locked({
  title, desc, onOpen, cta = "解开这一卷",
}: { title: string; desc: string; onOpen: () => void; cta?: string }) {
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-line bg-card/60 p-6">
      <div className="blur-locked select-none space-y-2.5" aria-hidden>
        <div className="h-4 w-3/4 rounded-full bg-faint/30" />
        <div className="h-3 w-full rounded-full bg-faint/25" />
        <div className="h-3 w-11/12 rounded-full bg-faint/25" />
        <div className="h-3 w-4/5 rounded-full bg-faint/25" />
        <div className="h-16 w-full rounded-2xl bg-faint/20" />
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-paper/45 p-6 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-paper shadow-soft">
          <Lock size={17} className="text-ink2" />
        </span>
        <p className="font-display text-[16px] font-semibold tracking-wide">{title}</p>
        <p className="max-w-[280px] text-[12px] leading-relaxed text-ink2">{desc}</p>
        <button className="btn-ink mt-1 h-10 px-6 text-[13px]" onClick={onOpen}>{cta}</button>
      </div>
    </div>
  );
}
