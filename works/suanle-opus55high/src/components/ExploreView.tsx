import { useMemo, useState } from "react";
import { ChevronRight, Feather, MessageCircle, Pencil } from "lucide-react";
import { useApp, useUI } from "@/lib/store";
import { baziToText, castToText, computeBazi, computeKLine, tarotToText, todayAlmanac, TAROT, type CastResult, type TarotDraw } from "@/lib/divination";
import { bringToChat } from "@/lib/engine";
import { AlmanacCard, BaziChart, BirthForm, CoinCaster, KLineChart, TarotPicker } from "./tools";
import { Card, SectionTitle, Sheet } from "./ui";

type Tool = "coins" | "tarot" | "bazi" | "kline";

function ToolMark({ id }: { id: Tool }) {
  const c = "#262626";
  if (id === "coins")
    return (
      <svg viewBox="0 0 32 32" width="30" height="30" fill={c} opacity=".82">
        {[4, 11, 18].map((y, i) => (i === 1 ? <rect key={y} x="3" y={y} width="26" height="4.5" rx="1.2" /> : <g key={y}><rect x="3" y={y} width="11" height="4.5" rx="1.2" /><rect x="18" y={y} width="11" height="4.5" rx="1.2" /></g>))}
        <circle cx="16" cy="28" r="2.2" fill="#c4553a" />
      </svg>
    );
  if (id === "tarot")
    return (
      <svg viewBox="0 0 32 32" width="30" height="30" fill="none" stroke={c} strokeWidth="1.6" opacity=".82">
        <rect x="9" y="3" width="15" height="24" rx="2.5" transform="rotate(10 16 15)" />
        <rect x="6" y="5" width="15" height="24" rx="2.5" fill="#efeef2" transform="rotate(-8 13 17)" />
        <path d="M13.5 12.5l1.2 2.6 2.6 1.2-2.6 1.2-1.2 2.6-1.2-2.6-2.6-1.2 2.6-1.2z" fill="#b8955a" stroke="none" transform="rotate(-8 13 17)" />
      </svg>
    );
  if (id === "bazi") return <span className="font-song text-[26px] font-bold leading-none text-ink/80">命</span>;
  return (
    <svg viewBox="0 0 32 32" width="30" height="30" opacity=".85">
      {[[5, 18, 24, 20, 23], [12, 12, 22, 14, 19], [19, 15, 21, 9, 18], [26, 6, 14, 4, 16]].map(([x, o, cl, h, l], i) => {
        const up = cl < o;
        return (
          <g key={i} stroke={up ? "#7d8b70" : "#c4553a"} strokeWidth="1.3">
            <line x1={x} x2={x} y1={h} y2={l + 6} />
            <rect x={x - 2.5} y={Math.min(o, cl)} width="5" height={Math.max(2, Math.abs(o - cl))} rx=".8" fill={up ? "#eaf0ea" : "#c4553a"} />
          </g>
        );
      })}
    </svg>
  );
}

const TOOLS: { id: Tool; name: string; sub: string; tone: string }[] = [
  { id: "coins", name: "六爻摇卦", sub: "一事一卦，问个走向", tone: "from-[#f4efe4] to-[#ebe3d2]" },
  { id: "tarot", name: "三张塔罗", sub: "此刻 · 阻碍 · 出路", tone: "from-[#efeef2] to-[#e2e0ea]" },
  { id: "bazi", name: "八字命盘", sub: "四柱五行，看看底色", tone: "from-[#f3ece6] to-[#eadbd0]" },
  { id: "kline", name: "人生 K 线", sub: "八十年起落，一图看", tone: "from-[#eaf0ea] to-[#dce6dc]" },
];

function QuestionInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value.slice(0, 40))}
      placeholder="心里想问的事（可不填）"
      className="mb-3 h-11 w-full rounded-2xl border border-line bg-white px-4 text-[15px] outline-none placeholder:text-faint focus:border-ink/30"
    />
  );
}

function ChatButton({ onClick, label = "带去聊聊" }: { onClick: () => void; label?: string }) {
  return (
    <button onClick={onClick} className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-ink text-[14.5px] text-paper active:scale-[0.98]">
      <MessageCircle size={16} /> {label}
    </button>
  );
}

