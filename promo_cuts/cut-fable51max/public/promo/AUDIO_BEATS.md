# 《算了 · Suanle》品牌宣传片音频工程与鼓点节奏表 (Audio Cue Sheet & EDL)

本文档精准标注宣传片视听时间线、音轨层次（Stems）、毫秒时间戳与 30FPS / 60FPS 对应帧号，供 Remotion 程序化视频引擎与 AI 剪辑精准卡点。

---

## 一、 音频工程总览 (Acoustic Architecture)

| 参数项 | 仓库物理路径 | 设计意图与声音质感 |
| :--- | :--- | :--- |
| **主选配乐 (Master BGM)** | `promo/assets/audio/suanle_zen_bgm.mp3` | **《晓寺晨曦》（Temple at Dawn, CC0-1.0 公共领域）**：85.7 BPM。0~3.5s 晨钟破晓、3.6s 竹笛与温润吉他入场、11.47s 温暖低音鼓点爆发进入主歌。现代年轻人与中年人皆宜的东方 Lo-Fi 禅意氛围，纯音乐无电子噪点。 |
| **备选配乐 (Alt BGM)** | `promo/assets/audio/moon_through_bamboo.mp3` | **《竹间月影》（Moon Through Bamboo, CC0-1.0 公共领域）**：70.6 BPM。古筝古琴与深沉温润的 Lo-Fi 律动，适合极慢节奏的深层冥想风格。 |
| **预混母带 (Mixed Master)** | `promo/assets/audio/bgm_suanle_zen.mp3` | 49.3s：0~37s 传统古琴大师《阳关三叠》，38s 无缝切入西藏颂钵长鸣与余音回荡。 |
| **古典散板音轨** | `promo/assets/audio/guqin_liushui.mp3` / `guqin_yangguan.mp3` | 传统古琴名曲《流水》、《阳关三叠》，适合作为开篇或特定镜头的情绪垫乐。 |
| **声音质感 (Texture)** | 宣纸墨韵、青铜震颤、纸团皱褶、颂钵回荡 | 真实录音与拟音（Foley），杜绝粗糙 WebAudio 合成音。 |

---

## 二、 关键卡点时码与鼓点节拍表 (Beat Sheet & Cue Points)

以主选配乐 `promo/assets/audio/suanle_zen_bgm.mp3`（85.7 BPM，四四拍，每拍约 0.700 秒，每小节约 2.800 秒）为基准：

