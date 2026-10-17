import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from "remotion";
import { C, SERIF, SANS, BEAT, SCENES } from "../theme";
import { InkText, PaperBackground, SceneFade, clamp, useSpring } from "../components/Primitives";
import { InkBloom } from "../components/Ink";
import { Phone } from "../components/Phone";

/* ───────────── 第四幕 · 浪潮：人生大运 K 线如千里江山 ───────────── */
const waveY = (x: number) =>
  790 - Math.sin(x * 0.0042 + 0.6) * 95 - Math.sin(x * 0.013 + 1.3) * 34 - Math.sin(x * 0.031) * 10;

const buildWave = (offset = 0) => {
  const pts: string[] = [];
  for (let x = -40; x <= 1960; x += 12) pts.push(`${x === -40 ? "M" : "L"}${x},${(waveY(x) + offset).toFixed(1)}`);
  return pts.join(" ");
};

export const WaveScene: React.FC = () => {
  const frame = useCurrentFrame();
  const draw = interpolate(frame, [4, 110], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const s1 = useSpring(8, { damping: 18, stiffness: 70 });
  const s2 = useSpring(22, { damping: 18, stiffness: 70 });
  const dotX = -40 + draw * 2000;
  const pan = interpolate(frame, [0, SCENES.wave.dur], [40, -40]);
  const glow = 0.5 + Math.sin(frame / 7) * 0.5;
  const main = buildWave();
  return (
    <SceneFade dur={SCENES.wave.dur} fadeIn={12} fadeOut={14}>
      <PaperBackground tone="#F8F5EE" />
      <AbsoluteFill style={{ transform: `translateX(${pan}px)` }}>
        <svg width="1920" height="1080" style={{ position: "absolute" }}>
          <defs>
            <linearGradient id="hill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.bamboo} stopOpacity="0.22" />
              <stop offset="100%" stopColor={C.bamboo} stopOpacity="0" />
            </linearGradient>
            <filter id="goldGlow">
              <feGaussianBlur stdDeviation="6" />
            </filter>
          </defs>
          {/* 远山层叠（千里江山意象） */}
          <path d={`${buildWave(70)} L1960,1080 L-40,1080 Z`} fill="url(#hill)" opacity={draw} />
          <path d={`${buildWave(150)} L1960,1080 L-40,1080 Z`} fill="url(#hill)" opacity={draw * 0.8} />
          <path d={main} fill="none" stroke={C.gold} strokeWidth={10} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} filter="url(#goldGlow)" opacity={0.35} />
          <path d={main} fill="none" stroke={C.gold} strokeWidth={4} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} />
          {/* 年龄刻度 */}
          {[0, 10, 20, 30, 40, 50, 60, 70, 80].map((age, i) => {
            const x = 120 + i * 210;
            const o = interpolate(dotX - x, [0, 30], [0, 0.6], clamp);
            return (
              <g key={age} opacity={o}>
                <line x1={x} x2={x} y1={waveY(x) + 18} y2={1000} stroke={C.gold} strokeDasharray="3 8" strokeWidth={1.5} />
                <text x={x} y={1030} textAnchor="middle" fontFamily={SANS} fontSize={20} fill="#8A7D66">
                  {age} 岁
                </text>
              </g>
            );
          })}
          <circle cx={dotX} cy={waveY(dotX)} r={10 + glow * 8} fill={C.gold} opacity={0.25 * (draw < 1 ? 1 : 0)} />
          <circle cx={dotX} cy={waveY(dotX)} r={7} fill={C.cinnabar} opacity={draw < 1 ? 1 : 0} />
        </svg>
      </AbsoluteFill>
      <Phone height={700} x={180} y={-90 + (1 - s1) * 200} rotateY={-14} rotateZ={-4} opacity={s1} image="promo/ui_bazi_chart.png" />
      <Phone height={740} x={470} y={-50 + (1 - s2) * 220} rotateY={-8} rotateZ={3} opacity={s2} image="promo/ui_kline.png" />
      <AbsoluteFill style={{ left: 150, top: 150, flexDirection: "column", gap: 16 }}>
        <div style={{ fontFamily: SANS, fontSize: 24, color: C.gold, letterSpacing: "0.5em", opacity: interpolate(frame, [0, 14], [0, 1], clamp) }}>
          八字命盘 · 人生大运 K 线
        </div>
        <InkText text="起伏，本是生命的呼吸。" start={10} size={62} weight={700} stagger={3} />
        <InkText
          text="低谷时蓄力，高峰时尽兴。"
          start={56}
          size={44}
          weight={500}
          stagger={3}
          color="#5A5348"
          highlight={{ chars: "尽兴", color: C.cinnabar }}
        />
      </AbsoluteFill>
    </SceneFade>
  );
};

