import React from "react";
import { AbsoluteFill, Img, Sequence, spring, staticFile, useVideoConfig } from "remotion";
import { FULL_FRAME, Phone, phoneHeight } from "../components/Phone";
import { Seal } from "../components/Seal";
import { Chars, easeInCubic, progressAt, useSeconds } from "../components/Reveal";
import { ASSETS, COLORS, CUES } from "../theme";

export const S4_START = CUES.reprise; // 33.34
export const S4_END = CUES.cta + 0.5;

const PHONE_W = 380;
const CARDS = [
  { src: ASSETS.image.cardAphorism, x: 930, y: 230, rot: -8, w: 280 },
  { src: ASSETS.image.cardLetgo, x: 1090, y: 300, rot: -3.5, w: 280 },
  { src: ASSETS.image.cardAnnual, x: 1245, y: 372, rot: 1.5, w: 280 },
];

export const S4Cards: React.FC = () => {
  const { t, tLocal, fps } = useSeconds();
  const { fps: vfps } = useVideoConfig();
  const T = t;
  const baseY = (1080 - phoneHeight(PHONE_W)) / 2 + 20;
  const exit = easeInCubic(progressAt(T, CUES.cta - 0.05, 0.5));

  const phoneIn = spring({ frame: tLocal * fps, fps: vfps, config: { damping: 21, stiffness: 70, mass: 1.1 } });
  const sealP = T >= CUES.reprise + 2.74
    ? spring({ frame: (T - CUES.reprise - 2.74) * fps, fps: vfps, config: { damping: 11, stiffness: 170, mass: 0.8 } })
    : 0;

  return (
    <AbsoluteFill style={{ opacity: 1 - exit, filter: exit > 0 ? `blur(${exit * 10}px)` : undefined }}>
      {/* 左侧排版 */}
      <div style={{ position: "absolute", left: 168, top: 340 }}>
        <div style={{ fontSize: 44, fontWeight: 300, color: COLORS.inkSoft, letterSpacing: "0.1em" }}>
          <Chars text="把这一刻的释怀，" from={S4_START + 0.2} stagger={0.07} />
        </div>
        <div style={{ position: "relative", fontSize: 72, fontWeight: 400, color: COLORS.ink, letterSpacing: "0.06em", marginTop: 14, lineHeight: 1.3 }}>
          <Chars text="做成一张宣纸卡。" from={S4_START + 0.75} stagger={0.07} />
          <div style={{ position: "absolute", left: 640, top: -6 }}>
            <Seal size={100} text="算" progress={sealP} id="card-seal" />
          </div>
        </div>
        <div style={{ fontSize: 32, fontWeight: 300, color: COLORS.inkSoft, letterSpacing: "0.1em", marginTop: 44, lineHeight: 1.7 }}>
          <Chars text="木版水印，朱砂落款，" from={S4_START + 2.1} stagger={0.05} />
          <br />
          <Chars text="分享给同样睡不着的朋友。" from={S4_START + 2.75} stagger={0.05} />
        </div>
      </div>

      {/* 宣纸卡片 —— 错落层叠、缓慢视差 */}
      {CARDS.map((c, i) => {
        const delay = 0.12 + i * 0.22;
        const p = tLocal >= delay
          ? spring({ frame: (tLocal - delay) * fps, fps: vfps, config: { damping: 18, stiffness: 68, mass: 1.1 } })
          : 0;
        const drift = tLocal * (6 + i * 3);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: c.x - drift,
              top: c.y + (1 - p) * 520,
              width: c.w,
              opacity: p,
              transform: `perspective(1800px) rotateY(-10deg) rotateZ(${c.rot}deg)`,
              transformOrigin: "center",
              borderRadius: 10,
              overflow: "hidden",
              boxShadow: "0 24px 60px rgba(43,43,43,0.18), 0 4px 12px rgba(43,43,43,0.10)",
              background: COLORS.paper,
            }}
          >
            <Img src={staticFile(c.src)} style={{ width: "100%", display: "block" }} />
          </div>
        );
      })}

      {/* 实机录屏：卡片生成与二维码 */}
      <Sequence from={0} durationInFrames={Math.round((S4_END - S4_START) * fps)} premountFor={fps}>
        <div
          style={{
            position: "absolute",
            left: 1440 + (1 - phoneIn) * 600,
            top: baseY,
            opacity: phoneIn,
          }}
        >
          <Phone width={PHONE_W} video={ASSETS.video.card} contentBox={FULL_FRAME} startFromSec={0.3} rotateY={-10 - (1 - phoneIn) * 10} rotateX={3} />
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};
