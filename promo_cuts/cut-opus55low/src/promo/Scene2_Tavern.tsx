import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, SERIF, SPRING_COIN, SPRING_SOFT, s } from "./constants";
import { Handheld, Paper, Phone, Subtitle } from "./common";

const ChatMock: React.FC<{ f: number }> = ({ f }) => {
  const msgs = [
    { me: true, t: "最近总觉得卡住了，想问问换工作的事", at: 20 },
    { me: false, t: "先喝口茶。我替你起一卦。", at: 90 },
    { me: false, t: "天水讼 ☰☵", at: 330, gold: true },
    { me: false, t: "天往上升，水往低流……你心里正跟自己较劲呢。", at: 420 },
    { me: false, t: "明天给脑子放半天假吧。", at: 520 },
  ];
  return (
    <div style={{ padding: "70px 22px", fontFamily: SERIF, display: "flex", flexDirection: "column", gap: 14, background: C.paper, height: "100%" }}>
      <div style={{ textAlign: "center", color: C.gold, fontSize: 16, letterSpacing: 6 }}>老友茶局</div>
      {msgs.map((m, i) => {
        const o = interpolate(f - m.at, [0, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <div key={i} style={{ alignSelf: m.me ? "flex-end" : "flex-start", maxWidth: "82%", opacity: o, transform: `translateY(${(1 - o) * 12}px)`, background: m.me ? C.ink : m.gold ? "#f3ead9" : C.mist, color: m.me ? C.paper : m.gold ? C.gold : C.ink, padding: "10px 14px", borderRadius: 14, fontSize: m.gold ? 22 : 15, lineHeight: 1.6 }}>
            {m.t}
          </div>
        );
      })}
    </div>
  );
};

const Coin: React.FC<{ f: number; i: number }> = ({ f, i }) => {
  const { fps } = useVideoConfig();
  const start = s(3.4) + i * 8;
  const lf = f - start;
  const land = spring({ frame: lf - 40, fps, config: SPRING_COIN });
  const t = Math.min(Math.max(lf / 48, 0), 1);
  const x = 1180 + i * 150;
  const y = lf < 48 ? 120 + (-4 * 260 * t * (1 - t)) + t * 560 : 680 - (1 - land) * 18 * Math.sin(lf / 2);
  const rot = lf < 48 ? lf * 22 : 0;
  const tilt = lf < 48 ? 0 : (1 - land) * 30;
  const o = interpolate(lf, [-10, 0], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: o, transform: `perspective(600px) rotateX(${rot + tilt + 55}deg) rotateZ(${i * 17}deg)` }}>
      <div style={{ width: 110, height: 110, borderRadius: "50%", background: `radial-gradient(circle at 35% 30%, #d9b874, ${C.gold} 55%, #6e5328)`, boxShadow: "0 20px 30px rgba(60,40,10,0.3), inset 0 0 0 6px rgba(80,55,20,0.35)", display: "grid", placeItems: "center" }}>
        <div style={{ width: 30, height: 30, background: C.paper, boxShadow: "inset 0 0 0 3px #6e5328" }} />
      </div>
    </div>
  );
};

export const Scene2Tavern: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = s(12);
  const enter = spring({ frame: f, fps, config: SPRING_SOFT });
  const tiltY = interpolate(f, [0, dur], [-14, 8]);
  const floatY = Math.sin(f / 40) * 10;
  const gua = spring({ frame: f - s(5.2), fps, config: SPRING_SOFT });
  // 热茶蒸汽
  const steam = [0, 1, 2].map((k) => {
    const p = ((f + k * 60) % 180) / 180;
    return <path key={k} d={`M ${300 + k * 20} 900 C ${280 + k * 20} ${820 - p * 60}, ${330 + k * 20} ${760 - p * 80}, ${300 + k * 20} ${680 - p * 100}`} stroke={C.ink} strokeOpacity={0.12 * Math.sin(p * Math.PI)} strokeWidth={6} fill="none" strokeLinecap="round" style={{ filter: "blur(4px)" }} />;
  });
  return (
    <AbsoluteFill>
      <Paper />
      <Handheld dur={dur} zoom={[1.02, 1.08]}>
        <svg width="1920" height="1080" style={{ position: "absolute" }}>{steam}</svg>
        <div style={{ position: "absolute", left: 560, top: 120 + (1 - enter) * 300 + floatY, opacity: enter, transform: `perspective(1800px) rotateY(${tiltY}deg) rotateX(4deg)` }}>
          <Phone w={380} video={f < s(4) ? "video/01_home_navigation.mp4" : "video/02_chat_consultation.mp4"} fallback={<ChatMock f={f} />} />
        </div>
        {[0, 1, 2].map((i) => <Coin key={i} f={f} i={i} />)}
        <div style={{ position: "absolute", left: 1170, top: 260, fontFamily: SERIF, opacity: gua, transform: `translateY(${(1 - gua) * 30}px)` }}>
          <div style={{ fontSize: 30, color: C.gold, letterSpacing: 10 }}>第六卦</div>
          <div style={{ fontSize: 120, color: C.ink, letterSpacing: 24, fontWeight: 700 }}>天水讼</div>
          <div style={{ fontSize: 26, color: C.bamboo, letterSpacing: 6, marginTop: 10 }}>天往上升，水往低流。</div>
        </div>
      </Handheld>
      <Subtitle
        lines={[
          { t: "但这里没有冷冰冰的算命机器，", from: s(0.5), to: s(3.6) },
          { t: "只有一位为你温好热茶的老朋友。", from: s(3.7), to: s(7) },
          { t: "懂八字、懂六爻，更懂你眼底的疲惫。", from: s(7.2), to: s(11.6) },
        ]}
      />
    </AbsoluteFill>
  );
};
