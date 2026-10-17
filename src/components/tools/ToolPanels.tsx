"use client";

import { useEffect, useMemo, useState } from "react";
import { deepLeft, engineHeaders, lampActive, useApp, useUI } from "@/lib/store";
import { baziToText, castToText, computeBazi, tarotToText, type CastResult, type TarotDraw } from "@/lib/divination";
import { ziweiToText } from "@/lib/ziwei-core";
import { annualToText, localAnnual, type AnnualReport } from "@/lib/annual";
import { FREE_DEEP_PER_DAY } from "@/lib/meter";
import { Maximize2, Minimize2 } from "lucide-react";
import { Card, GhostButton, Panel, PrimaryButton, Skeleton } from "../ui";
import { bringToChat } from "../chat/engine";
import { CoinCaster } from "./CoinCaster";
import { TarotPicker } from "./TarotPicker";
import { AlmanacCard, BaziChart, BirthForm } from "./Charts";
import { PalaceDetail, useZiwei, ZiweiBoard } from "./Ziwei";
import { AnnualLoading, AnnualView } from "./Annual";
import { saveAnnual, saveBazi, saveCast, saveTarot, saveZiwei } from "./records";

function QuestionBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[13px] text-ink-2">心里想问的事（不写也行）</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, 60))}
        rows={2}
        placeholder={placeholder}
        className="w-full resize-none rounded-2xl border border-line bg-card px-4 py-3 text-[15px] leading-relaxed text-ink outline-none placeholder:text-mute focus:border-ink/40"
      />
    </label>
  );
}

function CoinsPanel() {
  const [question, setQuestion] = useState("");
  const [started, setStarted] = useState(false);
  const [round, setRound] = useState(0);
  const [result, setResult] = useState<CastResult | null>(null);
  return (
    <div className="px-4 pb-10 pt-5">
      {!started ? (
        <div className="space-y-4">
          <QuestionBox value={question} onChange={setQuestion} placeholder="比如：这周要不要主动找他聊聊" />
          <PrimaryButton onClick={() => setStarted(true)}>想好了，开始摇</PrimaryButton>
          <p className="text-center text-[12px] leading-relaxed text-mute">一事一问，越具体越好。同一件事，一天别反复摇。</p>
        </div>
      ) : (
        <Card className="p-4">
          {question && <div className="mb-3 text-center text-[13px] text-mute">问：{question}</div>}
          <CoinCaster
            key={round}
            question={question}
            initial={null}
            onDone={(r) => {
              setResult(r);
              saveCast(r);
            }}
          />
        </Card>
      )}
      {result && (
        <div className="mt-4 space-y-2">
          <p className="pb-2 text-center font-song text-[15px] text-ink-2">「{result.primary.letgo}」</p>
          <PrimaryButton onClick={() => bringToChat(castToText(result))}>请算了细细解读</PrimaryButton>
          <GhostButton
            onClick={() => {
              setResult(null);
              setStarted(false);
              setQuestion("");
              setRound((x) => x + 1);
            }}
          >
            换一件事再问
          </GhostButton>
        </div>
      )}
    </div>
  );
}

function TarotPanel() {
  const [question, setQuestion] = useState("");
  const [started, setStarted] = useState(false);
  const [round, setRound] = useState(0);
  const [draw, setDraw] = useState<TarotDraw | null>(null);
  return (
    <div className="px-4 pb-10 pt-5">
      {!started ? (
        <div className="space-y-4">
          <QuestionBox value={question} onChange={setQuestion} placeholder="比如：我和他之间，接下来会怎样" />
          <PrimaryButton onClick={() => setStarted(true)}>洗好了，开始选</PrimaryButton>
          <p className="text-center text-[12px] leading-relaxed text-mute">深呼吸，凭第一眼的感觉。牌只是镜子，答案在你心里。</p>
        </div>
      ) : (
        <Card className="p-4">
          <TarotPicker
            key={round}
            question={question}
            initial={null}
            onDone={(d) => {
              setDraw(d);
              saveTarot(d);
            }}
          />
        </Card>
      )}
      {draw && (
        <div className="mt-4 space-y-2">
          <PrimaryButton onClick={() => bringToChat(tarotToText(draw))}>请算了连起来读</PrimaryButton>
          <GhostButton
            onClick={() => {
              setDraw(null);
              setStarted(false);
              setQuestion("");
              setRound((x) => x + 1);
            }}
          >
            重新洗牌
          </GhostButton>
        </div>
      )}
    </div>
  );
}

