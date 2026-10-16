"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Sparkles, Coins as CoinsIcon, ArrowRight, Check } from "lucide-react";
import { HexGlyph } from "@/components/ui";
import { useApp, useUI } from "@/store/app";
import { playCoins, playFlip, playTap } from "@/lib/sound";
import {
  tossThree, resolveCast, castToText, hexLines, type CastResult,
  TAROT, TAROT_POSITIONS, shuffledDeck, tarotToText,
  computeBazi, baziToText, todayAlmanac, WX_COLOR, parseBirth,
} from "@/lib/divination";

interface WidgetProps { onSubmit: (text: string) => void; done?: boolean; onDone?: () => void }

/* ───────────── 铜钱六爻 ───────────── */
export function CoinsWidget({ question, onSubmit, done, onDone }: WidgetProps & { question?: string }) {
  const [sums, setSums] = useState<number[]>([]);
  const [coins, setCoins] = useState<number[] | null>(null);
  const [shaking, setShaking] = useState(false);
  const result: CastResult | null = sums.length === 6 ? resolveCast(sums, question) : null;
  const addReading = useApp((s) => s.addReading);

  const toss = () => {
    if (shaking || sums.length >= 6) return;
    setShaking(true); playTap();
    setTimeout(() => {
      const t = tossThree();
      setCoins(t.coins); setSums((s) => [...s, t.sum]); setShaking(false); playCoins();
    }, 650);
  };
  useEffect(() => {
    if (result) addReading({ kind: "coins", title: result.primary.full + (result.changed ? ` → ${result.changed.full}` : ""), summary: result.primary.gist });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!result]);

  if (done) return <WidgetDone label="这一卦已经摇过了" />;

  return (
    <Card title="摇一卦" subtitle={question ? `问：${question}` : "心里默念一件事，摇六次"} icon={<CoinsIcon size={16} />}>
      <div className="flex items-center gap-4">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-paper-2/80">
          {result ? <HexGlyph lines={hexLines(result.primary)} size={56} moving={result.moving} /> : (
            <div className="flex flex-col-reverse gap-1.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={`h-1.5 w-12 rounded-full ${i < sums.length ? (sums[i] % 2 ? "bg-ink" : "bg-ink/25") : "bg-ink/10"}`} />
              ))}
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="mb-2 flex h-10 items-center gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div key={i} animate={shaking ? { rotateY: [0, 180, 360, 540], y: [0, -14, 0, -6, 0] } : { rotateY: coins && coins[i] === 3 ? 180 : 0 }} transition={{ duration: shaking ? 0.65 : 0.3 }}
                className="grid h-9 w-9 place-items-center rounded-full border border-gold/60 bg-gradient-to-br from-[#e9cf96] to-[#c9a35e] text-[11px] font-semibold text-[#5a4320] shadow-inner">
                {coins ? (coins[i] === 3 ? "背" : "字") : "·"}
              </motion.div>
            ))}
          </div>
          {!result ? (
            <button onClick={toss} disabled={shaking} className="ink-btn w-full rounded-xl py-2.5 text-sm font-medium disabled:opacity-60">
              {shaking ? "铜钱在转…" : sums.length === 0 ? "摇第一爻" : `摇第 ${["一", "二", "三", "四", "五", "六"][sums.length]} 爻`}
            </button>
          ) : (
            <div>
              <div className="font-serif text-lg font-semibold">{result.primary.full}{result.changed && <span className="text-ink-3"> → {result.changed.full}</span>}</div>
              <p className="mt-0.5 text-[13px] text-ink-2">{result.primary.gist}</p>
            </div>
          )}
        </div>
      </div>
      {result && (
        <button onClick={() => { onDone?.(); onSubmit(castToText(result)); }} className="ink-btn mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-medium">
          请算了解这一卦 <ArrowRight size={15} />
        </button>
      )}
    </Card>
  );
}

