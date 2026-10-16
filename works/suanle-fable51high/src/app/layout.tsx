import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "算了 · Suanle — 算一算，然后，算了。",
  description: "一个懂八字、六爻、塔罗，但更懂人心的老朋友。算一算，然后，算了。",
  applicationName: "算了",
  appleWebApp: { capable: true, title: "算了", statusBarStyle: "default" },
  icons: { icon: "/logo.svg", apple: "/logo.svg" },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#f7f4ee",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <div id="app-root">{children}</div>
      </body>
    </html>
  );
}
