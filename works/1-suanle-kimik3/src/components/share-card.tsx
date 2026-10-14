"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Loader2, X } from "lucide-react";
import QRCode from "qrcode";
import { hashSeed } from "@/lib/rand";

export interface ShareCardData {
  quote: string;
  name: string;
  dateLabel: string;
  tag?: string;
}

const SERIF = `"Songti SC","STSong","SimSun",serif`;
const SANS = `"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif`;

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** 程序绘制品牌标识：六断爻笑眼 + 微笑曲线 */
function drawLogo(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, color: string) {
  // s = 整体宽度（对应原 1024 viewBox）
  const u = s / 1024;
  ctx.fillStyle = color;
  const bars = [
    [248, 248], [560, 248], [248, 356], [560, 356], [248, 464], [560, 464],
  ];
  for (const [bx, by] of bars) {
    roundRect(ctx, cx - s / 2 + bx * u, cy - s / 2 + by * u, 216 * u, 74 * u, 6 * u);
    ctx.fill();
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 64 * u;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx - s / 2 + 264 * u, cy - s / 2 + 600 * u);
  ctx.bezierCurveTo(
    cx - s / 2 + 264 * u, cy - s / 2 + 776 * u,
    cx - s / 2 + 760 * u, cy - s / 2 + 776 * u,
    cx - s / 2 + 760 * u, cy - s / 2 + 600 * u,
  );
  ctx.stroke();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const ch of text) {
    if (ctx.measureText(line + ch).width > maxW && line) {
      lines.push(line);
      line = ch;
    } else line += ch;
  }
  if (line) lines.push(line);
  return lines;
}

async function renderCard(canvas: HTMLCanvasElement, data: ShareCardData) {
  const W = 1080, H = 1440;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // 纸底
  ctx.fillStyle = "#FAF9F6";
  ctx.fillRect(0, 0, W, H);
  // 颗粒
  const seed = hashSeed(data.quote);
  let s = seed >>> 0;
  const rnd = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = `rgba(38,38,38,${rnd() * 0.028})`;
    ctx.fillRect(rnd() * W, rnd() * H, 1.5, 1.5);
  }
  // 内框
  ctx.strokeStyle = "rgba(38,38,38,0.1)";
  ctx.lineWidth = 2;
  roundRect(ctx, 44, 44, W - 88, H - 88, 40);
  ctx.stroke();

  // 品牌
  drawLogo(ctx, W / 2, 250, 210, "#262626");
  ctx.fillStyle = "#262626";
  ctx.textAlign = "center";
  ctx.font = `700 40px ${SANS}`;
  ctx.save();
  ctx.translate(W / 2, 430);
  ctx.fillText("算  了  ·  S U A N L E", 0, 0);
  ctx.restore();

  // 标签
  if (data.tag) {
    ctx.fillStyle = "#B9714B";
    ctx.font = `500 27px ${SANS}`;
    ctx.fillText(`— ${data.tag} —`, W / 2, 512);
  }

  // 金句
  ctx.fillStyle = "#262626";
  ctx.font = `600 62px ${SERIF}`;
  const lines = wrapText(ctx, data.quote, W - 260);
  const lh = 104;
  const startY = H / 2 - ((lines.length - 1) * lh) / 2;
  lines.forEach((ln, i) => ctx.fillText(ln, W / 2, startY + i * lh));

  // 署名
  ctx.fillStyle = "#8B857A";
  ctx.font = `400 30px ${SANS}`;
  ctx.fillText(`${data.name ? `${data.name} · ` : ""}${data.dateLabel}`, W / 2, startY + lines.length * lh + 34);

  // 撕裂线
  ctx.strokeStyle = "rgba(38,38,38,0.22)";
  ctx.lineWidth = 3;
  ctx.setLineDash([16, 14]);
  ctx.beginPath();
  ctx.moveTo(120, H - 330);
  ctx.lineTo(W - 120, H - 330);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#A9A29A";
  ctx.font = `400 24px ${SANS}`;
  ctx.fillText("✂", 96, H - 320);

  // 底部
  ctx.fillStyle = "#57534B";
  ctx.textAlign = "left";
  ctx.font = `500 30px ${SANS}`;
  ctx.fillText("算一算，然后，算了。", 120, H - 232);
  ctx.fillStyle = "#A9A29A";
  ctx.font = `400 24px ${SANS}`;
  ctx.fillText("长按识别 · 测测你的今日气流", 120, H - 184);

  // 二维码
  try {
    const url = typeof window !== "undefined" ? window.location.origin : "https://suanle.app";
    const dataUrl = await QRCode.toDataURL(url, { width: 320, margin: 1, color: { dark: "#262626", light: "#FAF9F6" } });
    await new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => {
        roundRect(ctx, W - 320, H - 292, 200, 200, 24);
        ctx.fillStyle = "#FAF9F6";
        ctx.fill();
        ctx.strokeStyle = "rgba(38,38,38,0.14)";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.drawImage(img, W - 306, H - 278, 168, 168);
        resolve();
      };
      img.onerror = () => resolve();
      img.src = dataUrl;
    });
  } catch { /* 二维码失败时留白 */ }

  ctx.textAlign = "center";
  ctx.fillStyle = "#C7C0B2";
  ctx.font = `400 22px ${SANS}`;
  ctx.fillText("Suanle · 当代心灵庇护所", W / 2, H - 92);
}

export function ShareCardModal({ data, onClose }: { data: ShareCardData | null; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pngUrl, setPngUrl] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!data || !canvasRef.current) return;
    setBusy(true);
    setPngUrl("");
    let alive = true;
    renderCard(canvasRef.current, data).then(() => {
      if (!alive || !canvasRef.current) return;
      setPngUrl(canvasRef.current.toDataURL("image/png"));
      setBusy(false);
    });
    return () => { alive = false; };
  }, [data]);

  return (
    <AnimatePresence>
      {data && (
        <motion.div
          className="fixed inset-0 z-[85] flex items-center justify-center p-5"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-[6px]" onClick={onClose} />
          <motion.div
            className="relative w-full max-w-[400px]"
            initial={{ y: 40, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
          >
            <button
              onClick={onClose}
              className="absolute -top-3 right-0 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-line bg-paper text-ink2 shadow-soft"
              aria-label="关闭"
            >
              <X size={16} />
            </button>
            <div className="overflow-hidden rounded-[28px] border border-line bg-card shadow-lift">
              {busy && (
                <div className="flex aspect-[3/4] items-center justify-center text-faint">
                  <Loader2 size={22} className="animate-spin" />
                </div>
              )}
              <canvas ref={canvasRef} className={`w-full ${busy ? "hidden" : "block"}`} />
            </div>
            {pngUrl && (
              <a
                href={pngUrl}
                download={`算了-${data.dateLabel.replace(/[年月日\s·]/g, "") || "今日"}.png`}
                className="btn-ink mt-4 h-12 w-full text-[14px]"
              >
                <Download size={15} /> 保存这张灵验签
              </a>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
