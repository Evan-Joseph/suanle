# Role & Creative Mission
你是一位斩获多项国际设计大奖的独立创意总监（Creative Director）、资深动态设计大师（Motion Designer）与代码驱动视频工程师（Remotion Engineer）。

你的终极使命是：为现象级东方反内耗心智产品——**《算了 · Suanle》**（官网：`https://www.suanle.cc/`），构思、编排并完整编写一套影视级、富有灵魂共鸣的程序化品牌宣传片工程代码（50 秒，1080P/60FPS 或 30FPS，基于 Remotion 框架），做到“拿到代码即可无缝导出高质量成片”。

---

## 一、 品牌哲学与产品灵魂（Brand DNA）

- **品牌 Slogan**：**“算一算，然后，算了。”**
- **核心定位**：一个懂八字、紫微、六爻、塔罗，更懂人心的老朋友。陪你把心里那团乱麻理一理，然后，算了。
- **东方哲学双关**：
  - “算”是探索自我、洞悉规律、理清纷扰；
  - “算了”则是当代青年终止精神内耗、接纳不完美、轻装前行的最高心法。
- **美学基准**：
  - **宋代极简美学**：生宣米白（`#FAF9F6`）、徽墨温黑（`#2B2B2B`）、朱砂印红（`#C4553A`）、古拙泥金（`#A9844A`）、修竹清绿（`#74866A`）、晴岚灰（`#E8E3D9`）。
  - **呼吸感与留白**：拒绝廉价赛博朋克、拒绝土味算命修仙、拒绝恐吓式贩卖焦虑。呈现如水墨晕染、热茶升腾、孤灯长明的温润与通透。
  - **绝对纯净的视听体验**：宣传片只面向真实用户的情感与产品体验，**严禁使用任何后台、管理、合规、审查、风控等防御性内部文案**。

---

## 二、 仓库内置素材库（Pre-loaded Assets in Repository）

仓库中已准备好视网膜级资产，位于 `promo/assets/` 及 `public/promo/` 目录下，在 Remotion 中可直接通过 `staticFile("promo/<subpath>")` 或 `<Video src={staticFile("promo/video/<name>.mp4")} />` 引用：

### 1. 真实真机实录视频 (Retina 60FPS Video Footage)
- `promo/video/01_home_navigation.mp4`：860×1864 移动端主界面全貌、今日卦象铜钱翻转与平滑浏览。
- `promo/video/02_chat_consultation.mp4`：860×1864 对话解盘、老友温茶点拨实机体验。
- `promo/video/03_letgo_paper_crumple.mp4`：860×1864 核心灵魂交互：真实心事书写、信笺非线性揉皱成纸团、物理抛物线投掷入竹篓、落定回弹与“算了。”红印浮现全过程。
- `promo/video/04_share_card_with_qr.mp4`：860×1864 带有官方平台二维码与网址的精美宋韵分享卡镜头平移特写。

### 2. 真实纯音乐母带与音效采样 (Pure Acoustic Audio & SFX)
- `promo/audio/bgm_suanle_zen.mp3`：大师预混 50 秒母带（0–37s 传统古琴《阳关三叠》古朴散音与泛音，38s 处无缝爆发西藏颂钵长鸣并缭绕至片尾）。
- `promo/audio/water_drop.mp3`：清冽单滴水声入墨。
- `promo/audio/coin_clatter.mp3`：三枚青铜钱在木案上翻滚碰撞震颤声。
- `promo/audio/paper_crumple.mp3`：极度解压治愈的真实纤维纸张揉皱 ASMR。
- `promo/audio/singing_bowl_strike.mp3`：西藏颂钵重力敲击与泛音。
- `promo/audio/singing_bowl.mp3`：空灵沉浑长达 54 秒的持续共振余音。

### 3. 高清矢量与界面资产 (High-Res UI & Graphics)
- `promo/logo.svg` / `promo/logo.png`：品牌矢量符号（坤卦六断爻与微笑圆弧双关，徽墨温黑/朱砂质感）。
- `promo/suanle_qrcode.svg` / `promo/suanle_qrcode.png`：官方平台高精度二维码（指向 `https://www.suanle.cc/`，带“扫码问心”）。
- `promo/ui_chat_view.png`、`promo/ui_kline.png`、`promo/ui_bazi_chart.png`、`promo/ui_letgo_ball.png`、`promo/ui_letgo_done.png`：860×1864 高清实机界面。
- `promo/card_aphorism.png`、`promo/card_dialogue.png`、`promo/card_letgo.png`、`promo/card_annual.png`：带有平台二维码的 1080P 宣纸分享长图。

---

## 三、 影视级五幕分镜叙事与时码节奏 (The 5-Act Narrative & Audio EDL)

视频规格：1920 × 1080 ｜ 60 FPS (推荐，总长 3000 帧) 或 30 FPS (总长 1500 帧) ｜ 总长 50 秒。请将各幕封装为独立的 Remotion `<Sequence>` 组件：

### 第一幕：叩问与迷惘 (0s – 8s / 0 – 480 帧 @ 60FPS)
- **视觉**：纯净微粗糙的生宣纸纹理上，一滴浓黑徽墨垂直滴落，水墨柔和自然漫散。数行深夜叩问的极简半透明字体随墨迹浮动消弭（“今年考研能上岸吗？”、“换工作是对还是错？”、“我的人生为什么总在打转？”）。
- **声音**：古琴散音悠扬入耳；1.8s 水滴声清澈入墨（`water_drop.mp3`）。
- **旁白字幕**：“人这一生，为什么总想算一算？算前程、算感情、算流年……算那个总在深夜敲打心房的问号。”

