import React from "react";
import { AbsoluteFill, Sequence, spring, useVideoConfig } from "remotion";
import { Phone, phoneHeight } from "../components/Phone";
import { Chars, InkLine, easeInOutSine, progressAt, useSeconds } from "../components/Reveal";
import { ASSETS, COLORS, CUES } from "../theme";

export const S1_START = CUES.strings; // 6.43

const PHONE_W = 430;

export const S1Friend: React.FC = () => {
  const { t, tLocal, fps } = useSeconds();
  const { fps: vfps } = useVideoConfig();
  const T = t;

  // 手机自右侧入场（弹簧阻尼）
  const enter = spring({
    frame: tLocal * fps,
    fps: vfps,
    config: { damping: 22, stiffness: 70, mass: 1.1 },
  });
  // 预备拍后让位：向左漂移、缩小、虚化
  const leave = easeInOutSine(progressAt(T, CUES.pickup - 0.1, 1.15));

  const x = 1180 + (1 - enter) * 620 - leave * 560;
  const y = (1080 - phoneHeight(PHONE_W)) / 2 + 30 - leave * 40;
  const rotY = -16 + enter * 8 - leave * 10;
  const textExit = CUES.pickup + 0.5;

  return (
    <AbsoluteFill>
      {/* 左侧排版 */}
      <div style={{ position: "absolute", left: 168, top: 318 }}>
        <div style={{ fontSize: 40, fontWeight: 300, color: COLORS.inkSoft, letterSpacing: "0.1em" }}>
          <Chars text="懂八字、紫微、六爻、塔罗，" from={S1_START + 0.25} stagger={0.06} exitAt={textExit} />
        </div>
        <div style={{ fontSize: 92, fontWeight: 400, color: COLORS.ink, letterSpacing: "0.06em", marginTop: 18, lineHeight: 1.25 }}>
          <Chars text="但更懂人心。" from={S1_START + 1.05} stagger={0.09} exitAt={textExit + 0.1} />
        </div>
        <InkLine from={S1_START + 1.9} width={240} color={COLORS.gold} exitAt={textExit} style={{ marginTop: 26 }} />
        <div style={{ fontSize: 34, fontWeight: 300, color: COLORS.inkFaint, letterSpacing: "0.12em", marginTop: 26 }}>
          <Chars text="像一位老朋友，邀你对坐，温一壶茶。" from={S1_START + 2.25} stagger={0.05} exitAt={textExit + 0.2} />
        </div>
      </div>

      {/* 实机录屏：首页巡礼 */}
      <Sequence from={0} durationInFrames={Math.round((CUES.drop - S1_START + 0.2) * fps)} premountFor={fps}>
        <div
          style={{
            position: "absolute",
            left: x,
            top: y,
            opacity: enter * (1 - leave),
            filter: `blur(${leave * 14}px)`,
            transform: `scale(${1 - leave * 0.12})`,
          }}
        >
          <Phone width={PHONE_W} video={ASSETS.video.home} startFromSec={4.0} rotateY={rotY} rotateX={3} />
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};
