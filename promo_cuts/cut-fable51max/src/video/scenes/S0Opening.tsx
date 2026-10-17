import React from "react";
import { AbsoluteFill } from "remotion";
import { noise2D } from "@remotion/noise";
import { InkWash } from "../components/InkWash";
import { Chars, clamp01, easeInCubic, easeOutCubic, presence, progressAt, useSeconds } from "../components/Reveal";
import { COLORS, CUES } from "../theme";

export const S0_START = 0;

/** 深夜里散落的念头 —— 轻、灰、飘 */
const THOUGHTS: { text: string; x: number; y: number; size: number }[] = [
  { text: "凌晨两点，还在复盘白天说错的那句话。", x: 1010, y: 268, size: 30 },
  { text: "offer 要不要接？", x: 1210, y: 392, size: 34 },
  { text: "他为什么还没回消息。", x: 1080, y: 508, size: 30 },
  { text: "这一次，是不是又选错了？", x: 1260, y: 632, size: 32 },
  { text: "明明很累，却不敢停下来。", x: 1120, y: 756, size: 30 },
];

export const S0Opening: React.FC = () => {
  const { t } = useSeconds();
  const T = t;

  // 墨滴：从上方落下，触纸后晕开
  const dropP = progressAt(T, CUES.inkDrop - 0.42, 0.42);
  const dropY = -140 + 680 * easeInCubic(dropP);
  const washP = progressAt(T, CUES.inkDrop, 3.2);
  const washFade = 1 - easeInCubic(progressAt(T, CUES.strings - 0.1, 0.9));

  return (
    <AbsoluteFill>
      {/* 落下的墨滴 */}
      {dropP > 0 && dropP < 1 && (
        <div
          style={{
            position: "absolute",
            left: 560 - 9,
            top: dropY,
            width: 18,
            height: 26,
            borderRadius: "50% 50% 50% 50% / 40% 40% 60% 60%",
            background: COLORS.ink,
            opacity: 0.9,
          }}
        />
      )}
      {/* 水墨晕染 */}
      {washP > 0 && (
        <InkWash x={560} y={540} size={520} progress={washP} opacity={0.82 * washFade} time={T} seed="opening" />
      )}

      {/* 散落的念头 */}
      {THOUGHTS.map((th, i) => {
        const from = 0.55 + i * 0.52;
        const exitAt = CUES.flute - 0.1 + i * 0.07;
        const { enter, exit, opacity } = presence(T, from, 1.1, exitAt, 0.9);
        const drift = noise2D(`thought-${i}`, T * 0.12, 0) * 10;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: th.x,
              top: th.y,
              fontSize: th.size,
              fontWeight: 300,
              color: COLORS.inkSoft,
              opacity: opacity * 0.85,
              letterSpacing: "0.06em",
              transform: `translate(${drift}px, ${(1 - enter) * 14 - exit * 40}px)`,
              filter: `blur(${(1 - enter) * 6 + exit * 8}px)`,
              whiteSpace: "nowrap",
            }}
          >
            {th.text}
          </div>
        );
      })}

      {/* 品牌叩问 */}
      <div style={{ position: "absolute", left: 980, top: 410 }}>
        <div style={{ fontSize: 58, fontWeight: 300, color: COLORS.ink, letterSpacing: "0.08em", lineHeight: 1.5 }}>
          <Chars text="有些事，想了一万遍，" from={CUES.flute} stagger={0.075} exitAt={CUES.strings - 0.05} />
          <br />
          <Chars text="也想不出答案。" from={CUES.flute + 0.95} stagger={0.075} exitAt={CUES.strings - 0.05} />
        </div>
        <div
          style={{
            marginTop: 36,
            fontSize: 44,
            fontWeight: 400,
            color: COLORS.inkSoft,
            letterSpacing: "0.12em",
          }}
        >
          <Chars text="不如，先算一算。" from={CUES.flute + 2.1} stagger={0.09} exitAt={CUES.strings + 0.05} />
        </div>
      </div>

      {/* 右下角页码式小字 —— 呼吸提示 */}
      <div
        style={{
          position: "absolute",
          right: 96,
          bottom: 64,
          fontSize: 20,
          letterSpacing: "0.4em",
          color: COLORS.inkFaint,
          opacity: clamp01(progressAt(T, 1.4, 1.2)) * (1 - easeOutCubic(progressAt(T, CUES.strings - 0.3, 0.6))),
        }}
      >
        深夜 · 心事
      </div>
    </AbsoluteFill>
  );
};
