# 《算了 · Suanle》AI 命理与情绪重塑产品研发总控工作区

> **品牌 Slogan**：**算一算，然后，算了。**  
> **核心定位**：面向当代人精神状态的沉浸式反内耗与情绪松弛产品。以易经、星盘、八字、塔罗为心理投射镜面，以对话式交互与酒馆人设为纽带，帮助用户看清现状、卸下执念、拥抱微小确定性。  
> **GitHub 官方仓库**：[https://github.com/Evan-Joseph/suanle](https://github.com/Evan-Joseph/suanle)

---

## 🎨 品牌资产（Brand Identity）

* **品牌名称**：**算了 · Suanle**
* **语义双关**：“算”取推演、占算、梳理之意；“算了”又是当代人放下内耗、解脱释怀的口头禅。
* **Logo 设计**：
  * 资产路径：[`assets/logo.png`](file:///Users/joseph/Desktop/【项目开发】AI算命/assets/logo.png)
  * 视觉内涵：上方为周易六十四卦之首的**坤卦**（六断爻，象征大地承载、全然接纳、包容顺应），下方为**一道上扬的微笑曲线**。二者融合，既是古意卦象，又是释怀笑脸。

---

## 📁 工作区目录索引与结构规划

```
/Users/joseph/Desktop/【项目开发】AI算命/
├── assets/
│   └── logo.png                                  # 官方品牌 Logo 资产（坤卦微笑图腾）
├── README.md                                     # [当前文件] 项目总控导引与资产速查
├── 01_产品定位与心理学内核/
│   └── product_definition_and_psychology.md      # 认知重塑哲学、反内耗机制、心理安全与伦理边界
├── 02_玄学理论与算法推演/
│   └── metaphysics_and_algorithmic_models.md     # 八字、紫微、周易六爻、塔罗数理模型与数据契约
├── 03_交互仪式感与视觉传达设计/
│   └── visual_and_interaction_design_spec.md     # 极简克制视觉体系、微交互与移动端触觉规范
├── 04_酒馆多智能体对话体系/
│   └── tavern_oracle_personas_and_mechanics.md   # 酒馆人设架构、去AI味口语化设计、双轨叙事规则
├── 05_产品功能地图与前端状态流转/
│   └── feature_map_and_state_architecture.md     # 商业化收付款闭环、状态机流转与自洽Mock规范
└── prompts/
    ├── BRAND_NAMING_PROMPT.md                    # 品牌命名与定位探索提示词归档
    └── FRONTEND_MASTER_PROMPT.md                 # 【当前核心交付】交付前端同事的商业级全量开发提示词
```

---

## 🚀 前端研发启动指南

* 打开 [`prompts/FRONTEND_MASTER_PROMPT.md`](file:///Users/joseph/Desktop/【项目开发】AI算命/prompts/FRONTEND_MASTER_PROMPT.md)，将其中代码块中的内容完整复制给负责前端开发的同事或智能体。
* 提示词已配置：
  1. 完全开放的技术栈选择与交互设计自由；
  2. 手机竖屏优先、从亲切聊天框切入、拒绝机械大表单；
  3. 真实的商业化收付款与用户状态闭环；
  4. 真实可用的 API 配置（`https://api.ai-pixel.online/v1`，模型 `gemini-4-argon`）；
  5. 严禁出现低级开发者自嗨文案，确保达到直接投产的高品质要求。
