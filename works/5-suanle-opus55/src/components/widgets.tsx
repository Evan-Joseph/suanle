"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import {
  BRANCHES, computeBazi, DAY_MASTER_TEXT, describeLiuyao, drawQian, drawTarot, EL_ADVICE, TAROT, TAROT_POS, tossCoins, TRIGRAM_IMAGE,
} from "@/lib/divination";
import type { DivRecord, Profile } from "@/lib/types";
import { sfx } from "@/lib/sound";
import { Logo } from "./ui";

export type RecInput = Omit<DivRecord, "id" | "createdAt">;
interface WP { onDone: (r: RecInput) => void; compact?: boolean; profile?: Profile; onProfile?: (p: Partial<Profile>) => void; doneLabel?: string }

const btn = "rounded-full bg-ink text-paper px-5 py-2.5 text-[14px] font-medium active:scale-95 transition disabled:opacity-40";
const ghost = "rounded-full border border-paper-3 px-4 py-2 text-[13px] text-ink-2 active:scale-95 transition";

function Card({ children, compact }: { children: React.ReactNode; compact?: boolean }) {
  return <div className={`rounded-3xl bg-paper-2/70 border border-paper-3/70 ${compact ? "p-4" : "p-5"} overflow-hidden`}>{children}</div>;
}

/* ---------------- 六爻 ---------------- */
function Coin({ face, spinning, i }: { face: number; spinning: boolean; i: number }) {
  const heads = face === 3;
  return (
    <motion.div
      key={spinning ? `s${i}` : `f${i}${face}`}
      initial={spinning ? { rotateY: 0, y: 0 } : { rotateY: 540, y: -30 }}
      animate={spinning ? { rotateY: 1440, y: [-0, -40, 0] } : { rotateY: 0, y: 0 }}
      transition={{ duration: spinning ? 0.9 : 0.5, delay: i * 0.06, ease: "easeOut" }}
      className="w-14 h-14 rounded-full flex items-center justify-center relative"
      style={{ background: "radial-gradient(circle at 35% 30%, #e8cf98, #b8935a 60%, #8a6a3a)", boxShadow: "inset 0 0 0 3px rgba(90,60,20,.35), 0 3px 8px rgba(90,60,20,.25)" }}
    >
      <div className="absolute w-3.5 h-3.5 bg-paper-2 border border-[#8a6a3a]/60" />
      {heads ? (
        <div className="absolute inset-0 text-[10px] font-serif text-[#5a3d17] font-bold">
          <span className="absolute top-1 left-1/2 -translate-x-1/2">乾</span>
          <span className="absolute bottom-1 left-1/2 -translate-x-1/2">隆</span>
          <span className="absolute left-1.5 top-1/2 -translate-y-1/2">通</span>
          <span className="absolute right-1.5 top-1/2 -translate-y-1/2">宝</span>
        </div>
      ) : (
        <div className="absolute inset-2 rounded-full border border-[#5a3d17]/30" />
      )}
    </motion.div>
  );
}

function YaoLine({ v, idx }: { v: number; idx: number }) {
  const yang = v === 7 || v === 9;
  const moving = v === 6 || v === 9;
  return (
    <motion.div initial={{ opacity: 0, scaleX: 0.3 }} animate={{ opacity: 1, scaleX: 1 }} className="flex items-center gap-2 h-4">
      <span className="w-6 text-[10px] text-ink-3 text-right">{["初", "二", "三", "四", "五", "上"][idx]}</span>
      <div className="flex-1 flex gap-3 h-2.5">
        {yang ? <div className="flex-1 rounded-sm bg-ink" /> : (<><div className="flex-1 rounded-sm bg-ink" /><div className="flex-1 rounded-sm bg-ink" /></>)}
      </div>
      <span className={`w-6 text-[11px] ${moving ? "text-cinnabar" : "text-transparent"}`}>{v === 9 ? "○" : "✕"}</span>
    </motion.div>
  );
}

