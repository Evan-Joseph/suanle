import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
Config.setOverwriteOutput(true);
Config.setPublicDir("./public");
Config.setEntryPoint("./src/promo/index.ts");
Config.setChromiumOpenGlRenderer("angle");
