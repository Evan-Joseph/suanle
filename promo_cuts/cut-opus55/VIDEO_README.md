# 《算了 · Suanle》品牌宣传片 —— Remotion 程序化视频工程

> 算一算，然后，算了。

- 规格：1920×1080 · 30FPS · 45 秒（1350 帧）· H.264 · 支持 `--scale=2` 导出 4K
- 配乐：《晓寺晨曦》`suanle_zen_bgm.mp3`（85.7 BPM），全片卡点严格对齐 `promo/AUDIO_BEATS.md`
- 素材：全部来自仓库 `promo/assets/`（已映射至 `public/promo/`），所有 UI 均为真实录屏与实机截图

## 一键导出

```bash
npm install
npm run build:video        # → out/suanle_brand_promo.mp4   (1080p)
npm run build:video:4k     # → out/suanle_brand_promo_4k.mp4 (2160p)
npm run studio             # Remotion Studio 逐帧预览 / 精修
# 或 ./scripts/render-video.sh [4k]
```

`npm run dev` / `npm run build` 生成的网页是**浏览器内实时预览播放器**（@remotion/player），与渲染使用同一份 `MainPromo` 合成。

## 七幕分镜

| 时码 | 幕 | 画面 | 声音卡点 |
| --- | --- | --- | --- |
| 00:00–06.8 | 壹 · 叩问 | 生宣纸上墨滴坠落、水墨晕散，深夜问号浮现 →「人这一生，为什么总想 算一算？」 | 01.17 水滴入墨 · 03.56 竹笛入场时标题浮现 |
| 06.3–11.8 | 贰 · 温茶 | 首页真实录屏悬浮手机、3D 透视、茶烟袅袅 →「只有一位老朋友，为你温好了一壶热茶。」 | 09.76 预备拍：手机轻轻浮起 |
| 11.3–16.4 | 叁 · 起卦 | **11.47s 鼓点爆发**：闪白 + 通宝起卦录屏（加速）+ 六爻横线逐爻生成；13.36s 老友解盘录屏滑入 →「懂卦象，更懂你眼底的疲惫。」 | 铜钱落案 ×2，按拍脉冲（每拍 21 帧） |
| 15.9–20.8 | 肆 · 浪潮 | 泥金大运曲线如千里江山生长，0–80 岁刻度，八字命盘 + K 线实机图 →「起伏，本是生命的呼吸。」 | 16.20 第 5 小节强拍 |
| 20.2–33.2 | 伍 · 算了 | 纸篓录屏变速对齐：22.86s 揉纸（文字挤压 + 镜头震动），25.74s 抛物线，**27.62s 落篓**：闪白、颂钵声波涟漪、朱砂晕染、巨字「算了。」 | 揉纸 ASMR · 颂钵重击（BGM 自动避让） |
| 32.5–37.0 | 陆 · 印信 | 分享卡录屏 + 宣纸金句卡 3D 漂浮，33.5s 朱砂「算了」印重击落款 | 印落轻响 |
| 36.5–45.0 | 柒 · 终章 | Logo、Slogan、**官方网址 https://www.suanle.cc/**、**官方二维码**，悠然淡出至生宣白 | 颂钵余韵 + 配乐淡出 |

## 工程结构

```
src/video/
  index.ts            registerRoot 入口
  Root.tsx            <Composition id="MainPromo">
  MainPromo.tsx       场景编排 + 音轨/拟音卡点
  theme.ts            色板、字体、BEAT 卡点表、SCENES 区间
  FontLoader.tsx      思源宋体子集预加载（delayRender），离线回退 Songti SC
  glyphs.ts           全片字形表（自动生成）
  components/         PaperBackground · InkText · Seal · Phone · InkBloom · Steam
  scenes/             ActOne（叩问/温茶/起卦）· ActTwo（浪潮/算了）· ActThree（印信/终章）
```

### 关于录屏的视口裁切

`01/02/03/05` 四段录屏在 860×1864 画布中，真实 App 画面只占左上角约 430×846 区域，其余部分是灰色填充。
`<Phone video={{ cropViewport: true }} />` 会按高度精准铺满并居中裁切，画面里只露出真实界面。`04` 是全幅画面，按原样使用。