export function LiuyaoWidget({ onDone, compact, doneLabel }: WP) {
  const [q, setQ] = useState("");
  const [vals, setVals] = useState<number[]>([]);
  const [coins, setCoins] = useState([3, 2, 3]);
  const [spin, setSpin] = useState(false);
  const [sent, setSent] = useState(false);
  const done = vals.length === 6;
  const result = useMemo(() => (done ? describeLiuyao(vals, q) : null), [done, vals, q]);

  const toss = () => {
    if (spin || done) return;
    setSpin(true);
    sfx.coin();
    if (navigator.vibrate) navigator.vibrate(18);
    setTimeout(() => {
      const t = tossCoins();
      setCoins(t.coins);
      setVals((v) => [...v, t.value]);
      setSpin(false);
    }, 900);
  };

  return (
    <Card compact={compact}>
      <div className="flex items-center justify-between mb-3">
        <div className="font-serif font-bold">六爻 · 摇铜钱</div>
        <div className="text-xs text-ink-3">{vals.length}/6</div>
      </div>
      {!vals.length && (
        <input value={q} onChange={(e) => setQ(e.target.value)} maxLength={40} placeholder="心里默念，或写下想问的事（可不填）"
          className="w-full mb-4 rounded-2xl bg-paper px-4 py-2.5 text-[15px] outline-none border border-paper-3 focus:border-ink-3" />
      )}
      {vals.length > 0 && q && <div className="text-sm text-ink-2 mb-3">问：{q}</div>}
      <div className="flex justify-center gap-4 py-3" style={{ perspective: 600 }}>
        {coins.map((c, i) => <Coin key={i} i={i} face={c} spinning={spin} />)}
      </div>
      <div className="flex flex-col-reverse gap-1.5 my-3 min-h-[20px]">
        {vals.map((v, i) => <YaoLine key={i} v={v} idx={i} />)}
      </div>
      {!done ? (
        <div className="flex flex-col items-center gap-2">
          <button onClick={toss} disabled={spin} className={btn}>{spin ? "叮铃……" : vals.length ? `再摇一次（第${vals.length + 1}爻）` : "摇一摇"}</button>
          <div className="text-[11px] text-ink-3">三枚铜钱摇六次，自下而上成卦</div>
        </div>
      ) : (
        result && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="rounded-2xl bg-paper p-4 mt-1">
              <div className="flex items-baseline gap-2">
                <span className="seal text-xs">第{result.main.no}卦</span>
                <span className="font-serif text-2xl font-bold">{result.main.name}</span>
                <span className="text-xs text-ink-3">{TRIGRAM_IMAGE[result.main.upper]}{TRIGRAM_IMAGE[result.main.lower]}</span>
              </div>
              <p className="text-[14px] text-ink-2 mt-2 leading-relaxed">{result.main.gist}</p>
              {result.after && (
                <p className="text-[13px] text-ink-2 mt-2 pt-2 border-t border-dashed border-paper-3">
                  <span className="text-cinnabar">变 → {result.after.name}</span>　{result.after.gist}
                </p>
              )}
            </div>
            {!sent && (
              <div className="flex justify-center mt-4">
                <button className={btn} onClick={() => { setSent(true); sfx.bell(); onDone({ kind: "liuyao", title: `${result.main.name}${result.after ? "之" + result.after.name : ""}`, summary: result.main.gist, detail: result.text }); }}>
                  {doneLabel || "请算了解卦"}
                </button>
              </div>
            )}
          </motion.div>
        )
      )}
    </Card>
  );
}

/* ---------------- 塔罗 ---------------- */
function TarotFace({ idx, reversed, small }: { idx: number; reversed: boolean; small?: boolean }) {
  const c = TAROT[idx];
  return (
    <div className={`w-full h-full rounded-xl bg-[#fbf6ea] border border-gold/60 flex flex-col items-center justify-between ${small ? "p-1.5" : "p-2"} shadow-inner`}>
      <div className="text-[9px] text-gold tracking-widest">{["0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI"][idx]}</div>
      <div className={`${small ? "text-2xl" : "text-3xl"} text-ink`} style={{ transform: reversed ? "rotate(180deg)" : undefined }}>{c.glyph}</div>
      <div className="text-center">
        <div className="font-serif text-[12px] font-bold leading-tight">{c.n}</div>
        <div className="text-[8px] text-ink-3">{reversed ? "逆位" : "正位"}</div>
      </div>
    </div>
  );
}

