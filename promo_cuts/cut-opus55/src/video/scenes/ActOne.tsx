import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from "remotion";
import { C, SERIF, SANS, BEAT, SCENES } from "../theme";
import { InkText, PaperBackground, SceneFade, clamp, useSpring, HairLine } from "../components/Primitives";
import { InkBloom, InkDrop, Steam } from "../components/Ink";
import { Phone } from "../components/Phone";

/* ───────────── 第一幕 · 叩问：墨滴入纸，深夜问号浮现 ───────────── */
const QUESTIONS = [
  { t: "考研，到底能不能上岸？", x: 210, y: 210, d: 40 },
  { t: "换工作，是对还是错？", x: 1240, y: 170, d: 52 },
  { t: "他，还会回来吗？", x: 1380, y: 820, d: 64 },
  { t: "凌晨三点，还是睡不着。", x: 170, y: 800, d: 58 },
  { t: "为什么总在同一个坑里打转？", x: 640, y: 930, d: 76 },
  { t: "明年，会不会好一点？", x: 1500, y: 470, d: 88 },
  { t: "我是不是，不够好？", x: 120, y: 500, d: 70 },
];

export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const dolly = interpolate(frame, [0, SCENES.hook.dur], [1.12, 1.0], { ...clamp, easing: Easing.out(Easing.quad) });
  const qFade = interpolate(frame, [BEAT.flute - 6, BEAT.flute + 20], [1, 0.25], clamp);
  return (
    <SceneFade dur={SCENES.hook.dur} fadeIn={0} fadeOut={18}>
      <PaperBackground />
      <AbsoluteFill style={{ transform: `scale(${dolly})` }}>
        <InkDrop land={BEAT.inkDrop} x={960} y={520} />
        <InkBloom start={BEAT.inkDrop} x={960} y={520} maxR={430} opacity={0.32} seed={4} />
        <InkBloom start={BEAT.inkDrop + 6} x={1010} y={560} maxR={240} opacity={0.22} seed={9} />
        {QUESTIONS.map((q, i) => {
          const t = frame - q.d;
          const o = interpolate(t, [0, 24, 90], [0, 0.55, 0.38], clamp) * qFade;
          const drift = t * 0.25;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: q.x,
                top: q.y - drift,
                fontFamily: SERIF,
                fontSize: 30,
                color: C.ink,
                opacity: o,
                filter: `blur(${interpolate(t, [0, 20], [8, 0.4], clamp)}px)`,
                letterSpacing: "0.16em",
              }}
            >
              {q.t}
            </div>
          );
        })}
      </AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 26 }}>
        <InkText text="人这一生，" start={BEAT.flute} size={58} weight={500} stagger={4} />
        <InkText
          text="为什么总想 算一算？"
          start={BEAT.flute + 24}
          size={88}
          weight={700}
          stagger={4}
          highlight={{ chars: "算一算", color: C.cinnabar }}
        />
        <div style={{ opacity: interpolate(frame, [BEAT.flute + 60, BEAT.flute + 80], [0, 1], clamp), marginTop: 12 }}>
          <div style={{ fontFamily: SANS, fontSize: 22, color: "#6E6658", letterSpacing: "0.5em" }}>
            算前程 · 算感情 · 算流年
          </div>
        </div>
      </AbsoluteFill>
    </SceneFade>
  );
};

/* ───────────── 第二幕 · 温茶：老友对坐 ───────────── */
export const TeaScene: React.FC = () => {
  const frame = useCurrentFrame();
  const s = useSpring(0, { damping: 20, stiffness: 60 });
  const tilt = interpolate(frame, [0, SCENES.tea.dur], [-16, -6]);
  const lift = interpolate(frame, [0, SCENES.tea.dur], [30, -10]);
  const pickup = useSpring(BEAT.pickup - SCENES.tea.from, { damping: 12 });
  return (
    <SceneFade dur={SCENES.tea.dur} fadeIn={16} fadeOut={10}>
      <PaperBackground tone="#F6F2EA" />
      {/* 远处淡竹影 */}
      <AbsoluteFill style={{ opacity: 0.08 }}>
        <svg width="1920" height="1080">
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={1600 + i * 70} y={-40} width={10} height={1200} fill={C.bamboo} transform={`rotate(${4 + i * 2} ${1600 + i * 70} 1080)`} />
          ))}
        </svg>
      </AbsoluteFill>
      <Steam x={1660} y={960} scale={1.4} opacity={0.4} />
      <Phone
        height={880}
        x={330}
        y={lift + (1 - s) * 260}
        rotateY={tilt}
        rotateX={6}
        scale={0.96 + pickup * 0.04}
        opacity={s}
        video={{ src: "promo/video/01_home_navigation.mp4", startFrom: 0, playbackRate: 1.35, cropViewport: true }}
      />
      <AbsoluteFill style={{ left: 200, top: 330, flexDirection: "column", gap: 22 }}>
        <InkText text="这里没有故弄玄虚的铁口神算，" start={10} size={40} weight={500} stagger={2} color="#5A5348" />
        <InkText text="只有一位老朋友，" start={48} size={68} weight={700} stagger={3} />
        <InkText text="为你温好了一壶热茶。" start={72} size={68} weight={700} stagger={3} highlight={{ chars: "热茶", color: C.cinnabar }} />
        <div style={{ marginTop: 26 }}>
          <HairLine progress={interpolate(frame, [100, 140], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) })} width={320} />
        </div>
        <div style={{ opacity: interpolate(frame, [112, 132], [0, 1], clamp), fontFamily: SANS, fontSize: 24, letterSpacing: "0.4em", color: C.bamboo }}>
          八字 · 紫微 · 六爻 · 塔罗
        </div>
      </AbsoluteFill>
    </SceneFade>
  );
};