/* ───────────── 塔罗三牌 ───────────── */
export function TarotWidget({ question, onSubmit, done, onDone }: WidgetProps & { question?: string }) {
  const deck = useMemo(() => shuffledDeck(), []);
  const [picked, setPicked] = useState<{ id: number; reversed: boolean }[]>([]);
  const addReading = useApp((s) => s.addReading);
  const full = picked.length === 3;

  const pick = () => {
    if (full) return;
    playFlip();
    setPicked((p) => [...p, { id: deck[p.length], reversed: Math.random() < 0.35 }]);
  };
  useEffect(() => {
    if (full) addReading({ kind: "tarot", title: picked.map((c) => TAROT[c.id].name + (c.reversed ? "⇅" : "")).join(" · "), summary: question ?? "三张牌阵" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [full]);

  if (done) return <WidgetDone label="这一局牌已经翻过了" />;

  return (
    <Card title="抽三张" subtitle={question ? `问：${question}` : "想着那个人或那件事，点牌堆"} icon={<Sparkles size={16} />}>
      <div className="grid grid-cols-3 gap-2.5">
        {[0, 1, 2].map((i) => {
          const c = picked[i];
          return (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <button onClick={pick} disabled={!!c || i !== picked.length} className="relative aspect-[2/3] w-full [perspective:800px]">
                <motion.div className="absolute inset-0 [transform-style:preserve-3d]" animate={{ rotateY: c ? 180 : 0 }} transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}>
                  <div className={`absolute inset-0 rounded-xl border bg-[radial-gradient(circle_at_50%_40%,#4b6282,#2f4257)] [backface-visibility:hidden] ${i === picked.length ? "border-gold/70 shadow-[0_0_0_3px_rgba(212,163,90,0.25)]" : "border-ink/10"}`}>
                    <div className="absolute inset-[6px] rounded-lg border border-white/15" />
                    <div className="absolute inset-0 grid place-items-center text-2xl text-white/70">✦</div>
                  </div>
                  <div className="absolute inset-0 rounded-xl border border-ink/10 bg-gradient-to-b from-white to-paper-2 p-2 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                    {c && (
                      <div className={`flex h-full flex-col items-center justify-between py-1 ${c.reversed ? "rotate-180" : ""}`}>
                        <span className="font-serif text-[10px] text-ink-3">{TAROT[c.id].glyph}</span>
                        <span className="font-serif text-base font-semibold">{TAROT[c.id].name}</span>
                        <span className="text-[9px] text-ink-3">{TAROT[c.id].en}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              </button>
              <span className="text-[11px] text-ink-3">{TAROT_POSITIONS[i]}{c?.reversed ? " · 逆" : ""}</span>
            </div>
          );
        })}
      </div>
      {full && (
        <button onClick={() => { onDone?.(); onSubmit(tarotToText({ cards: picked, question })); }} className="ink-btn mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-medium">
          请算了解牌 <ArrowRight size={15} />
        </button>
      )}
    </Card>
  );
}

/* ───────────── 八字命盘 ───────────── */
export function BaziWidget({ onSubmit, done, onDone, standalone }: WidgetProps & { standalone?: boolean }) {
  const profile = useApp((s) => s.profile);
  const setProfile = useApp((s) => s.setProfile);
  const addReading = useApp((s) => s.addReading);
  const p = parseBirth(profile.birth);
  const [date, setDate] = useState(p ? `${p.y}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")}` : "");
  const [time, setTime] = useState(p?.hourKnown ? `${String(p.h).padStart(2, "0")}:${String(p.mi).padStart(2, "0")}` : "");
  const [unknown, setUnknown] = useState(!p?.hourKnown);
  const birth = date ? `${date}${!unknown && time ? ` ${time}` : ""}` : "";
  const bazi = useMemo(() => computeBazi(birth), [birth]);
  const total = bazi ? Object.values(bazi.wuxing).reduce((a, b) => a + b, 0) || 1 : 1;

  if (done && !standalone) return <WidgetDone label="命盘已排" />;

  const submit = () => {
    if (!bazi) return;
    setProfile({ birth });
    addReading({ kind: "bazi", title: `${bazi.dayMaster}${bazi.dayMasterWx}日主 · ${bazi.shengxiao}`, summary: bazi.pillars.map((x) => x.gz).join(" ") });
    onDone?.();
    onSubmit(baziToText(bazi, birth));
  };

  return (
    <Card title="生辰" subtitle="公历即可，时辰不详也能看个七八分">
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <input type="date" value={date} min="1900-01-01" max="2100-12-31" onChange={(e) => setDate(e.target.value)} className="h-11 rounded-xl border border-ink/10 bg-white/70 px-3 text-[15px] outline-none focus:border-ink/40" />
        <input type="time" value={time} disabled={unknown} onChange={(e) => setTime(e.target.value)} className="h-11 w-[108px] rounded-xl border border-ink/10 bg-white/70 px-3 text-[15px] outline-none focus:border-ink/40 disabled:opacity-40" />
      </div>
      <label className="mt-2 flex items-center gap-2 text-[13px] text-ink-2">
        <input type="checkbox" checked={unknown} onChange={(e) => setUnknown(e.target.checked)} className="accent-ink" /> 时辰不详
      </label>
      {bazi && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-3 rounded-2xl bg-paper-2/70 p-3">
          <div className="grid grid-cols-4 gap-1 text-center">
            {bazi.pillars.map((pl) => (
              <div key={pl.label}>
                <div className="text-[11px] text-ink-3">{pl.label}柱</div>
                <div className="font-serif text-xl font-semibold tracking-wider">{pl.gz}</div>
                <div className="text-[11px] text-ink-3">{pl.wx || "—"}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-white/70">
            {Object.entries(bazi.wuxing).map(([k, v]) => v > 0 && <div key={k} style={{ width: `${(v / total) * 100}%`, background: WX_COLOR[k] }} />)}
          </div>
          <div className="mt-1.5 flex justify-between text-[11px] text-ink-3">
            {Object.entries(bazi.wuxing).map(([k, v]) => <span key={k} className="flex items-center gap-1"><i className="inline-block h-2 w-2 rounded-full" style={{ background: WX_COLOR[k] }} />{k}{v}</span>)}
          </div>
          <div className="mt-2 text-[12px] text-ink-2">{bazi.lunarText} · 属{bazi.shengxiao} · {bazi.zodiac} · {bazi.nayin}</div>
        </motion.div>
      )}
      <button onClick={submit} disabled={!bazi} className="ink-btn mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-medium disabled:opacity-40">
        {standalone && done ? "再看一次" : "请算了看看"} <ArrowRight size={15} />
      </button>
    </Card>
  );
}

/* ───────────── 今日黄历 ───────────── */
export function AlmanacWidget({ onSubmit, compact }: Partial<WidgetProps> & { compact?: boolean }) {
  const a = useMemo(() => todayAlmanac(), []);
  return (
    <Card title={`${a.dateText} · ${a.weekday}`} subtitle={`农历${a.lunarText} · ${a.ganzhi.split(" ")[2]}`}>
      <div className="flex items-start gap-3">
        <div className="shrink-0 rounded-2xl px-3 py-2 text-center text-white" style={{ background: a.color.hex }}>
          <div className="text-[10px] opacity-80">今日色</div>
          <div className="font-serif text-base font-semibold">{a.color.name}</div>
        </div>
        <div className="grid flex-1 grid-cols-2 gap-x-3 text-[13px]">
          <div><span className="text-moss">宜</span> <span className="text-ink-2">{a.yi.join(" ")}</span></div>
          <div><span className="text-cinnabar">忌</span> <span className="text-ink-2">{a.ji.join(" ")}</span></div>
          <p className="col-span-2 mt-1.5 font-serif text-[14px] leading-relaxed text-ink">{a.line}</p>
        </div>
      </div>
      {!compact && onSubmit && (
        <button onClick={() => onSubmit(`今天${a.dateText}，${a.ganzhi.split(" ")[2]}，宜${a.yi.join("、")}，忌${a.ji.join("、")}。结合我的情况，今天适合做点什么、避开什么？`)} className="mt-3 w-full rounded-xl border border-ink/15 py-2.5 text-sm text-ink-2 hover:bg-white/60">
          让算了结合我的情况说说
        </button>
      )}
    </Card>
  );
}

/* ───────────── 放下 入口 ───────────── */
export function LetgoWidget({ text }: { text?: string }) {
  const setTab = useUI((s) => s.setTab);
  const setDraft = useUI((s) => s.setLetgoDraft);
  return (
    <Card title="把它写下来，揉掉">
      <p className="text-[14px] leading-relaxed text-ink-2">{text ? `比如就写：「${text}」。` : "写下那件最压着你的事。"}写完揉成一团，丢进纸篓。很多事，丢的那一下，就真的算了。</p>
      <button onClick={() => { setDraft(text ?? ""); setTab("letgo"); }} className="ink-btn mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-medium">
        去揉一张 <ArrowRight size={15} />
      </button>
    </Card>
  );
}

/* ───────────── 通用 ───────────── */
function Card({ title, subtitle, icon, children }: { title: string; subtitle?: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="paper-card mt-3 w-full max-w-[420px] rounded-2xl p-4">
      <div className="mb-3 flex items-center gap-2">
        {icon && <span className="grid h-7 w-7 place-items-center rounded-full bg-paper-2 text-ink-2">{icon}</span>}
        <div className="min-w-0">
          <div className="font-serif text-[15px] font-semibold">{title}</div>
          {subtitle && <div className="truncate text-xs text-ink-3">{subtitle}</div>}
        </div>
      </div>
      {children}
    </motion.div>
  );
}

function WidgetDone({ label }: { label: string }) {
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-paper-2/80 px-3 py-1 text-xs text-ink-3">
        <Check size={12} /> {label}
      </motion.div>
    </AnimatePresence>
  );
}
