import { useEffect, useRef, useState } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { MainPromo } from "./video/MainPromo";
import { BEAT, C, DURATION, FPS, HEIGHT, SCENES, SERIF, SITE_URL, WIDTH } from "./video/theme";

const ACTS = [
  { k: "壹", name: "叩问", desc: "墨滴入纸，深夜的问号浮起", at: SCENES.hook.from },
  { k: "贰", name: "温茶", desc: "老友对坐，首页真实录屏", at: SCENES.tea.from },
  { k: "叁", name: "起卦", desc: "11.47s 鼓点爆发 · 通宝落案", at: BEAT.drop },
  { k: "肆", name: "浪潮", desc: "命盘与大运 K 线如江山起伏", at: SCENES.wave.from },
  { k: "伍", name: "算了", desc: "揉纸 · 抛物线 · 颂钵一响", at: SCENES.letgo.from },
  { k: "陆", name: "印信", desc: "金句卡 · 朱砂印重击", at: SCENES.card.from },
  { k: "柒", name: "终章", desc: "官网与官方二维码", at: SCENES.cta.from },
];

const fmt = (f: number) => `${String(Math.floor(f / FPS / 60)).padStart(2, "0")}:${(f / FPS % 60).toFixed(2).padStart(5, "0")}`;

export default function App() {
  const ref = useRef<PlayerRef>(null);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const p = ref.current;
    if (!p) return;
    const h = (e: { detail: { frame: number } }) => setFrame(e.detail.frame);
    p.addEventListener("frameupdate", h);
    return () => p.removeEventListener("frameupdate", h);
  }, []);

  const activeIdx = ACTS.reduce((acc, a, i) => (frame >= a.at ? i : acc), 0);

  return (
    <div className="min-h-screen" style={{ background: C.paper, color: C.ink, fontFamily: SERIF }}>
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs tracking-[0.5em]" style={{ color: C.gold }}>
              PROGRAMMATIC BRAND FILM · REMOTION
            </div>
            <h1 className="mt-2 text-4xl font-bold tracking-[0.12em]">
              算了 <span style={{ color: C.gold }}>·</span> Suanle 品牌宣传片
            </h1>
            <p className="mt-2 tracking-[0.2em] text-[#6E6658]">
              算一算，然后，<span style={{ color: C.cinnabar }}>算了</span>。
            </p>
          </div>
          <div className="text-right text-sm leading-7 text-[#6E6658]">
            {WIDTH}×{HEIGHT} · {FPS}FPS · {(DURATION / FPS).toFixed(0)}s
            <br />
            主配乐《晓寺晨曦》85.7 BPM
          </div>
        </header>

        <div
          className="overflow-hidden rounded-2xl"
          style={{ boxShadow: "0 30px 80px rgba(76,58,34,0.18)", border: `1px solid ${C.mist}` }}
        >
          <Player
            ref={ref}
            component={MainPromo}
            durationInFrames={DURATION}
            fps={FPS}
            compositionWidth={WIDTH}
            compositionHeight={HEIGHT}
            style={{ width: "100%", aspectRatio: "16 / 9" }}
            controls
            acknowledgeRemotionLicense
            clickToPlay
            doubleClickToFullscreen
            showVolumeControls
          />
        </div>

        <div className="mt-3 flex justify-between text-xs tracking-widest text-[#8A7D66]">
          <span>
            点击画面播放（建议开声音）·{" "}
            <a href="/promo/suanle_brand_promo_preview540p.mp4" download className="underline" style={{ color: C.cinnabar }}>
              下载沙盒实渲 MP4 样片（540p）
            </a>
          </span>
          <span className="font-mono">
            {fmt(frame)} · 第 {frame} 帧
          </span>
        </div>

        <section className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {ACTS.map((a, i) => (
            <button
              key={a.k}
              onClick={() => {
                ref.current?.seekTo(a.at);
                ref.current?.play();
              }}
              className="rounded-xl p-4 text-left transition-all hover:-translate-y-0.5"
              style={{
                background: i === activeIdx ? "#FFFEFB" : "transparent",
                border: `1px solid ${i === activeIdx ? C.cinnabar : C.mist}`,
              }}
            >
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold" style={{ color: i === activeIdx ? C.cinnabar : C.ink }}>
                  {a.k}
                </span>
                <span className="font-semibold tracking-widest">{a.name}</span>
              </div>
              <div className="mt-1 text-xs leading-5 text-[#7A7062]">{a.desc}</div>
              <div className="mt-2 font-mono text-[10px] text-[#A99A80]">{fmt(a.at)}</div>
            </button>
          ))}
        </section>

        <section className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl p-6" style={{ background: "#FFFEFB", border: `1px solid ${C.mist}` }}>
            <h2 className="mb-3 text-lg font-bold tracking-widest">本地一键导出 MP4</h2>
            <pre className="overflow-x-auto rounded-lg p-4 font-mono text-[13px] leading-6" style={{ background: "#F3EFE7" }}>
{`npm install
npm run build:video        # → out/suanle_brand_promo.mp4
npm run build:video:4k     # → 4K (--scale=2)
npm run studio             # Remotion Studio 逐帧精修`}
            </pre>
          </div>
          <div className="rounded-2xl p-6" style={{ background: "#FFFEFB", border: `1px solid ${C.mist}` }}>
            <h2 className="mb-3 text-lg font-bold tracking-widest">关键卡点</h2>
            <ul className="space-y-1 font-mono text-[13px] text-[#5A5348]">
              <li>00:01.17 墨滴入纸 · water_drop</li>
              <li>00:11.47 鼓点爆发 · coin_clatter</li>
              <li>00:22.86 揉掉它 · paper_crumple</li>
              <li>00:27.62 纸团落篓 · singing_bowl_strike</li>
              <li>00:33.53 朱砂印落 · 金句卡</li>
              <li>00:36.50 终章 · {SITE_URL}</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
