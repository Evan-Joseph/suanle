<div align="center">

  <img src="./assets/logo.jpg" alt="算了 · Suanle Logo" width="160" height="160" style="border-radius: 28px; box-shadow: 0 8px 30px rgba(0,0,0,0.12);" />

  # 算了 · Suanle

  **算一算，然后，算了。**

  *一款面向现代高压心智的沉浸式“反内耗”AI 命运推演与心智解压产品*

  <p>
    <a href="./LICENSE"><img src="https://img.shields.io/badge/License-Source--Available-blue.svg?style=flat-square" alt="License" /></a>
    <a href="https://github.com/Evan-Joseph/suanle"><img src="https://img.shields.io/badge/GitHub-Repo-black.svg?style=flat-square&logo=github" alt="GitHub" /></a>
    <img src="https://img.shields.io/badge/Next.js-15.x-black.svg?style=flat-square&logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/TypeScript-5.x-blue.svg?style=flat-square&logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/TailwindCSS-3.x-38B2AC.svg?style=flat-square&logo=tailwind-css" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/LLM-Gemini_4_Argon-orange.svg?style=flat-square" alt="LLM Engine" />
  </p>

  <p>
    <a href="#-品牌内核与哲学">品牌哲学</a> •
    <a href="#-核心产品特性">核心特性</a> •
    <a href="#-作品展厅-works-gallery">作品展厅</a> •
    <a href="#-目录组织规范">目录组织</a> •
    <a href="#-快速开始">快速开始</a> •
    <a href="#-知识产权与协议">知识产权保护</a>
  </p>

</div>

---

## 💡 品牌内核与哲学 (Brand Philosophy)

> **“算”是审视未知的勇气，“算了”是拥抱当下的从容。**

当代年轻人长期置身于周期波动与内卷竞争中，面对未知的焦虑与决策瘫痪，“AI 算命”早已不再是封建迷信，而演变为一种**刚需的自我探索与情绪疗愈容器**。

* **绝妙双关**：“算”取推演占算、明察时运之意；“算了”则是当代人消解执念、拒绝内耗的最高心法。
* **心智画面**：一个人面对杂乱纷扰的现实，耸了耸肩会心一笑，把揉成一团的草稿纸随手丢进纸篓。
* **符号图腾**：
  * **上部**：周易【坤卦】（☷ 六断爻），象征大地般厚德载物、柔顺承载与适度退让（“算了”）。在现代视觉上，六断爻自然化为一双笑意盈盈的**眯眯笑眼**；
  * **下部**：一道极简而温暖的上扬弧线，构成**开怀微笑**；
  * 古老东方智慧与现代极简 Emoji 在此完美交融。

---

## ✨ 核心产品特性 (Key Features)

### 1. 聊天优先与温和渐进建档 (Chat-First Onboarding)
告别生硬、繁琐的生辰输入表单。用户初次进入，即置身于一个温和亲切的会话界面。AI 像一位熟络老友，在自然对话中顺势了解你的心境与生辰线索，无感沉淀用户画像。

### 2. 有人味的多智能体酒馆陪伴 (The Oracle Tavern)
彻底打破机械生硬的“AI 客服腔”，融入酒馆双轨叙事（`*动作与微表情描写*` + `"通透温润的台词"`）。在推演事实的同时，总能给出一句让你会心一笑、彻底释怀的“算了”箴言。

### 3. 专业术语的生活化重构 (Professional Divination)
兼具东方术数（子平八字、紫微斗数、周易六爻铜钱摇卦）与西方神秘学（占星、韦特塔罗）的严谨推演逻辑，并将其转化为接地气、抚慰人心的人文指引。

### 4. 商业闭环与“生活拟物化”算力打赏 (Monetization & Metaphor)
* **Token 的生活化度量**：将消耗的算力 Token 动态类比为具象日常（如：*“本次推演消耗 16,800 Token ≈ 1.5 杯热拿铁 / 2 炷清心香 / 3 个刚出锅的肉包子”*）；
* **无痛赞赏**：既可支持常规深度解锁，也提供极具亲和力的“随喜功德/请喝咖啡”打赏弹窗，实现可持续的商业自运转。

---

## 🎨 作品展厅 (Works Gallery)

我们在探索阶段基于相同的研发 Master Prompt，由不同前沿大模型完成了 6 项精选前端工程作品。**我们原则上不评判各版本的优劣与好坏**，各版本均从不同视角诠释了“算了”的交互与架构可能（编号仅代表时间顺序）：

