"use client";

import { useState } from "react";
import { useApp, useUI, lampActive, type DivRecord } from "@/lib/store";
import {
  baziToText,
  castToText,
  computeBazi,
  hexLines,
  tarotToText,
  TAROT,
  TAROT_POSITIONS,
  todayAlmanac,
  type CastResult,
  type TarotDraw,
} from "@/lib/divination";
import { CoinCaster, HexagramView, TarotPicker, TarotFace } from "../tools/Divine";
import { AlmanacCard, BaziChart, BirthForm } from "../tools/Charts";
import { Icon, Sheet, timeAgo } from "../ui";
import { bringToChat } from "../chat/engine";

type Tool = "coins" | "tarot" | "bazi" | null;

const KIND_ICON: Record<string, string> = { coins: "☯️", tarot: "🃏", bazi: "🧿", annual: "📜" };

function ToolTile({ title, sub, glyph, onClick, badge }: { title: string; sub: string; glyph: string; onClick: () => void; badge?: string }) {
  return (
    <button onClick={onClick} className="relative flex flex-col items-start rounded-3xl border border-line bg-white/75 p-4 text-left shadow-[0_2px_12px_rgba(60,40,10,0.04)] transition active:scale-[0.97]">
      {badge && <span className="absolute right-3 top-3 rounded-full bg-seal/10 px-2 py-0.5 text-[10.5px] text-seal">{badge}</span>}
      <span className="font-song text-[28px] leading-none">{glyph}</span>
      <span className="mt-3 font-song text-[16px] font-bold">{title}</span>
      <span className="mt-0.5 text-[12px] leading-snug text-mute">{sub}</span>
    </button>
  );
}

function ChatButton({ text, label = "带去聊聊，让它细说" }: { text: string; label?: string }) {
  return (
    <button
      onClick={() => {
        useUI.getState().close();
        bringToChat(text);
      }}
      className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-ink py-3.5 text-[15px] text-paper active:scale-[0.98]"
    >
      {label} <Icon name="arrow" size={16} />
    </button>
  );
}