function CoinsTool() {
  const [q, setQ] = useState("");
  const [round, setRound] = useState(0);
  const [res, setRes] = useState<CastResult | null>(null);
  return (
    <div className="pb-4">
      {!res && <QuestionInput value={q} onChange={setQ} />}
      <Card className="p-4">
        <CoinCaster
          key={round}
          question={q || undefined}
          onDone={(r) => {
            setRes(r);
            useApp.getState().addRecord({ kind: "coins", title: r.changed ? `${r.primary.full} → ${r.changed.full}` : r.primary.full, summary: r.primary.gist, text: castToText(r) });
          }}
        />
      </Card>
      {res && (
        <>
          <div className="mt-3 rounded-2xl bg-seal/[0.05] px-4 py-3 font-song text-[14.5px] text-ink">「{res.primary.letgo}」</div>
          <ChatButton onClick={() => bringToChat(castToText(res))} label="请算了细细解卦" />
          <button onClick={() => { setRes(null); setRound((r) => r + 1); }} className="mt-2 h-10 w-full text-[13.5px] text-mute">再起一卦</button>
        </>
      )}
    </div>
  );
}

function TarotTool() {
  const [q, setQ] = useState("");
  const [round, setRound] = useState(0);
  const [res, setRes] = useState<TarotDraw | null>(null);
  return (
    <div className="pb-4">
      {!res && <QuestionInput value={q} onChange={setQ} />}
      <Card className="p-4">
        <TarotPicker
          key={round}
          question={q || undefined}
          onDone={(d) => {
            setRes(d);
            useApp.getState().addRecord({ kind: "tarot", title: d.cards.map((c) => TAROT[c.id].name + (c.reversed ? "(逆)" : "")).join(" · "), summary: d.question || "三张牌", text: tarotToText(d) });
          }}
        />
      </Card>
      {res && (
        <>
          <ChatButton onClick={() => bringToChat(tarotToText(res))} label="请算了连起来读" />
          <button onClick={() => { setRes(null); setRound((r) => r + 1); }} className="mt-2 h-10 w-full text-[13.5px] text-mute">重新洗牌</button>
        </>
      )}
    </div>
  );
}

function BirthGate({ children }: { children: (birth: string) => React.ReactNode }) {
  const birth = useApp((s) => s.profile.birth);
  const gender = useApp((s) => s.profile.gender);
  const [editing, setEditing] = useState(false);
  if (!birth || editing) {
    return (
      <Card className="p-4">
        <div className="mb-3 text-[13px] leading-relaxed text-ink-2">留个生辰，命盘和 K 线都会跟着它走。时辰不清楚也没关系。</div>
        <BirthForm
          initial={birth}
          gender={gender}
          cta="就是这天"
          onSubmit={(b, g) => {
            useApp.getState().setProfile({ birth: b, ...(g ? { gender: g } : {}) });
            setEditing(false);
          }}
        />
      </Card>
    );
  }
  return (
    <>
      <div className="mb-2 flex items-center justify-between px-1 text-[12.5px] text-mute">
        <span>生辰 · {birth}{gender ? ` · ${gender}` : ""}</span>
        <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-ink-2">
          <Pencil size={12} /> 修改
        </button>
      </div>
      {children(birth)}
    </>
  );
}

function BaziTool() {
  return (
    <div className="pb-4">
      <BirthGate>
        {(birth) => {
          const b = computeBazi(birth);
          if (!b) return <div className="text-[13px] text-mute">这个日期好像不太对，改改看？</div>;
          return (
            <>
              <Card className="p-4">
                <BaziChart b={b} />
              </Card>
              <ChatButton
                label="请算了看看这张盘"
                onClick={() => {
                  useApp.getState().addRecord({ kind: "bazi", title: b.pillars.map((p) => p.gz).join(" "), summary: `日主${b.dayMaster}${b.dayMasterWx} · ${b.shengxiao}`, text: baziToText(b, birth) });
                  bringToChat(baziToText(b, birth));
                }}
              />
            </>
          );
        }}
      </BirthGate>
    </div>
  );
}

