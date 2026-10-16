"use client";

/** 生成「算了卡」长图：纸色底、Logo、正文与箴言，全部用 Canvas 绘制 */

export interface CardInput {
  kicker?: string;
  title?: string;
  body: string;
  line?: string | null;
}

const W = 1080;
const PAD = 96;

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const out: string[] = [];
  for (const para of text.split(/\n+/)) {
    let line = "";
    for (const ch of para) {
      const test = line + ch;
      if (ctx.measureText(test).width > maxW && line) {
        out.push(line);
        line = ch;
      } else line = test;
    }
    if (line) out.push(line);
    out.push("");
  }
  while (out.length && out[out.length - 1] === "") out.pop();
  return out;
}

function drawLogo(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  const s = size / 1024;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = color;
  for (const cx of [248, 560]) for (const cy of [248, 356, 464]) ctx.fillRect(cx, cy, 216, 74);
  ctx.strokeStyle = color;
  ctx.lineWidth = 64;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(264, 600);
  ctx.bezierCurveTo(264, 776, 760, 776, 760, 600);
  ctx.stroke();
  ctx.restore();
}

export async function renderCard(input: CardInput): Promise<string> {
  const serif = '"Songti SC", "Noto Serif SC", "Source Han Serif SC", "STSong", serif';
  const sans = '-apple-system, "PingFang SC", "Noto Sans SC", sans-serif';
  const measure = document.createElement("canvas").getContext("2d");
  if (!measure) throw new Error("canvas");
  measure.font = `400 40px ${serif}`;
  const bodyLines = wrap(measure, input.body, W - PAD * 2).slice(0, 16);
  measure.font = `600 44px ${serif}`;
  const lineLines = input.line ? wrap(measure, input.line, W - PAD * 2 - 80).slice(0, 4) : [];

  const H = Math.max(1350, 520 + bodyLines.length * 68 + (lineLines.length ? lineLines.length * 64 + 140 : 0) + 260);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");

  ctx.fillStyle = "#FAF9F6";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#E8E3D9";
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, W - 80, H - 80);

  drawLogo(ctx, W / 2 - 70, 104, 140, "#2B2B2B");
  let y = 300;
  ctx.textAlign = "center";
  if (input.kicker) {
    ctx.fillStyle = "#958F86";
    ctx.font = `400 30px ${sans}`;
    ctx.fillText(input.kicker, W / 2, y);
    y += 64;
  }
  if (input.title) {
    ctx.fillStyle = "#2B2B2B";
    ctx.font = `700 52px ${serif}`;
    ctx.fillText(input.title.slice(0, 18), W / 2, y);
    y += 80;
  }
  ctx.textAlign = "left";
  ctx.fillStyle = "#3a3733";
  ctx.font = `400 40px ${serif}`;
  for (const l of bodyLines) {
    if (l) ctx.fillText(l, PAD, y);
    y += l ? 68 : 30;
  }
  if (lineLines.length) {
    y += 50;
    const boxH = lineLines.length * 64 + 60;
    ctx.fillStyle = "rgba(196,85,58,0.07)";
    ctx.fillRect(PAD, y, W - PAD * 2, boxH);
    ctx.fillStyle = "#C4553A";
    ctx.fillRect(PAD, y, 6, boxH);
    ctx.fillStyle = "#2B2B2B";
    ctx.font = `600 44px ${serif}`;
    let ly = y + 74;
    for (const l of lineLines) {
      ctx.fillText(l, PAD + 44, ly);
      ly += 64;
    }
    y += boxH;
  }
  ctx.textAlign = "center";
  ctx.fillStyle = "#2B2B2B";
  ctx.font = `700 40px ${serif}`;
  ctx.fillText("算了 · Suanle", W / 2, H - 150);
  ctx.fillStyle = "#958F86";
  ctx.font = `400 28px ${sans}`;
  const d = new Date();
  ctx.fillText(`算一算，然后，算了。 · ${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`, W / 2, H - 100);
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
