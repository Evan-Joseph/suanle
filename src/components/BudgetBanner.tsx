"use client";

import { motion, AnimatePresence } from "motion/react";
import { Sparkles, X, ChevronRight } from "lucide-react";
import { useApp, useUI, todayUsage, dayKey, lampActive, profileHint } from "@/lib/store";
import { compact, localAnalogy, NUDGE_TOKENS } from "@/lib/meter";

export default function BudgetBanner() {
  const tokens = useApp((s) => todayUsage(s));
  const nudgeDay = useApp((s) => s.nudgeDay);
  const lamp = useApp((s) => lampActive(s));
  const hint = useApp((s) => profileHint(s.profile));
  const dismiss = useApp((s) => s.dismissNudge);
  const openTip = useUI((s) => s.open);
  const setTab = useUI((s) => s.setTab);

  // 达到用量阈值、今天未关闭、未点长明灯时轻盈展示
  const visible = tokens >= 25000 && nudgeDay !== dayKey() && !lamp;

  const analogy = localAnalogy(tokens, hint, 1, 2)[0]?.text ?? "一杯热拿铁";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
          className="pointer-events-auto absolute inset-x-3 top-2 z-[35] flex items-center justify-between gap-2.5 rounded-2xl border border-line/70 bg-card/90 px-3.5 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.08)] backdrop-blur-md"
        >
          <div
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-2"
            onClick={() => {
              openTip("tip", { from: "banner" });
            }}
          >
            <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[12px] font-medium text-ink">
                <span>今日畅聊已耗约 <b>{compact(tokens)}</b> 算力</span>
                <span className="hidden sm:inline text-mute font-normal text-[11px]">（≈ {analogy}）</span>
              </div>
              <p className="truncate text-[11px] text-mute">
                小馆由个人自费运维，算力随缘随喜维系。点击前往随喜，未随喜亦可安心畅聊 →
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                openTip("tip", { from: "banner" });
              }}
              className="rounded-full bg-ink px-2.5 py-1 text-[11px] font-medium text-on-ink transition hover:opacity-90 active:scale-95"
            >
              随喜
            </button>
            <button
              type="button"
              aria-label="关闭温馨提示"
              onClick={(e) => {
                e.stopPropagation();
                dismiss();
              }}
              className="grid h-6 w-6 place-items-center rounded-full text-mute transition hover:bg-ink/[0.06] hover:text-ink active:scale-90"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