| 时码 (Timestamp) | 30FPS 帧号 | 60FPS 帧号 | 音乐小节 / 鼓点事件 | 建议画面事件与视听响应 | 推荐素材索引 |
| :---: | :---: | :---: | :--- | :--- | :--- |
| **00:00.00** | Frame 0 | Frame 0 | **前奏起**：万籁俱寂，晨钟悠远回响 | 极简生宣米白底色，呼吸式微距推入，深夜心结提问隐现 | `promo/assets/prod_mobile_home.png` |
| **00:01.17** | Frame 35 | Frame 70 | 晨钟谐波第二回响 | 墨滴落入纸面，水墨晕散扩散 | `promo/assets/audio/water_drop.mp3` |
| **00:03.56** | Frame 107 | Frame 214 | **竹笛轻抚入场**，氛围渐起 | 浮现品牌核心叩问，文字轻柔浮现 | 动态排版 Typography |
| **00:06.43** | Frame 193 | Frame 386 | 弦乐旋律上行预热 | 镜头过渡至老友对坐茶局，茶汽升腾 | `promo/assets/video/01_home_navigation.mp4` |
| **00:09.76** | Frame 293 | Frame 586 | 鼓点预备拍（Pickup Beat） | 手机界面微微浮起，呈现三枚乾隆通宝古钱 | `promo/assets/video/05_coins_divination.mp4` |
| **00:11.47** | Frame 344 | Frame 688 | 💥 **主鼓点爆发 (Beat Drop)**！Kick 强烈切入 | **全片视觉加速**：三枚铜钱翻转落案，六爻卦象与本卦变卦迅速凝结成型 | `promo/assets/audio/coin_clatter.mp3`<br>`promo/assets/video/05_coins_divination.mp4` |
| **00:13.36** | Frame 401 | Frame 802 | 第 4 小节强拍（Downbeat） | 深度解析流式生成：“懂卦象，更懂你眼底的疲惫” | `promo/assets/video/02_chat_consultation.mp4` |
| **00:16.20** | Frame 486 | Frame 972 | 第 5 小节强拍 | 命盘罗盘与大运走势图展开，江山如画 | `promo/assets/ui_bazi_chart.png`<br>`promo/assets/ui_kline.png` |
| **00:20.43** | Frame 613 | Frame 1226 | **情绪转折点**：鼓点渐沉，收束到内心深处 | 画面进入「算了」纸篓界面：“放不下昨晚的失眠与焦虑” | `promo/assets/ui_letgo_write.png`<br>`promo/assets/video/03_letgo_paper_crumple.mp4` |
| **00:22.86** | Frame 686 | Frame 1372 | 纸张揉皱动作触发 | 剧烈纸张纤维挤压，信笺凝聚为一颗立体纸团 | `promo/assets/audio/paper_crumple.mp3` |
| **00:25.74** | Frame 772 | Frame 1544 | 抛物线空中飞跃 | 镜头追踪纸团划过弧线，直奔竹编纸篓 | `promo/assets/video/03_letgo_paper_crumple.mp4` |
| **00:27.62** | Frame 829 | Frame 1658 | 💥 **最高潮：纸团落篓**！颂钵重击鸣响 | 纸团“咚”落入纸篓；全屏骤停，苍劲宋体浮现：**【揉掉它。算了。】** | `promo/assets/audio/singing_bowl_strike.mp3`<br>`promo/assets/ui_letgo_done.png` |
| **00:28.61 – 00:33.00** | Frame 858–990 | Frame 1716–1980 | 颂钵悠远余音回荡 5 秒，鼓点平缓收拢 | 释放内耗后的彻底空灵与释怀，呼吸留白 | 视觉静止与光影漫散 |
| **00:33.34** | Frame 1000 | Frame 2000 | 尾声主题复现，朱砂印章沉稳盖落 | 生成今日禅意卡片，朱砂印「算」重击定格，展现官网专属二维码 | `promo/assets/card_dialogue.png`<br>`promo/assets/video/04_share_card_with_qr.mp4` |
| **00:36.00** | Frame 1080 | Frame 2160 | **品牌 CTA 终章** | 浮现官方域名与扫码邀请：`https://www.suanle.cc/`，“算一算，然后，算了。” | `promo/assets/brand/logo.svg`<br>`promo/assets/brand/suanle_qrcode.png` |
| **00:40.00** | Frame 1200 | Frame 2400 | 全片悠然淡出 | 归于生宣纯净米白与绝对宁静 | 优雅淡出 |

---

## 三、 Remotion 音频组件配置示例

```tsx
import { Audio, Sequence, staticFile } from "remotion";

export const AudioTracks = () => {
  return (
    <>
      {/* 1. 主旋律 BGM: 晓寺晨曦 (85.7 BPM) */}
      <Audio
        src={staticFile("promo/audio/suanle_zen_bgm.mp3")}
        volume={(f) => (f < 30 ? f / 30 : f > 1150 ? (1200 - f) / 50 : 0.85)}
      />

      {/* 2. 0.0s 墨滴入纸 */}
      <Sequence from={0} durationInFrames={60}>
        <Audio src={staticFile("promo/audio/water_drop.mp3")} volume={0.7} />
      </Sequence>

      {/* 3. 11.47s (344帧 @ 30FPS) 铜钱落案 */}
      <Sequence from={344} durationInFrames={90}>
        <Audio src={staticFile("promo/audio/coin_clatter.mp3")} volume={0.8} />
      </Sequence>

      {/* 4. 22.86s (686帧 @ 30FPS) 揉纸声 */}
      <Sequence from={686} durationInFrames={90}>
        <Audio src={staticFile("promo/audio/paper_crumple.mp3")} volume={0.9} />
      </Sequence>

      {/* 5. 27.62s (829帧 @ 30FPS) 纸团入篓与西藏颂钵重击 */}
      <Sequence from={829} durationInFrames={180}>
        <Audio src={staticFile("promo/audio/singing_bowl_strike.mp3")} volume={1.0} />
      </Sequence>
    </>
  );
};
```
