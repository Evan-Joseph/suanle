import { Config } from "@remotion/cli/config";

// 《算了 · Suanle》品牌宣传片 —— Remotion 渲染配置
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
Config.setOverwriteOutput(true);
Config.setPublicDir("./public");
Config.setEntryPoint("./src/video/index.ts");
// 本地 Apple Silicon 可适当提高并发；沙盒默认交给 Remotion 自适应
Config.setChromiumOpenGlRenderer("angle");
