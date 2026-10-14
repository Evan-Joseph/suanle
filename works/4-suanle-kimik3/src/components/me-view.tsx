"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Check,
  Coffee,
  Flame,
  Hand,
  RefreshCcw,
  Sprout,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useApp } from "@/store/app";
import { metaphorForTokens, TOKEN_UNITS } from "@/lib/brand";
import { setMuted, sfxWood } from "@/lib/audio";
import { cn, fmtTokens, todayKey } from "@/lib/utils";
import { Logo } from "./logo";

function Section({
  title,
  en,
  children,
}: {
  title: string;
  en: string;
  children: React.ReactNode;
}) {
  return (
    <section className="anim-rise">
      <div className="mb-2.5 flex items-baseline gap-2 px-1">
        <h3 className="font-display text-[15px] tracking-[0.2em] text-ink">{title}</h3>
        <span className="text-[9px] tracking-[0.3em] text-mist/60">{en}</span>
      </div>
      <div className="rounded-3xl border border-line/80 bg-paper-2 p-4 shadow-[0_2px_12px_rgba(38,35,29,0.04)]">
        {children}
      </div>
    </section>
  );
}

const MERIT_WORDS = ["功德 +1", "烦恼 -1", "定力 +1", "心气 +1", "焦虑 -1"];

