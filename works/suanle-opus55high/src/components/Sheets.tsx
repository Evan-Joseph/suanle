import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import QRCode from "qrcode";
import { Download, Heart } from "lucide-react";
import { useApp, useUI, lampActive } from "@/lib/store";
import { analogize, fmt, yuanOf } from "@/lib/meter";
import { maybeRefreshBasis } from "@/lib/engine";
import { playBowl, haptic } from "@/lib/sound";
import { BirthForm } from "./tools";
import { Logo, Sheet, copyText } from "./ui";

/** 收款二维码内容：替换为真实的收款链接即可 */
const PAY_LINK = "https://github.com/Evan-Joseph/suanle";

function PayQR({ amount, onPaid }: { amount: number; onPaid: () => void }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    QRCode.toDataURL(`${PAY_LINK}?tip=${amount}`, { margin: 1, width: 320, color: { dark: "#262626", light: "#ffffff" } })
      .then(setSrc)
      .catch(() => setSrc(""));
  }, [amount]);
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center rounded-[22px] border border-line bg-white p-5">
      <div className="relative">
        {src ? <img src={src} alt="收款码" className="h-44 w-44 rounded-xl" /> : <div className="h-44 w-44 animate-pulse rounded-xl bg-paper-2" />}
        <div className="absolute left-1/2 top-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-xl bg-white shadow">
          <Logo size={26} mode="static" />
        </div>
      </div>
      <div className="mt-3 font-song text-[22px] font-bold">¥ {amount}</div>
      <div className="mt-1 text-[12px] text-mute">微信 / 支付宝 扫一扫 · 长按识别</div>
      <button onClick={onPaid} className="mt-4 h-11 w-full rounded-full bg-ink text-[14.5px] text-paper active:scale-[0.98]">
        我已随喜
      </button>
    </motion.div>
  );
}

function Thanks({ text, sub }: { text: string; sub: string }) {
  useEffect(() => {
    playBowl();
    haptic(20);
  }, []);
  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-8 text-center">
      <div className="grid h-20 w-20 place-items-center rounded-full bg-seal/10 text-seal">
        <Heart size={30} fill="currentColor" />
      </div>
      <div className="mt-5 font-song text-[20px] font-bold">{text}</div>
      <div className="mt-2 max-w-[260px] text-[13px] leading-relaxed text-mute">{sub}</div>
    </motion.div>
  );
}

const AMOUNTS = [
  { v: 3, label: "一炷清香" },
  { v: 9.9, label: "一杯热茶" },
  { v: 18, label: "一碗热面" },
  { v: 66, label: "六六大顺" },
];

