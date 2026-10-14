"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { QRCodeCanvas } from "qrcode.react";
import { Coffee, X } from "lucide-react";
import { PAYMENT } from "@/lib/brand";
import { useApp } from "@/store/app";
import { sfxReveal } from "@/lib/audio";
import { cn } from "@/lib/utils";

type Channel = keyof Pick<typeof PAYMENT, "wechat" | "alipay">;

export function TipModal() {
  const open = useApp((s) => s.tipOpen);
  const setOpen = useApp((s) => s.setTipOpen);
  const donate = useApp((s) => s.donate);
  const toast = useApp((s) => s.toast);
  const [channel, setChannel] = useState<Channel>("wechat");
  const [amount, setAmount] = useState<number>(PAYMENT.amounts[1]);

  const pay = PAYMENT[channel];

  const confirm = () => {
    donate(amount);
    sfxReveal();
    toast(`香火情领下了：功德 +${amount}，烦恼 -${Math.round(amount / 2)}。多谢客官！`);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-ink/45 backdrop-blur-[3px]"
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="fixed left-1/2 top-1/2 z-[81] w-[min(92vw,380px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[28px] border border-line bg-paper-2 shadow-2xl"
          >
            {/* 香火头图 */}
            <div className="relative flex h-16 items-center justify-center overflow-hidden bg-gradient-to-b from-paper-3/80 to-transparent">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="mx-2 h-8 w-[3px] rounded-full bg-gradient-to-t from-cinnabar to-cinnabar/40"
                  style={{ animation: `incense 2.6s ease-in-out ${i * 0.7}s infinite` }}
                />
              ))}
              <button
                onClick={() => setOpen(false)}
                className="no-tap-highlight absolute right-3 top-3 rounded-full bg-ink/5 p-1.5 text-mist"
                aria-label="关闭"
              >
                <X size={15} />
              </button>
            </div>

            <div className="px-5 pb-6 pt-1 text-center">
              <h3 className="font-display text-[19px] tracking-[0.25em] text-ink">添香油</h3>
              <p className="mt-1 text-[11.5px] text-mist">
                此殿不收门票，香火随缘。你的每一分都化作小馆的电费与豆香。
              </p>

              {/* channel tabs */}
              <div className="mx-auto mt-4 flex w-fit rounded-full border border-line p-0.5">
                {(["wechat", "alipay"] as Channel[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setChannel(c)}
                    className={cn(
                      "no-tap-highlight rounded-full px-4 py-1.5 text-[12px] transition-all",
                      channel === c ? "bg-ink text-paper-2" : "text-ink-2"
                    )}
                  >
                    {PAYMENT[c].label}
                  </button>
                ))}
              </div>

              {/* QR */}
              <div className="mx-auto mt-4 w-fit rounded-2xl border border-line bg-white p-3 shadow-inner">
                <QRCodeCanvas value={pay.payload} size={164} level="M" includeMargin={false} />
              </div>
              <p className="mt-2 text-[11px] text-mist">{pay.hint}</p>
              {!pay.configured && (
                <p className="mt-1 text-[10px] leading-relaxed text-mist/60">
                  （掌柜的收款码还在置办中，先记账，心意一样灵）
                </p>
              )}

              {/* amounts */}
              <div className="mt-4 grid grid-cols-4 gap-2">
                {PAYMENT.amounts.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAmount(a)}
                    className={cn(
                      "no-tap-highlight rounded-xl border py-2 text-[13px] transition-all active:scale-95",
                      amount === a
                        ? "border-cinnabar bg-cinnabar/[0.07] text-cinnabar"
                        : "border-line text-ink-2"
                    )}
                  >
                    ¥{a}
                  </button>
                ))}
              </div>

              <button
                onClick={confirm}
                className="no-tap-highlight mt-3.5 flex w-full items-center justify-center gap-2 rounded-2xl bg-cinnabar py-3 text-[14px] tracking-wider text-paper-2 shadow-sm transition-all active:scale-[0.98]"
              >
                <Coffee size={15} />
                我已添香 ¥{amount}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
