import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "算了 · Suanle — 算一算，然后，算了。",
  description: "深夜小酒馆里那个懂点命理、嘴有点损、心很软的老友。把纠结掰扯清楚，然后，算了。",
  icons: { icon: "/logo.svg", apple: "/logo.jpg" },
  appleWebApp: { capable: true, title: "算了", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#F5F1E8",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
