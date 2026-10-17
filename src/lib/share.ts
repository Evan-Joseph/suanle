"use client";

import QRCode from "qrcode";

/** 生成「算了卡」长图：宣纸底色、Logo、排版正文与金句箴言，全部用 Canvas 绘制 */

export interface CardInput {
  kicker?: string;
  title?: string;
  body: string;
  line?: string | null;
}

const W = 1080;
const PAD = 96;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** 中文避头尾排版规则 (Kinsoku Shori) */
const NO_START = "，。、；：！？）》】”’—…";
const NO_END = "（《【“‘";

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  if (!text) return [];
  const out: string[] = [];
  const HANGING_MARGIN = 38; // 标点悬挂容差，符合宋体版刻与现代出版规范，杜绝孤立标点

  for (const para of text.split(/\n/)) {
    if (!para.trim()) {
      out.push("");
      continue;
    }
    let cur = "";
    for (let i = 0; i < para.length; i++) {
      const ch = para[i];
      const test = cur + ch;
      const testW = ctx.measureText(test).width;

      if (testW > maxW && cur) {
        // 1. 若当前字符是避头标点且在悬挂容差范围内，直接附着在行末
        if (NO_START.includes(ch) && testW <= maxW + HANGING_MARGIN) {
          cur = test;
          continue;
        }

        // 2. 若超出容差且是避头标点，连同前方关联标点/文字一同换行
        if (NO_START.includes(ch) && cur.length > 1) {
          let pullCount = 1;
          while (
            pullCount < cur.length &&
            (NO_START.includes(cur[cur.length - pullCount]) || NO_END.includes(cur[cur.length - pullCount]))
          ) {
            pullCount++;
          }
          const keep = cur.slice(0, -pullCount);
          const pulled = cur.slice(-pullCount);
          out.push(keep);
          cur = pulled + ch;
        } else if (NO_END.includes(cur[cur.length - 1])) {
          const prev = cur[cur.length - 1];
          cur = cur.slice(0, -1);
          out.push(cur);
          cur = prev + ch;
        } else {
          out.push(cur);
          cur = ch;
        }
      } else {
        cur = test;
      }
    }
    if (cur) out.push(cur);
  }
  while (out.length && out[out.length - 1] === "") out.pop();
  return out;
}

function drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function drawLogo(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  const s = size / 1024;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = color;
  // 左三横、右三横，带柔和圆角
  for (const cx of [248, 560]) {
    for (const cy of [248, 356, 464]) {
      drawRoundRect(ctx, cx, cy, 216, 74, 16);
      ctx.fill();
    }
  }
  // 底部微笑圆弧
  ctx.strokeStyle = color;
  ctx.lineWidth = 64;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(264, 600);
  ctx.bezierCurveTo(264, 776, 760, 776, 760, 600);
  ctx.stroke();
  ctx.restore();
}

