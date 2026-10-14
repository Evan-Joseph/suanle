"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useApp } from "@/store/app";
import { Logo } from "./logo";
import { OPENING_LINES } from "@/lib/brand";

export function Onboarding() {
  const complete = useApp((s) => s.completeOnboarding);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      className="grain flex h-dvh flex-col items-center justify-between overflow-hidden bg-paper px-6 py-10"
    >
      <div className="flex flex-1 flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/img/welcome-ink.png"
            alt=""
            className="h-44 w-44 rounded-[36px] object-cover opacity-90 mix-blend-multiply sm:h-52 sm:w-52"
          />
          <div className="absolute -bottom-5 -right-5 rounded-2xl bg-paper-2 p-2.5 shadow-[0_8px_28px_rgba(38,35,29,0.14)]">
            <Logo size={44} animated className="text-ink" />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="mt-9 font-display text-[34px] tracking-[0.28em] text-ink"
        >
          算了
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="mt-2 text-[12px] tracking-[0.42em] text-mist"
        >
          SUANLE · 一间不打烊的命运小馆
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
          className="mt-8 space-y-2 text-center"
        >
          {OPENING_LINES.map((l, i) => (
            <motion.p
              key={l}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85 + i * 0.18 }}
              className="text-[13.5px] leading-relaxed text-ink-2"
            >
              {l}
            </motion.p>
          ))}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.35 }}
        className="w-full max-w-[320px] safe-b"
      >
        <button
          onClick={complete}
          className="no-tap-highlight group flex w-full items-center justify-center gap-2 rounded-full bg-ink py-4 font-display text-[15px] tracking-[0.3em] text-paper-2 shadow-[0_10px_30px_rgba(38,35,29,0.25)] transition-all hover:shadow-[0_12px_36px_rgba(181,64,42,0.3)] active:scale-[0.97]"
        >
          进来坐坐
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </button>
        <p className="mt-3 text-center text-[10.5px] tracking-[0.3em] text-mist/70">
          算一算 · 然后 · 算了
        </p>
      </motion.div>
    </motion.div>
  );
}
