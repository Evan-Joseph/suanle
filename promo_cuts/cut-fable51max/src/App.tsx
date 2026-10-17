import { Player } from "@remotion/player";
import { MainPromo } from "./video/MainPromo";
import { DURATION_SECONDS, HEIGHT, WIDTH, SITE_URL } from "./video/theme";

const FPS = 30;

const CUE_SHEET: { time: string; beat: string; scene: string }[] = [
  { time: "00:00.00", beat: "前奏 · 晨钟", scene: "生宣留白，深夜心事散落浮现" },
  { time: "00:01.17", beat: "晨钟第二回响", scene: "墨滴入纸，水墨晕染（water_drop）" },
  { time: "00:03.56", beat: "竹笛入场", scene: "「有些事，想了一万遍，也想不出答案。不如，先算一算。」" },
  { time: "00:06.43", beat: "弦乐上行", scene: "首页巡礼录屏入画 ·「懂八字、紫微、六爻、塔罗，但更懂人心。」" },
  { time: "00:09.76", beat: "预备拍", scene: "铜钱手机自下升起" },
  { time: "00:11.47", beat: "💥 鼓点爆发", scene: "铜钱落案（coin_clatter）·「算一算。」朱砂墨晕" },
  { time: "00:13.36", beat: "第 4 小节强拍", scene: "老友对话层叠入画 ·「懂卦象，更懂你眼底的疲惫。」" },
  { time: "00:16.20", beat: "第 5 小节强拍", scene: "大运 K 线 + 八字命盘 · 人生浪潮曲线画出「此刻」" },
  { time: "00:19.04", beat: "第 6 小节强拍", scene: "「低谷时蓄力，高峰时尽兴。看清起伏，心就定了。」" },
  { time: "00:20.43", beat: "情绪转折", scene: "纸篓仪式 ·「算过了，还是放不下。那就，写下来。」" },
  { time: "00:24.72", beat: "第 8 小节强拍", scene: "信笺揉成纸团（paper_crumple）·「揉掉它。」" },
  { time: "00:26.57", beat: "抛物线", scene: "镜头缓慢推入，跟拍纸团飞向竹篓" },
  { time: "00:27.62", beat: "💥 最高潮", scene: "纸团落篓 · 颂钵重击（singing_bowl_strike）· 苍劲「算了。」+ 朱砂印" },
  { time: "00:28.61", beat: "余音回荡", scene: "「放下执念，便与自己，温柔地和解。」「今天，算了一件事。」" },
  { time: "00:33.34", beat: "主题复现", scene: "宣纸木刻卡片层叠 · 分享卡录屏 · 朱砂印落款" },
  { time: "00:38.92", beat: "终章强拍", scene: "品牌标识落笔 ·「算一算，然后，算了。」· 官方二维码 + 官网" },
  { time: "00:48.30", beat: "淡出", scene: "归于生宣米白" },
];