function BirthGate({ title, onSaved }: { title: string; onSaved?: () => void }) {
  const birth = useApp((s) => s.profile.birth);
  const gender = useApp((s) => s.profile.gender);
  const city = useApp((s) => s.profile.city);
  return (
    <div className="px-4 pb-10 pt-5">
      <Card className="p-4">
        <p className="mb-4 text-[14px] leading-relaxed text-ink-2">{title}</p>
        <BirthForm
          initialBirth={birth}
          initialGender={gender}
          initialCity={city}
          onSave={(b, g, c) => {
            useApp.getState().setProfile({ birth: b, gender: g, city: c ?? city });
            onSaved?.();
          }}
        />
      </Card>
    </div>
  );
}

function BaziPanel() {
  const birth = useApp((s) => s.profile.birth);
  const gender = useApp((s) => s.profile.gender);
  const city = useApp((s) => s.profile.city);
  const [editing, setEditing] = useState(false);
  const b = useMemo(() => computeBazi(birth, gender, city), [birth, gender, city]);
  useEffect(() => {
    if (b && birth) saveBazi(birth, b);
  }, [b, birth]);
  if (!birth || !b || editing) return <BirthGate title="排八字需要阳历生日与时辰。时辰不记得也能排，只是少了时柱。" onSaved={() => setEditing(false)} />;
  return (
    <div className="px-4 pb-10 pt-5">
      <Card className="p-4">
        <BaziChart b={b} />
      </Card>
      <div className="mt-4 space-y-2">
        <PrimaryButton onClick={() => bringToChat(baziToText(b, birth))}>请算了细看</PrimaryButton>
        <GhostButton onClick={() => setEditing(true)}>修改生辰</GhostButton>
      </div>
    </div>
  );
}

function ZiweiPanel() {
  const birth = useApp((s) => s.profile.birth);
  const gender = useApp((s) => s.profile.gender);
  const city = useApp((s) => s.profile.city);
  const [editing, setEditing] = useState(false);
  const [sel, setSel] = useState<number | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const chart = useZiwei(birth, gender, city);
  useEffect(() => {
    if (chart && birth) saveZiwei(birth, chart);
  }, [chart, birth]);
  if (!birth || editing) return <BirthGate title="紫微看得细，时辰越准越好；性别决定大限的顺逆。" onSaved={() => setEditing(false)} />;
  if (chart === undefined)
    return (
      <div className="grid grid-cols-4 gap-[5px] px-3 pt-3">
        {Array.from({ length: 16 }, (_, i) => (
          <Skeleton key={i} className="h-[96px] rounded-[10px]" />
        ))}
      </div>
    );
  if (!chart) return <BirthGate title="这个生辰没排出来，换一个试试。" />;
  const soulIdx = Math.max(0, chart.palaces.findIndex((p) => p.name === "命宫"));
  const selected = sel ?? soulIdx;
  const target = chart.palaces[selected];
  return (
    <div className="px-3 pb-10 pt-2">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-[12px] text-mute">十二宫命盘</span>
        <button
          type="button"
          onClick={() => setFullscreen(!fullscreen)}
          className="flex items-center gap-1 rounded-full bg-ink/[0.05] px-2.5 py-1 text-[11.5px] text-ink-2 hover:bg-ink/[0.09] transition"
        >
          {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          <span>{fullscreen ? "收起全屏" : "全屏放大看盘"}</span>
        </button>
      </div>

      {fullscreen ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-paper p-4 overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <span className="font-song text-[17px] font-bold">紫微斗数 · 十二宫全图</span>
            <button
              type="button"
              onClick={() => setFullscreen(false)}
              className="flex items-center gap-1 rounded-full bg-ink px-3 py-1 text-[12px] text-on-ink"
            >
              <Minimize2 className="h-3.5 w-3.5" />
              <span>收起</span>
            </button>
          </div>
          <div className="my-auto py-4">
            <ZiweiBoard chart={chart} selected={selected} onSelect={setSel} />
          </div>
          <div className="pb-6">
            <PalaceDetail chart={chart} index={selected} />
            <div className="mt-3">
              <PrimaryButton onClick={() => { setFullscreen(false); bringToChat(ziweiToText(chart, target)); }}>
                带上这宫去聊聊
              </PrimaryButton>
            </div>
          </div>
        </div>
      ) : (
        <>
          <ZiweiBoard chart={chart} selected={selected} onSelect={setSel} />
          {!chart.hourKnown && <p className="mt-2 px-1 text-[11.5px] text-mute">时辰不详，暂按午时排盘；记起时辰后可以改。</p>}
          <div className="mt-3">
            <PalaceDetail chart={chart} index={selected} />
          </div>
          <div className="mt-4 space-y-2 px-1">
            <PrimaryButton onClick={() => bringToChat(ziweiToText(chart, target))}>请算了细看{target?.name === "命宫" ? "命宫" : `${target?.name ?? ""}宫`}</PrimaryButton>
            <GhostButton onClick={() => setEditing(true)}>修改生辰</GhostButton>
          </div>
        </>
      )}
    </div>
  );
}