### 第二幕：温茶与对坐 (8s – 20s / 480 – 1200 帧 @ 60FPS)
- **视觉**：水墨过渡至微 3D 透视浮动的手机屏幕（结合 `01_home_navigation.mp4` / `ui_chat_view.png`）。展现三枚青铜钱在空中立体翻转翻落，清脆落案形成“天水讼”卦象。老友温茶对坐的点拨文字渐进呈现（“天往上升，水往低流……你心里正跟自己较劲呢。明天给脑子放半天假吧。”）。
- **声音**：13.2s 铜钱翻落碰撞声（`coin_clatter.mp3`），古琴泛音悠扬。
- **旁白字幕**：“但这里没有冷冰冰的算命机器，只有一位为你温好热茶的老朋友。懂八字、懂六爻，更懂你眼底未说出口的疲惫。”

### 第三幕：人生如浪潮 (20s – 32s / 1200 – 1920 帧 @ 60FPS)
- **视觉**：手机界面平滑展开为壮阔写意的「人生大运 K 线图谱」（`ui_kline.png`）。泥金色的运势起伏曲线如千里江山图般动态延伸绘制，掠过高山与深谷，伴随柔和呼吸脉冲光晕。
- **声音**：古琴滚拂流水音阶，空谷长风拂过。
- **旁白字幕**：“看透了周期的起起伏伏，你就会明白：低谷时蓄力，高峰时尽兴。起落本是常态，心也就定下来了。”

### 第四幕：灵魂交互：揉掉它，丢进纸篓 (32s – 44s / 1920 – 2640 帧 @ 60FPS) —— **全片最高潮**
- **视觉**：聚焦于信笺上手写心事：“放不下昨晚的失眠与焦虑”。点击“揉掉它”——整张信笺伴随物理挤压剧烈揉皱成纸团（`03_letgo_paper_crumple.mp4`），划过一道优美而有张力的抛物线，“咚”地落入画面右下方的竹编纸篓！纸篓轻微反弹。
- **高潮转折**：全屏骤然极简定格，唯有一行苍劲的大字浮现：**【揉掉它。算了。】**
- **声音**：34.5s 纸张揉皱 ASMR（`paper_crumple.mp3`） $\rightarrow$ **38.0s 重中之重**：一声空灵、沉浑、余音缭绕长达 6 秒的**西藏颂钵（Singing Bowl）长鸣**（`singing_bowl_strike.mp3`），涤荡全场。
- **旁白字幕**：“那些执念、纠结、睡不着的深夜……写下来，揉成团，丢进纸篓。——算了。”

### 第五幕：微光与释怀 (44s – 50s / 2640 – 3000 帧 @ 60FPS) —— **品牌 CTA**
- **视觉**：温暖的生宣米色底，角落长明灯芯微光静静摇曳。中央朱砂印章稳稳盖下：【算了】。核心 Slogan 浮现：“算一算，然后，算了。”。右侧呈现精美古典外框包裹的官方二维码（`suanle_qrcode.png`，标注“扫码问心”），底部展示官方网址 `https://www.suanle.cc/`。
- **声音**：印章盖下的厚重定格声，颂钵余音与微弱风铃缓缓淡出至绝对寂静。
- **旁白字幕**：“算了 · Suanle —— 算一算，然后，算了。”

---

## 四、 你的沙盒行动指南与交付要求

1. **环境与能力探索**：
   - 充分探索你当前沙盒环境中的可用工具、CLI、包管理器与系统环境；
   - 可以在项目内创建独立的 `promo-video/` 模块，或直接在现有 Next.js / Remotion 环境中组织；
   - 推荐依赖：`remotion`、`@remotion/shapes`、`@remotion/noise`、`lucide-react`。
2. **模块化解耦架构**：
   - 将 5 幕镜头分别实现为独立的组件（`Scene1_Hook.tsx`, `Scene2_Tavern.tsx`, `Scene3_KLine.tsx`, `Scene4_LetGo.tsx`, `Scene5_EndCard.tsx`）；
   - 在 `Root.tsx` 与主 Composition 中统一调度时间线与音频；
   - 使用物理弹簧动效（`spring({ frame, fps, config: { damping: 14, stiffness: 120 } })`）与平滑插值（`interpolate()`），杜绝僵硬跳变。
3. **极具弹性的渲染与导出策略**：
   - **若沙盒算力与环境支持视频渲染**：你可以直接执行 `npx remotion render MainPromo out/suanle_brand_promo.mp4`，生成真正的 MP4 视频！
   - **若沙盒无头环境或性能受限**：无需强行在沙盒内耗尽超时跑导出，**确保整套 Remotion 工程源码、资源引用与依赖配置完整自包含**，用户将把整套工程直接同步到本地 Mac（M 系列芯片硬件加速），本地一键执行 `npx remotion render` 完成极速 4K/60FPS 导出！
4. **发挥你的顶级创意天赋**：
   - 脚本中的时间与视觉元素为基准骨架，你完全可以根据对节奏感、镜头语言、美学层次的理解，增添更细腻的水墨粒子、呼吸光晕、镜头虚化（Blur Fade）或动态物理细节！

请全力以赴，为《算了 · Suanle》打造一部惊艳全网的东方禅意极简品牌宣传片！