/* ───────────── 第三幕 · 起卦：Beat Drop，通宝落案 + 老友解盘 ───────────── */
export const CoinsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const local = (abs: number) => abs - SCENES.coins.from;
  const dropS = useSpring(local(BEAT.drop) - 4, { damping: 11, stiffness: 140 });
  const chatS = useSpring(local(BEAT.bar4), { damping: 16, stiffness: 110 });
  // 鼓点脉冲：每拍 21 帧（85.7BPM@30fps）
  const beatPhase = Math.max(0, frame - local(BEAT.drop)) % 21;
  const pulse = frame >= local(BEAT.drop) ? interpolate(beatPhase, [0, 8], [1, 0], clamp) : 0;
  const flash = interpolate(frame - local(BEAT.drop), [0, 3, 14], [0, 0.22, 0], clamp);
  return (
    <SceneFade dur={SCENES.coins.dur} fadeIn={8} fadeOut={14}>
      <PaperBackground />
      {/* 卦象背景：六爻横线随鼓点浮现 */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "flex-end", paddingRight: 120, opacity: 0.05 }}>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const on = interpolate(frame - local(BEAT.drop) - i * 12, [0, 10], [0, 1], clamp);
          const yin = [1, 0, 1, 1, 0, 1][i];
          return (
            <div key={i} style={{ display: "flex", gap: 60, marginBottom: 36, transform: `scaleX(${on})`, transformOrigin: "left" }}>
              {yin ? (
                <>
                  <div style={{ width: 300, height: 60, background: C.ink, borderRadius: 6 }} />
                  <div style={{ width: 300, height: 60, background: C.ink, borderRadius: 6 }} />
                </>
              ) : (
                <div style={{ width: 660, height: 60, background: C.ink, borderRadius: 6 }} />
              )}
            </div>
          );
        })}
      </AbsoluteFill>
      <Phone
        height={860}
        x={interpolate(chatS, [0, 1], [230, 90])}
        y={(1 - dropS) * -120 + 10}
        rotateY={interpolate(chatS, [0, 1], [-4, 10])}
        rotateZ={interpolate(chatS, [0, 1], [0, -2])}
        scale={1 + pulse * 0.012}
        video={{ src: "promo/video/05_coins_divination.mp4", startFrom: 24, playbackRate: 2.4, cropViewport: true }}
      />
      <Phone
        height={860}
        x={interpolate(chatS, [0, 1], [1200, 560])}
        y={30}
        rotateY={interpolate(chatS, [0, 1], [-30, -10])}
        rotateZ={2}
        opacity={chatS}
        video={{ src: "promo/video/02_chat_consultation.mp4", startFrom: 60, playbackRate: 1.5, cropViewport: true }}
      />
      <AbsoluteFill style={{ left: 150, top: 360, flexDirection: "column", gap: 18 }}>
        <div style={{ fontFamily: SANS, fontSize: 24, color: C.gold, letterSpacing: "0.5em", opacity: interpolate(frame, [0, 14], [0, 1], clamp) }}>
          乾隆通宝 · 六爻起卦
        </div>
        <InkText text="三枚铜钱，" start={local(BEAT.drop) - 2} size={64} weight={700} stagger={2} />
        <InkText text="问一问当下。" start={local(BEAT.drop) + 10} size={64} weight={700} stagger={2} />
        <div style={{ height: 30 }} />
        <InkText text="懂卦象，" start={local(BEAT.bar4) + 4} size={44} weight={500} stagger={2} color="#5A5348" />
        <InkText
          text="更懂你眼底的疲惫。"
          start={local(BEAT.bar4) + 18}
          size={44}
          weight={600}
          stagger={2}
          highlight={{ chars: "疲惫", color: C.cinnabar }}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: "#FFFDF8", opacity: flash, pointerEvents: "none" }} />
    </SceneFade>
  );
};
