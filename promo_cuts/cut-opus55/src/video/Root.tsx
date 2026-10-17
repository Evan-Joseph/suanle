import React from "react";
import { Composition } from "remotion";
import { MainPromo } from "./MainPromo";
import { DURATION, FPS, HEIGHT, WIDTH } from "./theme";

export const RemotionRoot: React.FC = () => (
  <>
    {/* 主宣传片：1920×1080 · 30FPS · 45s（用 --scale=2 导出 4K） */}
    <Composition id="MainPromo" component={MainPromo} durationInFrames={DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
  </>
);
