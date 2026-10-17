import React from "react";
import { Img, OffthreadVideo, staticFile } from "remotion";
import { C } from "../theme";

/** 真实录屏/截图的悬浮手机（860×1864 视网膜比例） */
export const Phone: React.FC<{
  height?: number;
  x?: number;
  y?: number;
  rotateX?: number;
  rotateY?: number;
  rotateZ?: number;
  scale?: number;
  opacity?: number;
  blur?: number;
  /** cropViewport: 录屏实际有效画面位于左上角 430×846 区域时，按高度铺满并居中裁切 */
  video?: { src: string; startFrom?: number; playbackRate?: number; cropViewport?: boolean };
  image?: string;
  overlay?: React.ReactNode;
}> = ({
  height = 860,
  x = 0,
  y = 0,
  rotateX = 0,
  rotateY = 0,
  rotateZ = 0,
  scale = 1,
  opacity = 1,
  blur = 0,
  video,
  image,
  overlay,
}) => {
  const width = (height * 860) / 1864;
  const bezel = height * 0.018;
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: width + bezel * 2,
        height: height + bezel * 2,
        marginLeft: -(width + bezel * 2) / 2,
        marginTop: -(height + bezel * 2) / 2,
        transform: `translate(${x}px, ${y}px) perspective(2200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale})`,
        opacity,
        filter: blur ? `blur(${blur}px)` : undefined,
        borderRadius: height * 0.07,
        background: "linear-gradient(145deg, #F3EFE7 0%, #D9D2C4 55%, #EFEAE0 100%)",
        padding: bezel,
        boxShadow: `0 ${height * 0.06}px ${height * 0.12}px rgba(76, 58, 34, 0.22), 0 ${height * 0.01}px ${height * 0.02}px rgba(76,58,34,0.18), inset 0 0 0 1.5px rgba(255,255,255,0.7)`,
      }}
    >
      <div
        style={{
          width,
          height,
          borderRadius: height * 0.058,
          overflow: "hidden",
          position: "relative",
          background: C.paper,
          boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.06)",
        }}
      >
        {image ? (
          <Img src={staticFile(image)} style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute" }} />
        ) : null}
        {video ? (
          <OffthreadVideo
            src={staticFile(video.src)}
            startFrom={video.startFrom ?? 0}
            playbackRate={video.playbackRate ?? 1}
            muted
            style={
              video.cropViewport
                ? {
                    position: "absolute",
                    top: 0,
                    left: -((430 * (height / 846) - width) / 2),
                    width: 860 * (height / 846),
                    height: 1864 * (height / 846),
                    maxWidth: "none",
                  }
                : { width: "100%", height: "100%", objectFit: "cover", position: "absolute" }
            }
          />
        ) : null}
        {/* 玻璃高光 */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(115deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 28%, rgba(255,255,255,0) 70%, rgba(255,255,255,0.08) 100%)",
            pointerEvents: "none",
          }}
        />
        {overlay}
      </div>
    </div>
  );
};
