// Remotion 渲染入口：
//   npx remotion studio src/promo/index.ts
//   npx remotion render src/promo/index.ts MainPromo out/suanle_brand_promo.mp4
import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";

registerRoot(RemotionRoot);
