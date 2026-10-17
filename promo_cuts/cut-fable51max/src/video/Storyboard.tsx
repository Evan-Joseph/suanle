import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { MainPromo } from "./MainPromo";
import { HEIGHT, WIDTH } from "./theme";

/**
 * 导演工具：分镜审片表 —— 在同一张静帧里并排呈现全片多个时间点。
 * 原理：负向 Sequence 偏移使子合成的 useCurrentFrame() 指向目标帧。
 */
export type StoryboardProps = { times: number[]; cols: number };

export const Storyboard: React.FC<StoryboardProps> = ({ times, cols }) => {
  const { fps, width } = useVideoConfig();
  const cellW = width / cols;
  const scale = cellW / WIDTH;
  const cellH = HEIGHT * scale;
  return (
    <AbsoluteFill style={{ background: "#222", display: "flex", flexDirection: "row", flexWrap: "wrap", alignContent: "flex-start" }}>
      {times.map((time, i) => (
        <div key={i} style={{ width: cellW, height: cellH, position: "relative", overflow: "hidden", outline: "1px solid #444" }}>
          <div style={{ width: WIDTH, height: HEIGHT, transform: `scale(${scale})`, transformOrigin: "top left" }}>
            <Sequence from={-Math.round(time * fps)} durationInFrames={Math.round(time * fps) + 2}>
              <MainPromo />
            </Sequence>
          </div>
          <div style={{ position: "absolute", left: 6, bottom: 4, color: "#0f0", fontSize: 18, fontFamily: "monospace" }}>{time.toFixed(2)}s</div>
        </div>
      ))}
    </AbsoluteFill>
  );
};
