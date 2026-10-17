// Remotion CLI 配置：public/ 目录下的 promo 素材通过 staticFile("promo/...") 引用
import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
Config.setOverwriteOutput(true);
Config.setConcurrency(null);
Config.setChromiumOpenGlRenderer("angle");