/* ───────────── 第五幕 · 算了：揉掉执念，颂钵一响 ───────────── */
export const LetGoScene: React.FC = () => {
  const frame = useCurrentFrame();
  const L = (abs: number) => abs - SCENES.letgo.from;
  const crumple = L(BEAT.crumple);
  const flight = L(BEAT.flight);
  const bowl = L(BEAT.bowl);
  const dur = SCENES.letgo.dur;

  const enter = useSpring(0, { damping: 20, stiffness: 70 });
  const release = useSpring(bowl, { damping: 9, stiffness: 120, mass: 0.8 });
  // 张力：落篓前镜头缓慢推近，落篓瞬间弹回
  const tension = interpolate(frame, [0, bowl], [1, 1.07], { ...clamp, easing: Easing.in(Easing.quad) });
  const camScale = frame < bowl ? tension : 1.07 - release * 0.07;
  const squeeze = interpolate(frame - crumple, [0, 4, 16], [1, 0.82, 1], clamp);
  const shake = frame > crumple && frame < crumple + 14 ? Math.sin(frame * 3.1) * (crumple + 14 - frame) * 0.4 : 0;
  const flash = interpolate(frame - bowl, [0, 2, 20], [0, 0.26, 0], clamp);
  const glide = useSpring(bowl + 4, { damping: 16, stiffness: 60 });
  const phoneX = interpolate(glide, [0, 1], [300, -380]);
  const phoneScale = interpolate(glide, [0, 1], [1, 0.9]);
  const preText = interpolate(frame, [bowl - 8, bowl], [1, 0], clamp);

  return (
    <SceneFade dur={dur} fadeIn={12} fadeOut={16}>
      <PaperBackground />
      {/* 颂钵声波涟漪 */}
      {frame >= bowl &&
        [0, 1, 2, 3, 4].map((i) => {
          const t = frame - bowl - i * 16;
          if (t < 0) return null;
          const r = interpolate(t, [0, 150], [40, 1100], { ...clamp, easing: Easing.out(Easing.cubic) });
          const o = interpolate(t, [0, 10, 150], [0, 0.4, 0], clamp);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 580 - r,
                top: 540 - r,
                width: r * 2,
                height: r * 2,
                borderRadius: "50%",
                border: `${2 + (4 - i) * 0.6}px solid ${i % 2 ? C.gold : C.cinnabar}`,
                opacity: o,
              }}
            />
          );
        })}
      <InkBloom start={bowl} x={580} y={560} maxR={460} color={C.cinnabar} opacity={0.16} seed={21} />
      <AbsoluteFill style={{ transform: `scale(${camScale}) translateX(${shake}px)` }}>
        <Phone
          height={900}
          x={phoneX}
          y={(1 - enter) * 240 + 10}
          rotateY={interpolate(glide, [0, 1], [-8, 10])}
          rotateX={4}
          scale={phoneScale}
          opacity={enter}
          image="promo/ui_letgo_done.png"
          video={{ src: "promo/video/03_letgo_paper_crumple.mp4", startFrom: 111, playbackRate: 1.25, cropViewport: true }}
        />
      </AbsoluteFill>

      {/* 落篓前文案 */}
      <AbsoluteFill style={{ left: 170, top: 320, flexDirection: "column", gap: 24, opacity: preText }}>
        <div style={{ fontFamily: SANS, fontSize: 24, color: C.bamboo, letterSpacing: "0.5em", opacity: interpolate(frame, [0, 14], [0, 1], clamp) }}>
          「算了」纸篓仪式
        </div>
        <InkText text="把放不下的，写下来。" start={8} size={58} weight={700} stagger={3} />
        <div
          style={{
            fontFamily: SERIF,
            fontSize: 30,
            color: "#7A7062",
            letterSpacing: "0.12em",
            opacity: interpolate(frame, [40, 56], [0, 1], clamp) * interpolate(frame, [crumple, crumple + 10], [1, 0.25], clamp),
            transform: `scaleX(${squeeze})`,
            transformOrigin: "left",
          }}
        >
          “放不下昨晚的失眠与焦虑。”
        </div>
        <div style={{ transform: `scale(${squeeze})`, transformOrigin: "left center" }}>
          <InkText text="揉掉它。" start={crumple - 2} size={96} weight={900} stagger={4} color={C.cinnabar} />
        </div>
        <InkText text="然后，轻轻一抛——" start={flight - 4} size={40} weight={500} stagger={3} color="#5A5348" />
      </AbsoluteFill>

      {/* 落篓后：顿悟 */}
      {frame >= bowl - 2 && (
        <AbsoluteFill style={{ left: 1040, top: 250, flexDirection: "column", gap: 10 }}>
          <div
            style={{
              fontFamily: SERIF,
              fontWeight: 900,
              fontSize: 230,
              color: C.ink,
              letterSpacing: "0.08em",
              lineHeight: 1.1,
              transform: `scale(${interpolate(release, [0, 1], [1.5, 1])})`,
              transformOrigin: "left center",
              opacity: interpolate(frame - bowl, [0, 6], [0, 1], clamp),
              filter: `blur(${interpolate(frame - bowl, [0, 10], [14, 0], clamp)}px)`,
            }}
          >
            算了<span style={{ color: C.cinnabar }}>。</span>
          </div>
          <div style={{ height: 30 }} />
          <InkText text="心结落篓，烟消云散。" start={bowl + 40} size={44} weight={500} stagger={4} color="#5A5348" />
          <InkText
            text="今天，又放下了一件事。"
            start={bowl + 85}
            size={44}
            weight={600}
            stagger={4}
            highlight={{ chars: "放下", color: C.cinnabar }}
          />
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{ backgroundColor: "#FFFDF8", opacity: flash, pointerEvents: "none" }} />
    </SceneFade>
  );
};
