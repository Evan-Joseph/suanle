"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check, ChevronRight, Crown, Heart, KeyRound, Lock, PencilLine, Receipt,
  RefreshCcw, ScrollText, Settings2, Trash2,
} from "lucide-react";
import { LogoMark } from "@/components/brand";
import { usePaywall } from "@/components/paywall";
import { HOURS, birthLabel, type BirthProfile } from "@/lib/fortune";
import { PLANS, defaultProfile, useStore, type ApiConfig } from "@/lib/store";

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`;
}

const YEARS = Array.from({ length: 72 }, (_, i) => ({ v: 1940 + i, t: `${1940 + i}` })).reverse();
const MONTHS = Array.from({ length: 12 }, (_, i) => ({ v: i + 1, t: `${i + 1}` }));
const DAYS = Array.from({ length: 31 }, (_, i) => ({ v: i + 1, t: `${i + 1}` }));

export default function MePage() {
  const store = useStore();
  const { open } = usePaywall();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<BirthProfile>(() => store.state.profile ?? defaultProfile());
  const [apiForm, setApiForm] = useState<ApiConfig>({ baseUrl: "https://api.openai.com/v1", apiKey: "", model: "gpt-4o-mini", ...store.state.api });
  const [apiSaved, setApiSaved] = useState(false);

  if (!store.ready) return <div className="h-[72vh]" />;

  const { profile, member } = store.state;
  const pro = store.isPro;

  const startEdit = () => {
    setForm(profile ?? defaultProfile());
    setEditing(true);
  };
  const saveEdit = () => {
    store.setProfile({ ...form, name: form.name.trim() });
    setEditing(false);
  };

  const saveApi = () => {
    if (apiForm.apiKey.trim() && apiForm.baseUrl.trim() && apiForm.model.trim()) {
      store.setApi({ baseUrl: apiForm.baseUrl.trim(), apiKey: apiForm.apiKey.trim(), model: apiForm.model.trim() });
    } else {
      store.setApi(null);
    }
    setApiSaved(true);
    window.setTimeout(() => setApiSaved(false), 2000);
  };

  return (
    <div className="mx-auto max-w-[760px]">
      <p className="text-[11px] tracking-[0.42em] text-faint">我的 · 了凡四训不如了却心事</p>
      <h1 className="mt-4 font-display text-[30px] font-black tracking-[0.05em] sm:text-[36px]">
        你的阁楼，样样都在<span className="text-terra">。</span>
      </h1>

      {/* ————— 档案 ————— */}
      <section className="panel mt-8 p-6 sm:p-7">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-3xl border border-line bg-paper">
              <LogoMark size={34} />
            </span>
            <div>
              <p className="font-display text-[18px] font-bold">{profile?.name?.trim() || "旅人"}</p>
              <p className="mt-1 text-[12px] text-ink2">
                {profile ? birthLabel(profile) : "尚未安放生辰 · 起一卦即自动落档"}
              </p>
            </div>
          </div>
          <button onClick={editing ? saveEdit : startEdit} className="btn-ghost h-9 px-4 text-[12px]">
            {editing ? <><Check size={13} /> 收好</> : <><PencilLine size={13} /> {profile ? "修订" : "落档"}</>}
          </button>
        </div>

        <AnimatePresence>
          {editing && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-6 grid gap-3 border-t border-line pt-6 sm:grid-cols-2">
                <input className="field" placeholder="怎么称呼你" value={form.name} maxLength={12} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <div className="flex rounded-2xl border border-line bg-white/60 p-1">
                  {(["solar", "lunar"] as const).map((c) => (
                    <button key={c} onClick={() => setForm({ ...form, calType: c })} className={`flex-1 rounded-xl py-2 text-[12px] transition ${form.calType === c ? "bg-ink text-paper" : "text-ink2"}`}>
                      {c === "solar" ? "公历" : "农历"}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <select className="field cursor-pointer appearance-none" value={form.year} onChange={(e) => setForm({ ...form, year: +e.target.value })}>{YEARS.map((o) => <option key={o.v} value={o.v}>{o.t}</option>)}</select>
                  <select className="field cursor-pointer appearance-none" value={form.month} onChange={(e) => setForm({ ...form, month: +e.target.value })}>{MONTHS.map((o) => <option key={o.v} value={o.v}>{o.t}</option>)}</select>
                  <select className="field cursor-pointer appearance-none" value={form.day} onChange={(e) => setForm({ ...form, day: +e.target.value })}>{DAYS.map((o) => <option key={o.v} value={o.v}>{o.t}</option>)}</select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select className="field cursor-pointer appearance-none" value={form.hour} onChange={(e) => setForm({ ...form, hour: +e.target.value })}>
                    {HOURS.map((h, i) => <option key={i} value={i}>{h.label}</option>)}
                  </select>
                  <input className="field" placeholder="城市" value={form.city} maxLength={10} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ————— 权益 ————— */}
      <section className="relative mt-5 overflow-hidden rounded-[1.75rem] bg-ink p-6 text-paper sm:p-7">
        <span className="absolute -right-14 -top-14 h-48 w-48 rounded-full bg-gold/15 blur-3xl" aria-hidden />
        <div className="relative flex items-center justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-[11px] tracking-[0.4em] text-paper/50">
              <Crown size={13} className="text-gold" /> 我的权益
            </p>
            <p className="mt-3 font-display text-[22px] font-bold tracking-wide">
              {pro ? `算了 Pro · ${member.plan === "yearly" ? "年度会员" : "连续包月"}` : "免费体验中"}
            </p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-paper/60">
              {pro
                ? `有效期至 ${member.until ? fmtDate(member.until) : "长期"} · 深度权益已全开`
                : member.unlocked.length > 0
                  ? `已解开 ${member.unlocked.length} 卷锦囊 · 升级 Pro 全卷畅读`
                  : "每日解语、木鱼纸篓、酒馆 8 次深聊 · 已备好"}
            </p>
          </div>
          <button
            onClick={() => open({ context: "general", headline: pro ? "管理我的 Pro" : undefined })}
            className="shrink-0 rounded-full bg-paper px-5 py-2.5 text-[12.5px] font-medium text-ink transition hover:bg-paper/90"
          >
            {pro ? "管理" : "升级 Pro"}
          </button>
        </div>
        {!pro && (
          <div className="relative mt-5 flex flex-wrap gap-2 border-t border-paper/10 pt-4">
            {["四大板块深度解语", "人生能量波段", "双缘分合盘", "酒馆不限次"].map((t) => (
              <span key={t} className="rounded-full border border-paper/15 px-3 py-1 text-[10.5px] text-paper/70">{t}</span>
            ))}
          </div>
        )}
      </section>

      {/* ————— 命书阁 ————— */}
      <section className="mt-10">
        <p className="flex items-center gap-2 text-[11px] tracking-[0.4em] text-faint">
          <ScrollText size={13} className="text-haze" /> 命书阁 · 你的推演足迹
        </p>
        <div className="mt-4 space-y-3">
          {store.state.readings.length === 0 && (
            <div className="panel flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-[13px] text-ink2">阁中尚无藏书。</p>
              <button onClick={() => router.push("/reading")} className="btn-ink h-10 px-6 text-[13px]">去起第一卦</button>
            </div>
          )}
          {store.state.readings.map((r) => {
            const openFull = store.isUnlocked(r.id);
            return (
              <button
                key={r.id}
                onClick={() => router.push(`/reading?id=${r.id}`)}
                className="group panel flex w-full items-center gap-4 p-5 text-left transition-transform duration-200 hover:-translate-y-0.5"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-card2 font-display text-[15px] font-bold text-ink2">
                  {r.archetype[0]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="font-display text-[15px] font-bold">{r.profile.name.trim() || "旅人"} · {r.archetype}</span>
                    <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${openFull ? "bg-mint2 text-ink2" : "bg-card2 text-faint"}`}>
                      {openFull ? <><Check size={10} /> 全卷</> : <><Lock size={10} /> 试读</>}
                    </span>
                  </span>
                  <span className="mt-1 block truncate text-[12px] text-ink2">「{r.summary}」</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-[10.5px] text-faint">{fmtDate(r.createdAt)}</span>
                  <ChevronRight size={14} className="ml-auto mt-1 text-faint transition-transform group-hover:translate-x-0.5" />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ————— 解语袋 ————— */}
      <section className="mt-10">
        <p className="flex items-center gap-2 text-[11px] tracking-[0.4em] text-faint">
          <Heart size={13} className="text-terra" /> 解语袋 · 收藏的金句
        </p>
        <div className="mt-4 space-y-3">
          {store.state.favs.length === 0 && (
            <div className="panel py-8 text-center text-[13px] text-ink2">袋中空空，遇到心动的句子就收进来。</div>
          )}
          {store.state.favs.map((f) => (
            <div key={f.id} className="panel group flex items-start gap-4 p-5">
              <p className="flex-1 font-display text-[14.5px] font-semibold leading-[1.9]">「{f.text}」</p>
              <div className="shrink-0 text-right">
                <p className="text-[10.5px] text-faint">{f.from}</p>
                <p className="mt-0.5 text-[10.5px] text-faint">{f.date}</p>
                <button
                  onClick={() => store.toggleFav(f)}
                  className="mt-2 text-[11px] text-faint underline underline-offset-4 opacity-0 transition group-hover:opacity-100 hover:text-terra"
                >
                  取出
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ————— 订单 ————— */}
      <section className="mt-10">
        <p className="flex items-center gap-2 text-[11px] tracking-[0.4em] text-faint">
          <Receipt size={13} className="text-gold" /> 订单记录
        </p>
        <div className="mt-4 space-y-3">
          {store.state.orders.length === 0 && (
            <div className="panel py-8 text-center text-[13px] text-ink2">暂无订单，一切从简。</div>
          )}
          {store.state.orders.map((o) => (
            <div key={o.id} className="panel flex items-center gap-4 p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-mint2">
                <Check size={16} className="text-mint" />
              </span>
              <div className="flex-1">
                <p className="text-[14px] font-medium">{PLANS[o.plan].name}</p>
                <p className="mt-0.5 text-[11px] text-faint">{o.id} · {o.methodLabel} · {fmtDate(o.createdAt)}</p>
              </div>
              <div className="text-right">
                <p className="tabular text-[15px] font-semibold">¥{o.amount}</p>
                <p className="mt-0.5 text-[10.5px] text-mint">已生效</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ————— 设置 ————— */}
      <section className="mt-10 pb-6">
        <p className="flex items-center gap-2 text-[11px] tracking-[0.4em] text-faint">
          <Settings2 size={13} className="text-ink2" /> 设置
        </p>

        {/* 私有智囊 */}
        <div className="panel mt-4 p-6">
          <p className="flex items-center gap-2 font-display text-[15px] font-bold tracking-wide">
            <KeyRound size={15} className="text-haze" /> 私有智囊接入
            {store.state.api?.apiKey && <span className="rounded-full bg-mint2 px-2.5 py-0.5 text-[10px] font-normal text-ink2">已接入</span>}
          </p>
          <p className="mt-2 text-[12px] leading-relaxed text-ink2">
            接入你自己的模型服务后，酒馆挚友将由你的算力驱动，聊得更深、更贴你。
          </p>
          <div className="mt-4 grid gap-3">
            <input className="field" placeholder="服务地址（如 https://api.openai.com/v1）" value={apiForm.baseUrl} onChange={(e) => setApiForm({ ...apiForm, baseUrl: e.target.value })} />
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="field" type="password" placeholder="API Key" value={apiForm.apiKey} onChange={(e) => setApiForm({ ...apiForm, apiKey: e.target.value })} />
              <input className="field" placeholder="模型（如 gpt-4o-mini）" value={apiForm.model} onChange={(e) => setApiForm({ ...apiForm, model: e.target.value })} />
            </div>
            <div className="flex gap-2.5">
              <button onClick={saveApi} className="btn-ink h-10 px-6 text-[12.5px]">{apiSaved ? "已收好 ✓" : "保存配置"}</button>
              {store.state.api?.apiKey && (
                <button onClick={() => { store.setApi(null); setApiForm({ baseUrl: "https://api.openai.com/v1", apiKey: "", model: "gpt-4o-mini" }); }} className="btn-ghost h-10 px-5 text-[12.5px]">
                  断开
                </button>
              )}
            </div>
            <p className="text-[10.5px] leading-relaxed text-faint">密钥只存放在这台设备上，不经由我们的服务器留存。</p>
          </div>
        </div>

        {/* 偏好与维护 */}
        <div className="panel mt-4 p-6">
          <p className="flex items-center gap-2 font-display text-[15px] font-bold tracking-wide">
            <RefreshCcw size={15} className="text-haze" /> 偏好与维护
          </p>
          <p className="mt-2 text-[12px] text-ink2">以不同身份看看这间阁楼的模样：</p>
          <div className="mt-3.5 flex flex-wrap gap-2">
            {([["guest", "游客"], ["monthly", "连续包月"], ["yearly", "年度会员"]] as const).map(([t, label]) => {
              const active = t === "guest" ? !pro : pro && member.plan === t;
              return (
                <button
                  key={t}
                  onClick={() => store.setTier(t)}
                  className={`rounded-full border px-4 py-2 text-[12px] transition ${active ? "border-ink bg-ink text-paper" : "border-line text-ink2 hover:border-faint/60"}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="mt-6 border-t border-line pt-5">
            <button
              onClick={() => {
                if (window.confirm("确定要清空这台设备上的全部痕迹吗？档案、足迹与订单都会一并抹去。")) store.wipe();
              }}
              className="flex items-center gap-2 text-[12.5px] text-terra"
            >
              <Trash2 size={14} /> 清空本机全部痕迹
            </button>
            <p className="mt-2 text-[10.5px] leading-relaxed text-faint">
              算了从不把你的心事交给服务器——一切只发生在这台设备上。
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
