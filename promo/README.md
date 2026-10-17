# 《算了 · Suanle》宣传片素材仓库与工程指南

本目录包含为《算了 · Suanle》高规格品牌宣传片准备的高清视听素材、镜头脚本、音频工程规范及自动化生成工具链。

---

## 📁 核心资产索引 (Assets Inventory)

所有素材均已保存在仓库的 `promo/assets/` 及 `public/promo/` 中，可直接在 Remotion、Web 前端或 Python MoviePy 中无损引用：

### 1. 视网膜级实景视频录屏 (Real 60FPS Video Footage)
位于 `promo/assets/video/`：
- `01_home_navigation.mp4`：860×1864 真实移动端首页交互与老友茶馆沉浸式漫游。
- `02_chat_consultation.mp4`：860×1864 真实老友茶局对话问卜、铜钱翻转落案结卦。
- `03_letgo_paper_crumple.mp4`：860×1864 真实信笺书写心事、剧烈揉皱成团与物理投掷落篓。
- `04_share_card_with_qr.mp4`：860×1864 真实生成带官方二维码与红印章的分享卡片并展示长图。

### 2. 高清矢量与界面快照 (High-Res UI & Visual Assets)
位于 `promo/assets/`：
- `logo.svg` / `logo.png`：纯矢量 / 1024×1024 品牌标识（坤卦六断爻与微笑圆弧双关）。
- `suanle_qrcode.svg` / `suanle_qrcode.png`：平台官方二维码（直达 `https://www.suanle.cc/`，内嵌朱砂红「算」印章）。
- `prod_mobile_home.png`：430×932 移动端主界面全貌。
- `ui_chat_view.png`：860×1864 聊天问卜、三枚铜钱翻落、老友对话解盘真实 UI。
- `ui_bazi_chart.png`：860×1864 八字排盘与紫微斗数罗盘排盘真实 UI。
- `ui_kline.png`：860×1864 人生大运 K 线图、十二流月运势浪潮起伏交互图谱。
- `ui_letgo_write.png`：860×1864 纸篓心事信笺书写（“写下来，揉掉它”）。
- `ui_letgo_ball.png`：860×1864 揉碎纸团在空中拖拽瞄准、竹编纸篓物理交互界面。
- `ui_letgo_done.png`：860×1864 纸团入篓、金句回响与“今天算了 X 件”释怀界面。

### 3. 木版水印宣纸分享卡 (Retina Share Cards with Platform QR)
- `card_annual.png`：1080×1220 大运年度长卡，宣纸底色与官方二维码。
- `card_dialogue.png`：1080×1220 经典老友对话问心卡，含官方二维码。
- `card_letgo.png`：1080×1080 纸篓释怀信笺卡，含官方二维码。
- `card_aphorism.png`：1080×1080 极简单句箴言木刻卡，含官方二维码。

### 4. 纯自然声学音轨 (Acoustic Audio Stems & SFX)
位于 `promo/assets/audio/`：
- `bgm_suanle_zen.mp3`：49.3s 预混母带纯音乐 BGM（前 37 秒为清幽传统古琴《阳关三叠》，38 秒无缝切入沉浑空灵的西藏颂钵长鸣）。
- `water_drop.mp3`：12.8s 清冽水滴入墨声。
- `coin_clatter.mp3`：2.3s 青铜钱币在木案翻滚碰撞清脆震颤声。
- `paper_crumple.mp3`：23.5s 真实纸张剧烈揉皱解压 ASMR。
- `singing_bowl_strike.mp3`：12.8s 西藏颂钵空灵敲击与 6 秒谐波回荡。
- `singing_bowl.mp3`：54.4s 颂钵持续谐波长音。
- `guqin_yangguan.mp3`：350s 完整古琴名曲《阳关三叠》母带。
- `guqin_liushui.mp3`：493s 完整古琴名曲《流水》母带。

---

## 🛠️ 推荐视频工程框架 (Remotion Framework)

本宣传片推荐使用 **Remotion**（基于 React + TypeScript + Spring 物理弹簧系统），实现真正的**代码驱动、帧级精确、无损渲染**。

### 1. 快速脚手架初始化
```bash
# 初始化空白视频工程
npx create-video --yes --blank suanle-promo-video
cd suanle-promo-video

# 安装 Remotion Agent Skills（为 AI Agent 注入精准视频 API）
npx remotion skills add

# 启动本地实时热重载预览调试
npm run dev
```

### 2. 本地无损极速导出 (Apple Silicon / NVENC 加速)
若沙盒环境计算资源有限，可直接将整套工程克隆至本地，一键执行渲染：
```bash
# 导出 1080P 60FPS 生产级 MP4 宣传片
npx remotion render MainPromo out/suanle_brand_promo.mp4 --gl=angle --concurrency=4
```
