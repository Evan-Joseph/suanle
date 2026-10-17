import React, { useEffect, useState } from "react";
import { continueRender, delayRender } from "remotion";
import { GLYPHS } from "./glyphs";

const FONT_CSS =
  "https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;600;700;800;900&family=Noto+Sans+SC:wght@400;500&display=block";

/**
 * 加载思源宋体 / 思源黑体。渲染时 delayRender 等待字体就绪，
 * 离线时自动回退到系统宋体（macOS: Songti SC）。
 */
export const FontLoader: React.FC = () => {
  const [handle] = useState(() => delayRender("Loading Noto Serif SC", { timeoutInMilliseconds: 25000 }));
  useEffect(() => {
    const id = "suanle-fonts";
    let done = false;
    const finish = () => {
      if (!done) {
        done = true;
        continueRender(handle);
      }
    };
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = FONT_CSS;
      link.onload = () => {
        Promise.all([
          ...[400, 500, 600, 700, 800, 900].map((w) => document.fonts.load(`${w} 64px "Noto Serif SC"`, GLYPHS)),
          document.fonts.load('400 24px "Noto Sans SC"', GLYPHS),
        ])
          .then(() => document.fonts.ready)
          .then(finish, finish);
      };
      link.onerror = finish;
      document.head.appendChild(link);
    } else {
      document.fonts.ready.then(finish, finish);
    }
    const t = setTimeout(finish, 20000);
    return () => clearTimeout(t);
  }, [handle]);
  return null;
};
