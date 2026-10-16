import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useUI } from "@/lib/store";

/**
 * 算了 Logo —— 温润笑脸
 * 左三断爻 = 左眼（一个整体），右三断爻 = 右眼（一个整体），下方一弧 = 微笑。
 * 眨眼时，两只“眼睛”分别作为整体沿自身中心纵向收合，绝不拆成六只眼。
 */
export function Logo({
  size = 40,
  mode = "idle",
  draw = false,
  bg = false,
  className = "",
  color = "currentColor",
}: {
  size?: number;
  mode?: "idle" | "think" | "static";
  draw?: boolean;
  bg?: boolean;
  className?: string;
  color?: string;
}) {
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    if (mode !== "idle") return;
    let alive = true;
    let t: ReturnType<typeof setTimeout>;
    const once = (after: () => void) => {
      setBlink(true);
      t = setTimeout(() => {
        if (!alive) return;
        setBlink(false);
        after();
      }, 130);
    };
    const loop = () => {
      t = setTimeout(() => {
        if (!alive) return;
        const double = Math.random() < 0.18;
        once(() => {
          if (double) t = setTimeout(() => alive && once(loop), 150);
          else loop();
        });
      }, 2600 + Math.random() * 3800);
    };
    loop();
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [mode]);

  const cls = [mode === "think" ? "logo-squint logo-breathe" : "", blink ? "logo-blink" : "", className].join(" ");
  const eye = (x: number) => (
    <g className="logo-eye">
      <rect x={x} y={248} width={216} height={74} rx={10} />
      <rect x={x} y={356} width={216} height={74} rx={10} />
      <rect x={x} y={464} width={216} height={74} rx={10} />
    </g>
  );
  return (
    <svg viewBox="0 0 1024 1024" width={size} height={size} className={cls} role="img" aria-label="算了">
      {bg && <rect width="1024" height="1024" rx="230" fill="#FAF9F6" />}
      <g fill={color}>
        {eye(248)}
        {eye(560)}
      </g>
      <path
        className="logo-smile"
        d="M 264 600 C 264 776, 760 776, 760 600"
        fill="none"
        stroke={color}
        strokeWidth={64}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={draw ? 1 : undefined}
        style={draw ? { strokeDashoffset: 1, animation: "smile-draw 1s cubic-bezier(0.65,0,0.35,1) 0.35s forwards" } : undefined}
      />
    </svg>
  );
}

export function WordMark({ small = false }: { small?: boolean }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className={`font-song font-bold tracking-[0.16em] ${small ? "text-[17px]" : "text-2xl"}`}>算了</span>
      <span className={`tracking-[0.3em] text-mute ${small ? "text-[9.5px]" : "text-[11px]"}`}>SUANLE</span>
    </div>
  );
}

/** 底部抽屉：弹簧进出、下拉关闭 */
export function Sheet({ open, onClose, title, children, tall = false }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; tall?: boolean }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end">
          <motion.div
            className="absolute inset-0 bg-[#1f1d1a]/35 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={`paper-grain relative flex flex-col rounded-t-[28px] shadow-[0_-12px_40px_rgba(0,0,0,0.14)] ${tall ? "h-[90%]" : "max-h-[88%]"}`}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 600) onClose();
            }}
          >
            <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-[#d8d2c5]" />
            <div className="flex shrink-0 items-center justify-between px-5 pb-1 pt-2">
              <div className="font-song text-[17px] font-bold">{title}</div>
              <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full bg-black/5 text-ink-2 active:scale-95" aria-label="关闭">
                <X size={16} />
              </button>
            </div>
            <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-safe pt-1" onPointerDown={(e) => e.stopPropagation()}>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function Toast() {
  const text = useUI((s) => s.toastText);
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[max(env(safe-area-inset-top),16px)] z-[70] flex justify-center px-6">
      <AnimatePresence>
        {text && (
          <motion.div
            key={text}
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-full bg-ink/90 px-4 py-2 text-[13px] text-paper shadow-lg backdrop-blur"
          >
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Card({ children, className = "", onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div onClick={onClick} className={`rounded-[22px] border border-line bg-white/70 shadow-[0_2px_14px_rgba(60,40,10,0.04)] ${onClick ? "cursor-pointer transition active:scale-[0.985]" : ""} ${className}`}>
      {children}
    </div>
  );
}

export function SectionTitle({ children, extra }: { children: ReactNode; extra?: ReactNode }) {
  return (
    <div className="mb-2.5 mt-6 flex items-end justify-between px-1">
      <h3 className="font-song text-[15px] font-bold tracking-wide">{children}</h3>
      {extra}
    </div>
  );
}

export function timeAgo(ts: number) {
  const d = Date.now() - ts;
  if (d < 60000) return "刚刚";
  if (d < 3600000) return `${Math.floor(d / 60000)} 分钟前`;
  if (d < 86400000) return `${Math.floor(d / 3600000)} 小时前`;
  if (d < 86400000 * 7) return `${Math.floor(d / 86400000)} 天前`;
  const t = new Date(ts);
  return `${t.getMonth() + 1}月${t.getDate()}日`;
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
}

/** 数字缓动 */
export function useCountUp(target: number, ms = 900) {
  const [v, setV] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / ms);
      const e = 1 - Math.pow(1 - k, 3);
      setV(a + (target - a) * e);
      if (k < 1) raf = requestAnimationFrame(step);
      else from.current = target;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}