| 序号与工程目录 | 架构模式 | 探索特色与核心模块 | 状态 |
| :---: | :--- | :--- | :---: |
| **[1-suanle-kimik3](./works/1-suanle-kimik3)** | App Router 多路由 | 规划 `/reading` 测算、`/tavern` 宿命酒馆与 `/me` 个人中心，配有五行图谱与海报卡片 | ✅ 源码收录 |
| **[2-suanle-opus55low](./works/2-suanle-opus55low)** | 极简响应式 SPA | 极简抽屉式导航（Drawer），专注超低延迟对话流与轻量化账单/订阅交互 | ✅ 源码收录 |
| **[3-suanle-opus55high](./works/3-suanle-opus55high)** | 矩阵式深度多路由 | 深度拆解 `/tools` 独立工具库（八字、六爻、塔罗、K线），含专属 `/letgo` 释怀仪式页面与管理后台 | ✅ 源码收录 |
| **[4-suanle-kimik3](./works/4-suanle-kimik3)** | 状态机多视图驱动 | 采用 Zustand 状态机流转，具有独特的 `/api/metaphor` Token 生活化隐喻算法与温暖 Onboarding | ✅ 源码收录 |
| **[5-suanle-opus55](./works/5-suanle-opus55)** | 模块化复合架构 | 结构清晰的 `ChatView`、`ExploreView` 与 `MeView`，配套完善的算力用量追踪与打赏体系 | ✅ 源码收录 |
| **[6-suanle-opus55high](./works/6-suanle-opus55high)** | 抽屉式组件化体系 | 极度细腻的交互体系：包含独立的 `LetGoView` 释怀仪轨、`LampSheet` 点灯、`Divine` 工具矩阵与万年历集成 | ✅ 源码收录 |

> 详细设计与代码结构拆解，请参阅 [works/README.md](./works/README.md)。

---

## 📁 目录组织规范 (Repository Structure)

```
.
├── LICENSE                                       # 源码可用与商业资产保护协议 (SSACPL)
├── README.md                                     # [本文件] 官方全景介绍与技术规范
├── assets/                                       # 品牌视觉资产
│   ├── logo.jpg                                  # 官方高清 Logo 位图
│   ├── logo.png                                  # 透明背景 PNG
│   └── logo.svg                                  # 纯矢量 SVG 图形
├── 00_品牌定位与视觉资产/                        # 品牌命名、双关哲学与视觉符号系统
├── 01_产品定位与心理学内核/                      # 认知重构、微小确定性、CBT与心理安全白皮书
├── 02_玄学理论与算法推演/                        # 八字、紫微、六爻、塔罗数理模型与数据契约
├── 03_交互仪式感与视觉传达设计/                  # 赛博新中式色彩系统与交互摩擦感规范
├── 04_酒馆多智能体对话体系/                      # 灵霄客栈世界观、大师角色卡与双轨叙事
├── 05_产品功能地图与前端状态流转/                # 状态机流转、用户体验旅程与离线Mock契约
├── prompts/                                      # 提示词资产库
│   ├── BRAND_NAMING_PROMPT.md                    # 品牌命名探索指令
│   └── FRONTEND_MASTER_PROMPT.md                 # 全端商业级产品研发 Master Prompt
└── works/                                        # 6 项多版本精选前端工程作品集
    ├── README.md                                 # 作品集架构总览与对比
    ├── 1-suanle-kimik3/
    ├── 2-suanle-opus55low/
    ├── 3-suanle-opus55high/
    ├── 4-suanle-kimik3/
    ├── 5-suanle-opus55/
    └── 6-suanle-opus55high/
```

---

## 🚀 快速开始 (Quick Start)

### 1. 运行根目录「终极融合生产版本」（推荐）

本项目根目录已完整集成了 6 项探索工程的精华（全功能酒馆双轨对话、DeepSeek 式思维链折叠、百岁人生 K 线与四柱原局双重视图、物理揉纸团释怀仪轨、生活化 Token 算力换算与随喜打赏）：

```bash
# 1. 克隆本仓库
git clone https://github.com/Evan-Joseph/suanle.git
cd suanle

# 2. 一键安装依赖
pnpm install # 或 npm install

# 3. 启动开发服务器 (内置默认大模型连接与全自洽内存降级，无需复杂配置即可开箱即用)
pnpm dev # 或 npm run dev
```

在本地浏览器打开 [http://localhost:3000](http://localhost:3000) 即可即时体验。

### 2. 独立运行任一历史探索作品
若需单独查看探索阶段的某一个历史实现版本（如 `works/6-suanle-opus55high`），可直接进入对应子目录：

```bash
cd works/6-suanle-opus55high
npm install && npm run dev
```

---

## 🔒 知识产权与商业保护声明 (License & IP)

本项目代码与设计资产遵循专有的 **《算了 · Suanle 源码可用与商业资产保护协议》(Suanle Source-Available and Commercial Protection License, SSACPL)**：

1. **允许个人研究与技术探讨**：个人开发者可出于学习、技术研究与本地调试目的自由克隆、查阅和运行代码；
2. **严禁未经授权的商业化掠夺**：
   * 严禁将本项目任何代码、页面、提示词（Prompt）用于商业 SaaS 部署、收费运营、商业转售或外包交付；
   * “**算了**”、“**Suanle**”、Slogan “**算一算，然后，算了。**”以及基于易经坤卦的图形 Logo 属于专有商标与设计专利，严禁任何形式的盗用、仿冒与侵权；
   * 严禁将 `prompts/` 目录下的系统提示词与智能体角色卡直接导出用于第三方商业模型商店或套壳收费。
3. **商业授权途径**：如需将本项目用于商业运营或企业集成，请联系项目维护团队获取正式书面授权。完整条款详见 [LICENSE](./LICENSE)。

---

<div align="center">
  <sub>算一算，然后，算了。© 2026 Suanle Team. All rights reserved.</sub>
</div>
