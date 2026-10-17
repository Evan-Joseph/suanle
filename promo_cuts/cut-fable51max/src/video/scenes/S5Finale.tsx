import React from "react";
import { AbsoluteFill, Img, spring, staticFile, useVideoConfig } from "remotion";
import { Logo } from "../components/Logo";
import { Block, Chars, InkLine, useSeconds } from "../components/Reveal";
import { ASSETS, COLORS, CUES, SITE_URL } from "../theme";

export const S5_START = CUES.cta; // 38.92

export const S5Finale: React.FC = () => {
  const { t, fps } = useSeconds();
  const { fps: vfps } = useVideoConfig();
  const T = t;

  const qrFrom = S5_START + 3.2;
  const qrIn = T >= qrFrom
    ? spring({ frame: (T - qrFrom) * fps, fps: vfps, config: { damping: 16, stiffness: 90, mass: 0.9 } })
    : 0;

  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      {/* 品牌标识：坤卦六断 → 微笑弧线 */}
      <div style={{ position: "absolute", top: 196 }}>
        <Logo size={232} from={S5_START + 0.1} smileColor={COLORS.ink} />
      </div>

      {/* 品牌名 */}
      <div style={{ position: "absolute", top: 452, fontSize: 36, fontWeight: 400, color: COLORS.inkSoft, letterSpacing: "0.42em", paddingLeft: "0.42em" }}>
        <Chars text="算了 · Suanle" from={S5_START + 1.3} stagger={0.05} duration={0.9} />
      </div>

      {/* Slogan —— 逗号即呼吸 */}
      <div style={{ position: "absolute", top: 528, fontSize: 84, fontWeight: 300, color: COLORS.ink, letterSpacing: "0.1em", whiteSpace: "nowrap" }}>
        <Chars text="算一算，" from={S5_START + 1.95} stagger={0.1} duration={0.8} />
        <Chars text="然后，" from={S5_START + 2.85} stagger={0.1} duration={0.8} />
        <Chars text="算了" from={S5_START + 3.6} stagger={0.12} duration={0.8} charStyle={{ fontWeight: 400 }} />
        <Chars text="。" from={S5_START + 3.95} duration={0.6} charStyle={{ color: COLORS.vermilion, fontWeight: 400 }} />
      </div>

      <div style={{ position: "absolute", top: 696, display: "flex", justifyContent: "center", width: 200 }}>
        <InkLine from={S5_START + 4.1} width={120} color={COLORS.gold} thickness={1.2} />
      </div>

      {/* CTA：官方二维码 + 官网 */}
      <Block from={qrFrom} duration={1} rise={20} style={{ position: "absolute", top: 742 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
          <div
            style={{
              width: 204,
              height: 204,
              padding: 12,
              boxSizing: "border-box",
              background: "#fff",
              border: `1px solid ${COLORS.mist}`,
              borderRadius: 8,
              boxShadow: "0 14px 36px rgba(43,43,43,0.10)",
              transform: `scale(${0.9 + 0.1 * qrIn})`,
            }}
          >
            <Img src={staticFile(ASSETS.brand.qr)} style={{ width: "100%", height: "100%", display: "block" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 30, fontWeight: 400, color: COLORS.ink, letterSpacing: "0.16em" }}>
              扫码，和老朋友聊聊。
            </div>
            <div style={{ fontSize: 46, fontWeight: 700, color: COLORS.ink, letterSpacing: "0.02em", fontFamily: '"Suanle Serif", "Songti SC", Georgia, serif' }}>
              {SITE_URL}
            </div>
            <div style={{ fontSize: 21, fontWeight: 300, color: COLORS.inkFaint, letterSpacing: "0.18em" }}>
              或在浏览器输入 suanle.cc
            </div>
          </div>
        </div>
      </Block>
    </AbsoluteFill>
  );
};
