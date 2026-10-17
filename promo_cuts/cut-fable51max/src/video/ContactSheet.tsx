import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile, useVideoConfig } from "remotion";

/**
 * 导演工具：素材分镜检查表 —— 将一条录屏按时间等分抽帧平铺，用于精确对位卡点。
 * 渲染：npx remotion still src/video/index.ts ContactSheet out/sheet.png --props='{"src":"promo/video/03_letgo_paper_crumple.mp4","durationSec":16.5}'
 */
export type ContactSheetProps = {
  src: string;
  durationSec: number;
  count: number;
  startSec: number;
};

export const ContactSheet: React.FC<ContactSheetProps> = ({ src, durationSec, count, startSec }) => {
  const { fps, width } = useVideoConfig();
  const cols = Math.ceil(count / 2);
  const cellW = Math.floor(width / cols);
  const thumbW = cellW - 10;
  const thumbH = Math.round(thumbW / (860 / 1864));
  return (
    <AbsoluteFill style={{ background: "#111", display: "flex", flexDirection: "row", flexWrap: "wrap", alignContent: "flex-start" }}>
      {Array.from({ length: count }).map((_, i) => {
        const time = startSec + ((durationSec - startSec) * i) / (count - 1);
        return (
          <div key={i} style={{ width: cellW, padding: 5, boxSizing: "border-box" }}>
            <div style={{ width: thumbW, height: thumbH, overflow: "hidden", background: "#000" }}>
              <OffthreadVideo
                src={staticFile(src)}
                startFrom={Math.round(time * fps)}
                muted
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div style={{ color: "#0f0", fontSize: 22, fontFamily: "monospace", marginTop: 2 }}>{time.toFixed(2)}s</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
