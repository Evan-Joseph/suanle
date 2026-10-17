import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, Easing, Img } from "remotion";
import { C, SERIF, USE_REAL_ASSETS, asset, s } from "./constants";
import { Paper, Subtitle } from "./common";

// 生成起伏的大运曲线
const PTS = Array.from({ length: 41 }, (_, i) => {
  const x = i * 80;
  const y = 560 - Math.sin(i / 3.2) * 170 - Math.sin(i / 1.3) * 45 - Math.cos(i / 7) * 60;
  return [x, y];
});
const path = PTS.reduce((acc, [x, y], i) => {
  if (i === 0) return `M ${x} ${y}`;
  const [px, py] = PTS[i - 1];
  const mx = (px + x) / 2;
  return `${acc} C ${mx} ${py}, ${mx} ${y}, ${x} ${y}`;
}, "");
const LEN = 5200;

export const Scene3KLine: React.FC = () => {
  const f = useCurrentFrame();
  const dur = s(12);
  const draw = interpolate(f, [20, dur - 120], [0, 1], { easing: Easing.inOut(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pan = interpolate(draw, [0, 1], [0, -1500]);
  const headIdx = Math.min(40, Math.floor(draw * 40));
  const [hx, hy] = PTS[headIdx];
  const pulse = 0.6 + Math.sin(f / 12) * 0.4;
  const labels = [
    { i: 5, t: "蓄力", d: "低谷时，蓄力" },
    { i: 15, t: "尽兴", d: "高峰时，尽兴" },
    { i: 25, t: "流转", d: "起落本是常态" },
    { i: 35, t: "心定", d: "心也就定下来了" },
  ];
  return (
    <AbsoluteFill>
      <Paper />
      {/* 远山 */}
      <svg width="1920" height="1080" style={{ position: "absolute", transform: `translateX(${pan * 0.2}px)`, width: 2600 }}>
        <path d="M0 760 Q200 600 420 700 T860 640 T1300 720 T1800 620 T2600 700 V1080 H0Z" fill={C.bamboo} opacity={0.1} />
        <path d="M0 820 Q260 720 520 790 T1040 760 T1560 800 T2600 760 V1080 H0Z" fill={C.ink} opacity={0.06} />
      </svg>
      {USE_REAL_ASSETS && (
        <Img src={asset("ui_kline.png")} style={{ position: "absolute", right: 80, top: 90, height: 760, borderRadius: 30, opacity: interpolate(f, [0, 40, 200, 260], [0, 0.9, 0.9, 0.15], { extrapolateRight: "clamp" }) }} />
      )}
      <div style={{ position: "absolute", left: 140, top: 90, fontFamily: SERIF, opacity: interpolate(f, [0, 40], [0, 1]) }}>
        <div style={{ fontSize: 24, color: C.gold, letterSpacing: 12 }}>人生大运 · 十二流月</div>
        <div style={{ fontSize: 64, color: C.ink, letterSpacing: 14, marginTop: 8 }}>人生如浪潮</div>
      </div>
      <svg width="3400" height="1080" style={{ position: "absolute", left: 200, transform: `translateX(${pan}px)` }}>
        <defs>
          <linearGradient id="goldFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={C.gold} stopOpacity="0.28" />
            <stop offset="1" stopColor={C.gold} stopOpacity="0" />
          </linearGradient>
          <clipPath id="reveal"><rect x="0" y="0" width={draw * 3200} height="1080" /></clipPath>
        </defs>
        {/* 月度 K 线柱 */}
        {PTS.slice(1).map(([x, y], i) => {
          const up = y < PTS[i][1];
          const o = interpolate(draw * 40 - i, [0, 1], [0, 0.6], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return <rect key={i} x={x - 52} y={Math.min(y, PTS[i][1])} width={24} height={Math.abs(y - PTS[i][1]) + 6} fill={up ? C.cinnabar : C.bamboo} opacity={o} rx={3} />;
        })}
        <path d={`${path} L 3200 1080 L 0 1080 Z`} fill="url(#goldFill)" clipPath="url(#reveal)" />
        <path d={path} stroke={C.gold} strokeWidth={6} fill="none" strokeLinecap="round" strokeDasharray={LEN} strokeDashoffset={LEN * (1 - draw)} />
        <circle cx={hx} cy={hy} r={40 * pulse} fill={C.gold} opacity={0.18} />
        <circle cx={hx} cy={hy} r={10} fill={C.gold} />
        {labels.map((l) => {
          const [x, y] = PTS[l.i];
          const o = interpolate(draw * 40 - l.i, [0, 2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <g key={l.i} opacity={o}>
              <line x1={x} y1={y - 20} x2={x} y2={y - 110} stroke={C.ink} strokeOpacity={0.3} strokeDasharray="4 6" />
              <text x={x} y={y - 130} textAnchor="middle" fontFamily={SERIF} fontSize={44} fill={C.ink} letterSpacing={8}>{l.t}</text>
              <text x={x} y={y - 180} textAnchor="middle" fontFamily={SERIF} fontSize={22} fill={C.gold} letterSpacing={4}>{l.d}</text>
            </g>
          );
        })}
      </svg>
      <Subtitle
        lines={[
          { t: "看透了周期的起起伏伏，你就会明白：", from: s(0.6), to: s(4.4) },
          { t: "低谷时蓄力，高峰时尽兴。", from: s(4.5), to: s(8) },
          { t: "起落本是常态，心也就定下来了。", from: s(8.1), to: s(11.7) },
        ]}
      />
    </AbsoluteFill>
  );
};
