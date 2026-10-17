# Role & Creative Mission
你是一位屡获国际大奖的独立创意总监（Creative Director）、资深动态设计大师（Motion Designer）与代码驱动视频工程师（Remotion / Programmatic Video Engineer）。

你的终极使命是：为现象级东方反内耗心智品牌——**《算了 · Suanle》**（官网：`https://www.suanle.cc/`），构思、编排并完整编写一套影视级、富有灵魂共鸣的程序化品牌宣传片工程代码（50 秒，1080P / 60FPS，基于 Remotion 框架），做到“拿到代码即可无缝导出生产级高质量视频成片”。

---

## 一、 品牌哲学与产品灵魂（Brand DNA）

- **品牌 Slogan**：**“算一算，然后，算了。”**
- **核心定位**：一个懂八字、紫微、六爻、塔罗，更懂人心的老朋友。陪你把心里那团乱麻理一理，然后，算了。
- **东方哲学双关**：
  - “算”是探索自我、洞悉周期、理清纷扰；
  - “算了”则是当代青年终止精神内耗、接纳不完美、轻装前行的最高心法。
- **美学基准（宋代极简美学）**：
  - 生宣米白（`#FAF9F6`）、徽墨温黑（`#2B2B2B`）、朱砂印红（`#C4553A`）、古拙泥金（`#A9844A`）、修竹清绿（`#74866A`）、晴岚淡灰（`#E8E3D9`）。
  - **呼吸感与留白**：拒绝廉价赛博朋克、拒绝土味算命修仙、拒绝恐吓式贩卖焦虑。呈现如水墨晕染、热茶升腾、孤灯长明的温润与通透。
  - **纯净用户体验**：宣传片只面向真实用户的情感共鸣与产品交互，**严禁使用任何后台、管理、合规、风控等防御性内部文案**。

---

## 二、 仓库中已准备的高清视听素材库（Retina Assets in Repo）

所有素材均已保存在仓库目录中（同时映射至 `promo/assets/` 与 `public/promo/`），可直接在 Remotion 中通过 `staticFile("promo/...")` 或相对路径无损引用：

### 1. 真实视网膜录屏视频（Real 60FPS Video Footage，严格保证真实 UI，绝非虚构）
- `promo/assets/video/01_home_navigation.mp4`：860×1864 真实移动端首页交互与老友茶馆沉浸式漫游。
- `promo/assets/video/02_chat_consultation.mp4`：860×1864 真实老友茶局对话问卜、铜钱翻转落案结出静卦。
- `promo/assets/video/03_letgo_paper_crumple.mp4`：860×1864 真实信笺书写心事、剧烈揉皱成团与物理投掷落篓。
- `promo/assets/video/04_share_card_with_qr.mp4`：860×1864 真实生成带官方二维码与红印章的分享长卡。

### 2. 高清矢量与界面快照（High-Res UI & Visual Assets）
- `promo/assets/logo.svg` / `logo.png`：1024×1024 品牌矢量标识（坤卦六断爻与微笑圆弧双关，纯黑/朱砂质感）。
- `promo/assets/suanle_qrcode.svg` / `suanle_qrcode.png`：平台官方二维码（直达 `https://www.suanle.cc/`，内嵌朱砂红「算」印章）。
- `promo/assets/prod_mobile_home.png`：430×932 移动端主界面全貌。
- `promo/assets/ui_chat_view.png`：860×1864 聊天问卜、三枚铜钱翻落、老友对话解盘真实 UI。
- `promo/assets/ui_bazi_chart.png`：860×1864 八字排盘与紫微斗数罗盘排盘真实 UI。
- `promo/assets/ui_kline.png`：860×1864 人生大运 K 线图、十二流月运势浪潮起伏交互图谱。
- `promo/assets/ui_letgo_write.png`：860×1864 纸篓心事信笺书写（“写下来，揉掉它”）。
- `promo/assets/ui_letgo_ball.png`：860×1864 揉碎纸团在空中拖拽瞄准、竹编纸篓物理交互界面。
- `promo/assets/ui_letgo_done.png`：860×1864 纸团入篓、金句回响与“今天算了 X 件”释怀界面。