export function TarotWidget({ onDone, compact, doneLabel }: WP) {
  const [deck] = useState(() => drawTarot(9));
  const [picked, setPicked] = useState<number[]>([]);
  const [sent, setSent] = useState(false);
  const done = picked.length === 3;
  const pick = (i: number) => {
    if (picked.includes(i) || done) return;
    sfx.flip();
    if (navigator.vibrate) navigator.vibrate(10);
    setPicked((p) => [...p, i]);
  };
  const cards = picked.map((i) => deck[i]);
  const detail = `【塔罗】三张牌（过去/现在/建议）：\n` + cards.map((c, k) => `· ${TAROT_POS[k]}：${TAROT[c.idx].n}${c.reversed ? "（逆位）" : "（正位）"}——${c.reversed ? TAROT[c.idx].rev : TAROT[c.idx].up}`).join("\n");
  return (
    <Card compact={compact}>
      <div className="flex items-center justify-between mb-3">
        <div className="font-serif font-bold">塔罗 · 三张牌</div>
        <div className="text-xs text-ink-3">{done ? "牌已就位" : `凭感觉选 ${3 - picked.length} 张`}</div>
      </div>
      {!done && (
        <div className="flex justify-center h-28 items-end mb-2 pt-2">
          {deck.map((_, i) => (
            <motion.button key={i} onClick={() => pick(i)} disabled={picked.includes(i)}
              initial={{ y: 30, opacity: 0 }} animate={{ y: picked.includes(i) ? -60 : 0, opacity: picked.includes(i) ? 0 : 1, rotate: (i - 4) * 5 }}
              transition={{ delay: i * 0.03 }} whileTap={{ y: -12 }}
              className="tarot-back h-[88px] w-12 -mx-[9px] shrink-0 rounded-lg border border-gold/50 shadow-md origin-bottom" aria-label={`第${i + 1}张牌`} />
          ))}
        </div>
      )}
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((k) => (
          <div key={k} className="flex flex-col items-center gap-1.5">
            <div className="w-full aspect-[2/3] max-w-[96px]" style={{ perspective: 800 }}>
              <AnimatePresence mode="wait">
                {cards[k] ? (
                  <motion.div key="f" initial={{ rotateY: 90 }} animate={{ rotateY: 0 }} transition={{ duration: 0.45 }} className="w-full h-full">
                    <TarotFace idx={cards[k].idx} reversed={cards[k].reversed} small={compact} />
                  </motion.div>
                ) : (
                  <motion.div key="b" className="w-full h-full rounded-xl border border-dashed border-paper-3" />
                )}
              </AnimatePresence>
            </div>
            <div className="text-[10px] text-ink-3">{TAROT_POS[k].split(" · ")[0]}</div>
          </div>
        ))}
      </div>
      {done && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 space-y-1.5">
          {cards.map((c, k) => (
            <div key={k} className="text-[13px] text-ink-2"><span className="text-ink font-medium">{TAROT[c.idx].n}</span>　{c.reversed ? TAROT[c.idx].rev : TAROT[c.idx].up}</div>
          ))}
          {!sent && (
            <div className="flex justify-center pt-3">
              <button className={btn} onClick={() => { setSent(true); sfx.chime(); onDone({ kind: "tarot", title: cards.map((c) => TAROT[c.idx].n).join(" · "), summary: TAROT[cards[2].idx].up, detail }); }}>{doneLabel || "请算了读牌"}</button>
            </div>
          )}
        </motion.div>
      )}
    </Card>
  );
}

/* ---------------- 八字 ---------------- */
const HOURS = BRANCHES.map((b, i) => ({ label: `${b}时 ${String((i * 2 + 23) % 24).padStart(2, "0")}-${String((i * 2 + 1) % 24).padStart(2, "0")}`, value: `${String((i * 2) % 24).padStart(2, "0")}:00` }));
const EL_COLOR: Record<string, string> = { 木: "#7d9177", 火: "#c0533a", 土: "#b8935a", 金: "#9a9488", 水: "#4f6f86" };

