import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "算了 · Suanle — 算一算，然后，算了。",
  description: "一个懂八字、紫微、六爻、塔罗，更懂人心的老朋友。陪你把心里那团乱麻理一理，然后，算了。",
  applicationName: "算了",
  appleWebApp: { capable: true, title: "算了", statusBarStyle: "default" },
  formatDetection: { telephone: false, email: false, address: false },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f6" },
    { media: "(prefers-color-scheme: dark)", color: "#161513" },
  ],
};

// 首帧即应用主题，避免日夜切换时的闪白
const themeScript = `(function(){try{var t=localStorage.getItem('suanle-theme')||'system';var n=t==='night'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.setAttribute('data-theme',n?'night':'day');}catch(e){document.documentElement.setAttribute('data-theme','day');}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" data-theme="day" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
