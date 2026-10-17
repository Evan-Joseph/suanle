import React from "react";
import { Composition } from "remotion";
import { MainPromo } from "./MainPromo";
import { ContactSheet } from "./ContactSheet";
import { Storyboard } from "./Storyboard";
import { VideoProbe } from "./VideoProbe";
import { DURATION_SECONDS, HEIGHT, WIDTH } from "./theme";

/**
 * 《算了 · Suanle》品牌宣传片 —— 合成注册表
 *  - MainPromo   : 1920×1080 @ 30FPS（推荐导出）
 *  - MainPromo60 : 1920×1080 @ 60FPS（--scale 2 可得 4K60）
 *  - ContactSheet: 导演素材检查工具
 */
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MainPromo"
        component={MainPromo}
        width={WIDTH}
        height={HEIGHT}
        fps={30}
        durationInFrames={DURATION_SECONDS * 30}
      />
      <Composition
        id="MainPromo60"
        component={MainPromo}
        width={WIDTH}
        height={HEIGHT}
        fps={60}
        durationInFrames={DURATION_SECONDS * 60}
      />
      <Composition
        id="ContactSheet"
        component={ContactSheet}
        width={WIDTH}
        height={HEIGHT}
        fps={30}
        durationInFrames={1}
        defaultProps={{
          src: "promo/video/03_letgo_paper_crumple.mp4",
          durationSec: 16.5,
          count: 16,
          startSec: 0,
        }}
      />
      <Composition
        id="Storyboard"
        component={Storyboard}
        width={WIDTH}
        height={HEIGHT}
        fps={30}
        durationInFrames={1}
        defaultProps={{ times: [2.6, 5.2, 8.6, 12.3, 14.9, 18.6, 23.2, 28.4, 31.2], cols: 3 }}
      />
      <Composition id="VideoProbe" component={VideoProbe} width={WIDTH} height={HEIGHT} fps={25} durationInFrames={30} defaultProps={{ src: "promo/video/03_letgo_paper_crumple.mp4", time: 8 }} />
    </>
  );
};
