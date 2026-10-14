"use client";

import dynamic from "next/dynamic";
import { Logo } from "./ui";

const AppShell = dynamic(() => import("./AppShell"), {
  ssr: false,
  loading: () => (
    <div className="paper-grain mx-auto flex h-[100dvh] max-w-[480px] flex-col items-center justify-center gap-4 text-ink">
      <Logo size={72} blink />
      <div className="font-song text-[15px] tracking-[0.3em] text-ink-2">算一算，然后，算了。</div>
    </div>
  ),
});

export default function ClientApp() {
  return <AppShell />;
}
