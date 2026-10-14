"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "@/store/app";

export function Toaster() {
  const toasts = useApp((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[90] flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            className="max-w-xs rounded-full border border-ink/10 bg-ink/90 px-4 py-2 text-[13px] text-paper-2 shadow-lg backdrop-blur-md"
          >
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