### 3. 木版水印宣纸分享卡（Retina Share Cards with Platform QR）
- `promo/assets/card_dialogue.png`：1080×1220 经典老友对话问心卡，含官方二维码。
- `promo/assets/card_letgo.png`：1080×1080 纸篓释怀信笺卡，含官方二维码。
- `promo/assets/card_annual.png`：1080×1220 大运年度长卡，宣纸底色与官方二维码。
- `promo/assets/card_aphorism.png`：1080×1080 极简单句箴言木刻卡，含官方二维码。

### 4. 纯自然声学音轨与拟音（Acoustic Audio Stems & SFX，真实录音，拒绝 WebAudio 合成音）
- `promo/assets/audio/bgm_suanle_zen.mp3`：49.3s 预混母带纯音乐 BGM（前 37 秒为清幽传统古琴《阳关三叠》，38 秒无缝切入沉浑空灵的西藏颂钵长鸣）。
- `promo/assets/audio/water_drop.mp3`：清冽一滴水声入墨。
- `promo/assets/audio/coin_clatter.mp3`：三枚青铜钱在木桌翻滚碰撞的清脆震颤。
- `promo/assets/audio/paper_crumple.mp3`：真实纸张剧烈揉皱解压 ASMR。
- `promo/assets/audio/singing_bowl_strike.mp3`：空灵沉浑西藏颂钵（Singing Bowl）重锤敲击与 6 秒余音回荡。

---

## 三、 影视级五幕分镜叙事架构 (The 5-Act Narrative Arc)

视频规格：1920 × 1080 ｜ 60 FPS (总长 50 秒，共 3000 帧)。详情请参考仓库中 `promo/STORYBOARD.md` 与 `promo/AUDIO_BEATS.md`：

### 第一幕：叩问与迷惘 (0s – 8s / 0 – 480 帧)
- **视觉**：纯净微粗糙的宣纸纹理上，一滴浓黑徽墨垂直滴落，水墨柔和自然漫散。数行深夜叩问的极简半透明字体随墨迹浮动消弭（“今年考研能上岸吗？”、“换工作是对还是错？”、“我的人生为什么总在打转？”）。
- **旁白字幕**：“人这一生，为什么总想算一算？算前程、算感情、算流年……算那个总在深夜敲打心房的问号。”
- **声音与动效**：0s 水滴入墨（`water_drop.mp3`），古琴散音弱起；水墨扩散插值，微距缓慢推入。

### 第二幕：温茶与对坐 (8s – 20s / 480 – 1200 帧)
- **视觉**：水墨过渡至微透视浮动的手机屏幕（引用实录视频 `01_home_navigation.mp4` / `02_chat_consultation.mp4`）。三枚青铜钱在空中立体翻转翻落，清脆落案结出“天水讼”卦象。老友温茶对坐的点拨文字渐进呈现（“天往上升，水往低流……你心里正跟自己较劲呢。明天给脑子放半天假吧。”）。
- **旁白字幕**：“但这里没有冷冰冰的算命机器，只有一位为你温好热茶的老朋友。懂八字、懂六爻，更懂你眼底的疲惫。”
- **声音与动效**：13.2s 铜钱翻落回响（`coin_clatter.mp3`）；手机微 3D 浮动（Perspective Tilt + Floating Y）、铜钱抛物线下落震荡（Damping Spring）。

### 第三幕：人生如浪潮 (20s – 32s / 1200 – 1920 帧)
- **视觉**：手机界面平滑展开为壮阔的「人生大运 K 线图谱」（`ui_kline.png`）。泥金色的运势起伏曲线如千里江山图般动态延伸绘制，掠过高山与深谷，伴随柔和呼吸脉冲光晕。
- **旁白字幕**：“看透了周期的起起伏伏，你就会明白：低谷时蓄力，高峰时尽兴。起落本是常态，心也就定下来了。”
- **声音与动效**：古琴流水滚拂音阶；SVG 描边动态生长（`strokeDashoffset` 插值）、镜头平滑横向追踪（Camera Pan）。

