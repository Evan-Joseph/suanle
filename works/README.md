# 《算了 · Suanle》多版本前端实现作品集 (Works Gallery)

> **设计与收录原则**：  
> 本目录收录了团队在产品探索阶段由不同前沿大模型根据研发 Master Prompt 所自主实现的 6 项精选前端工程作品。  
> 我们**原则上不评判各个版本的优劣与好坏**，每一套实现都是从不同视角对“算一算，然后，算了”这一品牌精神、交互流转与商业闭环的深度诠释与创造。目录编号仅代表作品生成的时间顺序。

---

## 目录索引与架构概览

| 编号与工程目录 | 核心架构形态 | 特色亮点与探索切面 | 依赖与关键组件 |
| :--- | :--- | :--- | :--- |
| **[1-suanle-kimik3](./1-suanle-kimik3)** | 多路由页面应用 (App Router) | 划分 `/reading` 测算、`/tavern` 宿命酒馆、`/me` 个人中心三大主干，内置五行能量图谱与分享长卡生成 | Next.js, Tailwind CSS, Lucide, QR Code |
| **[2-suanle-opus55low](./2-suanle-opus55low)** | 轻量极简单页应用 (Single-Page App) | 极简抽屉式导航（Drawer），专注核心对话流与轻量化开销/订阅面板，启动与渲染速度极快 | Next.js, Radix UI, Drizzle ORM |
| **[3-suanle-opus55high](./3-suanle-opus55high)** | 全功能矩阵式多路由 (Deep Multi-Route) | 深度实现 `/tools` 独立测算工具库（八字、六爻、塔罗、人生K线）、独立的 `/letgo` 释怀仪式页面与管理后台 | Next.js, Framer Motion, Drizzle, Recharts |
| **[4-suanle-kimik3](./4-suanle-kimik3)** | 状态驱动多视图架构 (Zustand State-Driven) | 采用视图状态机（ChatView, DivineView, ArchiveView, MeView），具有独特的 `/api/metaphor` Token 生活化隐喻算法与亲切 Onboarding 引导 | Next.js, Zustand, Lucide, Tailwind CSS |
| **[5-suanle-opus55](./5-suanle-opus55)** | 复合视图与服务封装 (Modular SPA + Server Lib) | 结构清晰的 `ChatView`、`ExploreView` 与 `MeView`，配套完善的 `lib/server/usage.ts` 算力用量追踪与打赏体系 | Next.js, Tailwind CSS, Canvas |
| **[6-suanle-opus55high](./6-suanle-opus55high)** | 模块化抽屉与组件化深度应用 (Full-Featured Modular) | 极度细腻的交互体系：包含独立的 `LetGoView`（纸团揉碎与释怀仪式）、`LampSheet`（点灯祈福）、`TipSheet`（自愿赞赏）、`Divine` 工具矩阵与 Lunar 万年历集成 | Next.js, Lunar-javascript, Lucide, Tailwind |

---

## 本地快速体验指南

本作品集中的任一工程均可独立运行。以 `6-suanle-opus55high` 为例：

```bash
# 1. 进入对应作品目录
cd works/6-suanle-opus55high

# 2. 安装依赖 (推荐 pnpm 或 npm)
npm install

# 3. 配置环境变量 (如未配置 API Key，各工程均内置自洽的本地离线 Mock 逻辑)
cp .env.example .env.local

# 4. 启动本地开发服务
npm run dev
```

在浏览器中打开 `http://localhost:3000` 即可体验。

---

## 知识产权与商业授权声明
本目录中包含的所有代码工程、组件设计、交互动画及对应 Prompt 逻辑均属于《算了 · Suanle》项目组专属资产，受本仓库顶级 [LICENSE](../LICENSE) 约束。未经书面授权，严禁任何形式的商业转售、商业部署与二次打包。
