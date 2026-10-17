import React from "react";
import { Audio, Sequence, interpolate, staticFile, useVideoConfig } from "remotion";
import { ASSETS, CUES } from "./theme";

/**
 * 声音设计：
 *  - 主配乐《晓寺晨曦》全程铺底，颂钵重击处自动闪避（ducking），片尾 3 秒淡出
 *  - 拟音（Foley）严格对位画面：墨滴 / 铜钱落案 / 揉纸 / 颂钵
 */
export const AudioTracks: React.FC = () => {
  const { fps } = useVideoConfig();
  const s = (sec: number) => Math.round(sec * fps);

  return (
    <>
      <Audio
        src={staticFile(ASSETS.audio.bgm)}
        volume={(f) =>
          interpolate(
            f,
            [0, s(1.2), s(CUES.climax - 0.15), s(CUES.climax + 0.25), s(30.6), s(33.3), s(47.2), s(CUES.end - 0.2)],
            [0, 0.82, 0.82, 0.3, 0.3, 0.74, 0.74, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          )
        }
      />

      {/* 墨滴入纸 */}
      <Sequence from={s(CUES.inkDrop - 0.05)} durationInFrames={s(1.6)}>
        <Audio src={staticFile(ASSETS.audio.waterDrop)} volume={0.7} />
      </Sequence>

      {/* 铜钱落案（鼓点爆发） */}
      <Sequence from={s(CUES.drop)} durationInFrames={s(2.2)}>
        <Audio src={staticFile(ASSETS.audio.coinClatter)} volume={0.85} />
      </Sequence>

      {/* 揉纸（对齐录屏中的真实揉皱瞬间，恰在强拍 D4） */}
      <Sequence from={s(24.58)} durationInFrames={s(2.6)}>
        <Audio src={staticFile(ASSETS.audio.paperCrumple)} volume={0.9} />
      </Sequence>

      {/* 纸团落篓 · 颂钵重击与余音 */}
      <Sequence from={s(CUES.climax)} durationInFrames={s(6.6)}>
        <Audio src={staticFile(ASSETS.audio.bowlStrike)} volume={1} />
      </Sequence>
    </>
  );
};