export function BaziWidget({ onDone, compact, profile, onProfile, doneLabel }: WP) {
  const [date, setDate] = useState(profile?.birthDate || "");
  const [time, setTime] = useState(profile?.birthTime || "");
  const [show, setShow] = useState(false);
  const [sent, setSent] = useState(false);
  const bz = useMemo(() => (show ? computeBazi(date, time) : null), [show, date, time]);
  const pillars = bz ? [["年", bz.year], ["月", bz.month], ["日", bz.day], ["时", bz.hour]] as const : [];
  const detail = bz
    ? `【八字】${date}${time ? " " + time : "（时辰未知）"}\n四柱：${bz.year.stem}${bz.year.branch} ${bz.month.stem}${bz.month.branch} ${bz.day.stem}${bz.day.branch} ${bz.hour ? bz.hour.stem + bz.hour.branch : "—"}\n日主：${bz.dayMaster}${bz.dayEl}；属${bz.zodiac}；${bz.sign}\n五行：${Object.entries(bz.elements).map(([k, v]) => k + v).join(" ")}${bz.lack.length ? "；缺" + bz.lack.join("、") : ""}`
    : "";
  return (
    <Card compact={compact}>
      <div className="font-serif font-bold mb-3">八字 · 出厂设置</div>
      {!bz ? (
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs text-ink-3">公历生日</span>
            <input type="date" value={date} min="1900-01-01" max="2100-12-31" onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-2xl bg-paper px-4 py-2.5 outline-none border border-paper-3 appearance-none min-h-[44px]" />
          </label>
          <label className="block">
            <span className="text-xs text-ink-3">出生时辰</span>
            <select value={time} onChange={(e) => setTime(e.target.value)} className="mt-1 w-full rounded-2xl bg-paper px-4 py-2.5 outline-none border border-paper-3 min-h-[44px]">
              <option value="">不记得了</option>
              {HOURS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
            </select>
          </label>
          <div className="flex justify-center pt-1">
            <button className={btn} disabled={!date} onClick={() => { sfx.bell(); setShow(true); onProfile?.({ birthDate: date, birthTime: time }); }}>排盘</button>
          </div>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          <div className="grid grid-cols-4 gap-2 text-center">
            {pillars.map(([k, p]) => (
              <div key={k} className="rounded-2xl bg-paper py-2.5">
                <div className="text-[10px] text-ink-3">{k}柱</div>
                <div className={`font-serif text-xl font-bold mt-1 ${k === "日" ? "text-cinnabar" : ""}`}>{p ? p.stem : "—"}</div>
                <div className="font-serif text-xl font-bold">{p ? p.branch : "—"}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex h-2.5 rounded-full overflow-hidden bg-paper">
            {Object.entries(bz.elements).map(([k, v]) => v > 0 && <div key={k} style={{ flex: v, background: EL_COLOR[k] }} />)}
          </div>
          <div className="flex justify-between text-[11px] text-ink-3 mt-1.5 px-0.5">
            {Object.entries(bz.elements).map(([k, v]) => <span key={k}><span style={{ color: EL_COLOR[k] }}>●</span> {k}{v}</span>)}
          </div>
          <p className="text-[14px] text-ink-2 mt-3 leading-relaxed">
            日主<b className="text-ink">{bz.dayMaster}{bz.dayEl}</b>，{DAY_MASTER_TEXT[bz.dayMaster]}
            {bz.lack.length ? ` 盘里${bz.lack.join("、")}少一点：${EL_ADVICE[bz.lack[0]]}` : ` 五行都齐，${EL_ADVICE[bz.strong]}`}
          </p>
          <div className="flex gap-2 mt-2 text-[12px] text-ink-3"><span>属{bz.zodiac}</span>·<span>{bz.sign}</span></div>
          {!sent && (
            <div className="flex justify-center gap-2 mt-4">
              <button className={ghost} onClick={() => setShow(false)}>改一改</button>
              <button className={btn} onClick={() => { setSent(true); onDone({ kind: "bazi", title: `${bz.dayMaster}${bz.dayEl}日主 · 属${bz.zodiac}`, summary: DAY_MASTER_TEXT[bz.dayMaster], detail }); }}>{doneLabel || "请算了细看"}</button>
            </div>
          )}
        </motion.div>
      )}
    </Card>
  );
}

/* ---------------- 求签 ---------------- */
export function QianWidget({ onDone, compact, doneLabel }: WP) {
  const [stage, setStage] = useState<"idle" | "shake" | "out">("idle");
  const [q, setQ] = useState<ReturnType<typeof drawQian> | null>(null);
  const [sent, setSent] = useState(false);
  const shake = () => {
    if (stage === "shake") return;
    setStage("shake");
    sfx.sticks();
    if (navigator.vibrate) navigator.vibrate([20, 40, 20, 40, 20]);
    setTimeout(() => { setQ(drawQian()); setStage("out"); sfx.bell(); }, 1300);
  };
  return (
    <Card compact={compact}>
      <div className="font-serif font-bold mb-2">算了签</div>
      {stage !== "out" ? (
        <div className="flex flex-col items-center py-2">
          <motion.div animate={stage === "shake" ? { rotate: [0, -12, 10, -10, 8, -6, 0], y: [0, -4, 0, -4, 0] } : { rotate: 0 }} transition={{ duration: 1.2 }}
            className="relative w-20 h-32 origin-bottom">
            <div className="absolute inset-x-2 -top-6 flex justify-center gap-1">
              {[0, 1, 2, 3, 4].map((i) => <div key={i} className="w-1.5 rounded-t-sm bg-[#d9b77c]" style={{ height: 40 + ((i * 7) % 12) }} />)}
            </div>
            <div className="absolute inset-0 rounded-b-2xl rounded-t-md bg-gradient-to-b from-[#a8442f] to-[#7f2f20] shadow-lg flex items-center justify-center">
              <span className="font-serif text-paper text-lg [writing-mode:vertical-rl] tracking-[0.3em]">算了</span>
            </div>
          </motion.div>
          <button onClick={shake} className={`${btn} mt-5`}>{stage === "shake" ? "沙沙沙……" : "摇一支"}</button>
        </div>
      ) : (
        q && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-[#fbf6ea] border border-gold/40 p-5 text-center">
            <div className="flex justify-center items-center gap-2 text-xs text-ink-3"><span>第 {q.no} 签</span><span className="seal">{q.level}</span></div>
            <div className="font-serif text-[19px] leading-relaxed font-bold mt-3 text-balance">{q.poem}</div>
            <div className="text-[14px] text-ink-2 mt-3">{q.say}</div>
            {!sent && (
              <button className={`${btn} mt-4`} onClick={() => { setSent(true); onDone({ kind: "qian", title: `第${q.no}签 · ${q.level}`, summary: q.poem, detail: `【求签】第${q.no}签（${q.level}）\n签文：${q.poem}\n白话：${q.say}` }); }}>{doneLabel || "请算了解签"}</button>
            )}
          </motion.div>
        )
      )}
    </Card>
  );
}

/* ---------------- 纸篓 ---------------- */
export function LetGoWidget({ onDone, compact, doneLabel }: WP) {
  const [text, setText] = useState("");
  const [stage, setStage] = useState<"write" | "crumple" | "toss" | "done">("write");
  const go = () => {
    if (!text.trim()) return;
    setStage("crumple");
    sfx.crumple();
    if (navigator.vibrate) navigator.vibrate([10, 30, 10, 30, 10]);
    setTimeout(() => { setStage("toss"); sfx.toss(); }, 900);
    setTimeout(() => {
      setStage("done");
      onDone({ kind: "letgo", title: "丢掉了一件心事", summary: "算了。", detail: `【纸篓】我刚把一件心事写下来揉成纸团丢掉了：“${text.trim().slice(0, 200)}”` });
    }, 1800);
  };
  return (
    <Card compact={compact}>
      <div className="font-serif font-bold mb-3">算了纸篓</div>
      <div className="relative h-56">
        <AnimatePresence>
          {stage !== "done" && (
            <motion.div
              key="paper"
              className="absolute left-0 right-0 top-0 mx-auto bg-[#fffdf7] shadow-md border border-paper-3 overflow-hidden"
              initial={{ width: "100%", height: 150, borderRadius: 6 }}
              animate={
                stage === "write" ? { width: "100%", height: 150, borderRadius: 6, rotate: 0 }
                  : stage === "crumple" ? { width: 64, height: 64, borderRadius: 40, rotate: 200, x: 0, y: 20 }
                    : { width: 40, height: 40, borderRadius: 40, rotate: 520, x: [0, 30, 70], y: [20, -60, 150], opacity: [1, 1, 0] }
              }
              transition={{ duration: stage === "toss" ? 0.9 : 0.8, ease: "easeInOut" }}
              style={{ backgroundImage: "repeating-linear-gradient(transparent 0 27px, rgba(184,147,90,.22) 27px 28px)" }}
            >
              {stage === "write" && (
                <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={200}
                  placeholder="写下那件让你放不下的事……写完就揉掉，它不会被保存。"
                  className="w-full h-full bg-transparent p-3 text-[15px] leading-[28px] outline-none resize-none font-serif" />
              )}
            </motion.div>
          )}
        </AnimatePresence>
        <div className="absolute bottom-0 right-6 w-16 h-16">
          <svg viewBox="0 0 64 64" className="w-full h-full text-ink-3"><path d="M10 18h44l-5 42H15z" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" /><path d="M6 18h52" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /><path d="M24 28v24M32 28v24M40 28v24" stroke="currentColor" strokeWidth="1.5" opacity=".5" /></svg>
        </div>
        {stage === "done" && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 flex flex-col items-center justify-center text-ink">
            <Logo size={56} blink />
            <div className="font-serif text-3xl font-bold mt-3">算了。</div>
            <div className="text-sm text-ink-3 mt-1">它已经不在你手里了</div>
          </motion.div>
        )}
      </div>
      {stage === "write" && (
        <div className="flex justify-center mt-2">
          <button onClick={go} disabled={!text.trim()} className={btn}>{doneLabel || "揉成一团，丢掉"}</button>
        </div>
      )}
    </Card>
  );
}

export const WIDGET_MAP = { 六爻: LiuyaoWidget, 塔罗: TarotWidget, 八字: BaziWidget, 求签: QianWidget, 纸篓: LetGoWidget } as const;
