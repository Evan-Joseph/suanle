import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";

/** 调试：以 1:1 像素呈现录屏左上区域，用于测量真实内容边界 */
export const VideoProbe: React.FC<{ src: string; time: number }> = ({ src, time }) => {
  return (
    <AbsoluteFill style={{ background: "#00ff00" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 900, height: 1080, overflow: "hidden" }}>
        <OffthreadVideo src={staticFile(src)} trimBefore={Math.round(time * 25)} muted />
      </div>
    </AbsoluteFill>
  );
};
