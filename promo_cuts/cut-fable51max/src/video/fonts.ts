/**
 * 字体回退系统：优先使用 macOS 原生高精度宋体（Songti SC / STSong），
 * 确保离线与本地渲染稳定，无需外部 woff2 文件。
 */
export const loadBrandFonts = (): Promise<void> => {
  return Promise.resolve();
};