export function TipSheet() {
  const open = useUI((s) => s.sheet === "tip");
  const payload = useUI((s) => s.sheetPayload);
  const usage = useApp((s) => s.usage);
  const [amount, setAmount] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const one = typeof payload?.tokens === "number" ? (payload.tokens as number) : 0;
  const tokens = one || usage.total;
  const items = useMemo(() => analogize(tokens, usage.basis), [tokens, usage.basis]);

  useEffect(() => {
    if (open) {
      setAmount(null);
      setDone(false);
      void maybeRefreshBasis();
    }
  }, [open]);

  return (
    <Sheet open={open} onClose={() => useUI.getState().close()} title="随喜">
      {done ? (
        <Thanks text="心意收到了" sub="这份好意，会化成更多个陪你“算了”的夜晚。愿你今天也松快一点。" />
      ) : (
        <div className="pb-4">
          <div className="rounded-[22px] bg-ink p-5 text-paper">
            <div className="text-[12px] tracking-wider text-paper/60">{one ? "这一回答" : "我们一起"}消耗了</div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-song text-[32px] font-bold tabular-nums">{fmt(tokens)}</span>
              <span className="text-[13px] text-paper/70">算力</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {items.map((it) => (
                <div key={it.name} className="rounded-2xl bg-white/[0.08] px-2 py-2.5 text-center">
                  <div className="text-[22px] leading-none">{it.emoji}</div>
                  <div className="mt-1.5 text-[13px] font-medium tabular-nums">≈ {it.qty} {it.unit}</div>
                  <div className="mt-0.5 truncate text-[11px] text-paper/60">{it.name}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-[12.5px] text-paper/70">{usage.basisLine || `折合约 ¥${yuanOf(tokens).toFixed(2)}，比想不通的那一夜便宜多了。`}</div>
          </div>
          <div className="mt-5 text-center text-[13px] leading-relaxed text-ink-2">
            算了一直都是免费的。
            <br />
            若它陪你走过了一小段路，随喜一点，就当请掌柜喝杯茶。
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {AMOUNTS.map((a) => (
              <button
                key={a.v}
                onClick={() => setAmount(a.v)}
                className={`flex flex-col items-center rounded-2xl border py-2.5 transition active:scale-95 ${amount === a.v ? "border-ink bg-ink text-paper" : "border-line bg-white text-ink"}`}
              >
                <span className="font-song text-[16px] font-bold">¥{a.v}</span>
                <span className={`mt-0.5 text-[10.5px] ${amount === a.v ? "text-paper/70" : "text-mute"}`}>{a.label}</span>
              </button>
            ))}
          </div>
          {amount && (
            <div className="mt-4">
              <PayQR
                amount={amount}
                onPaid={() => {
                  useApp.getState().addMerit(Math.round(amount * 100));
                  setDone(true);
                }}
              />
            </div>
          )}
        </div>
      )}
    </Sheet>
  );
}

const LAMPS = [
  { days: 7, v: 6, label: "七日灯" },
  { days: 30, v: 18, label: "满月灯" },
];

export function LampSheet() {
  const open = useUI((s) => s.sheet === "lamp");
  const merit = useApp((s) => s.merit);
  const lit = useApp((s) => lampActive(s));
  const [pick, setPick] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (open) {
      setPick(null);
      setDone(false);
    }
  }, [open]);
  const lamp = LAMPS.find((l) => l.days === pick);
  const until = new Date(merit.lampUntil);
  return (
    <Sheet open={open} onClose={() => useUI.getState().close()} title="长明灯">
      {done ? (
        <Thanks text="灯已点亮" sub="灯亮着的日子里，深度推演不设上限。想多问几句，就多问几句。" />
      ) : (
        <div className="pb-4">
          <div className="flex flex-col items-center py-4">
            <svg viewBox="0 0 80 110" width="78" height="108">
              <defs>
                <radialGradient id="glow" cx="50%" cy="40%" r="50%">
                  <stop offset="0%" stopColor="#f6c76b" stopOpacity={lit ? 0.6 : 0.25} />
                  <stop offset="100%" stopColor="#f6c76b" stopOpacity="0" />
                </radialGradient>
              </defs>
              <circle cx="40" cy="36" r="34" fill="url(#glow)" />
              <g className="flame">
                <path d="M40 12c7 10 10 16 10 22a10 10 0 0 1-20 0c0-6 3-12 10-22Z" fill={lit ? "#e8a43c" : "#e9b866"} />
                <path d="M40 24c3.5 5 5 8 5 11a5 5 0 0 1-10 0c0-3 1.5-6 5-11Z" fill="#fff3d6" />
              </g>
              <path d="M24 56h32l-4 10H28l-4-10Z" fill="#b8955a" />
              <rect x="34" y="66" width="12" height="26" rx="2" fill="#c9a66b" />
              <ellipse cx="40" cy="96" rx="20" ry="5" fill="#b8955a" />
            </svg>
            <div className="mt-2 text-center text-[13.5px] leading-relaxed text-ink-2">
              {lit ? (
                <>
                  灯正亮着，至 {until.getMonth() + 1}月{until.getDate()}日。
                  <br />
                  可以续一盏，让光再久一点。
                </>
              ) : (
                <>
                  每天有三次深度推演，够用就好。
                  <br />
                  点一盏灯，灯亮着的日子里，想问多深都行。
                </>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {LAMPS.map((l) => (
              <button
                key={l.days}
                onClick={() => setPick(l.days)}
                className={`rounded-[20px] border p-4 text-left transition active:scale-[0.97] ${pick === l.days ? "border-ink bg-ink text-paper" : "border-line bg-white"}`}
              >
                <div className="font-song text-[16px] font-bold">{l.label}</div>
                <div className={`mt-0.5 text-[12px] ${pick === l.days ? "text-paper/70" : "text-mute"}`}>{l.days} 天 · 深度推演不限</div>
                <div className="mt-3 font-song text-[20px] font-bold">¥{l.v}</div>
              </button>
            ))}
          </div>
          {lamp && (
            <div className="mt-4">
              <PayQR
                amount={lamp.v}
                onPaid={() => {
                  useApp.getState().addMerit(lamp.v * 100, lamp.days);
                  setDone(true);
                }}
              />
            </div>
          )}
        </div>
      )}
    </Sheet>
  );
}

/* ───────── 分享卡片：把一句“算了”做成海报 ───────── */

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  const lines: string[] = [];
  let cur = "";
  for (const ch of text) {
    if (ctx.measureText(cur + ch).width > maxW) {
      lines.push(cur);
      cur = ch;
    } else cur += ch;
  }
  if (cur) lines.push(cur);
  return lines;
}

function drawLogo(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) {
  const k = s / 1024;
  ctx.fillStyle = color;
  for (const ex of [248, 560]) for (const ey of [248, 356, 464]) {
    ctx.beginPath();
    ctx.roundRect(x + ex * k, y + ey * k, 216 * k, 74 * k, 10 * k);
    ctx.fill();
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 64 * k;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x + 264 * k, y + 600 * k);
  ctx.bezierCurveTo(x + 264 * k, y + 776 * k, x + 760 * k, y + 776 * k, x + 760 * k, y + 600 * k);
  ctx.stroke();
}

export function ShareSheet() {
  const open = useUI((s) => s.sheet === "share");
  const payload = useUI((s) => s.sheetPayload);
  const name = useApp((s) => s.profile.name);
  const [url, setUrl] = useState("");
  const cv = useRef<HTMLCanvasElement | null>(null);
  const quote = String(payload?.quote || "算了，今天就到这儿。").replace(/^算了[，,]?\s*/, "");

  useEffect(() => {
    if (!open) return;
    const draw = async () => {
      try {
        await document.fonts?.load('700 60px "Noto Serif SC"');
      } catch {
        /* 字体没到也能画 */
      }
      const c = cv.current ?? document.createElement("canvas");
      cv.current = c;
      c.width = 1080;
      c.height = 1440;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#faf9f6";
      ctx.fillRect(0, 0, 1080, 1440);
      ctx.strokeStyle = "rgba(38,38,38,0.08)";
      ctx.lineWidth = 2;
      ctx.strokeRect(60, 60, 960, 1320);
      drawLogo(ctx, 90, 110, 150, "#262626");
      ctx.fillStyle = "#262626";
      ctx.font = '700 46px "Noto Serif SC", serif';
      ctx.fillText("算了", 250, 202);
      ctx.fillStyle = "#9a958c";
      ctx.font = '400 22px sans-serif';
      ctx.fillText("S U A N L E", 252, 240);
      ctx.fillStyle = "#c4553a";
      ctx.font = '700 120px "Noto Serif SC", serif';
      ctx.fillText("算了，", 130, 520);
      ctx.fillStyle = "#262626";
      ctx.font = '700 64px "Noto Serif SC", serif';
      const lines = wrap(ctx, quote, 820).slice(0, 6);
      lines.forEach((l, i) => ctx.fillText(l, 130, 640 + i * 100));
      const d = new Date();
      ctx.fillStyle = "#9a958c";
      ctx.font = '400 28px "Noto Serif SC", serif';
      ctx.fillText(`${name ? name + " · " : ""}${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`, 130, 1250);
      ctx.fillStyle = "#262626";
      ctx.font = '500 32px "Noto Serif SC", serif';
      ctx.fillText("算一算，然后，算了。", 130, 1310);
      ctx.fillStyle = "#c4553a";
      ctx.fillRect(880, 1220, 90, 90);
      ctx.fillStyle = "#faf9f6";
      ctx.font = '700 36px "Noto Serif SC", serif';
      ctx.fillText("算", 907, 1262);
      ctx.fillText("了", 907, 1302);
      setUrl(c.toDataURL("image/png"));
    };
    setUrl("");
    void draw();
  }, [open, quote, name]);

  return (
    <Sheet open={open} onClose={() => useUI.getState().close()} title="分享这一句">
      <div className="pb-4">
        <div className="mx-auto aspect-[3/4] w-full max-w-[300px] overflow-hidden rounded-2xl border border-line bg-white shadow-[0_10px_30px_rgba(60,40,10,0.08)]">
          {url ? <img src={url} alt="分享卡片" className="h-full w-full object-cover" /> : <div className="h-full w-full animate-pulse bg-paper-2" />}
        </div>
        <div className="mt-2 text-center text-[12px] text-mute">手机上可长按图片保存</div>
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <button
            onClick={async () => {
              await copyText(`算了，${quote}\n—— 算了 · 算一算，然后，算了。`);
              useUI.getState().toast("已复制这句话");
            }}
            className="h-11 rounded-full border border-line bg-white text-[14px] text-ink-2 active:scale-[0.98]"
          >
            复制文字
          </button>
          <a href={url || undefined} download="suanle.png" className="flex h-11 items-center justify-center gap-1.5 rounded-full bg-ink text-[14px] text-paper active:scale-[0.98]">
            <Download size={15} /> 保存图片
          </a>
        </div>
      </div>
    </Sheet>
  );
}

export function ProfileSheet() {
  const open = useUI((s) => s.sheet === "profile");
  const profile = useApp((s) => s.profile);
  const [name, setName] = useState(profile.name ?? "");
  const [city, setCity] = useState(profile.city ?? "");
  useEffect(() => {
    if (open) {
      setName(profile.name ?? "");
      setCity(profile.city ?? "");
    }
  }, [open, profile.name, profile.city]);
  return (
    <Sheet open={open} onClose={() => useUI.getState().close()} title="我的资料">
      <div className="space-y-4 pb-4">
        <div className="grid grid-cols-2 gap-2.5">
          <label className="block">
            <span className="mb-1 block text-[12px] text-mute">怎么称呼你</span>
            <input value={name} onChange={(e) => setName(e.target.value.slice(0, 12))} placeholder="小名、昵称都行" className="h-11 w-full rounded-2xl border border-line bg-white px-3 text-[15px] outline-none focus:border-ink/40" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] text-mute">常在的城市</span>
            <input value={city} onChange={(e) => setCity(e.target.value.slice(0, 12))} placeholder="可不填" className="h-11 w-full rounded-2xl border border-line bg-white px-3 text-[15px] outline-none focus:border-ink/40" />
          </label>
        </div>
        <BirthForm
          initial={profile.birth}
          gender={profile.gender}
          cta="保存"
          onSubmit={(birth, gender) => {
            useApp.getState().setProfile({ name: name.trim() || undefined, city: city.trim() || undefined, birth, gender });
            useUI.getState().close();
            useUI.getState().toast("记住了");
          }}
        />
      </div>
    </Sheet>
  );
}
