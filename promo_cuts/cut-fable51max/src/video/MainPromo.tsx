import React from "react";
import { AbsoluteFill, Sequence, interpolate, useVideoConfig } from "remotion";
import { loadBrandFonts } from "./fonts";
import { AudioTracks } from "./AudioTracks";
import { Paper } from "./components/Paper";
import { TimeOffsetContext, clamp01, easeOutCubic, progressAt, useSeconds } from "./components/Reveal";
import { S0Opening } from "./scenes/S0Opening";
import { S1Friend, S1_START } from "./scenes/S1Friend";
import { S2Divination, S2_END, S2_START } from "./scenes/S2Divination";
import { S3LetGo, S3_END, S3_START } from "./scenes/S3LetGo";
import { S4Cards, S4_END, S4_START } from "./scenes/S4Cards";
import { S5Finale, S5_START } from "./scenes/S5Finale";
import { COLORS, CUES, DURATION_SECONDS, FONT_FAMILY } from "./theme";

loadBrandFonts();

/** 短促冲击：用于鼓点与落篓的镜头呼吸 */
const impulse = (T: number, at: number, dur: number) => {
  const k = (T - at) / dur;
  if (k < 0 || k > 1) return 0;
  return (1 - k) * (1 - k);
};

/** 场景包装：按秒挂载，并向子组件注入全片绝对时间 */
const Scene: React.FC<{ from: number; until: number; name: string; children: React.ReactNode }> = ({ from, until, name, children }) => {
  const { fps } = useVideoConfig();
  const fromFrame = Math.round(from * fps);
  return (
    <Sequence from={fromFrame} durationInFrames={Math.round(until * fps) - fromFrame} name={name}>
      <TimeOffsetContext.Provider value={fromFrame / fps}>{children}</TimeOffsetContext.Provider>
    </Sequence>
  );
};

/**
 * 《算了 · Suanle》品牌宣传片 · 总导演时间线（48s）
 *
 *  00.00  叩问    深夜心事散落 · 墨滴入纸 · 「有些事，想了一万遍」
 *  06.43  老友    首页巡礼录屏 · 「懂八字……但更懂人心」
 *  09.76  预备    铜钱手机自下升起
 *  11.47  鼓点    💥 铜钱落案 · 「算一算。」
 *  13.36  解盘    老友对话层叠入画 · 「懂卦象，更懂你眼底的疲惫」
 *  16.20  周期    大运 K 线 · 人生浪潮曲线 · 「低谷蓄力，高峰尽兴」
 *  20.43  转折    纸篓仪式 · 「算过了，还是放不下」
 *  24.72  揉纸    信笺成团（强拍 D4）
 *  27.62  高潮    💥 纸团落篓 · 颂钵 · 「算了。」朱砂印
 *  28.61  余音    「放下执念，便与自己温柔地和解」
 *  33.34  卡片    宣纸木刻卡 · 朱砂落款
 *  38.92  终章    品牌标识 · 「算一算，然后，算了。」· 官网二维码
 *  46.00  淡出
 */
export const MainPromo: React.FC = () => {
  const { t } = useSeconds();
  const T = t;

  // 纸的暖度：进入仪式时加深，释怀后回归清明
  const warmth = interpolate(T, [CUES.turn, CUES.turn + 1.6, CUES.climax, CUES.climax + 3.2], [0, 1, 1, 0.2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 全局镜头：极缓呼吸 + 鼓点 / 落篓冲击
  const breathe = 1 + 0.01 * Math.sin(T * 0.45);
  const kick = impulse(T, CUES.drop, 0.5) * 0.035;
  const hit = impulse(T, CUES.climax, 0.7) * 0.028;
  const shake = T >= CUES.climax ? 5 * Math.sin((T - CUES.climax) * 46) * Math.exp(-(T - CUES.climax) * 7) : 0;
  const scale = breathe + kick + hit;

  const markIn = easeOutCubic(progressAt(T, 1.2, 1.2));
  const markOut = clamp01(progressAt(T, CUES.cta - 0.4, 0.5));
  const fade = clamp01(progressAt(T, CUES.fadeOut, CUES.end - CUES.fadeOut));

  return (
    <AbsoluteFill style={{ fontFamily: FONT_FAMILY, color: COLORS.ink, backgroundColor: COLORS.paper }}>
      <Paper warmth={warmth}>
        <AbsoluteFill style={{ transform: `scale(${scale}) translateY(${shake}px)`, transformOrigin: "50% 50%" }}>
          <Scene from={0} until={S1_START + 0.9} name="00 叩问">
            <S0Opening />
          </Scene>
          <Scene from={S1_START} until={CUES.drop + 0.3} name="01 老友">
            <S1Friend />
          </Scene>
          <Scene from={S2_START} until={S2_END} name="02 起卦 · 解盘 · 周期">
            <S2Divination />
          </Scene>
          <Scene from={S3_START} until={S3_END} name="03 纸篓仪式 · 算了">
            <S3LetGo />
          </Scene>
          <Scene from={S4_START} until={S4_END} name="04 宣纸卡">
            <S4Cards />
          </Scene>
          <Scene from={S5_START} until={DURATION_SECONDS} name="05 终章">
            <S5Finale />
          </Scene>
        </AbsoluteFill>

        {/* 常驻角标 */}
        <div
          style={{
            position: "absolute",
            left: 72,
            top: 56,
            display: "flex",
            alignItems: "center",
            gap: 14,
            opacity: 0.7 * markIn * (1 - markOut),
            transform: `translateY(${(1 - markIn) * 8}px)`,
          }}
        >
          <div style={{ width: 10, height: 10, background: COLORS.vermilion, borderRadius: 1 }} />
          <div style={{ fontSize: 20, letterSpacing: "0.32em", color: COLORS.inkSoft, fontWeight: 400 }}>算了 · Suanle</div>
        </div>
      </Paper>

      {/* 片尾归于生宣 */}
      {fade > 0 && <AbsoluteFill style={{ backgroundColor: COLORS.paper, opacity: fade }} />}

      <AudioTracks />
    </AbsoluteFill>
  );
};
