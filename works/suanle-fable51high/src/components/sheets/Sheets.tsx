"use client";

import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "motion/react";
import { Flame, Check, Download, Copy } from "lucide-react";
import { Sheet, Logo } from "@/components/ui";
import { useApp, useUI, lampActive, scheduleSync } from "@/store/app";
import { fmtTokens } from "@/lib/parse";
import { mockMetaphor } from "@/lib/mock";
import { playBowl, haptic } from "@/lib/sound";
import { BaziWidget } from "@/components/chat/Widgets";
import { bringToChat } from "@/lib/engine";

const PAY_URL = "https://github.com/Evan-Joseph/suanle";

export default function Sheets() {
  const sheet = useUI((s) => s.sheet);
  const setSheet = useUI((s) => s.setSheet);
  const close = () => setSheet(null);
  return (
    <>
      <TipSheet key={sheet?.kind === "tip" ? String(sheet.tokens ?? "all") : "tip"} open={sheet?.kind === "tip"} tokens={sheet?.kind === "tip" ? sheet.tokens : undefined} onClose={close} />
      <LampSheet open={sheet?.kind === "lamp"} onClose={close} />
      <ShareSheet open={sheet?.kind === "share"} text={sheet?.kind === "share" ? sheet.text : ""} onClose={close} />
      <Sheet open={sheet?.kind === "bazi"} onClose={close} title="生辰">
        <div className="-mt-2 flex justify-center">
          <BaziWidget standalone onSubmit={(t) => { close(); bringToChat(t, { fresh: true }); }} />
        </div>
      </Sheet>
    </>
  );
}