export function MeView() {
  const profile = useApp((s) => s.profile);
  const setProfile = useApp((s) => s.setProfile);
  const memory = useApp((s) => s.memory);
  const removeMemory = useApp((s) => s.removeMemory);
  const usage = useApp((s) => s.usage);
  const setMetaphor = useApp((s) => s.setMetaphor);
  const donations = useApp((s) => s.donations);
  const woodfish = useApp((s) => s.woodfish);
  const knockWood = useApp((s) => s.knockWood);
  const muted = useApp((s) => s.muted);
  const toggleMuted = useApp((s) => s.toggleMuted);
  const setTipOpen = useApp((s) => s.setTipOpen);
  const resetAll = useApp((s) => s.resetAll);
  const sessions = useApp((s) => s.sessions);
  const toast = useApp((s) => s.toast);

  const [name, setName] = useState(profile.name ?? "");
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [merits, setMerits] = useState<Array<{ id: number; text: string }>>([]);
  const [metaphorLoading, setMetaphorLoading] = useState(false);

  useEffect(() => setName(profile.name ?? ""), [profile.name]);
  useEffect(() => setMuted(muted), [muted]);

  const refreshMetaphor = useCallback(async () => {
    setMetaphorLoading(true);
    try {
      const topics = sessions
        .slice(0, 4)
        .map((s) => s.title)
        .filter((t) => t !== "新起一炉");
      const res = await fetch("/api/metaphor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokens: usage.total, name: profile.name ?? "", topics }),
      });
      const data = (await res.json()) as { metaphor?: string };
      if (data.metaphor) setMetaphor(data.metaphor);
    } catch {
      setMetaphor(metaphorForTokens(usage.total));
    } finally {
      setMetaphorLoading(false);
    }
  }, [usage.total, profile.name, sessions, setMetaphor]);

  // 每日首访自动刷新比喻
  useEffect(() => {
    if (usage.metaphorDay !== todayKey() || !usage.metaphor) {
      void refreshMetaphor();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const knock = () => {
    knockWood();
    sfxWood();
    const id = Date.now() + Math.random();
    setMerits((m) => [...m.slice(-6), { id, text: MERIT_WORDS[id % MERIT_WORDS.length | 0] ?? "功德 +1" }]);
    setTimeout(() => setMerits((m) => m.filter((x) => x.id !== id)), 1400);
  };

  const incense = usage.total / TOKEN_UNITS[0].per;
  const coffee = usage.total / TOKEN_UNITS[1].per;
  const trees = usage.total / TOKEN_UNITS[2].per;

  return (
    <div className="h-full min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-[640px] space-y-6 px-4 pb-32 pt-6 lg:pb-12">
        <header className="px-1">
          <p className="text-[10px] tracking-[0.4em] text-cinnabar/70">知 己 · 只 存 于 你 的 设 备</p>
          <h2 className="mt-1.5 flex items-center gap-2 font-display text-[24px] tracking-[0.2em] text-ink">
            {profile.name ? `${profile.name}，别来无恙` : "未曾谋面的常客"}
          </h2>
        </header>

        {/* —— 底档 —— */}
        <Section title="客官底档" en="PROFILE">
          <div className="space-y-3.5">
            <div>
              <label className="mb-1 block text-[11px] tracking-wider text-mist">怎么称呼你？</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="留个称呼，掌柜好招呼"
                className="w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-[14px] outline-none transition-colors focus:border-cinnabar/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[11px] tracking-wider text-mist">生辰（公历）</label>
                <input
                  type="date"
                  value={profile.birthday ?? ""}
                  onChange={(e) => setProfile({ birthday: e.target.value })}
                  className="w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-[14px] outline-none transition-colors focus:border-cinnabar/50"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] tracking-wider text-mist">性别（大运起排用）</label>
                <div className="flex overflow-hidden rounded-xl border border-line">
                  {([
                    ["male", "乾"],
                    ["female", "坤"],
                    ["secret", "不表"],
                  ] as const).map(([v, label]) => (
                    <button
                      key={v}
                      onClick={() => setProfile({ gender: v })}
                      className={cn(
                        "no-tap-highlight flex-1 py-2.5 text-[12.5px] transition-colors",
                        (profile.gender ?? "secret") === v
                          ? "bg-ink text-paper-2"
                          : "bg-paper text-ink-2"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setProfile({ name: name.trim() || undefined });
                setSaved(true);
                setTimeout(() => setSaved(false), 1600);
                toast("记下了。往后掌柜照这个称呼招呼你。");
              }}
              className="no-tap-highlight flex w-full items-center justify-center gap-1.5 rounded-xl bg-ink py-2.5 text-[13px] text-paper-2 transition-all active:scale-[0.98]"
            >
              {saved ? <Check size={14} /> : null}
              {saved ? "已收下" : "收下这份底档"}
            </button>
            <p className="text-[10.5px] leading-relaxed text-mist/70">
              底档仅用于排盘与称呼，全部存在你自己的浏览器里，小馆没有服务器存你隐私。
            </p>
          </div>
        </Section>

        {/* —— 记忆墙 —— */}
        <Section title="掌柜记得你" en="MEMORY">
          {memory.length === 0 ? (
            <p className="py-1 text-[12.5px] leading-relaxed text-mist">
              还是张白纸。多来坐几回，聊过的家乡、心事、口头禅，掌柜都会默默替你收着。
            </p>
          ) : (
            <div className="space-y-2">
              {memory.map((m, i) => (
                <div
                  key={`${i}-${m}`}
                  className="group flex items-start gap-2 rounded-xl bg-paper-3/60 px-3 py-2.5"
                >
                  <Brain size={13} className="mt-0.5 shrink-0 text-cinnabar/70" />
                  <p className="flex-1 text-[13px] leading-relaxed text-ink-2">{m}</p>
                  <button
                    onClick={() => removeMemory(i)}
                    className="no-tap-highlight shrink-0 rounded p-0.5 text-mist/50 opacity-0 transition-opacity hover:text-cinnabar group-hover:opacity-100"
                    aria-label="忘掉这条"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
              <p className="pt-1 text-[10.5px] text-mist/70">
                这些记忆会在往后的对谈里自然浮现 —— 「它一直记得我」。
              </p>
            </div>
          )}
        </Section>

        {/* —— 香火账 —— */}
        <Section title="今日香火账" en="TALLY">
          <div className="flex items-end justify-between">
            <div>
              <p className="font-display text-[30px] leading-none text-ink">
                {fmtTokens(usage.today)}
              </p>
              <p className="mt-1 text-[10.5px] text-mist">今日消耗字符 · 累计 {fmtTokens(usage.total)}</p>
            </div>
            <button
              onClick={() => void refreshMetaphor()}
              className="no-tap-highlight flex items-center gap-1 rounded-full border border-line px-2.5 py-1.5 text-[10.5px] text-mist transition-colors hover:text-cinnabar"
            >
              <RefreshCcw size={11} className={metaphorLoading ? "animate-spin" : ""} />
              换个说法
            </button>
          </div>

          <p className="mt-3 rounded-2xl bg-cinnabar/[0.06] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-ink-2">
            {usage.metaphor ?? metaphorForTokens(usage.total)}
          </p>

          <div className="mt-3.5 space-y-2.5">
            {[
              { icon: Flame, label: `供养清香`, val: incense, disp: incense >= 0.1 ? `${incense.toFixed(1)} 炷` : "尚未点燃" },
              { icon: Coffee, label: `冰美式`, val: coffee, disp: coffee >= 0.05 ? `${coffee.toFixed(2)} 杯` : "还差得远" },
              { icon: Sprout, label: `智慧树`, val: trees, disp: trees >= 0.01 ? `${trees.toFixed(3)} 棵` : "种子阶段" },
            ].map((u) => (
              <div key={u.label} className="flex items-center gap-3">
                <u.icon size={14} className="shrink-0 text-cinnabar/80" />
                <span className="w-16 text-[11.5px] text-ink-2">{u.label}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-paper-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((u.val / 2.5) * 100, 100)}%` }}
                    transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full rounded-full bg-gradient-to-r from-cinnabar/70 to-cinnabar"
                  />
                </div>
                <span className="w-16 text-right text-[10.5px] text-mist">{u.disp}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => setTipOpen(true)}
            className="no-tap-highlight mt-4 w-full rounded-2xl border border-cinnabar/35 bg-cinnabar/[0.05] py-3 text-[13.5px] tracking-[0.15em] text-cinnabar transition-all hover:bg-cinnabar/[0.09] active:scale-[0.98]"
          >
            添香油 · 请大师喝杯咖
          </button>
          {donations.count > 0 && (
            <p className="mt-2 text-center text-[10.5px] text-mist">
              已受供养 {donations.count} 次 · 功德簿上有你的名字
            </p>
          )}
        </Section>

        {/* —— 木鱼 —— */}
        <Section title="赛博木鱼" en="MERIT">
          <div className="relative flex flex-col items-center py-2">
            <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
              {merits.map((m) => (
                <motion.span
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: -34 }}
                  exit={{ opacity: 0 }}
                  className="absolute font-display text-[13px] text-gold"
                  style={{ animation: "incense 1.4s ease-out forwards" }}
                >
                  {m.text}
                </motion.span>
              ))}
            </div>
            <motion.button
              onClick={knock}
              whileTap={{ scale: 0.92 }}
              className="no-tap-highlight relative flex h-24 w-24 items-center justify-center rounded-full shadow-[0_8px_24px_rgba(38,35,29,0.25)]"
              style={{ background: "radial-gradient(circle at 34% 28%, #4a4034, #26221b 72%)" }}
              aria-label="敲木鱼"
            >
              <span className="h-14 w-14 rounded-full border-2 border-[#6b5d48]/60" />
              <span className="absolute font-display text-[13px] tracking-widest text-[#c9b98f]">木鱼</span>
            </motion.button>
            <p className="mt-3 flex items-center gap-1.5 text-[12px] text-mist">
              <Hand size={13} />
              已敲 {woodfish} 记 · 敲走一点是一点
            </p>
          </div>
        </Section>

        {/* —— 馆内规矩 —— */}
        <Section title="馆内杂项" en="HOUSE">
          <div className="space-y-1.5">
            <button
              onClick={toggleMuted}
              className="no-tap-highlight flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left text-[13px] text-ink-2 transition-colors hover:bg-paper-3/60"
            >
              {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              {muted ? "铜钱与木鱼已静音（点我开声）" : "馆内音效开着呢（点我静音）"}
            </button>
            <button
              onClick={() => {
                if (!confirmReset) {
                  setConfirmReset(true);
                  setTimeout(() => setConfirmReset(false), 4000);
                  return;
                }
                resetAll();
                toast("前尘尽散，小馆重新为你升起了炉火。");
              }}
              className={cn(
                "no-tap-highlight flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left text-[13px] transition-colors",
                confirmReset ? "bg-cinnabar/10 text-cinnabar" : "text-mist hover:bg-paper-3/60"
              )}
            >
              <Trash2 size={15} />
              {confirmReset ? "再点一次，前尘尽焚（不可恢复）" : "烧掉所有记录，重新来过"}
            </button>
          </div>
        </Section>

        <footer className="flex flex-col items-center gap-2 pb-4 pt-2 text-center">
          <Logo size={30} className="text-mist/60" />
          <p className="text-[10px] tracking-[0.35em] text-mist/50">算一算 · 然后 · 算了</p>
        </footer>
      </div>
    </div>
  );
}
