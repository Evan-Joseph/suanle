import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Noto_Serif_SC, Noto_Sans_SC } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { PaywallProvider } from "@/components/paywall";
import { AppShell } from "@/components/shell";

const serif = Noto_Serif_SC({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  variable: "--font-notoserif",
  display: "swap",
});

const sans = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-notosans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "算了 · Suanle — 算一算，然后，算了",
  description:
    "一款给当代年轻人的反内耗命运测算与心智解压产品。起一卦看清大势，饮一杯放下心事——先算一算，然后，算了。",
};

export const viewport: Viewport = {
  themeColor: "#FAF9F6",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" className={`${serif.variable} ${sans.variable}`}>
      <body className="bg-paper font-body text-ink antialiased">
        <StoreProvider>
          <PaywallProvider>
            <AppShell>{children}</AppShell>
          </PaywallProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