/* ───────────── 赞赏 ───────────── */
function TipSheet({ open, tokens, onClose }: { open: boolean; tokens?: number; onClose: () => void }) {
  const profile = useApp((s) => s.profile);
  const anonId = useApp((s) => s.anonId);
  const total = useApp((s) => s.usage.total);
  const toast = useUI((s) => s.toast);
  const n = tokens ?? total;
  const [m, setM] = useState(() => mockMetaphor(Math.max(n, 1), profile));
  const [amount, setAmount] = useState<number>(6);
  const [thanks, setThanks] = useState(false);

  const handleClose = () => { setThanks(false); onClose(); };
  useEffect(() => {
    if (!open) return;
    fetch("/api/metaphor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tokens: n, profile }) })
      .then((r) => r.json()).then((j) => j?.item && setM(j)).catch(() => null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, n]);

  const confirmTip = () => {
    fetch("/api/tips", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ anonId, kind: "tip", amount, note: `${m.count}${m.item}` }) }).catch(() => null);
    setThanks(true); playBowl(); haptic([10, 30, 10]);
    setTimeout(() => { handleClose(); toast("收到了，谢谢你", "🙏"); }, 1400);
  };

  return (
    <Sheet open={open} onClose={handleClose} title="请算了喝一杯">
      {thanks ? (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-10 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-moss/20 text-moss"><Check size={28} /></div>
          <p className="mt-4 font-serif text-lg">心意收到了。</p>
          <p className="mt-1 text-sm text-ink-3">下次再来，还是老位置。</p>
        </motion.div>
      ) : (
        <>
          <div className="rounded-2xl bg-paper-2/70 p-4 text-center">
            <div className="text-3xl">{m.emoji}</div>
            <p className="mt-2 text-[15px]">{tokens ? "这一次" : "到目前为止"}耗了 <b>{fmtTokens(n)}</b> 算力</p>
            <p className="font-serif text-[18px] font-semibold">≈ {m.count}{m.item}</p>
            <p className="mt-1 text-xs text-ink-3">{m.line}</p>
          </div>
          <p className="mt-4 text-center text-[13px] leading-relaxed text-ink-2">算了不设门槛，愿意的话，请它喝杯热的。<br />多少都好，不请也没关系。</p>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {[3, 6, 18, 66].map((a) => (
              <button key={a} onClick={() => setAmount(a)} className={`rounded-xl border py-2.5 text-[15px] font-medium transition ${amount === a ? "border-ink bg-ink text-paper" : "border-ink/10 bg-white/70 text-ink"}`}>¥{a}</button>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-4 rounded-2xl border border-ink/10 bg-white/80 p-4">
            <div className="shrink-0 rounded-xl bg-white p-2 shadow-sm"><QRCodeSVG value={`${PAY_URL}?tip=${amount}`} size={104} fgColor="#2b2a28" bgColor="#ffffff" level="M" /></div>
            <div className="min-w-0 text-[13px] leading-relaxed text-ink-2">
              <p className="font-serif text-[15px] font-semibold text-ink">扫码赞赏 ¥{amount}</p>
              <p className="mt-1">微信 / 支付宝长按识别。<br />扫完回来点一下下面的按钮就好。</p>
            </div>
          </div>
          <button onClick={confirmTip} className="ink-btn mt-4 w-full rounded-xl py-3 text-[15px] font-medium">我已经请过了</button>
        </>
      )}
    </Sheet>
  );
}

/* ───────────── 点灯 ───────────── */
function LampSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const anonId = useApp((s) => s.anonId);
  const lamp = useApp(lampActive);
  const lightLamp = useApp((s) => s.lightLamp);
  const toast = useUI((s) => s.toast);
  const [wish, setWish] = useState("");
  const [lit, setLit] = useState(false);
  const [plan, setPlan] = useState<30 | 90>(30);
  const handleClose = () => { setLit(false); setWish(""); onClose(); };

  const light = () => {
    lightLamp(plan); setLit(true); playBowl(); haptic([10, 40, 10, 40, 10]);
    fetch("/api/tips", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ anonId, kind: "lamp", amount: plan === 30 ? 28 : 68, days: plan, note: wish }) }).catch(() => null);
    scheduleSync();
    setTimeout(() => { handleClose(); toast("灯亮了", "🪔"); }, 1800);
  };

  return (
    <Sheet open={open} onClose={handleClose} title="点一盏灯">
      <div className="flex flex-col items-center py-2">
        <motion.div animate={lit ? { scale: [1, 1.15, 1] } : {}} className="relative grid h-28 w-28 place-items-center">
          <div className={`absolute inset-0 rounded-full blur-2xl transition-all duration-1000 ${lit || lamp ? "bg-gold/50" : "bg-gold/10"}`} />
          <svg viewBox="0 0 80 100" width="84" height="104" className="relative">
            <path d="M40 10 C 30 28, 28 36, 40 46 C 52 36, 50 28, 40 10Z" fill={lit || lamp ? "#e8a33d" : "#d9cdb4"} className={lit || lamp ? "anim-flame" : ""} />
            <path d="M40 24 C 36 32, 36 36, 40 42 C 44 36, 44 32, 40 24Z" fill={lit || lamp ? "#fff1c2" : "#ece5d6"} />
            <rect x="34" y="46" width="12" height="10" rx="2" fill="#2b2a28" />
            <path d="M18 58 H62 L56 90 H24 Z" fill="#c4553a" />
            <path d="M14 56 H66 V60 H14Z" fill="#8a3a28" />
            <path d="M22 90 H58 V96 H22Z" fill="#2b2a28" />
          </svg>
        </motion.div>
        {lit ? (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 font-serif text-lg">灯亮了。{wish ? "你的话，它听见了。" : "愿你心安。"}</motion.p>
        ) : lamp ? (
          <p className="mt-3 text-center text-sm text-ink-2">你的灯还亮着。<br />可以再续一段，也可以替在乎的人点一盏。</p>
        ) : (
          <p className="mt-3 max-w-[300px] text-center text-[14px] leading-relaxed text-ink-2">点一盏长明灯，这段日子里深度推演不限次数，算了也会更记得你。更重要的是——给自己一个安心的仪式。</p>
        )}
      </div>
      {!lit && (
        <>
          <input value={wish} onChange={(e) => setWish(e.target.value.slice(0, 40))} placeholder="想对自己说的一句话（可不填）" className="mt-2 h-11 w-full rounded-xl border border-ink/10 bg-white/80 px-4 text-[15px] outline-none focus:border-ink/40" />
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {([30, 90] as const).map((d) => (
              <button key={d} onClick={() => setPlan(d)} className={`rounded-2xl border p-3.5 text-left transition ${plan === d ? "border-ink bg-ink text-paper" : "border-ink/10 bg-white/70"}`}>
                <div className="font-serif text-[17px] font-semibold">{d} 天</div>
                <div className={`text-xs ${plan === d ? "text-paper/70" : "text-ink-3"}`}>{d === 30 ? "¥28 · 一盏小灯" : "¥68 · 一季长明"}</div>
              </button>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-4 rounded-2xl border border-ink/10 bg-white/80 p-4">
            <div className="shrink-0 rounded-xl bg-white p-2 shadow-sm"><QRCodeSVG value={`${PAY_URL}?lamp=${plan}`} size={96} fgColor="#2b2a28" level="M" /></div>
            <p className="text-[13px] leading-relaxed text-ink-2">扫码付 ¥{plan === 30 ? 28 : 68}，<br />回来点下面的按钮，灯就亮了。</p>
          </div>
          <button onClick={light} className="ink-btn mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[15px] font-medium"><Flame size={16} /> 点亮</button>
        </>
      )}
    </Sheet>
  );
}

/* ───────────── 分享卡 ───────────── */
function ShareSheet({ open, text, onClose }: { open: boolean; text: string; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const toast = useUI((s) => s.toast);
  const name = useApp((s) => s.profile.name);
  const quote = (text.match(/>\s*(算了[^\n]*)/)?.[1] ?? text.replace(/[#*`>]/g, "").trim()).slice(0, 120);

  useEffect(() => {
    if (!open) return;
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    const W = 720, H = 960; c.width = W; c.height = H;
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#faf7f1"); g.addColorStop(1, "#efe7d9");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#2b2a28";
    const drawLogo = (x: number, y: number, s: number) => {
      const bar = (bx: number, by: number) => { ctx.beginPath(); ctx.roundRect(x + bx * s, y + by * s, 216 * s, 74 * s, 22 * s); ctx.fill(); };
      [248, 356, 464].forEach((by) => { bar(248, by); bar(560, by); });
      ctx.beginPath(); ctx.lineWidth = 64 * s; ctx.lineCap = "round"; ctx.strokeStyle = "#2b2a28";
      ctx.moveTo(x + 264 * s, y + 600 * s); ctx.bezierCurveTo(x + 264 * s, y + 776 * s, x + 760 * s, y + 776 * s, x + 760 * s, y + 600 * s); ctx.stroke();
    };
    drawLogo(W / 2 - 60, 90, 0.12);
    ctx.font = "600 26px 'Songti SC','Noto Serif SC',serif"; ctx.textAlign = "center"; ctx.fillStyle = "#2b2a28";
    ctx.fillText("算了 · Suanle", W / 2, 270);
    ctx.font = "400 48px 'Songti SC','Noto Serif SC',serif";
    const lines: string[] = []; let cur = "";
    for (const ch of quote) { const t = cur + ch; if (ctx.measureText(t).width > W - 160 || ch === "\n") { lines.push(cur); cur = ch === "\n" ? "" : ch; } else cur = t; }
    if (cur) lines.push(cur);
    const startY = H / 2 - ((lines.length - 1) * 72) / 2;
    lines.slice(0, 6).forEach((l, i) => ctx.fillText(l, W / 2, startY + i * 72));
    ctx.font = "400 22px sans-serif"; ctx.fillStyle = "#8f8a81";
    ctx.fillText(name ? `${name} 的「算了」时刻` : "算一算，然后，算了。", W / 2, H - 120);
    ctx.fillText(new Date().toLocaleDateString("zh-CN"), W / 2, H - 84);
  }, [open, quote, name]);

  const download = () => {
    const c = canvasRef.current; if (!c) return;
    const a = document.createElement("a"); a.download = "suanle.png"; a.href = c.toDataURL("image/png"); a.click();
    toast("已保存", "🖼️");
  };
  const copy = async () => { try { await navigator.clipboard.writeText(`${quote}\n\n—— 算了 · Suanle`); toast("已复制文字", "📋"); } catch { toast("复制失败"); } };

  return (
    <Sheet open={open} onClose={onClose} title="分享这一刻">
      <div className="mx-auto w-full max-w-[300px] overflow-hidden rounded-2xl shadow-soft"><canvas ref={canvasRef} className="block h-auto w-full" /></div>
      <div className="mt-4 flex gap-2.5">
        <button onClick={copy} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-ink/15 bg-white/70 py-3 text-sm"><Copy size={15} /> 复制文字</button>
        <button onClick={download} className="ink-btn flex flex-1 items-center justify-center gap-1.5 rounded-xl py-3 text-sm"><Download size={15} /> 保存图片</button>
      </div>
      <div className="mt-3 flex items-center justify-center gap-2 text-ink-3"><Logo size={16} blink={false} /><span className="text-xs">算一算，然后，算了。</span></div>
    </Sheet>
  );
}