### 第四幕：灵魂交互：揉掉它，丢进纸篓 (32s – 44s / 1920 – 2640 帧) —— **全片最高潮**
- **视觉**：聚焦于信笺上写下的真实心事：“放不下昨晚的失眠与焦虑”。点击“揉掉它”——信笺伴随强烈的褶皱挤压，物理扭曲凝聚成一颗立体纸团（实录视频 `03_letgo_paper_crumple.mp4`），随后划过一道优美而有张力的抛物线，“咚”地落入画面右下方的竹编纸篓！纸篓轻微反弹摇晃。
- **高潮文案**：全屏骤然静止定格，唯有一行苍劲宋体大字浮现：**【揉掉它。算了。】**
- **声音指引**：34.5s 剧烈揉纸声（`paper_crumple.mp3` ASMR） $\rightarrow$ 37.2s 破风入篓 $\rightarrow$ **38.0s 重中之重**：一声空灵、沉浑、余音缭绕长达 6 秒的**西藏颂钵（Singing Bowl）长鸣**（`singing_bowl_strike.mp3`），涤荡灵魂，全场静止。

### 第五幕：微光与释怀 (44s – 50s / 2640 – 3000 帧) —— **品牌 CTA**
- **视觉**：温暖生宣米色底，角落一盏长明灯芯微光静静摇曳。
  - 左侧：中央朱砂印章稳稳盖下：【算了】，核心 Slogan 缓缓浮现：“算一算，然后，算了。”；
  - 右侧：精致古典宣纸底框包裹的平台官方二维码优雅浮现（`suanle_qrcode.png`，内嵌朱砂红「算」印章），标注“扫码解惑”，微透视分享卡轻悬浮（`04_share_card_with_qr.mp4` / `card_dialogue.png`）；
  - 底部居中清晰显现产品访问地址：`https://www.suanle.cc/`。
- **旁白字幕**：“算了 · Suanle —— 算一算，然后，算了。”
- **声音与动效**：44.0s 盖印厚重定格声，颂钵余音与微弱风铃缓缓淡出至绝对寂静。

---

## 四、 你的沙盒行动指南与技术要求

1. **环境、技能与工具自主探索**：
   - 充分探索并利用你当前沙盒环境中的可用工具、CLI、包管理器（pnpm/npm）与环境配置；
   - 检查是否有相关 Remotion 技能或文档（例如调用 `npx remotion skills add` 或直接查看官方 Remotion 最佳实践）；
   - 推荐在项目根目录下创建独立的视频工程目录（如 `promo-video/`）或直接在现有工程中组织；
   - 推荐依赖：`remotion`、`@remotion/shapes`、`@remotion/noise`、`lucide-react`。
2. **模块化解耦架构**：
   - 将 5 幕镜头分别实现为独立的组件（`Scene1_Hook.tsx`, `Scene2_Tavern.tsx`, `Scene3_KLine.tsx`, `Scene4_LetGo.tsx`, `Scene5_EndCard.tsx`）；
   - 集中管理色彩常量、物理弹簧配置（`constants.ts`）；
   - 在 `Root.tsx` 与主 Composition 中统一调度时间线与音频节奏（参考 `promo/AUDIO_BEATS.md`）；
   - 杜绝生硬突变，全片善用 `spring()` 弹簧阻尼与 `interpolate()` 缓动插值。
3. **极具弹性的渲染与交付策略（关键）**：
   - **若沙盒算力与环境支持渲染**：你可以直接执行 `npx remotion render MainPromo out/suanle_brand_promo.mp4`，生成真正的 MP4 视频成品！
   - **若沙盒无头浏览器环境受限或计算超时**：无需强行在沙盒内耗尽超时跑渲染，**确保整套 Remotion 工程源码、资源链接、依赖配置完整自包含、类型无错**！用户将把整套工程直接同步到本地 Mac（Apple Silicon 芯片硬件加速），本地一键执行 `npm run build` / `npx remotion render` 完成极速 4K/60FPS 导出！
4. **尽情发挥你的全部创意实力**：
   - 脚本中的时间与视觉元素为基准骨架，你完全可以自行优化分镜脚本、文案细节、镜头推拉晃动（Handheld Camera Shake）、水墨粒子漫散或光影体积光（Volumetric Rays）！

请全力以赴，为《算了 · Suanle》打造一部惊艳全网的东方禅意极简品牌宣传片！
