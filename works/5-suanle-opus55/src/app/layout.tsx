import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "算了 · Suanle — 算一算，然后，算了。",
  description: "一个会看八字、六爻、塔罗，更会陪你聊天的老朋友。算一算，然后，算了。",
  icons: { icon: "/brand/logo.svg", apple: "/brand/logo.png" },
  appleWebApp: { capable: true, title: "算了", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#faf9f6",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
