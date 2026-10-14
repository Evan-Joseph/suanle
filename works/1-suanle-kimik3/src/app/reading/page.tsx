"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Heart, RefreshCcw, Share2, Sparkles, Users } from "lucide-react";
import { EnergyChart } from "@/components/energy-chart";
import { Locked, usePaywall } from "@/components/paywall";
import { ShareCardModal, type ShareCardData } from "@/components/share-card";
import { ELEMENT_META, ELEMENT_ORDER } from "@/lib/copy";
import {
  HOURS, birthLabel, buildCompat, buildReport, buildWave, elementCn,
  type BirthProfile, type CompatResult, type ReadingReport, type LifeWave,
} from "@/lib/fortune";
import { cnDate, todayKey } from "@/lib/rand";
import { defaultProfile, useStore } from "@/lib/store";

// ———————————————— 起卦仪式 ————————————————
const RITUAL_LINES = ["正在铺开命盘…", "正在丈量五行气流…", "正在校准百年潮汐…", "正在与时间和解…"];

function Ritual({ onDone }: { onDone: () => void }) {
  const [line, setLine] = useState(0);
  useEffect(() => {
    const t1 = setInterval(() => setLine((l) => (l + 1) % RITUAL_LINES.length), 820);
    const t2 = setTimeout(onDone, 3300);
    return () => { clearInterval(t1); clearTimeout(t2); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <motion.div
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-paper"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.5 } }}
    >
      <div className="relative flex h-64 w-64 items-center justify-center">
        <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full animate-slowspin">
          <circle cx="100" cy="100" r="94" fill="none" stroke="#E6E1D6" strokeWidth="1.5" strokeDasharray="2 9" />
        </svg>
        <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full animate-slowspin-r">
          <circle cx="100" cy="100" r="78" fill="none" stroke="#D9CDB6" strokeWidth="1.2" strokeDasharray="14 22" />
        </svg>
        <svg viewBox="0 0 1024 1024" className="h-24 w-24">
          <g fill="#262626">
            {[0, 1, 2].flatMap((r) => [0, 1].map((c) => (
              <motion.rect
                key={`${r}${c}`}
                x={c === 0 ? 248 : 560} y={248 + r * 108} width={216} height={74} rx={6}
                initial={{ opacity: 0, scaleX: 0.1 }}
                animate={{ opacity: 1, scaleX: 1 }}
                style={{ originX: "512px" }}
                transition={{ delay: 0.22 * (r * 2 + c), duration: 0.4 }}
              />
            )))}
          </g>
          <motion.path
            d="M 264 600 C 264 776, 760 776, 760 600"
            fill="none" stroke="#262626" strokeWidth={64} strokeLinecap="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ delay: 1.6, duration: 1 }}
          />
        </svg>
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={line}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          className="mt-2 font-display text-[14px] tracking-[0.4em] text-ink2"
        >
          {RITUAL_LINES[line]}
        </motion.p>
      </AnimatePresence>
      <p className="mt-3 text-[11px] tracking-[0.3em] text-faint">深呼吸 · 放松肩膀</p>
    </motion.div>
  );
}

// ———————————————— 表单小控件 ————————————————
function Sel({ value, onChange, options, className = "" }: {
  value: number; onChange: (v: number) => void; options: { v: number; t: string }[]; className?: string;
}) {
  return (
    <select value={value} onChange={(e) => onChange(Number(e.target.value))} className={`field cursor-pointer appearance-none ${className}`}>
      {options.map((o) => <option key={o.v} value={o.v}>{o.t}</option>)}
    </select>
  );
}

const YEARS = Array.from({ length: 72 }, (_, i) => ({ v: 1940 + i, t: `${1940 + i} 年` })).reverse();
const MONTHS = Array.from({ length: 12 }, (_, i) => ({ v: i + 1, t: `${i + 1} 月` }));
const DAYS = Array.from({ length: 31 }, (_, i) => ({ v: i + 1, t: `${i + 1} 日` }));
const HOUR_OPTS = [...HOURS.map((h, i) => ({ v: i, t: `${h.label} · ${h.range}` })), { v: 12, t: "时辰随缘" }];

// ———————————————— 主页面 ————————————————
function ReadingInner() {
  const store = useStore();
  const { open } = usePaywall();
  const sp = useSearchParams();

  const [form, setForm] = useState<BirthProfile>(() => store.state.profile ?? defaultProfile());
  const [step, setStep] = useState<"form" | "ritual" | "report">("form");
  const [report, setReport] = useState<ReadingReport | null>(null);
  const [wave, setWave] = useState<LifeWave | null>(null);
  const [share, setShare] = useState<ShareCardData | null>(null);
  const [partner, setPartner] = useState<BirthProfile>({ name: "", gender: "secret", calType: "solar", year: 1998, month: 6, day: 6, hour: 6, city: "" });
  const [compat, setCompat] = useState<CompatResult | null>(null);
  const startedFromRecord = useRef(false);

  const unlocked = report ? store.isUnlocked(report.id) : false;

  const start = (p: BirthProfile) => {
    const profile = { ...p, name: p.name.trim() };
    store.setProfile(profile);
    const r = buildReport(profile);
    setReport(r);
    setWave(buildWave(profile));
    setCompat(null);
    setStep("ritual");
  };

  // 从「命书阁」回看
  useEffect(() => {
    if (startedFromRecord.current || !store.ready) return;
    const id = sp.get("id");
    if (!id) return;
    const rec = store.state.readings.find((r) => r.id === id);
    if (rec) {
      startedFromRecord.current = true;
      setForm(rec.profile);
      setReport(buildReport(rec.profile));
      setWave(buildWave(rec.profile));
      setStep("ritual");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.ready, sp]);

  // 记录足迹
  useEffect(() => {
    if (step === "report" && report) {
      store.addReading({
        id: report.id,
        createdAt: new Date().toISOString(),
        profile: { ...form },
        summary: report.oneLiner,
        archetype: report.archetype.name,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, report]);

  const favId = report ? `reading:${report.id}` : "";
  const isFav = store.state.favs.some((f) => f.id === favId);

  const openPay = (context: "reading" | "compat" | "wave", readingId?: string) =>
    open({ context, readingId });

  return (
    <div className="mx-auto max-w-[860px]">
      <AnimatePresence>{step === "ritual" && <Ritual onDone={() => setStep("report")} />}</AnimatePresence>

      {/* ————— 起卦表单 ————— */}
      {step === "form" && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[11px] tracking-[0.42em] text-faint">起一卦 · 全景推演</p>
          <h1 className="mt-5 font-display text-[34px] font-black leading-snug tracking-[0.05em] sm:text-[44px]">
            摆放好生辰，<br />把大势看个清楚<span className="text-terra">。</span>
          </h1>
          <p className="mt-5 max-w-[460px] text-[13.5px] leading-[1.95] text-ink2">
            年月日时各安其位，五行气流自会排开。看完你会明白：眼下的拧巴，多数只是时序未到。
          </p>

          <div className="panel mt-10 p-6 sm:p-8">
            <p className="text-[11px] tracking-[0.4em] text-faint">第一步 · 你是谁</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <input
                className="field" placeholder="怎么称呼你（可留白）"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                maxLength={12}
              />
              <div className="flex gap-2">
                {([["female", "女生"], ["male", "男生"], ["secret", "保密"]] as const).map(([v, t]) => (
                  <button
                    key={v}
                    onClick={() => setForm({ ...form, gender: v })}
                    className={`flex-1 rounded-2xl border py-2.5 text-[13px] transition ${form.gender === v ? "border-ink bg-ink text-paper" : "border-line bg-white/60 text-ink2 hover:border-faint/60"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <p className="text-[11px] tracking-[0.4em] text-faint">第二步 · 生于何时</p>
              <div className="flex rounded-full border border-line p-1">
                {(["solar", "lunar"] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setForm({ ...form, calType: c })}
                    className={`rounded-full px-4 py-1.5 text-[12px] transition ${form.calType === c ? "bg-ink text-paper" : "text-ink2"}`}
                  >
                    {c === "solar" ? "公历" : "农历"}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <Sel value={form.year} onChange={(year) => setForm({ ...form, year })} options={YEARS} />
              <Sel value={form.month} onChange={(month) => setForm({ ...form, month })} options={MONTHS} />
              <Sel value={form.day} onChange={(day) => setForm({ ...form, day })} options={DAYS} />
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Sel value={form.hour} onChange={(hour) => setForm({ ...form, hour: hour === 12 ? 6 : hour })} options={HOUR_OPTS} />
              <input className="field" placeholder="出生城市（如 杭州）" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} maxLength={10} />
            </div>

            <button className="btn-ink mt-8 h-13 w-full py-3.5 text-[15px]" onClick={() => start(form)}>
              摆放妥当 · 起卦
            </button>
            <p className="mt-3.5 text-center text-[11px] leading-relaxed text-faint">
              你的信息只存放在这台设备上 · 全程约三息，喝完一口茶的功夫
            </p>
          </div>
        </motion.div>
      )}

      {/* ————— 解卦报告 ————— */}
      {step === "report" && report && wave && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
          {/* 报告头 */}
          <div className="panel relative overflow-hidden p-7 sm:p-9">
            <span className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-mint2/40 blur-3xl" aria-hidden />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] tracking-[0.42em] text-faint">这一卦 · 写给 {form.name.trim() || "旅人"}</p>
                <h1 className="mt-4 font-display text-[30px] font-black tracking-[0.04em] sm:text-[38px]">
                  {report.archetype.name}
                </h1>
                <p className="mt-2 text-[12.5px] tracking-[0.2em] text-terra">{report.archetype.tag}</p>
              </div>
              <button onClick={() => setStep("form")} className="btn-ghost h-9 shrink-0 px-4 text-[12px]">
                <RefreshCcw size={13} /> 重新起卦
              </button>
            </div>
            <p className="mt-3 text-[11.5px] text-faint">{birthLabel(form)}</p>

            <p className="mt-7 border-l-[3px] border-terra/50 pl-4 font-display text-[19px] font-semibold leading-[1.9] sm:text-[21px]">
              「{report.oneLiner}」
            </p>

            <div className="mt-6 flex flex-wrap gap-2.5">
              <button
                onClick={() => store.toggleFav({ id: favId, text: report.oneLiner, date: todayKey(), from: `命书 · ${report.archetype.name}` })}
                className={`btn-ghost h-9 px-4 text-[12px] ${isFav ? "border-terra/50 text-terra" : ""}`}
              >
                <Heart size={13} fill={isFav ? "#B9714B" : "none"} /> {isFav ? "已收藏" : "收藏此卦"}
              </button>
              <button
                onClick={() => setShare({ quote: report.oneLiner, name: form.name.trim(), dateLabel: cnDate(), tag: "一卦一解" })}
                className="btn-ghost h-9 px-4 text-[12px]"
              >
                <Share2 size={13} /> 生成灵验签
              </button>
            </div>
          </div>

          {/* 五行气流 */}
          <section className="panel mt-6 p-7 sm:p-9">
            <p className="flex items-center gap-2 text-[11px] tracking-[0.4em] text-faint"><Sparkles size={13} className="text-gold" /> 你的五行气流</p>
            <div className="mt-6 space-y-4">
              {ELEMENT_ORDER.map((k, i) => {
                const e = report.vec.find((v) => v.key === k)!;
                const meta = ELEMENT_META[k];
                return (
                  <div key={k} className="flex items-center gap-4">
                    <span className="w-7 font-display text-[15px] font-bold" style={{ color: meta.color }}>{meta.cn}</span>
                    <div className="h-[13px] flex-1 overflow-hidden rounded-full bg-card2">
                      <motion.div
                        className="h-full rounded-full" style={{ background: meta.color }}
                        initial={{ width: 0 }} animate={{ width: `${e.pct * 2.2}%` }}
                        transition={{ delay: 0.3 + i * 0.12, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                    <span className="tabular w-10 text-right text-[12px] text-ink2">{e.pct}%</span>
                  </div>
                );
              })}
            </div>
            <p className="mt-6 text-[12.5px] leading-relaxed text-ink2">
              日主属<strong className="text-ink">{elementCn(report.master)}</strong> · 最旺是{elementCn(report.dom)}，最薄是{elementCn(report.weak)}。
              {ELEMENT_META[report.weak].nature}是你常年舍不得供养的部分，往后请刻意分它一杯羹。
            </p>
            <p className="mt-5 text-[12.5px] leading-[1.95] text-ink2">{report.archetype.profile}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {report.archetype.traits.map((t) => <span key={t} className="chip">{t}</span>)}
            </div>
          </section>

          {/* 四大板块 */}
          <p className="mb-4 mt-12 text-center text-[11px] tracking-[0.5em] text-faint">四大板块 · 深度解语</p>
          <div className="grid gap-5 sm:grid-cols-2">
            {(Object.keys(report.sections) as (keyof ReadingReport["sections"])[]).map((key, i) => {
              const s = report.sections[key];
              const card = (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.1, duration: 0.55 }}
                  className="panel flex h-full flex-col p-6"
                >
                  <p className="font-display text-[16px] font-bold tracking-wide">{s.title}</p>
                  <div className={unlocked ? "" : "blur-locked mt-3"}>
                    <p className="mt-3 flex-1 text-[13px] leading-[1.95] text-ink2">{s.body}</p>
                    <div className="mt-4 rounded-2xl border border-terra/25 bg-terra2/20 p-4">
                      <p className="text-[11px] tracking-[0.3em] text-terra">算了建议</p>
                      <p className="mt-1.5 font-display text-[13.5px] font-semibold leading-relaxed text-ink">{s.deal}</p>
                    </div>
                  </div>
                  {!unlocked && (
                    <button onClick={() => openPay("reading", report.id)} className="btn-ghost mt-4 h-9 w-full text-[12px]">
                      解开这一板块
                    </button>
                  )}
                </motion.div>
              );
              return card;
            })}
          </div>
          {!unlocked && (
            <Locked
              title="这卷命书还有下半册"
              desc="四大板块的完整批注与算了建议，已备好热茶等你翻开。"
              onOpen={() => openPay("reading", report.id)}
            />
          )}

          {/* 人生波段 */}
          <p className="mb-4 mt-14 text-center text-[11px] tracking-[0.5em] text-faint">人生能量波段 · 1 – 100 岁</p>
          {unlocked ? (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="panel p-6 sm:p-8">
              <p className="text-[13px] leading-relaxed text-ink2">
                你的潮汐不看别人的日历。滑动查看每一个年纪的风向——<span className="text-terra">虚线是此刻</span>。
              </p>
              <div className="mt-5">
                <EnergyChart wave={wave} />
              </div>
            </motion.section>
          ) : (
            <Locked
              title="看清一生的潮汐走向"
              desc="解开 1 – 100 岁能量波段图，以及四大关口的时间批注。"
              onOpen={() => openPay("wave", report.id)}
              cta="解开潮汐图"
            />
          )}

          {/* 双人合盘 */}
          <p className="mb-4 mt-14 text-center text-[11px] tracking-[0.5em] text-faint">双人缘分合盘</p>
          {store.isPro ? (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="panel p-6 sm:p-8">
              <p className="flex items-center gap-2 text-[11px] tracking-[0.4em] text-faint"><Users size={13} className="text-haze" /> 把 TA 的生辰也放上来</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-5">
                <input className="field sm:col-span-2" placeholder="TA 的称呼" value={partner.name} onChange={(e) => setPartner({ ...partner, name: e.target.value })} maxLength={10} />
                <Sel value={partner.year} onChange={(year) => setPartner({ ...partner, year })} options={YEARS} />
                <Sel value={partner.month} onChange={(month) => setPartner({ ...partner, month })} options={MONTHS} />
                <Sel value={partner.day} onChange={(day) => setPartner({ ...partner, day })} options={DAYS} />
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Sel value={partner.hour} onChange={(hour) => setPartner({ ...partner, hour: hour === 12 ? 6 : hour })} options={HOUR_OPTS} />
                <button className="btn-ink h-[46px] text-[14px]" onClick={() => setCompat(buildCompat(form, partner))}>
                  合一下
                </button>
              </div>

              <AnimatePresence>
                {compat && (
                  <motion.div key="compat" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
                    <div className="flex flex-col items-center gap-6 sm:flex-row">
                      <div className="relative h-[132px] w-[132px] shrink-0">
                        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                          <circle cx="60" cy="60" r="52" fill="none" stroke="#E6E1D6" strokeWidth="8" />
                          <motion.circle
                            cx="60" cy="60" r="52" fill="none" stroke={compat.tier === "high" ? "#7FA78D" : compat.tier === "mid" ? "#A9884F" : "#7E97A8"}
                            strokeWidth="8" strokeLinecap="round"
                            strokeDasharray={2 * Math.PI * 52}
                            initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                            animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - compat.score / 100) }}
                            transition={{ duration: 1.4, ease: [0.65, 0, 0.35, 1] }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="tabular font-display text-[34px] font-black leading-none">{compat.score}</span>
                          <span className="mt-1 text-[10px] tracking-[0.28em] text-faint">缘分指数</span>
                        </div>
                      </div>
                      <div>
                        <p className="font-display text-[18px] font-bold tracking-wide">{compat.tone.title}</p>
                        <p className="mt-2 text-[12.5px] leading-[1.9] text-ink2">{compat.tone.body}</p>
                      </div>
                    </div>
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-card2/70 p-4 text-[12px] leading-relaxed text-ink2">{compat.harmony.a}</div>
                      <div className="rounded-2xl bg-card2/70 p-4 text-[12px] leading-relaxed text-ink2">{compat.harmony.b}</div>
                    </div>
                    <div className="mt-5 rounded-2xl border border-mint/25 bg-mint2/30 p-5">
                      <p className="font-display text-[13px] font-bold tracking-[0.25em] text-mint">相处心法</p>
                      {compat.tips.map((t) => <p key={t} className="mt-2.5 text-[12.5px] leading-snug text-ink">· {t}</p>)}
                    </div>
                    <div className="mt-3 rounded-2xl border border-terra/20 bg-terra2/20 p-5">
                      <p className="font-display text-[13px] font-bold tracking-[0.25em] text-terra">雷区地图</p>
                      {compat.mines.map((t) => <p key={t} className="mt-2.5 text-[12.5px] leading-snug text-ink">{t}</p>)}
                    </div>
                    <p className="mt-6 text-center font-display text-[16px] font-semibold text-ink">「{compat.line}」</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
          ) : (
            <Locked
              title="两个人的命盘，值得细看"
              desc="解开缘分指数、相处心法与雷区地图——不限对象，看准了再走心。"
              onOpen={() => openPay("compat")}
              cta="解开合盘"
            />
          )}

          <div className="mt-14 flex flex-col items-center gap-3 pb-4">
            <p className="text-center font-display text-[15px] leading-loose text-ink2">
              卦已落，茶尚温。<br />看清了的，就随它去吧。
            </p>
            <button onClick={() => setStep("form")} className="btn-ghost mt-2 h-10 px-6 text-[12.5px]">
              <ArrowLeft size={13} /> 再为他人起一卦
            </button>
          </div>
        </motion.div>
      )}

      <ShareCardModal data={share} onClose={() => setShare(null)} />
    </div>
  );
}

export default function ReadingPage() {
  return (
    <Suspense fallback={<div className="h-[60vh]" />}>
      <ReadingInner />
    </Suspense>
  );
}
