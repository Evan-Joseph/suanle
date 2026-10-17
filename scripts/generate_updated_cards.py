import os
import base64
import json
from playwright.sync_api import sync_playwright

CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
BASE_URL = "https://www.suanle.cc"

CARDS = [
    {
        "filename": "card_aphorism.png",
        "data": {
            "kicker": "今日箴言 · 丙午年",
            "title": "算一算，然后，算了。",
            "body": "生活里的执念，就像手里攥紧的沙子，攥得越紧，漏得越快。把手松开，风自会带走尘埃。",
            "line": "知命而不认命，识局而不困于局。明天给脑子放半天假吧。"
        }
    },
    {
        "filename": "card_dialogue.png",
        "data": {
            "kicker": "解盘问心 · 天水讼",
            "title": "心里正较着劲呢",
            "body": "“问：为什么最近总觉得哪儿都不顺，换工作到底是对还是错？”\n\n“老友答：天往上升，水往低流，这两样东西本就走不到一块。你不是在跟环境较劲，是心里两个声音在打架。起伏本是潮汐，低谷时安心蓄力，高峰时尽情放手。”",
            "line": "算了，跟自己较劲也算加班，今晚早点睡。"
        }
    },
    {
        "filename": "card_letgo.png",
        "data": {
            "kicker": "释怀信笺 · 算了第 12 件",
            "title": "揉掉它。算了。",
            "body": "放不下昨晚的失眠与焦虑，心里总像压着石头……\n\n写下来，揉成团，丢进纸篓。听一声铜磬回响，山高水远，那些纠结的事，不过是时间长河里的一粒微尘。",
            "line": "揉碎执念，轻装前行。今天又算了 1 件。"
        }
    },
    {
        "filename": "card_annual.png",
        "data": {
            "kicker": "流年大运 · 丙午马年",
            "title": "长风破浪，知进退",
            "body": "天地运化，火土相生。上半年宜沉潜笃定，避锐气，养元神；下半年转机渐显，大运逢贵，行舟水到渠成。\n\n人生如 K 线，有谷底才能蓄积攀升的力量。顺境尽兴，逆境自宽。",
            "line": "潮涨潮落皆有期，安住当下，万事皆安。"
        }
    }
]

# Read official QR code png
with open("public/promo/suanle_qrcode.png", "rb") as f:
    qr_png_bytes = f.read()

qr_base64 = "data:image/png;base64," + base64.b64encode(qr_png_bytes).decode()

