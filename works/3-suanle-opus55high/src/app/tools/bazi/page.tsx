"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import BirthForm from "@/components/BirthForm";
import { ElementRadar, PillarsView } from "@/components/divination";
import InterpretPanel from "@/components/Interpret";
import { saveReading, ToolFrame } from "@/components/ToolFrame";
import { api, getUid, patchUser, useUserState } from "@/lib/client";
import { computeBazi, ELEMENT_CN, type BaziResult } from "@/lib/bazi";
import { interpretBazi } from "@/lib/mock-oracle";
import { Skeleton } from "@/components/ui";

type Reading = { id: string; kind: string; data: { birthday: string; hour: number | null }; interpretation: string | null };

export default function BaziPage() {
  const { user, loading } = useUserState();
  const [bazi, setBazi] = useState<BaziResult | null>(null);
  const [computing, setComputing] = useState(false);
  const [rid, setRid] = useState<string | null>(null);
  const [initial, setInitial] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [step, setStep] = useState(0);

  const run = async (birthday: string, hour: number | null, gender?: string, save = true) => {
    setComputing(true);
    setStep(0);
    const steps = setInterval(() => setStep((s) => Math.min(s + 1, 3)), 320);
    const b = computeBazi(birthday, hour);
    let reading: { id: string; interpretation: string | null } | null = null;
    try {
      const r = await api<{ readings: Reading[] }>(`/api/readings?userId=${getUid()}&kind=bazi`);
      reading = r.readings.find((x) => x.data?.birthday === birthday && (x.data?.hour ?? null) === hour) ?? null;
    } catch {}
    if (!reading) reading = await saveReading({ kind: "bazi", title: `本命盘 · ${b.pillars.year.label} ${b.pillars.month.label} ${b.pillars.day.label} ${b.pillars.hour?.label ?? ""}`.trim(), data: { birthday, hour } });
    if (save) patchUser({ profile: { birthday, birthHour: hour, ...(gender ? { gender } : {}) } }).catch(() => {});
    setTimeout(() => {
      clearInterval(steps);
      setRid(reading!.id);
      setInitial(reading!.interpretation);
      setBazi(b);
      setComputing(false);
      setEditing(false);
    }, 1400);
  };

  useEffect(() => {
    if (!bazi && !computing && user?.profile?.birthday && !editing) run(user.profile.birthday, user.profile.birthHour ?? null, undefined, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.profile?.birthday]);

  const showForm = editing || (!bazi && !computing && !loading && !user?.profile?.birthday);

  return (
    <ToolFrame title="八字命盘" sub="四柱 · 五行 · 十神" right={bazi && !editing ? <button onClick={() => setEditing(true)} className="text-[13px] text-sub">修改</button> : null}>
      {computing ? (
        <div className="flex flex-col items-center pt-20">
          <div className="breathe flex h-24 w-24 items-center justify-center rounded-full bg-sand font-serif text-[30px] text-ink">☷</div>
          <div className="mt-6 space-y-1.5 text-center text-[13px]">
            {["定年柱", "定月柱", "定日柱", "定时柱"].map((s, i) => <div key={s} className={i <= step ? "text-ink" : "text-faint"}>{s}{i < step ? " ✓" : i === step ? " …" : ""}</div>)}
          </div>
        </div>
      ) : showForm ? (
        <div className="anim-fade-up pt-4">
          <div className="mb-6 text-center">
            <div className="font-serif text-[18px] text-ink">看看你是什么材质的</div>
            <div className="mt-1 text-[12.5px] text-sub">木、火、土、金、水，没有好坏，只有用法</div>
          </div>
          <BirthForm initial={user?.profile} onSubmit={(v) => run(v.birthday, v.birthHour, v.gender)} />
        </div>
      ) : bazi ? (
        <div className="anim-fade-up space-y-4 pt-2">
          <div className="text-center text-[12px] text-sub">{bazi.birthday}{bazi.hour != null ? ` · ${bazi.hour}时` : ""} · 属{bazi.zodiac}</div>
          <PillarsView bazi={bazi} />
          <div className="flex flex-col items-center rounded-3xl bg-white p-5">
            <ElementRadar elements={bazi.elements} size={200} />
            <div className="mt-2 grid w-full grid-cols-3 gap-2 text-center text-[12px]">
              <div className="rounded-xl bg-paper py-2"><div className="text-sub">日元</div><div className="mt-0.5 font-serif text-[15px] text-ink">{bazi.dayMaster}</div></div>
              <div className="rounded-xl bg-paper py-2"><div className="text-sub">身</div><div className="mt-0.5 font-serif text-[15px] text-ink">{bazi.strength}</div></div>
              <div className="rounded-xl bg-paper py-2"><div className="text-sub">喜用</div><div className="mt-0.5 font-serif text-[15px] text-clay">{bazi.favorable.map((e) => ELEMENT_CN[e]).join("")}</div></div>
            </div>
            <div className="mt-4 w-full text-[13.5px] leading-relaxed text-ink-2">{bazi.traits}</div>
            <div className="no-scrollbar mt-3 flex w-full gap-1.5 overflow-x-auto">
              {bazi.tenGods.map((t) => <span key={t.pos} className="shrink-0 rounded-full bg-sand px-2.5 py-1 text-[11.5px] text-sub">{t.pos} {t.stem} · {t.god}</span>)}
            </div>
          </div>
          <InterpretPanel readingId={rid} initial={initial} auto={false} label="请细说这张命盘" localFallback={() => interpretBazi(bazi)} />
          <Link href="/tools/kline" className="flex items-center gap-3 rounded-3xl bg-ink p-4 text-paper active:scale-[0.99]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-paper/10 font-serif text-[18px]">⌇</div>
            <div className="min-w-0 flex-1">
              <div className="text-[14.5px]">看看你的人生波动图</div>
              <div className="truncate text-[12px] text-paper/60">从这张命盘推出 1~90 岁的起伏</div>
            </div>
            <span className="text-paper/50">›</span>
          </Link>
          <p className="text-center text-[11.5px] text-faint">命盘已自动归档为「本命盘」</p>
        </div>
      ) : (
        <div className="space-y-3 pt-4"><Skeleton className="h-28" /><Skeleton className="h-60" /></div>
      )}
    </ToolFrame>
  );
}
