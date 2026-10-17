import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { C, SERIF, SPRING_COIN, SPRING_SOFT, s } from "./constants";
import { Handheld, Paper, Phone } from "./common";

const WORRY = "放不下昨晚的失眠与焦虑";
const T_CRUMPLE = s(2.5); // 34.5s
const T_THROW = s(4.4);
const T_LAND = s(5.2); // 37.2s
const T_BOWL = s(6.0); // 38.0s

const Basket: React.FC<{ wobble: number }> = ({ wobble }) => (
  <div style={{ position: "absolute", left: 1520, top: 700, transform: `rotate(${wobble}deg)`, transformOrigin: "50% 100%" }}>
    <svg width="240" height="260" viewBox="0 0 240 260">
      <ellipse cx="120" cy="30" rx="110" ry="24" fill="#5b4a33" />
      <path d="M10 30 L40 250 Q120 266 200 250 L230 30 Q120 60 10 30Z" fill="#b89a68" />
      {Array.from({ length: 9 }).map((_, i) => <line key={i} x1={20 + i * 25} y1={40} x2={45 + i * 19} y2={250} stroke="#8a6f45" strokeWidth={3} />)}
      {Array.from({ length: 7 }).map((_, i) => <path key={"h" + i} d={`M${14 + i * 4} ${60 + i * 28} Q120 ${80 + i * 30} ${226 - i * 4} ${60 + i * 28}`} stroke="#9c8052" strokeWidth={3} fill="none" />)}
      <ellipse cx="120" cy="30" rx="110" ry="24" fill="none" stroke="#7a6040" strokeWidth={6} />
    </svg>
  </div>
);

export const Scene4LetGo: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = s(12);
  const typed = Math.floor(interpolate(f, [30, 130], [0, WORRY.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const crumple = interpolate(f, [T_CRUMPLE, T_THROW], [0, 1], { easing: Easing.in(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const shake = f > T_CRUMPLE && f < T_THROW ? Math.sin(f * 2.3) * 6 * crumple : 0;
  const tt = interpolate(f, [T_THROW, T_LAND], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ballX = interpolate(tt, [0, 1], [960, 1640]);
  const ballY = 520 - 4 * 380 * tt * (1 - tt) + tt * 230;
  const landed = f >= T_LAND;
  const wob = landed ? Math.sin((f - T_LAND) / 3) * 10 * (1 - spring({ frame: f - T_LAND, fps, config: SPRING_COIN })) : 0;
  const freeze = spring({ frame: f - T_BOWL, fps, config: SPRING_SOFT });
  const ripple = interpolate(f - T_BOWL, [0, 240], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const phoneO = interpolate(f, [0, 30, T_CRUMPLE - 20, T_CRUMPLE + 10], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <Paper />
      <Handheld dur={dur} zoom={[1.0, 1.05]} amp={f > T_BOWL ? 0.5 : 3}>
        {/* 真实录屏（左侧） */}
        <div style={{ position: "absolute", left: 180, top: 140, opacity: phoneO * (1 - freeze), transform: "perspective(1600px) rotateY(12deg)" }}>
          <Phone w={330} video="video/03_letgo_paper_crumple.mp4" fallback={<div style={{ height: "100%", background: C.mist, display: "grid", placeItems: "center", fontFamily: SERIF, color: C.ink, fontSize: 22, letterSpacing: 6 }}>写下来，揉掉它</div>} />
        </div>
        {/* 信笺 → 纸团 */}
        {f < T_LAND + 2 && (
          <div style={{ position: "absolute", left: ballX, top: ballY, transform: `translate(-50%,-50%) translateX(${shake}px) rotate(${crumple * 200 + tt * 540}deg)`, opacity: 1 - freeze }}>
            <div style={{
              width: interpolate(crumple, [0, 1], [620, 120]), height: interpolate(crumple, [0, 1], [420, 120]),
              borderRadius: `${crumple * 50}%`, background: `repeating-linear-gradient(0deg, #fbf7ee, #fbf7ee 46px, rgba(196,85,58,0.18) 47px)`,
              boxShadow: `0 ${30 - crumple * 10}px 60px rgba(70,50,20,${0.18 + crumple * 0.15}), inset 0 0 ${crumple * 60}px rgba(120,95,60,${crumple * 0.7})`,
              filter: crumple > 0 ? `url(#crumpleF)` : undefined, display: "grid", placeItems: "center", overflow: "hidden",
            }}>
              <div style={{ fontFamily: SERIF, fontSize: 40, color: C.ink, letterSpacing: 6, opacity: 1 - crumple * 1.5, transform: `scale(${1 - crumple * 0.6})` }}>
                {WORRY.slice(0, typed)}<span style={{ opacity: f % 60 < 30 && typed < WORRY.length ? 1 : 0 }}>|</span>
              </div>
            </div>
          </div>
        )}
        <svg width="0" height="0"><filter id="crumpleF"><feTurbulence type="turbulence" baseFrequency={0.02 + crumple * 0.05} numOctaves="3" seed={f % 4} /><feDisplacementMap in="SourceGraphic" scale={crumple * 60} /></filter></svg>
        {/* 揉掉它 按钮 */}
        <div style={{ position: "absolute", left: 960, top: 840, transform: `translateX(-50%) scale(${f > T_CRUMPLE - 10 && f < T_CRUMPLE + 6 ? 0.92 : 1})`, opacity: interpolate(f, [120, 150, T_CRUMPLE + 20, T_CRUMPLE + 40], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), background: C.ink, color: C.paper, fontFamily: SERIF, fontSize: 30, padding: "16px 48px", borderRadius: 999, letterSpacing: 8 }}>揉掉它</div>
        <div style={{ opacity: 1 - freeze }}><Basket wobble={wob} /></div>
      </Handheld>
      {/* 颂钵定格 */}
      <AbsoluteFill style={{ opacity: freeze, display: "grid", placeItems: "center" }}>
        <svg width="1920" height="1080" style={{ position: "absolute" }}>
          {[0, 0.33, 0.66].map((d) => {
            const r = ((ripple + d) % 1);
            return <circle key={d} cx={960} cy={540} r={120 + r * 800} fill="none" stroke={C.gold} strokeOpacity={(1 - r) * 0.25} strokeWidth={2} />;
          })}
        </svg>
        <div style={{ fontFamily: SERIF, fontSize: 150, fontWeight: 800, color: C.ink, letterSpacing: 40, transform: `scale(${1.08 - freeze * 0.08})`, filter: `blur(${(1 - freeze) * 12}px)` }}>
          揉掉它。<span style={{ color: C.cinnabar }}>算了。</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