export async function renderCard(rawInput: CardInput): Promise<string> {
  const serif = '"Songti SC", "Noto Serif SC", "Source Han Serif SC", "STSong", serif';
  const sans = '-apple-system, "PingFang SC", "Noto Sans SC", sans-serif';

  // 1. 防御性去重：若正文包含或完全等于箴言，避免在同一卡片中连续复读
  let bodyText = (rawInput.body || "").trim();
  const lineText = (rawInput.line || "").trim();
  if (lineText && bodyText) {
    if (bodyText === lineText) {
      bodyText = "";
    } else if (bodyText.includes(lineText)) {
      bodyText = bodyText.replace(lineText, "").trim();
    }
  }

  const isQuoteOnly = !bodyText && !!lineText;

  const measure = document.createElement("canvas").getContext("2d");
  if (!measure) throw new Error("canvas");

  let bodyLines: string[] = [];
  let lineLines: string[] = [];

  if (isQuoteOnly) {
    measure.font = `600 50px ${serif}`;
    lineLines = wrap(measure, lineText, W - PAD * 2 - 120);
  } else {
    measure.font = `400 38px ${serif}`;
    bodyLines = wrap(measure, bodyText, W - PAD * 2).slice(0, 16);
    if (lineText) {
      measure.font = `600 42px ${serif}`;
      lineLines = wrap(measure, lineText, W - PAD * 2 - 84).slice(0, 4);
    }
  }

  // 2. 精确计算卡片视觉高度（黄金比例，消除大面积无序留白）
  const headerH = 260 + (rawInput.kicker ? 54 : 0) + (rawInput.title ? 74 : 0);
  let contentH = 0;
  if (isQuoteOnly) {
    contentH = lineLines.length * 80 + 140;
  } else {
    contentH = bodyLines.reduce((acc, l) => acc + (l ? 64 : 28), 0);
    if (lineLines.length) {
      contentH += 40 + (lineLines.length * 64 + 72);
    }
  }
  const footerH = 250;
  const H = Math.max(1080, Math.min(1680, headerH + contentH + footerH + 40));

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");

  // 宣纸色底
  ctx.fillStyle = "#FAF8F5";
  ctx.fillRect(0, 0, W, H);

  // 双层雅致边框
  ctx.strokeStyle = "#E7E2D6";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(36, 36, W - 72, H - 72);
  ctx.strokeStyle = "rgba(231,226,214,0.45)";
  ctx.lineWidth = 1;
  ctx.strokeRect(46, 46, W - 92, H - 92);

  // 品牌 Logo
  drawLogo(ctx, W / 2 - 64, 88, 128, "#2B2825");

  let y = 250;
  ctx.textAlign = "center";
  if (rawInput.kicker) {
    ctx.fillStyle = "#8F897F";
    ctx.font = `500 27px ${sans}`;
    ctx.fillText(rawInput.kicker, W / 2, y);
    y += 54;
  }
  if (rawInput.title) {
    ctx.fillStyle = "#2B2825";
    ctx.font = `700 48px ${serif}`;
    ctx.fillText(rawInput.title.slice(0, 18), W / 2, y);
    y += 74;
  }

  // 垂直居中补偿：让较短内容自然舒展在中间
  const remainingSpace = H - footerH - y - contentH;
  if (remainingSpace > 30) {
    y += Math.floor(remainingSpace * 0.36);
  } else {
    y += 24;
  }

  if (isQuoteOnly) {
    // 纯金句模式：典雅大字
    const boxW = W - PAD * 2;
    const boxH = lineLines.length * 80 + 100;
    ctx.fillStyle = "rgba(196,85,58,0.06)";
    drawRoundRect(ctx, PAD, y, boxW, boxH, 24);
    ctx.fill();

    // 朱砂红微弧装饰条
    ctx.fillStyle = "#C4553A";
    drawRoundRect(ctx, PAD + 2, y + 16, 6, boxH - 32, 3);
    ctx.fill();

    ctx.textAlign = "left";
    ctx.fillStyle = "#2B2825";
    ctx.font = `600 48px ${serif}`;
    let ly = y + 74;
    for (const l of lineLines) {
      ctx.fillText(l, PAD + 48, ly);
      ly += 80;
    }
  } else {
    // 问答正文
    ctx.textAlign = "left";
    ctx.fillStyle = "#383430";
    ctx.font = `400 38px ${serif}`;
    for (const l of bodyLines) {
      if (l) ctx.fillText(l, PAD, y);
      y += l ? 64 : 28;
    }

    // 结尾箴言高亮小卡
    if (lineLines.length) {
      y += 36;
      const boxW = W - PAD * 2;
      const boxH = lineLines.length * 64 + 68;
      ctx.fillStyle = "rgba(196,85,58,0.065)";
      drawRoundRect(ctx, PAD, y, boxW, boxH, 20);
      ctx.fill();

      ctx.fillStyle = "#C4553A";
      drawRoundRect(ctx, PAD + 2, y + 12, 6, boxH - 24, 3);
      ctx.fill();

      ctx.fillStyle = "#22201D";
      ctx.font = `600 42px ${serif}`;
      let ly = y + 66;
      for (const l of lineLines) {
        ctx.fillText(l, PAD + 42, ly);
        ly += 64;
      }
    }
  }

  // 底部落款、官方链接与二维码 (带流导流与品牌识别)
  const footerY = H - 250;
  // 浅色隔断虚线
  ctx.save();
  ctx.strokeStyle = "rgba(231,226,214,0.7)";
  ctx.lineWidth = 1.2;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(PAD, footerY);
  ctx.lineTo(W - PAD, footerY);
  ctx.stroke();
  ctx.restore();

  // 左侧文字与官方入口
  const d = new Date();
  const dateStr = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;

  ctx.textAlign = "left";
  ctx.fillStyle = "#2B2825";
  ctx.font = `700 36px ${serif}`;
  ctx.fillText("算了 · Suanle", PAD, footerY + 54);

  ctx.fillStyle = "#6E685E";
  ctx.font = `500 24px ${sans}`;
  ctx.fillText("算一算，然后，算了。", PAD, footerY + 98);

  ctx.fillStyle = "#9C958B";
  ctx.font = `400 21px ${sans}`;
  ctx.fillText(`长按或扫码 · 来和老朋友聊聊 ｜ ${dateStr}`, PAD, footerY + 140);

  ctx.fillStyle = "#C4553A";
  ctx.font = `600 20px -apple-system, BlinkMacSystemFont, monospace`;
  ctx.fillText("https://www.suanle.cc", PAD, footerY + 176);

  // 右侧二维码
  const qrSize = 136;
  const qrX = W - PAD - qrSize;
  const qrY = footerY + 28;

  try {
    const qrDataUrl = await QRCode.toDataURL("https://www.suanle.cc/", {
      margin: 1,
      width: qrSize * 2,
      color: { dark: "#2B2825", light: "#FAF8F5" },
      errorCorrectionLevel: "M",
    });
    const qrImg = await loadImage(qrDataUrl);

    // 二维码白底托盘与外框
    ctx.fillStyle = "#FAF8F5";
    drawRoundRect(ctx, qrX - 6, qrY - 6, qrSize + 12, qrSize + 12, 10);
    ctx.fill();
    ctx.strokeStyle = "rgba(231,226,214,0.9)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

    // 二维码中心小印章「算」
    const sealSize = 26;
    const sealX = qrX + (qrSize - sealSize) / 2;
    const sealY = qrY + (qrSize - sealSize) / 2;
    ctx.fillStyle = "#C4553A";
    drawRoundRect(ctx, sealX, sealY, sealSize, sealSize, 4);
    ctx.fill();
    ctx.fillStyle = "#FAF8F5";
    ctx.font = `700 16px ${serif}`;
    ctx.textAlign = "center";
    ctx.fillText("算", qrX + qrSize / 2, sealY + 19);

    // 扫码提示标签
    ctx.fillStyle = "#9C958B";
    ctx.font = `400 17px ${sans}`;
    ctx.textAlign = "center";
    ctx.fillText("扫码解惑", qrX + qrSize / 2, qrY + qrSize + 24);
  } catch {
    /* 离线时静默退化 */
  }

  return canvas.toDataURL("image/png");
}

export async function shareImage(dataUrl: string, filename = "suanle.png"): Promise<"shared" | "downloaded"> {
  try {
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], filename, { type: "image/png" });
    const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
    if (nav.canShare?.({ files: [file] }) && nav.share) {
      await nav.share({ files: [file], title: "算了 · Suanle" });
      return "shared";
    }
  } catch {
    /* 用户取消或不支持，改为下载 */
  }
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
  return "downloaded";
}
