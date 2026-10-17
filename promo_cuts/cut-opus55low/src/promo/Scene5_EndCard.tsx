import React from "react";
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, SERIF, SPRING_SOFT, SPRING_STAMP, USE_REAL_ASSETS, asset } from "./constants";
import { Logo, Paper, Seal } from "./common";

const FakeQR: React.FC = () => {
  const cells: React.ReactNode[] = [];
  let seed = 11;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  for (let y = 0; y < 25; y++) for (let x = 0; x < 25; x++) {
    const finder = (x < 7 && y < 7) || (x > 17 && y < 7) || (x < 7 && y > 17);
    if (finder) continue;
    if (x > 9 && x < 15 && y > 9 && y < 15) continue;
    if (rnd() > 0.5) cells.push(<rect key={`${x}-${y}`} x={x * 10} y={y * 10} width={10} height={10} fill={C.ink} />);
  }
  const F = ({ x, y }: { x: number; y: number }) => (<g><rect x={x} y={y} width={70} height={70} fill={C.ink} /><rect x={x + 10} y={y + 10} width={50} height={50} fill="#fff" /><rect x={x + 20} y={y + 20} width={30} height={30} fill={C.ink} /></g>);
  return (
    <svg viewBox="0 0 250 250" width="100%" height="100%">
      {cells}<F x={0} y={0} /><F x={180} y={0} /><F x={0} y={180} />
      <rect x={100} y={100} width={50} height={50} rx={6} fill={C.cinnabar} />
      <text x={125} y={136} textAnchor="middle" fontFamily={SERIF} fontSize={32} fill={C.paper} fontWeight={900}>算</text>
    </svg>
  );
};

export const Scene5EndCard: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const stamp = spring({ frame: f - 10, fps, config: SPRING_STAMP });
  const slogan = spring({ frame: f - 50, fps, config: SPRING_SOFT });
  const qr = spring({ frame: f - 80, fps, config: SPRING_SOFT });
  const url = spring({ frame: f - 130, fps, config: SPRING_SOFT });
  const flicker = 0.85 + Math.sin(f / 5) * 0.06 + Math.sin(f / 13) * 0.05;
  const end = interpolate(f, [300, 360], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <Paper />
      {/* 长明灯 */}
      <AbsoluteFill style={{ background: `radial-gradient(circle at 8% 88%, rgba(232,170,90,${0.32 * flicker}), transparent 38%)` }} />
      <div style={{ position: "absolute", left: 130, top: 880 }}>
        <div style={{ width: 14, height: 34, borderRadius: "50% 50% 50% 50% / 70% 70% 30% 30%", background: "radial-gradient(circle at 50% 70%, #fff6d8, #f0b45a 60%, rgba(196,85,58,0.5))", transform: `scaleY(${flicker}) skewX(${Math.sin(f / 9) * 4}deg)`, transformOrigin: "50% 100%", boxShadow: "0 0 40px 12px rgba(240,180,90,0.35)" }} />
        <div style={{ width: 70, height: 16, marginLeft: -28, borderRadius: "0 0 40px 40px", background: C.ink, opacity: 0.8 }} />
      </div>
      {/* 左：印章 + slogan */}
      <div style={{ position: "absolute", left: 260, top: 250, display: "flex", alignItems: "center", gap: 70 }}>
        <div style={{ transform: `scale(${interpolate(stamp, [0, 1], [2.4, 1])}) rotate(-4deg)`, opacity: Math.min(1, stamp * 1.5) }}>
          <Seal text="算了" size={220} />
        </div>
        <div style={{ fontFamily: SERIF, opacity: slogan, transform: `translateY(${(1 - slogan) * 30}px)` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <Logo size={80} />
            <div style={{ fontSize: 46, color: C.ink, letterSpacing: 12 }}>算了 · Suanle</div>
          </div>
          <div style={{ fontSize: 74, color: C.ink, letterSpacing: 14, marginTop: 30, fontWeight: 700 }}>算一算，然后，<span style={{ color: C.cinnabar }}>算了。</span></div>
          <div style={{ fontSize: 26, color: C.bamboo, letterSpacing: 8, marginTop: 24 }}>懂八字、紫微、六爻、塔罗，更懂人心的老朋友</div>
        </div>
      </div>
      {/* 右：二维码 */}
      <div style={{ position: "absolute", right: 170, top: 210, opacity: qr, transform: `perspective(1400px) rotateY(${(1 - qr) * -25 - 6}deg) translateY(${Math.sin(f / 30) * 6 + (1 - qr) * 40}px)` }}>
        <div style={{ background: "#f6efe0", padding: 30, borderRadius: 12, boxShadow: "0 40px 80px rgba(80,60,30,0.2), inset 0 0 0 2px rgba(169,132,74,0.5), inset 0 0 0 12px #f6efe0, inset 0 0 0 13px rgba(169,132,74,0.35)" }}>
          <div style={{ width: 300, height: 300, background: "#fff", padding: 14 }}>
            {USE_REAL_ASSETS ? <Img src={asset("suanle_qrcode.png")} style={{ width: "100%", height: "100%" }} /> : <FakeQR />}
          </div>
          <div style={{ textAlign: "center", fontFamily: SERIF, fontSize: 30, color: C.ink, letterSpacing: 14, marginTop: 20 }}>扫码解惑</div>
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 90, width: "100%", textAlign: "center", fontFamily: SERIF, fontSize: 38, letterSpacing: 6, color: C.gold, opacity: url }}>https://www.suanle.cc/</div>
      <AbsoluteFill style={{ background: C.paper, opacity: end * 0.0 }} />
    </AbsoluteFill>
  );
};