with sync_playwright() as p:
    browser = p.chromium.launch(
        executable_path=CHROME_PATH,
        headless=True
    )
    page = browser.new_page(viewport={"width": 1080, "height": 1920})
    page.goto("about:blank")
    page.wait_for_timeout(300)
    
    for item in CARDS:
        fn = item["filename"]
        d = item["data"]
        
        script = f"""
        (async () => {{
            const serif = '"Songti SC", "Noto Serif SC", "Source Han Serif SC", "STSong", serif';
            const sans = '-apple-system, "PingFang SC", "Noto Sans SC", sans-serif';
            const W = 1080;
            const PAD = 96;
            
            const NO_START = "，。、；：！？）》】”’—…";
            const NO_END = "（《【“‘";
            const HANGING_MARGIN = 38;
            
            function wrap(ctx, text, maxW) {{
              if (!text) return [];
              const out = [];
              for (const para of text.split(/\\n/)) {{
                if (!para.trim()) {{ out.push(""); continue; }}
                let cur = "";
                for (let i = 0; i < para.length; i++) {{
                  const ch = para[i];
                  const test = cur + ch;
                  const testW = ctx.measureText(test).width;
                  if (testW > maxW && cur) {{
                    if (NO_START.includes(ch) && testW <= maxW + HANGING_MARGIN) {{
                      cur = test;
                      continue;
                    }}
                    if (NO_START.includes(ch) && cur.length > 1) {{
                      let pullCount = 1;
                      while (
                        pullCount < cur.length &&
                        (NO_START.includes(cur[cur.length - pullCount]) || NO_END.includes(cur[cur.length - pullCount]))
                      ) {{
                        pullCount++;
                      }}
                      const keep = cur.slice(0, -pullCount);
                      const pulled = cur.slice(-pullCount);
                      out.push(keep);
                      cur = pulled + ch;
                    }} else if (NO_END.includes(cur[cur.length - 1])) {{
                      const prev = cur[cur.length - 1];
                      cur = cur.slice(0, -1);
                      out.push(cur);
                      cur = prev + ch;
                    }} else {{
                      out.push(cur);
                      cur = ch;
                    }}
                  }} else {{
                    cur = test;
                  }}
                }}
                if (cur) out.push(cur);
              }}
              while (out.length && out[out.length - 1] === "") out.pop();
              return out;
            }}
            
            function drawRoundRect(ctx, x, y, w, h, r) {{
              if (typeof ctx.roundRect === "function") {{
                ctx.beginPath();
                ctx.roundRect(x, y, w, h, r);
                return;
              }}
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
            }}
            
            function drawLogo(ctx, x, y, size, color) {{
              const s = size / 1024;
              ctx.save();
              ctx.translate(x, y);
              ctx.scale(s, s);
              ctx.fillStyle = color;
              for (const cx of [248, 560]) {{
                for (const cy of [248, 356, 464]) {{
                  drawRoundRect(ctx, cx, cy, 216, 74, 16);
                  ctx.fill();
                }}
              }}
              ctx.strokeStyle = color;
              ctx.lineWidth = 64;
              ctx.lineCap = "round";
              ctx.beginPath();
              ctx.moveTo(264, 600);
              ctx.bezierCurveTo(264, 776, 760, 776, 760, 600);
              ctx.stroke();
              ctx.restore();
            }}
            
            const kicker = {json.dumps(d.get("kicker", ""))};
            const title = {json.dumps(d.get("title", ""))};
            let bodyText = {json.dumps(d.get("body", ""))}.trim();
            const lineText = {json.dumps(d.get("line", ""))}.trim();
            
            if (lineText && bodyText) {{
              if (bodyText === lineText) {{
                bodyText = "";
              }} else if (bodyText.includes(lineText)) {{
                bodyText = bodyText.replace(lineText, "").trim();
              }}
            }}
            
            const isQuoteOnly = !bodyText && !!lineText;
            
            const measure = document.createElement("canvas").getContext("2d");
            measure.font = `400 38px ${{serif}}`;
            const bodyLines = wrap(measure, bodyText, W - PAD * 2).slice(0, 16);
            measure.font = `600 42px ${{serif}}`;
            const lineLines = lineText ? wrap(measure, lineText, W - PAD * 2 - 84).slice(0, 4) : [];
            
            // 黄金高度动态计算
            const headerH = 250 + (kicker ? 54 : 0) + (title ? 74 : 0);
            let contentH = 0;
            if (isQuoteOnly) {{
              contentH = lineLines.length * 80 + 140;
            }} else {{
              contentH = bodyLines.reduce((acc, l) => acc + (l ? 64 : 28), 0);
              if (lineLines.length) {{
                contentH += 40 + (lineLines.length * 64 + 72);
              }}
            }}
            const footerH = 250;
            const H = Math.max(1050, Math.min(1600, headerH + contentH + footerH + 40));
            
            const canvas = document.createElement("canvas");
            canvas.width = W;
            canvas.height = H;
            const ctx = canvas.getContext("2d");
            
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
            
            // 居中品牌 Logo
            drawLogo(ctx, W / 2 - 64, 88, 128, "#2B2825");
            
            let y = 250;
            ctx.textAlign = "center";
            if (kicker) {{
              ctx.fillStyle = "#8F897F";
              ctx.font = `500 27px ${{sans}}`;
              ctx.fillText(kicker, W / 2, y);
              y += 54;
            }}
            if (title) {{
              ctx.fillStyle = "#2B2825";
              ctx.font = `700 48px ${{serif}}`;
              ctx.fillText(title.slice(0, 18), W / 2, y);
              y += 74;
            }}
            
            // 垂直居中舒展
            const remainingSpace = H - footerH - y - contentH;
            if (remainingSpace > 30) {{
              y += Math.floor(remainingSpace * 0.36);
            }} else {{
              y += 24;
            }}
            
            // 正文
            ctx.textAlign = "left";
            ctx.fillStyle = "#383430";
            ctx.font = `400 38px ${{serif}}`;
            for (const l of bodyLines) {{
              if (l) ctx.fillText(l, PAD, y);
              y += l ? 64 : 28;
            }}
            
            // 箴言小卡
            if (lineLines.length) {{
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
              ctx.font = `600 42px ${{serif}}`;
              let ly = y + 66;
              for (const l of lineLines) {{
                ctx.fillText(l, PAD + 42, ly);
                ly += 64;
              }}
            }}
            
            // 底部落款与二维码
            const footerY = H - 250;
            ctx.save();
            ctx.strokeStyle = "rgba(231,226,214,0.7)";
            ctx.lineWidth = 1.2;
            ctx.setLineDash([8, 6]);
            ctx.beginPath();
            ctx.moveTo(PAD, footerY);
            ctx.lineTo(W - PAD, footerY);
            ctx.stroke();
            ctx.restore();
            
            // 左侧品牌
            ctx.textAlign = "left";
            ctx.fillStyle = "#2B2825";
            ctx.font = `700 36px ${{serif}}`;
            ctx.fillText("算了 · Suanle", PAD, footerY + 54);
            
            ctx.fillStyle = "#6E685E";
            ctx.font = `500 24px ${{sans}}`;
            ctx.fillText("算一算，然后，算了。", PAD, footerY + 98);
            
            ctx.fillStyle = "#9C958B";
            ctx.font = `400 21px ${{sans}}`;
            ctx.fillText("长按或扫码 · 来和老朋友聊聊 ｜ 丙午年", PAD, footerY + 140);
            
            ctx.fillStyle = "#C4553A";
            ctx.font = `600 20px -apple-system, BlinkMacSystemFont, monospace`;
            ctx.fillText("https://www.suanle.cc", PAD, footerY + 176);
            
            // 右侧二维码
            const qrSize = 136;
            const qrX = W - PAD - qrSize;
            const qrY = footerY + 28;
            
            // 白底托盘
            ctx.fillStyle = "#FAF8F5";
            drawRoundRect(ctx, qrX - 6, qrY - 6, qrSize + 12, qrSize + 12, 10);
            ctx.fill();
            ctx.strokeStyle = "rgba(231,226,214,0.9)";
            ctx.lineWidth = 1;
            ctx.stroke();
            
            const qrImg = document.createElement("img");
            document.body.appendChild(qrImg);
            await new Promise((resolve) => {{
                qrImg.onload = resolve;
                qrImg.onerror = resolve;
                qrImg.src = {json.dumps(qr_base64)};
            }});
            ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
            
            // 二维码中心小印章「算」
            const sealSize = 26;
            const sealX = qrX + (qrSize - sealSize) / 2;
            const sealY = qrY + (qrSize - sealSize) / 2;
            ctx.fillStyle = "#C4553A";
            drawRoundRect(ctx, sealX, sealY, sealSize, sealSize, 4);
            ctx.fill();
            ctx.fillStyle = "#FAF8F5";
            ctx.font = `700 16px ${{serif}}`;
            ctx.textAlign = "center";
            ctx.fillText("算", qrX + qrSize / 2, sealY + 19);
            
            // 扫码解惑
            ctx.fillStyle = "#9C958B";
            ctx.font = `400 17px ${{sans}}`;
            ctx.textAlign = "center";
            ctx.fillText("扫码解惑", qrX + qrSize / 2, qrY + qrSize + 24);
            
            return canvas.toDataURL("image/png");
        }})()
        """
        data_url = page.evaluate(script)
        base64_data = data_url.split(",")[1]
        raw_bytes = base64.b64decode(base64_data)
        
        target1 = os.path.join("promo/assets", fn)
        target2 = os.path.join("public/promo", fn)
        with open(target1, "wb") as f:
            f.write(raw_bytes)
        with open(target2, "wb") as f:
            f.write(raw_bytes)
        print(f"✓ Rendered {fn} with QR code ({len(raw_bytes)} bytes)")
        
    browser.close()

print("All 4 cards rendered with platform QR code successfully!")
