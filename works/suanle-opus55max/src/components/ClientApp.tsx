"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import AppShell from "./AppShell";
import { Splash } from "./ui";

/** 先从本地取回会话、档案与画像，再进入应用；期间显示骨架屏 */
export default function ClientApp() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    const done = () => {
      if (alive) setReady(true);
    };
    const unsub = useApp.persist.onFinishHydration(done);
    Promise.resolve(useApp.persist.rehydrate()).then(done, done);
    return () => {
      alive = false;
      unsub();
    };
  }, []);
  return ready ? <AppShell /> : <Splash />;
}
