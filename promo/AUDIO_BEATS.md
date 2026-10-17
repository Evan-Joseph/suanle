# 《算了 · Suanle》品牌宣传片音频工程与鼓点节奏规范 (Audio Cue Sheet & EDL)

本文档精准标注宣传片 50 秒视听时间线、音轨层次（Stems）、毫秒时间戳与 30FPS / 60FPS 对应帧号，供 Remotion 程序化视频引擎与 AI 剪辑精准卡点。

---

## 一、 音频工程总览 (Acoustic Architecture)

| 参数项 | 参数值 | 设计意图 |
| :--- | :--- | :--- |
| **主配乐 (Master BGM)** | `promo/assets/audio/bgm_suanle_zen.mp3` | 纯音乐：前 37 秒为清冷孤高的传统古琴散音（《阳关三叠》），38 秒无缝切入沉浑空灵的西藏颂钵长鸣 |
| **基础节奏 (Tempo / Pulse)** | 自由散板 (Rubato) $\rightarrow$ 68 BPM 呼吸律动 | 拒绝机械敲击节拍，以呼吸停顿与东方气口带出旷达松弛感 |
| **总时长** | 50.0 秒 (3000 帧 @ 60FPS / 1500 帧 @ 30FPS) | 黄金宣发完播率时长 |
| **声音质感 (Texture)** | 宣纸墨韵、温润瓷盏、青铜震颤、纸团皱褶、颂钵回荡 | 纯实录 Foley 与古典民乐结合 |

---

## 二、 关键卡点时码表 (Frame-Accurate EDL / Cue Sheet)

| 时码 (Timestamp) | 30FPS 帧号 | 60FPS 帧号 | 视听事件 (Audiovisual Event) | 对应音效 (Audio Asset) | 视觉转场与动效响应 |
| :---: | :---: | :---: | :--- | :--- | :--- |
| **00:00.00** | Frame 0 | Frame 0 | **片头启画**：生宣米白背景微光呼吸 | 古琴极简散音弱起 (Fade-in 2s) | 镜头缓慢推入，墨滴从上方垂落 |
| **00:01.80** | Frame 54 | Frame 108 | **水墨滴入**：徽墨垂直落入宣纸纤维 | `water_drop.mp3` (清冽水滴入墨) | 墨色自中心向四周水墨晕散，浮现深夜叩问 |
| **00:08.00** | Frame 240 | Frame 480 | **第一幕转第二幕**：老友对坐温茶 | 古琴高音泛音清脆拔起 | 墨韵散开过渡至微 3D 悬浮手机 (`01_home_navigation.mp4`) |
| **00:13.20** | Frame 396 | Frame 792 | **铜钱落卦**：三枚青铜钱在屏幕中央翻落 | `coin_clatter.mp3` (青铜钱木桌翻滚回响) | 铜钱翻转落定，结出“天水讼”卦象与老友对话解盘 |
| **00:20.00** | Frame 600 | Frame 1200 | **第二幕转第三幕**：大运潮汐起伏 | 古琴滚拂指法，音域开阔舒展 | 展开壮阔「人生大运 K 线图谱」与流年走势 |
| **00:26.50** | Frame 795 | Frame 1590 | **K 线峰谷呼吸**：曲线掠过低谷转向攀升 | 金石共鸣微弱泛音 | 曲线节点发光脉冲，浮现“起落本是常态，知命心安” |
| **00:32.00** | Frame 960 | Frame 1920 | **第三幕转第四幕**：心事信笺展开 | 音乐骤然宁静，只留深沉气口 | 画面聚焦信笺：“放不下昨晚的失眠与焦虑” |
| **00:34.50** | Frame 1035 | Frame 2070 | **揉碎心事**：点击“揉掉它” | `paper_crumple.mp3` (真实纤维剧烈揉褶 ASMR) | 信笺非线性收缩挤压扭曲，瞬间凝成一颗物理纸团 |
| **00:37.20** | Frame 1116 | Frame 2232 | **抛物线投掷**：纸团划过长空 | 空气破风轻微呼啸 (`whoosh`) | 镜头紧随纸团抛物线高速平移追踪 |
| **00:38.00** | Frame 1140 | Frame 2280 | **全片最高潮：纸团落篓** 💥 | `singing_bowl_strike.mp3` (重力落定与空灵沉浑颂钵长鸣) | 纸团“咚”落入竹篓，纸篓轻微回弹；全屏骤然极简定格 |
| **00:38.20 – 00:44.00** | Frame 1146–1320 | Frame 2292–2640 | **灵魂释怀时刻** | 颂钵低频谐波余音缭绕长达 6 秒 | 屏幕缓缓浮现朱红墨字：**【揉掉它。算了。】** |
| **00:44.00** | Frame 1320 | Frame 2640 | **第五幕：定格钤印与传播落款** | 颂钵余音渐弱，印章沉稳盖下 | 朱砂印章【算了】盖落微震，展示卡片与官网平台二维码 |
| **00:46.50** | Frame 1395 | Frame 2790 | **呼吁行动 (CTA)** | 微风余韵微弱淡出 | 显现官方二维码与“扫码问心”，网址 `www.suanle.cc` |
| **00:50.00** | Frame 1500 | Frame 3000 | **全片淡出归寂** | 归于绝对宁静 | 优雅淡出至宣纸米白 |

---

## 三、 Remotion 代码集成范式

```tsx
import { Audio, staticFile } from "remotion";

export const SoundtrackLayer = () => {
  return (
    <>
      {/* 预混大师母带 BGM (包含 0-37s 古琴与 38s 颂钵) */}
      <Audio src={staticFile("promo/audio/bgm_suanle_zen.mp3")} volume={0.9} />

      {/* 关键帧精准拟音点缀 */}
      {/* 01: 水滴声入墨 */}
      <Audio
        src={staticFile("promo/audio/water_drop.mp3")}
        startFrom={0}
        endAt={120}
        volume={0.7}
      />

      {/* 02: 铜钱抛落清脆碰撞 (从 13.2s / 792 帧开始) */}
      <Sequence from={792}>
        <Audio src={staticFile("promo/audio/coin_clatter.mp3")} volume={0.85} />
      </Sequence>

      {/* 03: 纸团揉皱清脆褶皱声 (从 34.5s / 2070 帧开始) */}
      <Sequence from={2070}>
        <Audio src={staticFile("promo/audio/paper_crumple.mp3")} volume={1.0} />
      </Sequence>
    </>
  );
};
```
