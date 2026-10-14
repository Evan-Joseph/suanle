import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "算了 · Suanle — 算一算，然后，算了。",
  description: "一个懂点术数、更懂人心的老朋友。摇一卦、抽张牌、看看命盘，或者把烦恼揉成一团，丢掉。",
  icons: { icon: "/logo.svg", apple: "/logo.png" },
  appleWebApp: { capable: true, title: "算了", statusBarStyle: "default" },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#faf9f6",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