export default function App() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#2B2B2B]" style={{ fontFamily: '"Suanle Serif", "Songti SC", "Noto Serif SC", serif' }}>
      <header className="mx-auto max-w-6xl px-6 pt-12 pb-6">
        <div className="flex items-center gap-3 text-xs tracking-[0.4em] text-[#9A958D]">
          <span className="inline-block h-2.5 w-2.5 bg-[#C4553A]" />
          算了 · SUANLE · BRAND FILM
        </div>
        <h1 className="mt-4 text-4xl font-normal tracking-wide">
          算一算，然后，<span className="text-[#C4553A]">算了。</span>
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-[#5A5651]">
          《算了 · Suanle》品牌宣传片 —— 基于 Remotion 的程序化视频工程。下方为与最终成片 1:1 的实时预览（{WIDTH}×{HEIGHT}，{FPS}FPS，{DURATION_SECONDS}s），
          所有镜头、字幕、物理弹簧与卡点均由代码驱动，可一键渲染导出 MP4。
        </p>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24">
        <div className="overflow-hidden rounded-xl border border-[#E8E3D9] bg-[#1e1d1b] shadow-[0_30px_80px_rgba(43,43,43,0.18)]">
          <Player
            component={MainPromo}
            durationInFrames={DURATION_SECONDS * FPS}
            fps={FPS}
            compositionWidth={WIDTH}
            compositionHeight={HEIGHT}
            controls
            loop
            clickToPlay
            showVolumeControls
            acknowledgeRemotionLicense
            style={{ width: "100%", aspectRatio: `${WIDTH} / ${HEIGHT}` }}
          />
        </div>
        <p className="mt-3 text-xs tracking-wider text-[#9A958D]">
          提示：浏览器策略要求首次点击后才会出声；实时预览解码 5 条实机录屏可能略有掉帧，成片渲染为逐帧离线合成，不受影响。
        </p>

        <section className="mt-16 grid gap-10 md:grid-cols-[1.2fr_1fr]">
          <div>
            <h2 className="text-xl tracking-wide">导演时间线 · 卡点表</h2>
            <p className="mt-1 text-sm text-[#9A958D]">依据 promo/AUDIO_BEATS.md（《晓寺晨曦》85.7 BPM，强拍网格 13.36 + 2.84n）与录屏逐帧对位</p>
            <div className="mt-4 overflow-hidden rounded-lg border border-[#E8E3D9]">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F1EEE7] text-xs tracking-widest text-[#5A5651]">
                  <tr>
                    <th className="px-4 py-2 font-normal">时码</th>
                    <th className="px-4 py-2 font-normal">音乐事件</th>
                    <th className="px-4 py-2 font-normal">画面</th>
                  </tr>
                </thead>
                <tbody>
                  {CUE_SHEET.map((c) => (
                    <tr key={c.time} className="border-t border-[#E8E3D9] align-top">
                      <td className="whitespace-nowrap px-4 py-2 font-mono text-xs text-[#A9844A]">{c.time}</td>
                      <td className="whitespace-nowrap px-4 py-2 text-[#5A5651]">{c.beat}</td>
                      <td className="px-4 py-2 leading-6">{c.scene}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-xl tracking-wide">一键导出</h2>
              <pre className="mt-3 overflow-x-auto rounded-lg bg-[#2B2B2B] p-4 text-xs leading-6 text-[#E8E3D9]">
{`# 安装依赖
npm install

# 1080p · 30FPS（推荐，H.264 · CRF 16）
npm run build:video
# → out/suanle_brand_promo.mp4

# 1080p · 60FPS
npm run build:video:60

# 4K · 60FPS（--scale 2）
npm run build:video:4k

# 打开 Remotion Studio 逐帧审片
npm run video:studio`}
              </pre>
            </div>

            <div>
              <h2 className="text-xl tracking-wide">工程结构</h2>
              <pre className="mt-3 overflow-x-auto rounded-lg border border-[#E8E3D9] bg-white/60 p-4 text-xs leading-6 text-[#5A5651]">
{`remotion.config.ts        渲染配置
src/video/index.ts        Remotion 入口 (registerRoot)
src/video/Root.tsx        合成注册：MainPromo / MainPromo60
src/video/MainPromo.tsx   总时间线 · 全局镜头 · 场景编排
src/video/theme.ts        品牌色 · 字体 · 节拍表 CUES
src/video/AudioTracks.tsx 配乐闪避 + 拟音卡点
src/video/scenes/         S0 叩问 → S5 终章
src/video/components/     Paper 生宣 · InkWash 水墨
                          Phone 机身 · Seal 朱砂印
                          Logo 坤卦微笑 · Ripples 声波
public/promo/             仓库原始素材（录屏/截图/音频/品牌）
public/fonts/             思源宋体子集（离线内嵌）`}
              </pre>
            </div>

            <div>
              <h2 className="text-xl tracking-wide">素材忠实度说明</h2>
              <p className="mt-2 text-sm leading-7 text-[#5A5651]">
                全片 UI 均来自仓库真实录屏与截图，未重绘任何界面。经逐像素测量，录屏 01/02/03/05 的 860×1864 画布中，真实 App 界面位于左上角
                430×845 区域（其余为页面留白与录制灰底），机身组件据此精确裁切；04 分享卡录屏为完整画幅。官方二维码与域名
                <a className="ml-1 text-[#C4553A] underline underline-offset-4" href={SITE_URL}>{SITE_URL}</a> 在终章清晰呈现。
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