export default function ExploreView() {
  const [tool, setTool] = useState<Tool>(null);
  const [round, setRound] = useState(0);
  const [question, setQuestion] = useState("");
  const [cast, setCast] = useState<CastResult | null>(null);
  const [draw, setDraw] = useState<TarotDraw | null>(null);
  const [openRec, setOpenRec] = useState<string | null>(null);
  const records = useApp((s) => s.records);
  const birth = useApp((s) => s.profile.birth);
  const gender = useApp((s) => s.profile.gender);
  const lamp = useApp((s) => lampActive(s));
  const trialUsed = useApp((s) => s.deep.annualTrial);
  const addRecord = useApp((s) => s.addRecord);
  const removeRecord = useApp((s) => s.removeRecord);
  const setProfile = useApp((s) => s.setProfile);
  const bazi = computeBazi(birth);

  const openTool = (t: Tool) => {
    setCast(null);
    setDraw(null);
    setQuestion("");
    setRound((r) => r + 1);
    setTool(t);
  };

  const annual = () => {
    if (!birth) {
      useUI.getState().toast("先排一下命盘，年度大盘才有根");
      openTool("bazi");
      return;
    }
    if (!lamp && trialUsed) {
      useUI.getState().open("lamp", { reason: "annual" });
      return;
    }
    const year = new Date().getFullYear();
    const gz = todayAlmanac().ganzhi.split(" ")[0];
    if (!lamp) useApp.getState().spendAnnualTrial();
    addRecord({ kind: "annual", title: `${year} 年度大盘`, summary: `${gz} · 事业 感情 财运 身心`, text: "", payload: { year } });
    bringToChat(
      `请为我做一份 ${year} 年（${gz}）的年度大盘：结合我的命盘，分事业、感情、财运、身心四块，各给一个关键词和一句提醒；再按四个季度说说节奏，哪里该冲、哪里该歇；最后送我一句年度"算了"。`,
      { deep: true },
    );
  };

  return (
    <div className="no-scrollbar h-full overflow-y-auto">
      <div className="pt-safe px-4 pb-8">
        <div className="pb-4 pt-5">
          <h1 className="font-song text-[26px] font-bold tracking-wider">占一占</h1>
          <p className="mt-0.5 text-[13px] text-mute">问问天，问问牌，最后还是问问自己。</p>
        </div>

        <AlmanacCard />

        <div className="mt-4 grid grid-cols-2 gap-3">
          <ToolTile title="摇一卦" sub="三枚铜钱，问一件具体的事" glyph="☯" onClick={() => openTool("coins")} />
          <ToolTile title="抽三张" sub="塔罗大阿卡纳，照照此刻的心" glyph="✧" onClick={() => openTool("tarot")} />
          <ToolTile title="我的命盘" sub={bazi ? `${bazi.pillars[2].gz}日 · 属${bazi.shengxiao}` : "八字四柱，看看你的底色"} glyph="命" onClick={() => openTool("bazi")} />
          <ToolTile title="年度大盘" sub="一年的节奏，一次说清" glyph="年" onClick={annual} badge={lamp ? "长明灯" : trialUsed ? "长明灯" : "首次免费"} />
        </div>

        <div className="mt-7 flex items-end justify-between">
          <h2 className="font-song text-[17px] font-bold">推演记录</h2>
          <span className="text-[12px] text-mute">{records.length ? `${records.length} 条，只存在你这里` : ""}</span>
        </div>
        {records.length === 0 ? (
          <div className="mt-3 rounded-3xl border border-dashed border-line px-4 py-8 text-center text-[13px] leading-relaxed text-mute">
            还没有记录。<br />摇过的卦、抽过的牌，都会在这里留个底。
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {records.slice(0, 50).map((r: DivRecord) => (
              <div key={r.id} className="rounded-2xl border border-line bg-white/70 px-4 py-3">
                <button className="flex w-full items-center gap-3 text-left" onClick={() => setOpenRec(openRec === r.id ? null : r.id)}>
                  <span className="text-[20px]">{KIND_ICON[r.kind]}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-song text-[14.5px] font-bold">{r.title}</span>
                    <span className="block truncate text-[12px] text-mute">{r.summary}</span>
                  </span>
                  <span className="shrink-0 text-[11px] text-mute">{timeAgo(r.createdAt)}</span>
                </button>
                {openRec === r.id && (
                  <div className="anim-fade-in mt-3 flex gap-2">
                    {r.text && (
                      <button onClick={() => bringToChat(r.text)} className="flex-1 rounded-xl bg-ink py-2 text-[13px] text-paper active:scale-95">
                        带去聊聊
                      </button>
                    )}
                    <button onClick={() => removeRecord(r.id)} className="rounded-xl border border-line px-4 py-2 text-[13px] text-ink-2 active:scale-95">
                      删除
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 摇卦 */}
      <Sheet open={tool === "coins"} onClose={() => setTool(null)} title="摇一卦" full>
        <div key={round} className="pb-6">
          {!cast && (
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="想问的事（可不填，心里默念也行）"
              className="mb-5 w-full rounded-2xl border border-line bg-white px-4 py-3 text-[15px] outline-none placeholder:text-mute focus:border-ink/30"
            />
          )}
          <CoinCaster
            question={question.trim() || undefined}
            onDone={(r) => {
              setCast(r);
              addRecord({ kind: "coins", title: r.changed ? `${r.primary.full} → ${r.changed.full}` : r.primary.full, summary: r.primary.gist, text: castToText(r), payload: r });
            }}
          />
          {cast && (
            <div className="anim-fade-up mt-6 space-y-4">
              <div className="flex items-center justify-center gap-10 rounded-3xl bg-white/70 py-5">
                <div className="text-center">
                  <HexagramView lines={hexLines(cast.primary)} moving={cast.moving} />
                  <div className="mt-3 font-song text-[14px]">{cast.primary.full}</div>
                </div>
                {cast.changed && (
                  <>
                    <Icon name="arrow" className="text-mute" />
                    <div className="text-center">
                      <HexagramView lines={hexLines(cast.changed)} dim />
                      <div className="mt-3 font-song text-[14px] text-ink-2">{cast.changed.full}</div>
                    </div>
                  </>
                )}
              </div>
              {cast.changed && <p className="text-[14px] leading-relaxed text-ink-2">往后看：{cast.changed.gist}</p>}
              <blockquote className="rounded-2xl border-l-[3px] border-seal bg-[#f6efe4] px-4 py-3 font-song text-[15px]">{cast.primary.letgo}</blockquote>
              <ChatButton text={castToText(cast)} />
              <button onClick={() => openTool("coins")} className="w-full py-2 text-[13.5px] text-mute">
                再问一件
              </button>
            </div>
          )}
        </div>
      </Sheet>

      {/* 塔罗 */}
      <Sheet open={tool === "tarot"} onClose={() => setTool(null)} title="抽三张" full>
        <div key={round} className="pb-6">
          <TarotPicker
            onDone={(d) => {
              setDraw(d);
              addRecord({
                kind: "tarot",
                title: d.cards.map((c) => TAROT[c.id].name + (c.reversed ? "(逆)" : "")).join(" · "),
                summary: d.cards.map((c) => (c.reversed ? TAROT[c.id].rev : TAROT[c.id].up)).join("；"),
                text: tarotToText(d),
                payload: d,
              });
            }}
          />
          {draw && (
            <div className="anim-fade-up mt-6 space-y-3">
              {draw.cards.map((c, i) => (
                <div key={c.id} className="flex items-center gap-3 rounded-2xl bg-white/70 p-3">
                  <div className="h-[66px] w-[44px] shrink-0">
                    <TarotFace id={c.id} reversed={c.reversed} small />
                  </div>
                  <div className="text-[13.5px] leading-relaxed">
                    <div className="text-[11.5px] text-mute">{TAROT_POSITIONS[i]}</div>
                    <b className="font-song">{TAROT[c.id].name}</b>
                    {c.reversed ? "（逆）" : ""}：{c.reversed ? TAROT[c.id].rev : TAROT[c.id].up}
                  </div>
                </div>
              ))}
              <ChatButton text={tarotToText(draw)} />
              <button onClick={() => openTool("tarot")} className="w-full py-2 text-[13.5px] text-mute">
                重新洗牌
              </button>
            </div>
          )}
        </div>
      </Sheet>

      {/* 命盘 */}
      <Sheet open={tool === "bazi"} onClose={() => setTool(null)} title="我的命盘" full>
        <div className="pb-6">
          {bazi && birth ? (
            <div className="space-y-4">
              <div className="text-[12.5px] text-mute">生辰 {birth}</div>
              <BaziChart b={bazi} birth={birth} />
              <ChatButton text={baziToText(bazi, birth)} label="请它细看这张盘" />
              <button onClick={() => setProfile({ birth: undefined })} className="w-full py-2 text-[13px] text-mute">
                重新填写生辰
              </button>
            </div>
          ) : (
            <BirthForm
              initialGender={gender}
              onSave={(bt, g) => {
                setProfile({ birth: bt, ...(g ? { gender: g } : {}) });
                const nb = computeBazi(bt);
                if (nb) addRecord({ kind: "bazi", title: nb.pillars.map((p) => p.gz).join(" "), summary: `日主${nb.dayMaster}${nb.dayMasterWx} · 属${nb.shengxiao}`, text: baziToText(nb, bt), payload: { birth: bt } });
              }}
            />
          )}
        </div>
      </Sheet>
    </div>
  );
}
