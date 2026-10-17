import React, { useMemo } from "react";
import { AbsoluteFill, Sequence, spring, useVideoConfig } from "remotion";
import { Phone, phoneHeight } from "../components/Phone";
import { InkWash } from "../components/InkWash";
import {
  Chars,
  easeInCubic,
  easeInOutSine,
  easeOutCubic,
  progressAt,
  useSeconds,
} from "../components/Reveal";
import { ASSETS, COLORS, CUES } from "../theme";

export const S2_START = CUES.pickup; // 9.76
export const S2_END = CUES.turn + 0.55;

const W_COINS = 420;
const W_CHAT = 420;
const W_KLINE = 420;
const W_BAZI = 330;

/** 人生大运浪潮曲线 —— 确定性函数采样，便于标注「此刻」 */
const waveY = (x: number) =>
  650 - 140 * Math.sin((x - 260) / 300) - 48 * Math.sin((x + 80) / 125 + 0.6);

const LifeWave: React.FC<{ T: number }> = ({ T }) => {
  const draw = easeInOutSine(progressAt(T, CUES.bar5 + 0.1, 2.7));
  const exit = easeInCubic(progressAt(T, CUES.turn, 0.55));
  const { line, area } = useMemo(() => {
    const pts: string[] = [];
    for (let x = -20; x <= 1950; x += 10) pts.push(`${x} ${waveY(x).toFixed(1)}`);
    const l = `M ${pts.join(" L ")}`;
    return { line: l, area: `${l} L 1950 1080 L -20 1080 Z` };
  }, []);
  const clipW = -20 + 1970 * draw;
  const nowX = 1040;
  const nowVisible = clipW >= nowX;
  const nowP = nowVisible ? easeOutCubic(progressAt(T, CUES.bar5 + 0.1 + 2.7 * ((nowX + 20) / 1970), 0.5)) : 0;
  if (draw <= 0) return null;
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: 1 - exit }}>
      <defs>
        <clipPath id="wave-clip">
          <rect x={-20} y={0} width={Math.max(0, clipW + 20)} height={1080} />
        </clipPath>
        <linearGradient id="wave-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={COLORS.bamboo} stopOpacity={0.16} />
          <stop offset="100%" stopColor={COLORS.bamboo} stopOpacity={0} />
        </linearGradient>
      </defs>
      <g clipPath="url(#wave-clip)">
        <path d={area} fill="url(#wave-fill)" />
        <path d={line} fill="none" stroke={COLORS.ink} strokeWidth={1.6} opacity={0.55} />
      </g>
      {/* 此刻 */}
      <g opacity={nowP} transform={`translate(${nowX} ${waveY(nowX)})`}>
        <circle r={22 * nowP} fill={COLORS.vermilion} opacity={0.12} />
        <circle r={7} fill={COLORS.vermilion} />
        <line x1={0} y1={-14} x2={0} y2={-52} stroke={COLORS.vermilion} strokeWidth={1.2} />
        <text x={0} y={-66} textAnchor="middle" fontSize={24} fill={COLORS.vermilion} letterSpacing={4} fontWeight={400}>
          此刻
        </text>
      </g>
    </svg>
  );
};

