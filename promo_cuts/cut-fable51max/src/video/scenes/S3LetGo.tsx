import React from "react";
import { AbsoluteFill, Freeze, Sequence, spring, useVideoConfig } from "remotion";
import { Phone, phoneHeight } from "../components/Phone";
import { Ripples } from "../components/Ripples";
import { Seal } from "../components/Seal";
import {
  Chars,
  clamp01,
  easeInCubic,
  easeInOutSine,
  easeOutCubic,
  progressAt,
  useSeconds,
} from "../components/Reveal";
import { ASSETS, COLORS, CUES } from "../theme";

export const S3_START = CUES.turn; // 20.43
export const S3_END = CUES.reprise + 0.6;

/** 录屏 03 内部时码 → 全片时码的偏移：纸团落篓(视频 12.5s) 对齐颂钵重击(27.62s) */
const VIDEO_OFFSET = CUES.climax - 12.5; // 15.12
const VIDEO_END = VIDEO_OFFSET + 16.3; // 素材安全结束点
const CRUMPLE_AT = VIDEO_OFFSET + 9.6; // ≈ 24.72，恰为强拍 D4

const PHONE_W = 440;

const impulse = (T: number, at: number, dur: number) => {
  const k = (T - at) / dur;
  if (k < 0 || k > 1) return 0;
  return (1 - k) * (1 - k);
};

