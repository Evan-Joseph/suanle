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
    page.wait_for_timeout(500)
    
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
            
            function wrap(ctx, text, maxW) {{
              if (!text) return [];
              const out = [];
              for (const para of text.split(/\\n/)) {{
                if (!para.trim()) {{ out.push(""); continue; }}
                let cur = "";
                for (let i = 0; i < para.length; i++) {{
                  const ch = para[i];
                  const test = cur + ch;
                  if (ctx.measureText(test).width > maxW && cur) {{
                    if (NO_START.includes(ch) && cur.length > 1) {{
                      const prev = cur[cur.length - 1];
                      cur = cur.slice(0, -1);
                      out.push(cur);
                      cur = prev + ch;
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
              ctx.beginPath();
              ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h);
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
            const body = {json.dumps(d.get("body", ""))};
            const line = {json.dumps(d.get("line", ""))};
            
            const canvas = document.createElement("canvas");
            canvas.width = W;
            canvas.height = 1480;
            const ctx = canvas.getContext("2d");
            
            // 宣纸底色
            ctx.fillStyle = "#FAF8F5";
            ctx.fillRect(0, 0, W, 1480);
            
            // 宣纸边框
            ctx.strokeStyle = "#E7E2D6";
            ctx.lineWidth = 2;
            ctx.strokeRect(36, 36, W - 72, 1480 - 72);
            
            // 顶栏 Logo
            drawLogo(ctx, PAD, 76, 68, "#2B2825");
            ctx.fillStyle = "#9C958B";
            ctx.font = `600 24px ${{sans}}`;
            ctx.textAlign = "left";
            ctx.fillText(kicker || "算了 · 随笔", PAD + 84, 118);
            
            // 朱砂小印章
            const sealSize = 56;
            const sealX = W - PAD - sealSize;
            const sealY = 82;
            ctx.fillStyle = "#C4553A";
            drawRoundRect(ctx, sealX, sealY, sealSize, sealSize, 8);
            ctx.fill();
            ctx.fillStyle = "#FAF8F5";
            ctx.font = `bold 26px ${{serif}}`;
            ctx.textAlign = "center";
            ctx.fillText("算了", sealX + sealSize / 2, sealY + sealSize / 2 + 9);
            
            let curY = 220;
            if (title) {{
              ctx.fillStyle = "#2B2825";
              ctx.font = `700 48px ${{serif}}`;
              ctx.textAlign = "left";
              const titleLines = wrap(ctx, title, W - PAD * 2);
              for (const tl of titleLines) {{
                ctx.fillText(tl, PAD, curY);
                curY += 68;
              }}
              curY += 24;
            }}
            
            if (body) {{
              ctx.fillStyle = "#4A443D";
              ctx.font = `400 32px ${{serif}}`;
              ctx.textAlign = "left";
              const bodyLines = wrap(ctx, body, W - PAD * 2);
              for (const bl of bodyLines) {{
                if (!bl) {{ curY += 28; continue; }}
                ctx.fillText(bl, PAD, curY);
                curY += 56;
              }}
              curY += 36;
            }}
            
            if (line) {{
              ctx.fillStyle = "rgba(196,85,58,0.06)";
              drawRoundRect(ctx, PAD, curY, W - PAD * 2, 140, 16);
              ctx.fill();
              ctx.strokeStyle = "rgba(196,85,58,0.35)";
              ctx.lineWidth = 1.5;
              ctx.stroke();
              
              ctx.fillStyle = "#C4553A";
              ctx.font = `italic 600 30px ${{serif}}`;
              ctx.textAlign = "left";
              const quoteLines = wrap(ctx, line, W - PAD * 2 - 48);
              let qy = curY + 54;
              for (const ql of quoteLines) {{
                ctx.fillText(ql, PAD + 24, qy);
                qy += 44;
              }}
            }}
            
            // 底部落款分割线
            const H = 1480;
            ctx.strokeStyle = "rgba(231,226,214,0.8)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(PAD, H - 240);
            ctx.lineTo(W - PAD, H - 240);
            ctx.stroke();
            
            // 左侧：品牌落款与传播信息
            ctx.textAlign = "left";
            ctx.fillStyle = "#2B2825";
            ctx.font = `700 38px ${{serif}}`;
            ctx.fillText("算了 · Suanle", PAD, H - 175);
            
            ctx.fillStyle = "#7A7368";
            ctx.font = `400 26px ${{sans}}`;
            ctx.fillText("算一算，然后，算了。", PAD, H - 130);
            
            ctx.fillStyle = "#9C958B";
            ctx.font = `400 22px ${{sans}}`;
            ctx.fillText("www.suanle.cc · 丙午年", PAD, H - 86);
            
            // 右侧：平台二维码
            const qrSize = 136;
            const qrX = W - PAD - qrSize;
            const qrY = H - 215;
            
            ctx.fillStyle = "#FAF8F5";
            drawRoundRect(ctx, qrX - 8, qrY - 8, qrSize + 16, qrSize + 16, 12);
            ctx.fill();
            ctx.strokeStyle = "#E7E2D6";
            ctx.lineWidth = 1.5;
            ctx.stroke();
            
            const qrImg = document.createElement("img");
            document.body.appendChild(qrImg);
            await new Promise((resolve) => {{
                qrImg.onload = resolve;
                qrImg.onerror = resolve;
                qrImg.src = {json.dumps(qr_base64)};
            }});
            ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
            
            ctx.textAlign = "center";
            ctx.fillStyle = "#8F897F";
            ctx.font = `600 19px ${{sans}}`;
            ctx.fillText("扫码问心", qrX + qrSize / 2, H - 52);
            
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
