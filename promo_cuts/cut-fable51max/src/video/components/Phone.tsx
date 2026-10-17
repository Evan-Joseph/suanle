import React, { CSSProperties } from "react";
import { Img, OffthreadVideo, staticFile, useVideoConfig } from "remotion";

/**
 * 录屏素材说明：
 *  01 / 02 / 03 / 05 四条录屏的画布为 860×1864，但真实 App 界面位于左上角 430×845 区域
 *  （430~500px 为页面背景留白，500px 之外为录制器灰底，均经逐像素测量确认）。本组件自动裁切至真实内容区，
 *  04（分享卡）与全部 PNG 截图为完整 860×1864 画面。
 */
export const SOURCE_W = 860;
export const SOURCE_H = 1864;
export type ContentBox = { x: number; y: number; w: number; h: number };
export const RECORDING_CONTENT: ContentBox = { x: 0, y: 0, w: 430, h: 845 };
export const FULL_FRAME: ContentBox = { x: 0, y: 0, w: SOURCE_W, h: SOURCE_H };

/** 统一机身屏幕比例（与真实录屏内容区一致） */
export const PHONE_ASPECT = RECORDING_CONTENT.w / RECORDING_CONTENT.h;

export const phoneHeight = (width: number) => {
  const bezel = width * 0.026;
  return width / PHONE_ASPECT + bezel * 2;
};

export const Phone: React.FC<{
  width: number;
  video?: string;
  image?: string;
  /** 视频从第几秒开始（相对素材） */
  startFromSec?: number;
  playbackRate?: number;
  /** 素材中真实内容区；默认按录屏内容区裁切 */
  contentBox?: ContentBox;
  rotateX?: number;
  rotateY?: number;
  rotateZ?: number;
  /** 阴影强度 0~1 */
  shadow?: number;
  style?: CSSProperties;
  children?: React.ReactNode;
}> = ({
  width,
  video,
  image,
  startFromSec = 0,
  playbackRate = 1,
  contentBox,
  rotateX = 0,
  rotateY = 0,
  rotateZ = 0,
  shadow = 1,
  style,
  children,
}) => {
  const { fps } = useVideoConfig();
  const bezel = width * 0.026;
  const outerRadius = width * 0.14;
  const innerRadius = outerRadius - bezel;
  const screenW = width;
  const screenH = width / PHONE_ASPECT;

  // 将素材的真实内容区精确映射到屏幕（cover，顶部对齐）
  const box = contentBox ?? (video ? RECORDING_CONTENT : FULL_FRAME);
  const s = Math.max(screenW / box.w, screenH / box.h);
  const mediaStyle: CSSProperties = {
    position: "absolute",
    width: SOURCE_W * s,
    height: SOURCE_H * s,
    left: -box.x * s + (screenW - box.w * s) / 2,
    top: -box.y * s,
    display: "block",
  };

  return (
    <div
      style={{
        width: screenW + bezel * 2,
        height: screenH + bezel * 2,
        perspective: 2200,
        ...style,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: outerRadius,
          background: "linear-gradient(160deg, #3a3835 0%, #1e1d1b 45%, #2a2826 100%)",
          padding: bezel,
          boxSizing: "border-box",
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`,
          transformStyle: "preserve-3d",
          boxShadow: `0 ${40 * shadow}px ${90 * shadow}px rgba(43,43,43,${0.22 * shadow}), 0 ${8 * shadow}px ${20 * shadow}px rgba(43,43,43,${0.12 * shadow}), inset 0 0 0 1px rgba(255,255,255,0.08)`,
          position: "relative",
        }}
      >
        <div
          style={{
            width: screenW,
            height: screenH,
            borderRadius: innerRadius,
            overflow: "hidden",
            background: "#FAF9F6",
            position: "relative",
          }}
        >
          {video ? (
            <OffthreadVideo
              src={staticFile(video)}
              trimBefore={Math.round(startFromSec * fps)}
              playbackRate={playbackRate}
              muted
              style={mediaStyle}
            />
          ) : image ? (
            <Img src={staticFile(image)} style={mediaStyle} />
          ) : null}
          {children}
          {/* 屏幕微反光 */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: innerRadius,
              background:
                "linear-gradient(115deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 35%, rgba(255,255,255,0) 70%, rgba(255,255,255,0.05) 100%)",
              pointerEvents: "none",
            }}
          />
        </div>
      </div>
    </div>
  );
};
