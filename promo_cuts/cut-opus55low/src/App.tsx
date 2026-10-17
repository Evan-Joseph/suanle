import { Player } from "@remotion/player";
import { MainPromo } from "./promo/MainPromo";
import { DURATION, FPS, HEIGHT, WIDTH } from "./promo/constants";

export default function App() {
  return (
    <div style={{ minHeight: "100vh", background: "#E8E3D9", fontFamily: `"Noto Serif SC","Songti SC",serif`, color: "#2B2B2B" }} className="flex flex-col items-center px-6 py-10">
      <h1 className="text-3xl tracking-[0.4em] mb-2">算了 · Suanle</h1>
      <p className="tracking-[0.3em] text-[#A9844A] mb-8">算一算，然后，算了。 — 品牌宣传片 50s · 1080P · 60FPS</p>
      <div className="w-full max-w-6xl shadow-2xl rounded-lg overflow-hidden">
        <Player component={MainPromo} durationInFrames={DURATION} fps={FPS} compositionWidth={WIDTH} compositionHeight={HEIGHT} style={{ width: "100%" }} controls loop autoPlay={false} />
      </div>
      <p className="mt-6 text-sm opacity-70 tracking-wider text-center max-w-3xl leading-7">
        导出：npx remotion render src/promo/index.ts MainPromo out/suanle_brand_promo.mp4<br />
        启用真实录屏与音轨：将素材放入 public/promo/，并将 constants.ts 中 USE_REAL_ASSETS 设为 true。
      </p>
    </div>
  );
}
