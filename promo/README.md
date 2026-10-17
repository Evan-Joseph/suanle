# 《算了 · Suanle》宣传片素材仓库与工程指南

本目录包含为《算了 · Suanle》高规格品牌宣传片准备的高清视听素材、镜头脚本及自动化生成工具链。

---

## 📁 核心资产索引 (Assets Inventory)

所有素材均已保存在仓库的 `assets/promo/` 及 `public/promo/` 中，可直接在 Remotion 或 Web 前端中通过 `staticFile("promo/...")` 或相对路径无损引用：

| 文件名 | 尺寸 / 格式 | 用途与分镜对应 |
| :--- | :--- | :--- |
| `logo.svg` / `logo.png` | 纯矢量 / 1024x1024 | 品牌印章、片尾 End Card 核心 Logo |
| `prod_mobile_home.png` | 430 × 932 高清无损 | 第一幕/第二幕手机桌面端主界面展示 |
| `ui_chat_view.png` | 860 × 1864 视网膜级 | 第二幕：老友茶局、三枚铜钱占卦与温热点拨对话 |
| `ui_bazi_chart.png` | 860 × 1864 视网膜级 | 第二幕：八字排盘与紫微斗数罗盘排盘界面 |
| `ui_kline.png` | 860 × 1864 视网膜级 | 第三幕：人生大运 K 线图、十二流月涨落浪潮图谱 |
| `ui_letgo_write.png` | 860 × 1864 视网膜级 | 第四幕：信笺书写放不下的心事（“写下来，揉掉它”） |
| `ui_letgo_ball.png` | 860 × 1864 视网膜级 | 第四幕：手势拖拽瞄准、纸团与竹编纸篓物理交互 |
| `ui_letgo_done.png` | 860 × 1864 视网膜级 | 第四幕：纸团入篓、“算了”释怀金句与今天算了计数 |
| `card_annual.png` | 1080 × 1234 高清卡片 | 大运年度宣纸长卡木版水印展示 |
| `card_dialogue.png` | 1080 × 1020 高清卡片 | 经典对话点拨长图卡片展示 |
| `card_letgo.png` | 1080 × 1020 高清卡片 | 纸篓释怀卡片展示 |
| `card_aphorism.png` | 1080 × 1020 高清卡片 | 极简单句箴言木刻卡片展示 |

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
