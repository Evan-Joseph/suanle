<div align="center">

  <img src="./assets/logo.jpg" alt="算了 · Suanle Logo" width="140" height="140" style="border-radius: 24px; box-shadow: 0 8px 30px rgba(0,0,0,0.12);" />

  # 算了 · Suanle

  **算一算，然后，算了。**

  *一款基于 Next.js 15 与大语言模型的沉浸式 AI 互动决策与解压 Web 应用*  
  *An interactive decision-making and mindfulness web app powered by Next.js and modern LLMs.*

  <p>
    <a href="./LICENSE"><img src="https://img.shields.io/badge/License-Source--Available-blue.svg?style=flat-square" alt="License" /></a>
    <a href="https://github.com/Evan-Joseph/suanle"><img src="https://img.shields.io/badge/GitHub-Repo-black.svg?style=flat-square&logo=github" alt="GitHub" /></a>
    <img src="https://img.shields.io/badge/Next.js-15.x-black.svg?style=flat-square&logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/React-19.x-61DAFB.svg?style=flat-square&logo=react" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-5.x-blue.svg?style=flat-square&logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/TailwindCSS-3.x-38B2AC.svg?style=flat-square&logo=tailwind-css" alt="Tailwind CSS" />
  </p>

  <p>
    <a href="#-产品特性">产品特性</a> •
    <a href="#-技术架构">技术架构</a> •
    <a href="#-快速上手">快速上手</a> •
    <a href="#-工程演进与探索">版本演进</a> •
    <a href="#-知识产权保护声明">许可说明</a>
  </p>

</div>

---

## 💡 产品概述 (Overview)

「算了 · Suanle」是一款将**传统民俗数理文化**与**现代大语言模型技术**相结合的实验性 Web 应用。针对年轻人在日常选择与高压节奏中的“决策瘫痪”与复盘焦虑，产品通过启发式会话与拟物交互，提供温和的心境梳理、事件决策推演与情绪释怀引导。

* **核心定位**：拒绝玄学绑架与焦虑贩卖，以理性、温和的人文对话与现代软件交互，帮助用户看清选择、放下执念。
* **设计语言**：融合东方水墨意境与现代极简组件，支持真太阳时天文校准与 432Hz 舒压音频实时合成。

---

## ✨ 核心特性 (Key Features)

### 1. 渐进式对话建档 (Conversational Profiling)
* 摒弃机械繁琐的传统生辰多选表单；
* 基于流式会话自然捕捉背景上下文，在轻量交互中建立安全隔离的用户临时画像。

### 2. 启发式双轨叙事与推演 (Interactive Decision Assistance)
* 结合场景分析、多视角决策推演与释怀建议，输出结构化复盘卡片；
* 探索多智能体协作与不同角色视角（如通透温和的酒馆叙事模型）。

### 3. 多模态拟物交互与声学合成 (Sensory Micro-interactions)
* **Web Audio 实时声学**：基于 Web Audio API 动态合成 432Hz 铜钵拍频与白噪音背景音，打造沉浸式静心氛围；
* **物理动力学动效**：结合 Matter.js 2D 物理引擎实现拟物投掷与释怀抽屉微交互。

### 4. 离线即用与多供应商适配 (Offline-Ready & Model Agnostic)
* 内置全链路离线 Mock 推演引擎，无需配置任何远程 API Key 即可启动完整体验；
* 开放适配兼容 OpenAI、Gemini 及主流开源模型的结构化输出协议。

---

## 🛠️ 技术架构 (Tech Stack)

| 层次 | 核心技术 | 说明 |
|---|---|---|
| **前端基座** | Next.js 15 (App Router) + React 19 | 采用 Turbopack 毫秒级热更新与服务端流式渲染 (RSC) |
| **编程语言** | TypeScript 5.x | 端到端类型安全，严密的数据流状态约束 |
| **样式与交互** | Tailwind CSS + Framer Motion | 现代化响应式布局，平滑的视觉转场动效 |
| **声学与物理** | Web Audio API + Matter.js | 客户端离线声频合成与 2D 物理抛物线计算 |
| **持久层与 ORM** | Drizzle ORM + SQLite / PostgreSQL | 轻量级本地缓存与自托管数据库适配 |

---

## 📁 目录组织 (Repository Layout)

```text
suanle/
├── src/
│   ├── app/           # App Router 路由、流式 API 与服务页面
│   ├── components/    # 核心对话、仪表盘、声学控制与表单组件
│   ├── db/            # Drizzle ORM Schema 与持久层连接
│   └── lib/           # 历法算法、真太阳时计算、Web Audio 拟物声学
├── assets/            # 品牌设计资产与徽标
├── prompts/           # 提示词架构设计与系统指令
└── works/             # 多模型多技术栈原型演进成果展厅
```

---

## 🚀 快速上手 (Quick Start)

### 1. 克隆仓库与安装依赖

```bash
# 克隆仓库
git clone https://github.com/Evan-Joseph/suanle.git
cd suanle

# 推荐使用 pnpm 安装依赖
pnpm install
```

### 2. 环境配置（可选）

项目内置完整的离线交互 Mock 逻辑，**无需配置任何 Key 即可直接运行体验**。如需接入线上模型：

```bash
cp .env.example .env.local
# 在 .env.local 中填入您的模型端点与凭证：
# LLM_BASE_URL=https://api.your-provider.com/v1
# LLM_API_KEY=sk-...
```

### 3. 本地启动

```bash
pnpm dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000) 即可使用。

---

## 🔒 知识产权与许可协议 (License)

本项目遵循专有的 **《算了 · Suanle 源码可用与商业保护协议》(SSACPL)**：
* **个人与技术研究**：允许个人开发者出于学术研究、技术交流与本地非商业目的克隆、学习与调试代码；
* **商业保护限制**：严禁未经书面许可将本项目源码、提示词（Prompt）与设计资产用于商业 SaaS 运营、打包转售或收费套壳服务；
* 完整条款详见仓库根目录 [LICENSE](./LICENSE)。
