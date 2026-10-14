import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "算了 · Suanle — 算一算，然后，算了",
  description:
    "一款反内耗的 AI 命运小馆：塔罗、六爻、八字，先认真帮你算一算，再陪你笑着说一句「算了」。",
  icons: [{ rel: "icon", url: "/brand/logo.svg", type: "image/svg+xml" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#f6f1e7",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
