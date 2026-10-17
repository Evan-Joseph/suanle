import React from "react";
import { Composition } from "remotion";
import { DURATION, FPS, HEIGHT, WIDTH } from "./constants";
import { MainPromo } from "./MainPromo";

export const RemotionRoot: React.FC = () => (
  <Composition id="MainPromo" component={MainPromo} durationInFrames={DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
);