function KLineTool() {
  return (
    <div className="pb-4">
      <BirthGate>
        {(birth) => {
          const candles = computeKLine(birth);
          if (!candles) return null;
          const by = Number(birth.slice(0, 4));
          const age = new Date().getFullYear() - by + 1;
          const best = [...candles].sort((a, b) => b.close - b.open - (a.close - a.open)).slice(0, 3).sort((a, b) => a.age - b.age);
          const text = `我的人生K线里，涨得最猛的几年是 ${best.map((c) => `${c.age}岁(${c.year})`).join("、")}，今年我 ${age} 岁。帮我看看这条线，现在这段该怎么过？`;
          return (
            <>
              <Card className="p-4">
                <KLineChart candles={candles} currentAge={age} />
              </Card>
              <div className="mt-3 px-1 text-[12.5px] leading-relaxed text-mute">
                以日主五行与历年干支的生克起落为骨。绿色是顺风，红色是修炼——没有一根 K 线是白走的。点一点任意一年看细节。
              </div>
              <ChatButton
                label="请算了解读这条线"
                onClick={() => {
                  useApp.getState().addRecord({ kind: "kline", title: `人生 K 线 · ${age} 岁`, summary: `顺风年：${best.map((c) => c.age + "岁").join("、")}`, text });
                  bringToChat(text, { deep: false });
                }}
              />
            </>
          );
        }}
      </BirthGate>
    </div>
  );
}

export default function ExploreView() {
  const [tool, setTool] = useState<Tool | null>(null);
  const a = useMemo(() => todayAlmanac(), []);
  const records = useApp((s) => s.records);
  const current = TOOLS.find((t) => t.id === tool);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex h-14 shrink-0 items-center px-5">
        <h2 className="font-song text-[18px] font-bold tracking-[0.12em]">探索</h2>
      </header>
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-6">
        <div className="mx-auto max-w-[560px]">
          <Card className="relative overflow-hidden p-5">
            <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full opacity-25 blur-2xl" style={{ background: a.color.hex }} />
            <AlmanacCard a={a} />
            <button onClick={() => bringToChat("今天的黄历和运势怎么样？结合我说说")} className="mt-3 flex items-center gap-1 text-[12.5px] text-ink-2">
              让算了结合你说说今天 <ChevronRight size={14} />
            </button>
          </Card>

          <SectionTitle>算一算</SectionTitle>
          <div className="grid grid-cols-2 gap-2.5">
            {TOOLS.map((t) => (
              <button key={t.id} onClick={() => setTool(t.id)} className={`relative overflow-hidden rounded-[22px] bg-gradient-to-br ${t.tone} p-4 text-left transition active:scale-[0.97]`}>
                <div className="flex h-[30px] items-center"><ToolMark id={t.id} /></div>
                <div className="mt-4 text-[15px] font-medium text-ink">{t.name}</div>
                <div className="mt-0.5 text-[11.5px] text-ink-2/80">{t.sub}</div>
              </button>
            ))}
          </div>

          <SectionTitle>然后，算了</SectionTitle>
          <Card onClick={() => useUI.getState().setTab("letgo")} className="flex items-center gap-4 p-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-ink text-paper"><Feather size={20} /></div>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-medium">把心事揉成纸团</div>
              <div className="mt-0.5 text-[12px] text-mute">写下来，揉皱，扔进纸篓。手比心先学会放下。</div>
            </div>
            <ChevronRight size={18} className="shrink-0 text-faint" />
          </Card>

          {records.length > 0 && (
            <>
              <SectionTitle extra={<button onClick={() => useUI.getState().setTab("me")} className="text-[12px] text-mute">全部 {records.length}</button>}>最近算过</SectionTitle>
              <div className="space-y-2">
                {records.slice(0, 3).map((r) => (
                  <Card key={r.id} onClick={() => bringToChat(r.text)} className="flex items-center gap-3 px-4 py-3">
                    <span className="text-[18px]">{r.kind === "coins" ? "🪙" : r.kind === "tarot" ? "🃏" : r.kind === "bazi" ? "📜" : "📈"}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14px]">{r.title}</div>
                      <div className="truncate text-[11.5px] text-mute">{r.summary}</div>
                    </div>
                    <MessageCircle size={15} className="shrink-0 text-faint" />
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <Sheet open={!!tool} onClose={() => setTool(null)} title={current?.name} tall>
        {tool === "coins" && <CoinsTool />}
        {tool === "tarot" && <TarotTool />}
        {tool === "bazi" && <BaziTool />}
        {tool === "kline" && <KLineTool />}
      </Sheet>
    </div>
  );
}
