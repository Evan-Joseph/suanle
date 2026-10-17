# 《算了 · Suanle》品牌官方宣传片工程资产库 (Brand Promo Assets & Toolkit)

本项目为《算了 · Suanle》（官网：`https://www.suanle.cc/`）品牌宣传片与 AI 视频导演（Opus 5.5 / Remotion）准备的完整资产库。

---

## 📁 目录结构 (Directory Structure)

```text
promo/
├── OPUS_PROMO_PROMPT.md       # 核心交付物：为 Opus 5.5 定制的终极大导演提示词
├── STORYBOARD.md              # 电影级五幕分镜视听脚本（运镜、景别、声效、旁白）
├── AUDIO_BEATS.md             # 毫秒与帧级别精确卡点音频时码表 (EDL & Stems)
├── README.md                  # 本说明文档
└── assets/                    # 高清生产级素材集合
    ├── video/                 # 1080P Retina 真机实录 60FPS MP4 视频
    │   ├── 01_home_navigation.mp4        # 首页八字/六爻导航与每日卦象实录
    │   ├── 02_chat_consultation.mp4      # 对话解盘、温茶对坐实录
    │   ├── 03_letgo_paper_crumple.mp4    # 真实书写、揉皱纸团、投掷入篓实录
    │   └── 04_share_card_with_qr.mp4     # 带官方二维码的分享卡推拉运镜实录
    ├── audio/                 # 纯音乐母带与拟音无损音效
    │   ├── bgm_suanle_zen.mp3            # 50s 禅意母带（古琴阳关三叠 + 38s 颂钵）
    │   ├── guqin_yangguan.mp3            # 5:50 古琴完整母带
    │   ├── singing_bowl_strike.mp3       # 西藏颂钵清脆敲击与泛音
    │   ├── singing_bowl.mp3              # 54s 颂钵悠远余鸣
    │   ├── coin_clatter.mp3              # 青铜钱币木桌翻滚碰撞声
    │   ├── water_drop.mp3                # 清冽水滴声
    │   └── paper_crumple.mp3             # 真实纸张剧烈揉皱 ASMR
    ├── suanle_qrcode.svg      # 官方平台矢量二维码（指向 https://www.suanle.cc/）
    ├── suanle_qrcode.png      # 官方平台 1024×1024 高精度二维码
    ├── logo.svg / logo.png    # 品牌矢量标识（坤卦双关与微笑圆弧）
    ├── card_aphorism.png      # 带有平台二维码的 1080P 经典箴言卡
    ├── card_dialogue.png      # 带有平台二维码的 1080P 对话解盘卡
    ├── card_letgo.png         # 带有平台二维码的 1080P 算了信笺卡
    ├── card_annual.png        # 带有平台二维码的 1080P 流年运势卡
    └── ui_*.png               # 860×1864 实机界面高清切图
```

> **注意**：所有素材已同步镜像至 `public/promo/`，在 Remotion 中可以直接通过 `staticFile("promo/<subpath>")` 无缝调用。

---

## 🚀 本地渲染命令 (Local Rendering)

若由 Opus 5.5 生成 Remotion 代码后在本地渲染：

```bash
# 1. 确保安装 Remotion 依赖
npm install remotion @remotion/shapes @remotion/noise

# 2. 导出 1080P 60FPS 生产级品牌宣传片
npx remotion render MainPromo out/suanle_brand_promo.mp4 --gl=angle --concurrency=4
```
