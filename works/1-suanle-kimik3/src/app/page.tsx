"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Compass, Heart, MessagesSquare, Share2, Sparkles } from "lucide-react";
import { LogoMark } from "@/components/brand";
import { ShareCardModal, type ShareCardData } from "@/components/share-card";
import { WoodenFish, WeekStrip, WorryBin } from "@/components/widgets";
import { usePaywall } from "@/components/paywall";
import { dailyFortune } from "@/lib/fortune";
import { cnDate, todayKey } from "@/lib/rand";
import { useStore } from "@/lib/store";

const fadeUp = (i: number) => ({
  initial: { opacity: 0, y: 26 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.1 + i * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
});

function salutation() {
  const h = new Date().getHours();
  if (h < 5) return ["夜深了", "未完成的，先交给明天"];
  if (h < 9) return ["早上好", "新的一天值得慢慢展开"];
  if (h < 12) return ["上午好", "趁热把手边的事做轻一点"];
  if (h < 14) return ["中午好", "吃饱，是第一生产力"];
  if (h < 18) return ["下午好", "午后宜松弛，忌硬扛"];
  if (h < 22) return ["傍晚好", "把白天的紧绷还给白天"];
  return ["夜深了", "把未完成的，先交给明天"];
}

export default function HomePage() {
  const { state, ready, isPro, toggleFav } = useStore();
  const { open } = usePaywall();
  const [share, setShare] = useState<ShareCardData | null>(null);

  const key = todayKey();
  const fortune = useMemo(
    () => (ready ? dailyFortune(state.profile, key) : null),
    [ready, state.profile, key],
  );

  if (!ready || !fortune) return <div className="h-[72vh]" />;

  const name = state.profile?.name?.trim();
  const [hello, sub] = salutation();
  const favId = `daily:${key}`;
  const isFav = state.favs.some((f) => f.id === favId);

  return (
    <div className="mx-auto max-w-[860px]">
      {/* ————— 顶部问候 ————— */}
      <motion.div {...fadeUp(0)} className="flex items-center justify-between">
        <p className="text-[11px] tracking-[0.42em] text-faint">{cnDate()}</p>
        <Link href="/me" className="chip transition hover:border-faint/60">
          {hello}，{name || "旅人"}
        </Link>
      </motion.div>

      {/* ————— 主视觉 ————— */}
      <section className="relative mt-10 sm:mt-14">
        <span className="vertical-rl absolute -right-1 top-2 hidden select-none font-display text-[11px] tracking-[0.55em] text-faint/70 sm:block">
          看清大势 · 然后放下
        </span>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="animate-breathe"
        >
          <LogoMark size={92} />
        </motion.div>
        <motion.h1 {...fadeUp(1)} className="mt-8 font-display text-[44px] font-black leading-[1.18] tracking-[0.06em] sm:text-[64px]">
          算一算，
        </motion.h1>
        <motion.h1 {...fadeUp(2)} className="font-display text-[44px] font-black leading-[1.18] tracking-[0.06em] text-ink sm:text-[64px]">
          然后，算了<span className="text-terra">。</span>
        </motion.h1>
        <motion.p {...fadeUp(3)} className="mt-6 max-w-[420px] text-[14px] leading-[1.9] text-ink2">
          {sub}。摊开今天的命数看一眼——看清的人，才放得下。
        </motion.p>
      </section>

      {/* ————— 今日气流 ————— */}
      <motion.section {...fadeUp(4)} className="panel mt-12 p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-[11px] tracking-[0.4em] text-faint">
              <Sparkles size={13} className="text-gold" /> 今日气流
            </p>
            <div className="mt-4 flex items-end gap-4">
              <span className="tabular font-display text-[72px] font-black leading-none sm:text-[88px]">
                {fortune.temp}
                <span className="text-[30px] font-bold text-faint">°</span>
              </span>
              <div className="pb-2">
                <p className="font-display text-xl font-bold tracking-widest">{fortune.weather.word}</p>
                <p className="mt-1 max-w-[300px] text-[12.5px] leading-relaxed text-ink2">{fortune.weather.note}</p>
              </div>
            </div>
          </div>
          <div className="hidden flex-col items-end gap-2 sm:flex">
            <span className="chip">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: fortune.color.hex }} />
              幸运色 · {fortune.color.name}
            </span>
            <span className="chip">宜向 · {fortune.dir}</span>
            <span className="chip">幸运数 · {fortune.num}</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-mint/25 bg-mint2/35 p-4">
            <p className="font-display text-[13px] font-bold tracking-[0.3em] text-mint">宜</p>
            {fortune.yi.map((y) => <p key={y} className="mt-2 text-[13px] leading-snug text-ink">· {y}</p>)}
          </div>
          <div className="rounded-2xl border border-terra/20 bg-terra2/25 p-4">
            <p className="font-display text-[13px] font-bold tracking-[0.3em] text-terra">忌</p>
            {fortune.ji.map((j) => <p key={j} className="mt-2 text-[13px] leading-snug text-ink">· {j}</p>)}
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-line bg-paper p-6 text-center">
          <p className="font-display text-[19px] font-semibold leading-[1.9] tracking-wide sm:text-[21px]">
            「{fortune.quote}」
          </p>
          <div className="mt-4 flex items-center justify-center gap-2.5">
            <button
              onClick={() => toggleFav({ id: favId, text: fortune.quote, date: key, from: "今日解语" })}
              className={`btn-ghost h-9 px-4 text-[12px] ${isFav ? "border-terra/50 text-terra" : ""}`}
            >
              <Heart size={13} fill={isFav ? "#B9714B" : "none"} /> {isFav ? "已收藏" : "收入解语袋"}
            </button>
            <button
              onClick={() => setShare({ quote: fortune.quote, name: name || "", dateLabel: cnDate(), tag: "今日解语" })}
              className="btn-ghost h-9 px-4 text-[12px]"
            >
              <Share2 size={13} /> 生成灵验签
            </button>
          </div>
        </div>
      </motion.section>

      {/* ————— 解压小筑 ————— */}
      <motion.section {...fadeUp(5)} className="mt-6 grid gap-6 md:grid-cols-2">
        <WorryBin />
        <WoodenFish />
      </motion.section>

      {/* ————— 七日气流 ————— */}
      <motion.section {...fadeUp(6)} className="mt-6">
        <WeekStrip />
      </motion.section>

      {/* ————— 深度入口 ————— */}
      <motion.section {...fadeUp(7)} className="mt-6 grid gap-6 md:grid-cols-2">
        <Link href="/reading" className="group panel relative overflow-hidden p-7 transition-transform duration-300 hover:-translate-y-1">
          <span className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-haze2/40 blur-2xl transition-transform duration-700 group-hover:scale-125" aria-hidden />
          <Compass size={22} strokeWidth={1.6} className="text-haze" />
          <h3 className="mt-5 font-display text-[22px] font-bold tracking-wide">起一卦 · 全景推演</h3>
          <p className="mt-2 text-[12.5px] leading-relaxed text-ink2">
            五行底色、四大板块深度解语，以及你 1 到 100 岁的能量潮汐图。
          </p>
          <span className="mt-5 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-ink">
            摆放好生辰，开始推演 <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </Link>
        <Link href="/tavern" className="group panel relative overflow-hidden p-7 transition-transform duration-300 hover:-translate-y-1">
          <span className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-mint2/50 blur-2xl transition-transform duration-700 group-hover:scale-125" aria-hidden />
          <MessagesSquare size={22} strokeWidth={1.6} className="text-mint" />
          <h3 className="mt-5 font-display text-[22px] font-bold tracking-wide">宿命酒馆 · 不打烊</h3>
          <p className="mt-2 text-[12.5px] leading-relaxed text-ink2">
            三位通透挚友坐台，不上课、不评判，只递上一杯刚刚好的清醒。
          </p>
          <span className="mt-5 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-ink">
            推门落座，把心事摊开 <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </Link>
      </motion.section>

      {!isPro && (
        <motion.button
          {...fadeUp(8)}
          onClick={() => open({ context: "general" })}
          className="group mt-6 flex w-full items-center justify-between overflow-hidden rounded-[1.75rem] border border-line bg-ink px-7 py-6 text-left text-paper transition-transform duration-300 hover:-translate-y-0.5"
        >
          <div>
            <p className="font-display text-[17px] font-bold tracking-widest">算了 Pro · 深度权益</p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-paper/60">
              完整解语、人生波段、双人合盘、不限次深聊 · 低至 ¥9.9
            </p>
          </div>
          <span className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-paper/10 px-4 py-2 text-[12px] transition group-hover:bg-paper/20">
            了解一下 <ArrowRight size={13} />
          </span>
        </motion.button>
      )}

      <footer className="mt-16 flex flex-col items-center gap-3 pb-4">
        <LogoMark size={30} className="opacity-30" />
        <p className="text-center text-[10.5px] leading-relaxed tracking-[0.3em] text-faint">
          看清潮汐的人 · 不跟浪花较劲<br />© 2026 SUANLE 算了
        </p>
      </footer>

      <ShareCardModal data={share} onClose={() => setShare(null)} />
    </div>
  );
}
