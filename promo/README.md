# 《算了 · Suanle》宣传片素材仓库 (Promo Assets Manifest)

本项目为《算了 · Suanle》（官网：`https://www.suanle.cc/`）品牌宣传片的全量视听与品牌素材清单。所有文件均已提交至 GitHub 仓库，并同步映射至生产环境 CDN，方便代码渲染引擎（如 Remotion）直接通过相对路径或网络 URL 引用。

---

## 1. 真实视网膜录屏视频 (Real High-Res Video Footage)

所有视频均为在真实生产环境界面上无损录制（860 × 1864，25/60 FPS，H.264 编码，无黑边无裁剪），真实呈现产品交互：

| 文件路径 (相对仓库根目录) | 分辨率 | 时长 | 交互内容说明 |
| :--- | :---: | :---: | :--- |
| `promo/assets/video/01_home_navigation.mp4` | 860 × 1864 | 14.3s | **移动端首页巡礼**：宣纸茶馆质感、顶部今日运势、占卦探索及极简底部导航 |
| `promo/assets/video/02_chat_consultation.mp4` | 860 × 1864 | 10.8s | **老友对话问卜**：温茶解盘、思维链展开、卦象与白话心法流式生成 |
| `promo/assets/video/03_letgo_paper_crumple.mp4` | 860 × 1864 | 16.5s | **「算了」纸篓仪式**：写下心结信笺、点击“揉掉它”、物理挤压成团与抛物线入篓 |
| `promo/assets/video/04_share_card_with_qr.mp4` | 860 × 1864 | 8.0s | **禅意卡片生成与引流**：抽取卡片、朱砂印章盖落、动态渲染平台专属二维码 |
| `promo/assets/video/05_coins_divination.mp4` | 860 × 1864 | 20.8s | **六爻铜钱起卦**：乾隆通宝三枚古钱 3D 物理翻转、逐爻生成、本卦变卦深度解析 |

---

## 2. 高清界面与卡片素材 (High-Res UI & Share Cards)

| 文件路径 (相对仓库根目录) | 尺寸 | 说明 |
| :--- | :---: | :--- |
| `promo/assets/card_aphorism.png` | 1080 × 1080 | 极简箴言木刻卡，内嵌朱砂红「算」印章与官方访问二维码 |
| `promo/assets/card_dialogue.png` | 1080 × 1220 | 经典老友对话金句卡，内嵌朱砂红「算」印章与官方访问二维码 |
| `promo/assets/card_letgo.png` | 1080 × 1080 | 纸篓释怀信笺卡，内嵌朱砂红「算」印章与官方访问二维码 |
| `promo/assets/card_annual.png` | 1080 × 1220 | 大运年度长卡，宣纸底色与官方访问二维码 |
| `promo/assets/ui_coins_hexagram.png` | 860 × 1864 | 六爻成卦实机截图（本卦、变卦、动爻标注） |
| `promo/assets/ui_letgo_write.png` | 860 × 1864 | 纸篓心事信笺书写实机截图（“写下来，揉掉它”） |
| `promo/assets/ui_letgo_ball.png` | 860 × 1864 | 纸团在空中拖拽投掷物理交互实机截图 |
| `promo/assets/ui_letgo_done.png` | 860 × 1864 | 纸团入篓与“今天算了 X 件”释怀实机截图 |
| `promo/assets/ui_chat_view.png` | 860 × 1864 | 禅意对话与思维链展开实机截图 |
| `promo/assets/ui_bazi_chart.png` | 860 × 1864 | 八字四柱命盘实机截图 |
| `promo/assets/ui_kline.png` | 860 × 1864 | 人生大运 K 线图与流年运势起伏实机截图 |
| `promo/assets/prod_mobile_home.png` | 860 × 1864 | 移动端首页全貌高清实机截图 |

---

## 3. 品牌矢量与专属二维码 (Brand & QR Assets)

| 文件路径 (相对仓库根目录) | 格式 | 说明 |
| :--- | :---: | :--- |
| `promo/assets/brand/logo.svg` / `logo.png` | SVG / PNG | 官方矢量标识（坤卦六断爻与微笑圆弧双关，纯黑/朱砂温润质感） |
| `promo/assets/brand/suanle_qrcode.svg` / `suanle_qrcode.png` | SVG / PNG | **官方引流二维码**：直通 `https://www.suanle.cc/`，中心嵌入朱砂红「算」字方印 |

---

## 4. 纯自然声学生态音效 (Pure Acoustic Audio Stems)

全部音效为 CC0-1.0 公共领域或实录拟音（Foley），无版权争议，适合商业宣发：

| 文件路径 (相对仓库根目录) | 格式 | BPM / 时长 | 说明 |
| :--- | :---: | :---: | :--- |
| `promo/assets/audio/suanle_zen_bgm.mp3` | MP3 | 85.7 BPM / 114s | **主旋律《晓寺晨曦》**（CC0-1.0）：晨钟破晓、竹笛悠扬、11.47s 温暖 Lo-Fi 鼓点切入，现代东方禅意 |
| `promo/assets/audio/moon_through_bamboo.mp3` | MP3 | 70.6 BPM / 171s | **备选主乐《竹间月影》**（CC0-1.0）：古筝古琴与深沉温润的 Lo-Fi 律动 |
| `promo/assets/audio/bgm_suanle_zen.mp3` | MP3 | 49.3s | 49.3s 预混母带纯音乐 BGM（前 37s 古琴《阳关三叠》，38s 无缝切入空灵西藏颂钵） |
| `promo/assets/audio/guqin_liushui.mp3` | MP3 | 散板 / 493s | 传统古琴大师演奏版《流水》 |
| `promo/assets/audio/guqin_yangguan.mp3` | MP3 | 散板 / 532s | 传统古琴大师演奏版《阳关三叠》 |
| `promo/assets/audio/coin_clatter.mp3` | MP3 | 1.8s | 三枚青铜钱在木桌翻滚碰撞的清脆回响 |
| `promo/assets/audio/paper_crumple.mp3` | MP3 | 2.5s | 真实纸张剧烈揉皱解压 ASMR |
| `promo/assets/audio/singing_bowl_strike.mp3` | MP3 | 6.5s | 空灵沉浑西藏颂钵（Singing Bowl）重锤敲击与悠远谐波余音 |
| `promo/assets/audio/singing_bowl.mp3` | MP3 | 12.0s | 颂钵低频持续共振长音 |
| `promo/assets/audio/water_drop.mp3` | MP3 | 1.2s | 清冽水滴入墨声 |