export const S2Divination: React.FC = () => {
  const { t, fps } = useSeconds();
  const { fps: vfps } = useVideoConfig();
  const T = t;
  const baseY = (1080 - phoneHeight(W_COINS)) / 2 + 24;

  /* ───── 铜钱手机：预备拍升起 → 鼓点落位 ───── */
  const rise = easeInOutSine(progressAt(T, CUES.pickup, CUES.drop - CUES.pickup));
  const landed = T >= CUES.drop;
  const bounce = landed
    ? spring({ frame: (T - CUES.drop) * fps, fps: vfps, config: { damping: 9, stiffness: 180, mass: 0.6 } })
    : 0;
  const shiftB = easeInOutSine(progressAt(T, CUES.bar4, 0.85));
  const exitC = easeInCubic(progressAt(T, CUES.bar5, 0.6));

  const coinsX = 1250 - shiftB * 330 - exitC * 900;
  const coinsY = baseY + (1 - rise) * 820 - shiftB * 10;
  const coinsRotY = 18 - rise * 24 - shiftB * 10;
  const coinsScale = (landed ? 1 + 0.06 * (1 - bounce) : 0.96 + 0.04 * rise) * (1 - shiftB * 0.1);

  /* ───── 对话手机：第 4 小节强拍自右侧层叠进入 ───── */
  const chatIn = T >= CUES.bar4
    ? spring({ frame: (T - CUES.bar4) * fps, fps: vfps, config: { damping: 20, stiffness: 85, mass: 1 } })
    : 0;
  const chatX = 1330 + (1 - chatIn) * 760 - exitC * 1100;
  const chatRotY = -8 - (1 - chatIn) * 14;

  /* ───── 命盘 / 大运手机：第 5 小节强拍自下方升起 ───── */
  const klineIn = T >= CUES.bar5
    ? spring({ frame: (T - CUES.bar5) * fps, fps: vfps, config: { damping: 19, stiffness: 72, mass: 1.1 } })
    : 0;
  const exitD = easeInCubic(progressAt(T, CUES.turn, 0.6));
  const klineY = baseY + (1 - klineIn) * 760 + exitD * 300;
  const baziIn = T >= CUES.bar5 + 0.18
    ? spring({ frame: (T - CUES.bar5 - 0.18) * fps, fps: vfps, config: { damping: 19, stiffness: 72, mass: 1.1 } })
    : 0;
  const baziY = baseY + 120 + (1 - baziIn) * 760 + exitD * 300;

  const quickExit = { exitDuration: 0.35 };

  return (
    <AbsoluteFill>
      <LifeWave T={T} />

      {/* 鼓点爆发：朱砂墨晕 */}
      {T >= CUES.drop && (
        <InkWash
          x={400}
          y={430}
          size={300}
          color={COLORS.vermilion}
          progress={progressAt(T, CUES.drop, 1.3)}
          opacity={0.24 * (1 - easeInCubic(progressAt(T, CUES.bar4 - 0.25, 0.5)))}
          time={T}
          seed="kick"
        />
      )}

      {/* ───── 左侧排版 ───── */}
      <div style={{ position: "absolute", left: 168, top: 0, width: 880, height: 1080 }}>
        {/* Phase A · 算一算 */}
        <div style={{ position: "absolute", top: 300 }}>
          <div style={{ fontSize: 150, fontWeight: 700, color: COLORS.ink, letterSpacing: "0.04em", lineHeight: 1.1 }}>
            <Chars text="算一算" from={CUES.drop} stagger={0.085} duration={0.45} rise={30} exitAt={CUES.bar4 - 0.15} {...quickExit} />
            <Chars text="。" from={CUES.drop + 0.3} duration={0.4} charStyle={{ color: COLORS.vermilion }} exitAt={CUES.bar4 - 0.15} {...quickExit} />
          </div>
          <div style={{ fontSize: 40, fontWeight: 300, color: COLORS.ink, letterSpacing: "0.14em", marginTop: 22 }}>
            <Chars text="三枚古钱，六爻成卦。" from={CUES.drop + 0.6} stagger={0.05} duration={0.6} exitAt={CUES.bar4 - 0.15} {...quickExit} />
          </div>
          <div style={{ fontSize: 32, fontWeight: 300, color: COLORS.inkSoft, letterSpacing: "0.1em", marginTop: 14 }}>
            <Chars text="不为预言吉凶，只为看清此刻。" from={CUES.drop + 1.15} stagger={0.045} duration={0.6} exitAt={CUES.bar4 - 0.1} {...quickExit} />
          </div>
        </div>

        {/* Phase B · 懂卦象，更懂你 */}
        <div style={{ position: "absolute", top: 330 }}>
          <div style={{ fontSize: 76, fontWeight: 400, color: COLORS.ink, letterSpacing: "0.06em", lineHeight: 1.35 }}>
            <Chars text="懂卦象，" from={CUES.bar4} stagger={0.07} duration={0.6} exitAt={CUES.bar5 - 0.12} exitDuration={0.4} />
            <br />
            <Chars text="更懂你眼底的疲惫。" from={CUES.bar4 + 0.5} stagger={0.06} duration={0.6} exitAt={CUES.bar5 - 0.12} exitDuration={0.4} />
          </div>
          <div style={{ fontSize: 32, fontWeight: 300, color: COLORS.inkSoft, letterSpacing: "0.1em", marginTop: 26 }}>
            <Chars text="不吓你，不哄你，只陪你把乱麻理一理。" from={CUES.bar4 + 1.5} stagger={0.04} duration={0.6} exitAt={CUES.bar5 - 0.08} exitDuration={0.4} />
          </div>
        </div>

        {/* Phase C · 人生有周期 */}
        <div style={{ position: "absolute", top: 290 }}>
          <div style={{ fontSize: 88, fontWeight: 400, color: COLORS.ink, letterSpacing: "0.06em", lineHeight: 1.2 }}>
            <Chars text="人生有周期。" from={CUES.bar5} stagger={0.08} duration={0.6} exitAt={CUES.turn} exitDuration={0.5} />
          </div>
          <div style={{ fontSize: 40, fontWeight: 300, color: COLORS.inkSoft, letterSpacing: "0.12em", marginTop: 18 }}>
            <Chars text="起伏，本就是常态。" from={CUES.bar5 + 0.9} stagger={0.06} duration={0.7} exitAt={CUES.turn} exitDuration={0.5} />
          </div>
          <div style={{ fontSize: 46, fontWeight: 400, color: COLORS.ink, letterSpacing: "0.1em", marginTop: 92 }}>
            <Chars text="低谷时蓄力，高峰时尽兴。" from={CUES.bar6} stagger={0.055} duration={0.55} exitAt={CUES.turn + 0.05} exitDuration={0.5} />
          </div>
          <div style={{ fontSize: 34, fontWeight: 300, color: COLORS.gold, letterSpacing: "0.14em", marginTop: 18 }}>
            <Chars text="看清起伏，心就定了。" from={CUES.bar6 + 0.75} stagger={0.06} duration={0.6} exitAt={CUES.turn + 0.1} exitDuration={0.5} />
          </div>
        </div>
      </div>

      {/* ───── 对话手机（底层） ───── */}
      <Sequence
        from={Math.round((CUES.bar4 - S2_START) * fps)}
        durationInFrames={Math.round((CUES.bar5 + 0.7 - CUES.bar4) * fps)}
        premountFor={fps}
      >
        <div
          style={{
            position: "absolute",
            left: chatX,
            top: baseY + 40,
            opacity: chatIn * (1 - exitC),
            filter: `blur(${exitC * 10}px)`,
          }}
        >
          <Phone width={W_CHAT} video={ASSETS.video.chat} startFromSec={5.9} rotateY={chatRotY} rotateX={3} shadow={0.8} />
        </div>
      </Sequence>

      {/* ───── 铜钱手机 ───── */}
      <Sequence from={0} durationInFrames={Math.round((CUES.bar5 + 0.7 - S2_START) * fps)} premountFor={fps}>
        <div
          style={{
            position: "absolute",
            left: coinsX,
            top: coinsY,
            opacity: (1 - exitC) * (1 - shiftB * 0.12),
            filter: `blur(${exitC * 10}px)`,
            transform: `scale(${coinsScale})`,
            transformOrigin: "center",
          }}
        >
          <Phone width={W_COINS} video={ASSETS.video.coins} startFromSec={9.7} rotateY={coinsRotY} rotateX={4 - rise * 2} />
        </div>
      </Sequence>

      {/* ───── 命盘 / 大运 K 线 ───── */}
      {T >= CUES.bar5 && (
        <>
          <div
            style={{
              position: "absolute",
              left: 1560,
              top: baziY,
              opacity: 0.8 * baziIn * (1 - exitD),
              transform: "scale(0.86)",
              transformOrigin: "top left",
              filter: `blur(${exitD * 8}px)`,
            }}
          >
            <Phone width={W_BAZI} image={ASSETS.image.bazi} rotateY={-14} rotateX={3} shadow={0.6} />
          </div>
          <div
            style={{
              position: "absolute",
              left: 1210,
              top: klineY,
              opacity: klineIn * (1 - exitD),
              filter: `blur(${exitD * 8}px)`,
            }}
          >
            <Phone width={W_KLINE} image={ASSETS.image.kline} rotateY={-9} rotateX={3} />
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};