function AnnualPanel() {
  const profile = useApp((s) => s.profile);
  const anonId = useApp((s) => s.anonId);
  const lamp = useApp((s) => lampActive(s));
  const left = useApp((s) => deepLeft(s));
  const year = new Date().getFullYear();
  const key = profile.birth ? `annual:${year}:${profile.birth}` : "";
  const report = useApp((s) => (key ? (s.records.find((r) => r.key === key)?.payload as AnnualReport | undefined) : undefined));
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    const birth = profile.birth;
    if (!birth || loading) return;
    if (!lamp && left <= 0) {
      useUI.getState().open("lamp", { reason: "annual" });
      return;
    }
    setLoading(true);
    let r: AnnualReport = localAnnual(birth, year);
    try {
      const res = await fetch("/api/annual", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...engineHeaders() },
        body: JSON.stringify({ profile: { name: profile.name, birth, gender: profile.gender }, year, anonId }),
        signal: AbortSignal.timeout(70000),
      });
      const j = (await res.json()) as { report?: AnnualReport; tokens?: number };
      if (j.report) r = j.report;
      if (j.tokens) useApp.getState().addUsage(j.tokens);
    } catch {
      /* 用本地推演 */
    }
    if (!lampActive(useApp.getState())) useApp.getState().spendDeep();
    saveAnnual(birth, r);
    setLoading(false);
  };

  if (!profile.birth) return <BirthGate title="年度盘以你的八字与紫微为底，先留个生辰吧。" />;
  if (loading)
    return (
      <div className="px-4 pb-10 pt-4">
        <AnnualLoading />
      </div>
    );
  if (!report)
    return (
      <div className="px-4 pb-10 pt-6">
        <Card className="p-5 text-center">
          <div className="font-song text-[20px] font-bold">{year} 年，会是怎样的一年？</div>
          <p className="mx-auto mt-2.5 max-w-[300px] text-[13.5px] leading-relaxed text-ink-2">结合你的八字、大运与紫微十二宫，推演这一年的关键词、四个面向和十二个月的起伏。推演好的年度盘会收进档案，随时回看。</p>
          <PrimaryButton onClick={() => void generate()} className="mt-5">
            推演 {year} 年度盘
          </PrimaryButton>
          <p className="mt-3 text-[11.5px] text-mute">{lamp ? "长明灯亮着，不限次数" : `使用一次深度推演 · 今日还剩 ${left}/${FREE_DEEP_PER_DAY}`}</p>
        </Card>
      </div>
    );
  return (
    <div className="px-4 pb-10 pt-5">
      <AnnualView report={report} />
      <div className="mt-5 space-y-2">
        <PrimaryButton onClick={() => bringToChat(annualToText(report))}>带着年度盘去聊聊</PrimaryButton>
        <div className="grid grid-cols-2 gap-2">
          <GhostButton onClick={() => useUI.getState().open("share", { kicker: `${report.year} ${report.ganzhi}年 · 年度盘`, title: `「${report.keyword}」`, body: `${report.summary}\n\n${report.advice.map((a, i) => `${i + 1}. ${a}`).join("\n")}`, line: report.letgo })} className="border border-line">
            做成卡片
          </GhostButton>
          <GhostButton onClick={() => void generate()} className="border border-line">
            重新推演
          </GhostButton>
        </div>
      </div>
    </div>
  );
}

export default function ToolPanels() {
  const panel = useUI((s) => s.panel);
  const close = useUI((s) => s.closePanel);
  const year = new Date().getFullYear();
  return (
    <>
      <Panel open={panel === "coins"} onClose={close} title="六爻 · 摇一卦">
        <CoinsPanel />
      </Panel>
      <Panel open={panel === "tarot"} onClose={close} title="塔罗 · 三张牌">
        <TarotPanel />
      </Panel>
      <Panel open={panel === "bazi"} onClose={close} title="八字 · 四柱命盘">
        <BaziPanel />
      </Panel>
      <Panel open={panel === "ziwei"} onClose={close} title="紫微 · 十二宫">
        <ZiweiPanel />
      </Panel>
      <Panel open={panel === "annual"} onClose={close} title={`${year} 年度盘`}>
        <AnnualPanel />
      </Panel>
      <Panel open={panel === "almanac"} onClose={close} title="今日黄历">
        <div className="px-4 pb-10 pt-5">
          <AlmanacCard />
        </div>
      </Panel>
    </>
  );
}
