#!/usr/bin/env bash
# 《算了 · Suanle》品牌宣传片 —— 一键本地导出
#   ./scripts/render-video.sh          → out/suanle_brand_promo.mp4      (1080p30)
#   ./scripts/render-video.sh 4k       → out/suanle_brand_promo_4k.mp4   (2160p30)
set -euo pipefail
cd "$(dirname "$0")/.."
[ -d node_modules ] || npm install
mkdir -p out
if [ "${1:-}" = "4k" ]; then
  npx remotion render src/video/index.ts MainPromo out/suanle_brand_promo_4k.mp4 --codec=h264 --crf=14 --scale=2 --timeout=120000
else
  npx remotion render src/video/index.ts MainPromo out/suanle_brand_promo.mp4 --codec=h264 --crf=16 --timeout=120000
fi
echo "✅ 导出完成：$(ls -1 out/*.mp4)"
