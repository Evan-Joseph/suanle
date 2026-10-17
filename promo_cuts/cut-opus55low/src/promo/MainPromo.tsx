import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate } from "remotion";
import { BEATS, DURATION, SCENES, USE_REAL_ASSETS, XFADE, asset, s } from "./constants";
import { Fade } from "./common";
import { Scene1Hook } from "./Scene1_Hook";
import { Scene2Tavern } from "./Scene2_Tavern";
import { Scene3KLine } from "./Scene3_KLine";
import { Scene4LetGo } from "./Scene4_LetGo";
import { Scene5EndCard } from "./Scene5_EndCard";

const Shot: React.FC<{ from: number; dur: number; first?: boolean; last?: boolean; children: React.ReactNode }> = ({ from, dur, first, last, children }) => {
  const start = first ? from : from - XFADE;
  const len = dur + (first ? 0 : XFADE);
  return (
    <Sequence from={start} durationInFrames={len}>
      <Fade dur={len} inF={first ? 20 : XFADE} outF={last ? 60 : XFADE}>{children}</Fade>
    </Sequence>
  );
};

export const MainPromo: React.FC = () => (
  <AbsoluteFill style={{ background: "#FAF9F6" }}>
    <Shot {...SCENES.hook} first><Scene1Hook /></Shot>
    <Shot {...SCENES.tavern}><Scene2Tavern /></Shot>
    <Shot {...SCENES.kline}><Scene3KLine /></Shot>
    <Shot {...SCENES.letgo}><Scene4LetGo /></Shot>
    <Shot {...SCENES.end} last><Scene5EndCard /></Shot>

    {USE_REAL_ASSETS && (
      <>
        <Audio src={asset("audio/bgm_suanle_zen.mp3")} volume={(f) => interpolate(f, [0, 60, DURATION - 120, DURATION], [0, 0.75, 0.6, 0], { extrapolateRight: "clamp" })} />
        <Sequence from={BEATS.water}><Audio src={asset("audio/water_drop.mp3")} volume={0.9} /></Sequence>
        <Sequence from={BEATS.coin}><Audio src={asset("audio/coin_clatter.mp3")} volume={0.85} /></Sequence>
        <Sequence from={BEATS.crumple}><Audio src={asset("audio/paper_crumple.mp3")} volume={1} /></Sequence>
        <Sequence from={BEATS.bowl}><Audio src={asset("audio/singing_bowl_strike.mp3")} volume={1} /></Sequence>
        <Sequence from={BEATS.stamp} durationInFrames={s(6)}><Audio src={asset("audio/singing_bowl_strike.mp3")} volume={(f) => interpolate(f, [0, 300, 360], [0.35, 0.2, 0], { extrapolateRight: "clamp" })} /></Sequence>
      </>
    )}
  </AbsoluteFill>
);
