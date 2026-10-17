import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, Easing } from "remotion";
import { C, SERIF, SANS, BEAT, SCENES, SITE_URL } from "../theme";
import { InkText, PaperBackground, SceneFade, Seal, clamp, useSpring, HairLine } from "../components/Primitives";
import { Phone } from "../components/Phone";

/* ───────────── 第六幕 · 印信：木版水印金句卡 ───────────── */
export const CardScene: React.FC = () => {
  const frame = useCurrentFrame();
  const sealAt = BEAT.seal - SCENES.card.from + 6;
  const phoneS = useSpring(0, { damping: 18, stiffness: 70 });
  const cardS = useSpring(6, { damping: 15, stiffness: 60 });
  const stamp = useSpring(sealAt, { damping: 10, stiffness: 220, mass: 0.7 });
  const hit = interpolate(frame - sealAt, [0, 3, 12], [0, 1, 0], clamp);
  const floatY = Math.sin(frame / 22) * 8;
  return (
    <SceneFade dur={SCENES.card.dur} fadeIn={14} fadeOut={14}>
      <PaperBackground tone="#F7F3EB" />
      <Phone
        height={820}
        x={-520}
        y={(1 - phoneS) * 220 + 10}
        rotateY={12}
        rotateZ={-2}
        opacity={phoneS}
        video={{ src: "promo/video/04_share_card_with_qr.mp4", startFrom: 0, playbackRate: 1 }}
      />
      <div
        style={{
          position: "absolute",
          left: 1080 - 270,
          top: 540 - 314 + floatY + hit * 6,
          width: 540,
          transform: `perspective(1800px) rotateY(${interpolate(cardS, [0, 1], [-40, -8])}deg) rotateX(${interpolate(cardS, [0, 1], [18, 3])}deg) translateY(${(1 - cardS) * 160}px) scale(${1 - hit * 0.01})`,
          opacity: cardS,
          boxShadow: "0 40px 90px rgba(76,58,34,0.25), 0 6px 18px rgba(76,58,34,0.15)",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        <Img src={staticFile("promo/card_dialogue.png")} style={{ width: "100%", display: "block" }} />
      </div>
      {/* 朱砂印重击落款 */}
      <div
        style={{
          position: "absolute",
          left: 1260,
          top: 640 + floatY,
          transform: `scale(${interpolate(stamp, [0, 1], [3.2, 1])}) rotate(${interpolate(stamp, [0, 1], [-18, -6])}deg)`,
          opacity: interpolate(frame - sealAt, [-2, 2], [0, 0.94], clamp),
          filter: `drop-shadow(0 ${interpolate(stamp, [0, 1], [40, 3])}px ${interpolate(stamp, [0, 1], [30, 4])}px rgba(80,30,20,0.3))`,
        }}
      >
        <Seal text="算了" size={124} />
      </div>
      <AbsoluteFill style={{ left: 1420, top: 360, flexDirection: "column", gap: 18 }}>
        <div style={{ fontFamily: SANS, fontSize: 22, color: C.gold, letterSpacing: "0.4em", opacity: interpolate(frame, [4, 18], [0, 1], clamp) }}>
          木版水印 · 宣纸金句卡
        </div>
        <InkText text="把这份释怀，" start={12} size={44} weight={700} stagger={3} />
        <InkText text="寄给同样" start={40} size={44} weight={700} stagger={3} />
        <InkText text="还在熬夜的人。" start={56} size={44} weight={700} stagger={3} highlight={{ chars: "熬夜", color: C.cinnabar }} />
      </AbsoluteFill>
    </SceneFade>
  );
};

/* ───────────── 终章 · 品牌 CTA：算一算，然后，算了。 ───────────── */
export const CtaScene: React.FC = () => {
  const frame = useCurrentFrame();
  const logoS = useSpring(4, { damping: 16, stiffness: 80 });
  const qrS = useSpring(40, { damping: 16, stiffness: 70 });
  const sealS = useSpring(92, { damping: 10, stiffness: 220, mass: 0.7 });
  const breath = 1 + Math.sin(frame / 30) * 0.006;
  const urlChars = Array.from(SITE_URL);
  return (
    <SceneFade dur={SCENES.cta.dur} fadeIn={16} fadeOut={36}>
      <PaperBackground />
      {/* 极淡的坤卦水印 */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: 0.022 }}>
        <Img src={staticFile("promo/brand/logo.svg")} style={{ width: 1100, height: 1100, transform: `scale(${1.05 + frame * 0.0004})` }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ transform: `scale(${breath})` }}>
        {/* 左：品牌 */}
        <div style={{ position: "absolute", left: 230, top: 250, display: "flex", flexDirection: "column", gap: 26 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 28, opacity: logoS, transform: `translateY(${(1 - logoS) * 40}px)` }}>
            <div style={{ width: 120, height: 120, borderRadius: 26, overflow: "hidden", boxShadow: "0 12px 30px rgba(76,58,34,0.18), inset 0 0 0 1px rgba(0,0,0,0.05)" }}>
              <Img src={staticFile("promo/brand/logo.svg")} style={{ width: "100%", height: "100%" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontFamily: SERIF, fontSize: 64, fontWeight: 800, color: C.ink, letterSpacing: "0.12em" }}>
                算了 <span style={{ color: C.gold, fontWeight: 400 }}>·</span> <span style={{ fontSize: 48, letterSpacing: "0.04em" }}>Suanle</span>
              </div>
              <div style={{ fontFamily: SANS, fontSize: 22, color: "#7A7062", letterSpacing: "0.36em" }}>一位懂命理，更懂人心的老朋友</div>
            </div>
          </div>
          <div style={{ height: 40 }} />
          <div style={{ display: "flex", alignItems: "flex-end", gap: 30 }}>
            <InkText text="算一算，然后，算了。" start={26} size={82} weight={800} stagger={5} highlight={{ chars: "算了", color: C.cinnabar }} />
            <div style={{ transform: `scale(${interpolate(sealS, [0, 1], [3, 1])}) rotate(-6deg)`, opacity: interpolate(frame, [90, 94], [0, 0.95], clamp), marginBottom: 18 }}>
              <Seal text="算" size={78} />
            </div>
          </div>
          <div style={{ marginTop: 20 }}>
            <HairLine progress={interpolate(frame, [110, 150], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) })} width={760} />
          </div>
          {/* 官方网址 */}
          <div style={{ display: "flex", alignItems: "center", gap: 22, marginTop: 10 }}>
            <div style={{ fontFamily: SANS, fontSize: 22, color: C.bamboo, letterSpacing: "0.3em", opacity: interpolate(frame, [120, 134], [0, 1], clamp) }}>
              官方网站
            </div>
            <div style={{ fontFamily: '"SF Mono", "JetBrains Mono", Menlo, monospace', fontSize: 46, fontWeight: 600, color: C.ink, letterSpacing: "0.02em" }}>
              {urlChars.map((ch, i) => (
                <span key={i} style={{ opacity: interpolate(frame - 102 - i * 1.4, [0, 6], [0, 1], clamp), color: i >= 12 && i <= 17 ? C.cinnabar : undefined }}>
                  {ch}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 右：官方二维码 */}
        <div
          style={{
            position: "absolute",
            left: 1300,
            top: 230,
            width: 420,
            padding: 30,
            background: "#FFFEFB",
            borderRadius: 18,
            boxShadow: "0 30px 80px rgba(76,58,34,0.18), inset 0 0 0 1px rgba(169,132,74,0.25)",
            transform: `perspective(1600px) rotateY(${interpolate(qrS, [0, 1], [-30, -4])}deg) translateY(${(1 - qrS) * 120}px)`,
            opacity: qrS,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div style={{ position: "absolute", inset: 12, border: `1.5px dashed ${C.mist}`, borderRadius: 12 }} />
          <Img src={staticFile("promo/brand/suanle_qrcode.png")} style={{ width: 360, height: 360, position: "relative" }} />
          <div style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 700, color: C.ink, letterSpacing: "0.2em", position: "relative" }}>
            扫码，来喝杯茶
          </div>
          <div style={{ fontFamily: SANS, fontSize: 18, color: "#8A7D66", letterSpacing: "0.3em", position: "relative", marginTop: -10 }}>
            把心头的乱麻，理一理
          </div>
        </div>
      </AbsoluteFill>
    </SceneFade>
  );
};
