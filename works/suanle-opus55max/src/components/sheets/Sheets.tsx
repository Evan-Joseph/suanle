"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useApp, useUI, type DivRecord } from "@/lib/store";
import { computeBazi, type CastResult, type TarotDraw } from "@/lib/divination";
import type { AnnualReport } from "@/lib/annual";
import { renderCard, shareImage, type CardInput } from "@/lib/share";
import { Icon } from "../icons";
import { GhostButton, PrimaryButton, Sheet, Skeleton, timeAgo } from "../ui";
import { BaziChart, BirthForm } from "../tools/Charts";
import { CastSummary, HexLines } from "../tools/CoinCaster";
import { TarotSpread } from "../tools/TarotPicker";
import { AnnualView } from "../tools/Annual";
import { bringToChat } from "../chat/engine";
import { LampSheet, TipSheet } from "./Pay";
import SettingsSheet from "./SettingsSheet";

export const KIND_LABEL: Record<DivRecord["kind"], string> = { coins: "六爻", tarot: "塔罗", bazi: "八字", ziwei: "紫微", annual: "年度盘" };

function ProfileSheet() {
  const open = useUI((s) => s.sheet === "profile");
  const close = useUI((s) => s.close);
  const profile = useApp((s) => s.profile);
  const set = useApp((s) => s.setProfile);
  const [editBirth, setEditBirth] = useState(false);
  return (
    <Sheet open={open} onClose={close} title="我的小档案" full>
      <div className="space-y-5 pb-6">
        <div className="grid grid-cols-2 gap-2.5">
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] text-mute">怎么称呼你</span>
            <input value={profile.name ?? ""} onChange={(e) => set({ name: e.target.value.slice(0, 16) || undefined })} placeholder="随便起一个" className="h-11 w-full rounded-xl border border-line bg-card px-3 text-ink outline-none focus:border-ink/40" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] text-mute">常在的城市</span>
            <input value={profile.city ?? ""} onChange={(e) => set({ city: e.target.value.slice(0, 20) || undefined })} placeholder="可以不填" className="h-11 w-full rounded-xl border border-line bg-card px-3 text-ink outline-none focus:border-ink/40" />
          </label>
        </div>
        <div className="rounded-[20px] border border-line bg-card/70 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[12.5px] text-mute">生辰</div>
              <div className="mt-0.5 text-[15px] text-ink">{profile.birth ? `${profile.birth}${profile.gender ? ` · ${profile.gender}` : ""}` : "还没留"}</div>
            </div>
            <button type="button" onClick={() => setEditBirth(!editBirth)} className="h-8 rounded-full border border-line px-3 text-[12.5px] text-ink-2">
              {editBirth ? "收起" : profile.birth ? "修改" : "填写"}
            </button>
          </div>
          {editBirth && (
            <div className="mt-4">
              <BirthForm
                initialBirth={profile.birth}
                initialGender={profile.gender}
                cta="保存生辰"
                onSave={(b, g) => {
                  set({ birth: b, gender: g });
                  setEditBirth(false);
                  useUI.getState().toast("记下了");
                }}
              />
            </div>
          )}
        </div>
        <div>
          <div className="mb-2 text-[13px] text-ink-2">关键词</div>
          {profile.tags.length ? (
            <div className="flex flex-wrap gap-1.5">
              {profile.tags.map((t, i) => (
                <span key={t} className="inline-flex h-8 items-center gap-1 rounded-full bg-ink/[0.05] pl-3 pr-1.5 text-[13px] text-ink">
                  {t}
                  <button type="button" aria-label={`删除 ${t}`} onClick={() => useApp.getState().removeTag(i)} className="grid h-5 w-5 place-items-center rounded-full text-mute">
                    <Icon as={X} size={12} />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-mute">聊得多了，这里会慢慢多起来。</p>
          )}
        </div>
        <div>
          <div className="mb-2 text-[13px] text-ink-2">它记得的你</div>
          {profile.facts.length ? (
            <ul className="space-y-1.5">
              {profile.facts.map((f, i) => (
                <li key={f + i} className="flex items-start gap-2 rounded-2xl bg-paper-2/70 py-2.5 pl-3.5 pr-2 text-[13.5px] leading-relaxed text-ink">
                  <span className="min-w-0 flex-1">{f}</span>
                  <button type="button" aria-label="忘掉这一条" onClick={() => useApp.getState().removeFact(i)} className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-mute">
                    <Icon as={X} size={13} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] leading-relaxed text-mute">你随口提到的近况和在意的事，会被轻轻记在这里。不想被记得的，点一下就忘掉。</p>
          )}
        </div>
      </div>
    </Sheet>
  );
}

function RecordBody({ r }: { r: DivRecord }) {
  const gender = useApp((s) => s.profile.gender);
  if (r.kind === "coins") {
    const c = r.payload as CastResult;
    return (
      <div>
        {c.question && <p className="mb-3 text-center text-[13px] text-mute">问：{c.question}</p>}
        <HexLines sums={c.sums} size="sm" />
        <CastSummary r={c} />
      </div>
    );
  }
  if (r.kind === "tarot") return <TarotSpread draw={r.payload as TarotDraw} />;
  if (r.kind === "bazi") {
    const birth = (r.payload as { birth?: string })?.birth;
    const b = computeBazi(birth, gender);
    return b ? <BaziChart b={b} /> : <p className="text-[13.5px] text-mute">{r.summary}</p>;
  }
  if (r.kind === "annual") return <AnnualView report={r.payload as AnnualReport} />;
  return (
    <div className="rounded-2xl bg-paper-2/70 p-4 text-[13.5px] leading-relaxed text-ink-2">
      {r.summary}
      <button type="button" onClick={() => useUI.getState().openPanel("ziwei")} className="mt-3 block h-9 rounded-full border border-line px-4 text-[13px] text-ink">
        打开十二宫
      </button>
    </div>
  );
}

function RecordSheet() {
  const open = useUI((s) => s.sheet === "record");
  const payload = useUI((s) => s.sheetPayload);
  const close = useUI((s) => s.close);
  const id = typeof payload?.id === "string" ? payload.id : "";
  const r = useApp((s) => s.records.find((x) => x.id === id));
  const [confirm, setConfirm] = useState(false);
  return (
    <Sheet open={open && !!r} onClose={close} title={r ? `${KIND_LABEL[r.kind]} · ${timeAgo(r.updatedAt ?? r.createdAt)}` : ""} full={r?.kind === "annual"}>
      {r && (
        <div className="pb-4">
          <div className="mb-4 font-song text-[18px] font-bold leading-snug">{r.title}</div>
          <RecordBody r={r} />
          <div className="mt-5 space-y-1">
            <PrimaryButton onClick={() => bringToChat(r.text)}>带去聊聊</PrimaryButton>
            <GhostButton
              onClick={() => {
                if (!confirm) {
                  setConfirm(true);
                  setTimeout(() => setConfirm(false), 2400);
                  return;
                }
                useApp.getState().removeRecord(r.id);
                close();
                useUI.getState().toast("删掉了");
              }}
              className={confirm ? "text-seal" : "text-mute"}
            >
              {confirm ? "再点一次，删掉这条" : "删除这条档案"}
            </GhostButton>
          </div>
        </div>
      )}
    </Sheet>
  );
}

function SharePreview({ input }: { input: CardInput }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    renderCard(input)
      .then((u) => {
        if (alive) setUrl(u);
      })
      .catch(() => {
        if (alive) setUrl("");
      });
    return () => {
      alive = false;
    };
  }, [input]);
  return (
    <div className="pb-4">
      <div className="mx-auto w-full max-w-[300px] overflow-hidden rounded-[18px] border border-line bg-[#faf9f6] shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="算了卡" className="block w-full" />
        ) : (
          <Skeleton className="aspect-[4/5] w-full rounded-none" />
        )}
      </div>
      <p className="mt-3 text-center text-[12px] text-mute">长按图片可以直接保存</p>
      <PrimaryButton
        disabled={!url}
        className="mt-4"
        onClick={() => {
          if (!url) return;
          void shareImage(url, `suanle-${Date.now().toString(36)}.png`).then((r) => useUI.getState().toast(r === "shared" ? "分享出去了" : "已保存到下载"));
        }}
      >
        分享或保存
      </PrimaryButton>
    </div>
  );
}

function ShareSheet() {
  const open = useUI((s) => s.sheet === "share");
  const payload = useUI((s) => s.sheetPayload);
  const close = useUI((s) => s.close);
  const input: CardInput | null =
    payload && typeof payload.body === "string"
      ? { kicker: typeof payload.kicker === "string" ? payload.kicker : undefined, title: typeof payload.title === "string" ? payload.title : undefined, body: payload.body, line: typeof payload.line === "string" ? payload.line : null }
      : null;
  return (
    <Sheet open={open && !!input} onClose={close} title="做成卡片">
      {input && <SharePreview input={input} />}
    </Sheet>
  );
}

export default function Sheets() {
  return (
    <>
      <TipSheet />
      <LampSheet />
      <ProfileSheet />
      <SettingsSheet />
      <RecordSheet />
      <ShareSheet />
    </>
  );
}