export const S3LetGo: React.FC = () => {
  const { t, tLocal, fps } = useSeconds();
  const { fps: vfps } = useVideoConfig();
  const T = t;
  const baseY = (1080 - phoneHeight(PHONE_W)) / 2 + 20;

  // 入场
  const enter = spring({ frame: tLocal * fps, fps: vfps, config: { damping: 20, stiffness: 60, mass: 1.1 } });
  // 揉纸挤压
  const squeeze = impulse(T, CRUMPLE_AT, 0.55);
  // 抛掷跟拍：缓慢推镜
  const dolly = easeInOutSine(progressAt(T, CUES.climax - 1.05, 1.05));
  const afterClimax = T >= CUES.climax;
  // 高潮后：手机让位，退至左侧小景
  const post = afterClimax
    ? spring({ frame: (T - CUES.climax) * fps, fps: vfps, config: { damping: 18, stiffness: 58, mass: 1 } })
    : 0;
  const stamp = afterClimax
    ? spring({ frame: (T - CUES.climax) * fps, fps: vfps, config: { damping: 12, stiffness: 130, mass: 0.9 } })
    : 0;
  const sealP = T >= CUES.climax + 0.42
    ? spring({ frame: (T - CUES.climax - 0.42) * fps, fps: vfps, config: { damping: 11, stiffness: 170, mass: 0.8 } })
    : 0;
  const flash = afterClimax ? 0.28 * (1 - easeOutCubic(progressAt(T, CUES.climax, 0.45))) : 0;
  const sceneExit = easeInCubic(progressAt(T, S3_END - 0.6, 0.6));

  const phoneX = 1230 - post * 700;
  const phoneY = baseY + (1 - enter) * 500 + post * 70;
  const phoneScale = (1 - post * 0.24) * (afterClimax ? 1 : 1 + dolly * 0.14);
  const videoEnded = T >= VIDEO_END;
  const freezeFrame = Math.round((VIDEO_END - S3_START) * fps);

  const preExit = { exitAt: CUES.climax - 0.04, exitDuration: 0.22 };

  return (
    <AbsoluteFill style={{ opacity: 1 - sceneExit, filter: sceneExit > 0 ? `blur(${sceneExit * 10}px)` : undefined }}>
      {/* 颂钵声波 */}
      {afterClimax && <Ripples cx={1240} cy={470} from={CUES.climax} count={7} interval={0.4} maxRadius={1250} life={4.6} />}

      {/* 高潮前排版（随推镜一起轻微放大） */}
      <div
        style={{
          position: "absolute",
          left: 168,
          top: 330,
          transform: `scale(${1 + dolly * 0.05})`,
          transformOrigin: "left center",
        }}
      >
        <div style={{ fontSize: 44, fontWeight: 300, color: COLORS.inkSoft, letterSpacing: "0.1em" }}>
          <Chars text="也有些事，" from={S3_START + 0.3} stagger={0.07} {...preExit} />
        </div>
        <div style={{ fontSize: 66, fontWeight: 400, color: COLORS.ink, letterSpacing: "0.06em", marginTop: 10, lineHeight: 1.3 }}>
          <Chars text="算过了，还是放不下。" from={S3_START + 0.75} stagger={0.07} {...preExit} />
        </div>
        <div style={{ fontSize: 40, fontWeight: 300, color: COLORS.inkSoft, letterSpacing: "0.12em", marginTop: 40 }}>
          <Chars text="那就，写下来。" from={S3_START + 1.7} stagger={0.08} {...preExit} />
        </div>
        <div style={{ fontSize: 84, fontWeight: 400, color: COLORS.ink, letterSpacing: "0.08em", marginTop: 26 }}>
          <Chars text="揉掉它。" from={CRUMPLE_AT} stagger={0.045} duration={0.4} rise={26} {...preExit} />
        </div>
      </div>

      {/* 实机录屏：纸篓仪式 */}
      <div
        style={{
          position: "absolute",
          left: phoneX,
          top: phoneY,
          opacity: enter,
          transform: `scale(${phoneScale}) scaleX(${1 - squeeze * 0.035}) scaleY(${1 + squeeze * 0.02})`,
          transformOrigin: "center",
        }}
      >
        {videoEnded ? (
          /* 素材播完后定格在真实的最后一帧（「算了。」完成态） */
          <Freeze frame={freezeFrame}>
            <Phone width={PHONE_W} video={ASSETS.video.letgo} startFromSec={5.31} rotateY={0} rotateX={0} />
          </Freeze>
        ) : (
          <Sequence from={0} durationInFrames={freezeFrame + 1} premountFor={fps}>
            <Phone width={PHONE_W} video={ASSETS.video.letgo} startFromSec={5.31} rotateY={-6 + post * 6} rotateX={2 - post * 2} />
          </Sequence>
        )}
      </div>

      {/* 高潮：算了。 */}
      {afterClimax && (
        <>
          <div
            style={{
              position: "absolute",
              left: 1000,
              top: 300,
              opacity: clamp01(stamp * 3),
              transform: `scale(${1.38 - 0.38 * stamp})`,
              transformOrigin: "40% 50%",
              filter: `blur(${Math.max(0, 10 * (1 - stamp))}px)`,
              fontSize: 230,
              fontWeight: 700,
              color: COLORS.ink,
              letterSpacing: "0.04em",
              lineHeight: 1.1,
              whiteSpace: "nowrap",
            }}
          >
            算了<span style={{ color: COLORS.vermilion }}>。</span>
          </div>
          <div style={{ position: "absolute", left: 1595, top: 330 }}>
            <Seal size={132} text="算" progress={sealP} id="climax-seal" />
          </div>

          <div style={{ position: "absolute", left: 1012, top: 600 }}>
            <div style={{ fontSize: 40, fontWeight: 300, color: COLORS.ink, letterSpacing: "0.12em", lineHeight: 1.6 }}>
              <Chars text="放下执念，" from={CUES.afterglow + 0.4} stagger={0.08} duration={1} exitAt={S3_END - 0.7} />
              <br />
              <Chars text="便与自己，温柔地和解。" from={CUES.afterglow + 1.1} stagger={0.08} duration={1} exitAt={S3_END - 0.7} />
            </div>
            <div style={{ fontSize: 26, fontWeight: 400, color: COLORS.gold, letterSpacing: "0.32em", marginTop: 40 }}>
              <Chars text="今天，算了一件事。" from={CUES.afterglow + 2.4} stagger={0.07} duration={1} exitAt={S3_END - 0.7} />
            </div>
          </div>
        </>
      )}

      {/* 落篓瞬间：纸白闪光 */}
      {flash > 0 && <AbsoluteFill style={{ backgroundColor: COLORS.paper, opacity: flash }} />}
    </AbsoluteFill>
  );
};
