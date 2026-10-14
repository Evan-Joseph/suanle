"use client";

import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import QRCode from "qrcode";
import { useUI } from "@/lib/store";
import { todayAlmanac } from "@/lib/divination";
import Markdown from "../chat/Markdown";
import { Icon, Logo, Sheet } from "../ui";

export default function ShareSheet() {
  const open = useUI((s) => s.sheet === "share");
  const payload = useUI((s) => s.sheetPayload);
  const close = useUI((s) => s.close);
  const cardRef = useRef<HTMLDivElement>(null);
  const [img, setImg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [qr, setQr] = useState("");
  const question = String(payload?.question ?? "").replace(/\*\*/g, "");
  const answer = String(payload?.answer ?? "");
  const a = todayAlmanac();

  useEffect(() => {
    if (!open) return;
    setImg(null);
    QRCode.toDataURL(window.location.origin, { margin: 0, width: 140, color: { dark: "#2b2b2b", light: "#00000000" } })
      .then(setQr)
      .catch(() => setQr(""));
  }, [open]);

  const generate = async () => {
    if (!cardRef.current) return;
    setBusy(true);
    try {
      const url = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true, backgroundColor: "#faf9f6" });
      setImg(url);
      const link = document.createElement("a");
      link.href = url;
      link.download = `算了-${Date.now()}.png`;
      link.click();
    } catch {
      useUI.getState().toast("图片没生成出来，再试一次？");
    }
    setBusy(false);
  };

  return (
    <Sheet open={open} onClose={close} title="分享长图" full>
      <div className="pb-6">
        {img ? (
          <div className="anim-fade-in">
            <img src={img} alt="长图" className="w-full rounded-2xl border border-line shadow-md" />
            <p className="mt-3 text-center text-[12.5px] text-mute">已保存；手机上也可以长按图片保存或转发</p>
            <button onClick={() => setImg(null)} className="mt-2 w-full py-2 text-[13px] text-ink-2">
              返回预览
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-2xl border border-line shadow-md">
              <div ref={cardRef} className="paper-grain px-6 pb-6 pt-7" style={{ width: "100%" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-ink">
                    <Logo size={30} />
                    <div>
                      <div className="font-song text-[16px] font-bold leading-tight tracking-widest">算了</div>
                      <div className="text-[10px] tracking-wider text-mute">Suanle</div>
                    </div>
                  </div>
                  <div className="text-right text-[11px] leading-tight text-mute">
                    {a.dateText} · {a.weekday}
                    <br />
                    农历{a.lunarText}
                  </div>
                </div>
                {question && (
                  <div className="mt-5 rounded-2xl bg-ink px-4 py-3 text-[14px] leading-relaxed text-paper">
                    {question.length > 140 ? question.slice(0, 140) + "…" : question}
                  </div>
                )}
                <div className="mt-5">
                  <Markdown text={answer} msgId="share" widgets="hidden" />
                </div>
                <div className="mt-6 flex items-end justify-between border-t border-dashed border-line pt-4">
                  <div>
                    <div className="font-song text-[15px] font-bold tracking-[0.2em]">算一算，然后，算了。</div>
                    <div className="mt-1 text-[11px] text-mute">扫码，和算了聊聊</div>
                  </div>
                  {qr && <img src={qr} alt="" width={56} height={56} className="h-14 w-14" />}
                </div>
              </div>
            </div>
            <button
              onClick={generate}
              disabled={busy}
              className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-2xl bg-ink py-3.5 text-[15px] text-paper active:scale-[0.98] disabled:opacity-60"
            >
              <Icon name="download" size={17} />
              {busy ? "正在研墨……" : "保存长图"}
            </button>
          </>
        )}
      </div>
    </Sheet>
  );
}
