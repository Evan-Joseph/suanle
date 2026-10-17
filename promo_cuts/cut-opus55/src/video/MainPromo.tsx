import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile } from "remotion";
import { BEAT, C, DURATION, SCENES } from "./theme";
import { CoinsScene, HookScene, TeaScene } from "./scenes/ActOne";
import { LetGoScene, WaveScene } from "./scenes/ActTwo";
import { CardScene, CtaScene } from "./scenes/ActThree";
import { FontLoader } from "./FontLoader";

/** 声音设计：主配乐《晓寺晨曦》+ 实录拟音，严格卡点 AUDIO_BEATS.md */
const AudioTracks: React.FC = () => (
  <>
    <Audio
      src={staticFile("promo/audio/suanle_zen_bgm.mp3")}
      volume={(f) =>
        interpolate(
          f,
          [0, 24, BEAT.bowl - 4, BEAT.bowl + 6, BEAT.bowl + 120, DURATION - 70, DURATION - 4],
          [0, 0.8, 0.8, 0.42, 0.75, 0.75, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        )
      }
    />
    <Sequence from={BEAT.inkDrop - 6} durationInFrames={90}>
      <Audio src={staticFile("promo/audio/water_drop.mp3")} volume={0.75} />
    </Sequence>
    <Sequence from={BEAT.drop} durationInFrames={90}>
      <Audio src={staticFile("promo/audio/coin_clatter.mp3")} volume={0.85} />
    </Sequence>
    <Sequence from={BEAT.drop + 42} durationInFrames={80}>
      <Audio src={staticFile("promo/audio/coin_clatter.mp3")} volume={0.45} />
    </Sequence>
    <Sequence from={BEAT.crumple} durationInFrames={90}>
      <Audio src={staticFile("promo/audio/paper_crumple.mp3")} volume={0.95} />
    </Sequence>
    <Sequence from={BEAT.bowl} durationInFrames={220}>
      <Audio src={staticFile("promo/audio/singing_bowl_strike.mp3")} volume={1} />
    </Sequence>
    <Sequence from={BEAT.seal + 6} durationInFrames={60}>
      <Audio src={staticFile("promo/audio/water_drop.mp3")} volume={0.4} />
    </Sequence>
    <Sequence from={SCENES.cta.from + 90} durationInFrames={DURATION - SCENES.cta.from - 90}>
      <Audio
        src={staticFile("promo/audio/singing_bowl.mp3")}
        volume={(f) => interpolate(f, [0, 10, 120, 165], [0, 0.35, 0.3, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
      />
    </Sequence>
  </>
);

export const MainPromo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.paper }}>
      <FontLoader />
      {(
        [
          [SCENES.hook, HookScene],
          [SCENES.tea, TeaScene],
          [SCENES.coins, CoinsScene],
          [SCENES.wave, WaveScene],
          [SCENES.letgo, LetGoScene],
          [SCENES.card, CardScene],
          [SCENES.cta, CtaScene],
        ] as const
      ).map(([s, Comp], i) => (
        <Sequence key={i} from={s.from} durationInFrames={s.dur} name={Comp.name}>
          <Comp />
        </Sequence>
      ))}
      <AudioTracks />
    </AbsoluteFill>
  );
};
