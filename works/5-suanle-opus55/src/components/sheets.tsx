"use client";
import { AnimatePresence, motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { Download, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { useApp, newSession } from "@/lib/store";
import { analogize, fmt, PLANS, TIP_TIERS } from "@/lib/analogy";
import { TAGS } from "@/lib/types";
import { saying } from "@/lib/mock";
import { sfx } from "@/lib/sound";
import { Logo, Markdown, Sheet, useToast } from "./ui";

const TIP_URL = process.env.NEXT_PUBLIC_TIP_URL || "https://github.com/Evan-Joseph/suanle";

/* ---------------- 随喜 ---------------- */
export function TipSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, set } = useApp();
  const toast = useToast();
  const [tab, setTab] = useState<"tip" | "plan">("tip");
  const [sel, setSel] = useState<string>("latte");
  const [stage, setStage] = useState<"pick" | "pay" | "thanks">("pick");
  const [note, setNote] = useState("");
  const [social, setSocial] = useState<{ today: number; supporters: number } | null>(null);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStage("pick");
    fetch("/api/tips").then((r) => r.json()).then(setSocial).catch(() => {});
  }, [open]);

  const tier = TIP_TIERS.find((t) => t.id === sel);
  const plan = PLANS.find((p) => p.id === sel);
  const cents = tab === "tip" ? tier?.cents || 0 : plan?.price || 0;
  const label = tab === "tip" ? tier?.label || "" : plan?.label || "";

  const confirm = async () => {
    try {
      await fetch("/api/tips", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: state.deviceId, amountCents: cents, item: label, plan: tab === "tip" ? "tip" : sel, message: note || undefined }),
      });
    } catch { /* still thank locally */ }
    set((s) => ({
      ...s,
      support: {
        count: s.support.count + 1,
        totalCents: s.support.totalCents + cents,
        memberUntil: tab === "plan" ? Math.max(Date.now(), s.support.memberUntil) + (sel === "friend" ? 365 : 30) * 86400000 : s.support.memberUntil,
      },
    }));
    sfx.chime();
    setStage("thanks");
  };

  return (
    <Sheet open={open} onClose={onClose} tall>
      <AnimatePresence mode="wait">
        {stage === "thanks" ? (
          <motion.div key="t" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="py-10 flex flex-col items-center text-center">
            <motion.div initial={{ rotate: -10 }} animate={{ rotate: [0, -8, 8, 0] }} transition={{ duration: 0.8 }} className="text-ink"><Logo size={72} blink /></motion.div>
            <div className="font-serif text-2xl font-bold mt-5">收到啦，谢谢你</div>
            <p className="text-[14px] text-ink-2 mt-2 leading-relaxed px-6">这份{label}，算了会好好用在下一次陪你说话的时候。<br />你也记得，对自己好一点。</p>
            {tab === "plan" && <div className="mt-3 text-[12px] text-sage">「{label}」已为你开通</div>}
            <button onClick={onClose} className="mt-8 rounded-full bg-ink text-paper px-8 py-2.5 text-[14px]">好</button>
          </motion.div>
        ) : stage === "pay" ? (
          <motion.div key="p" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="py-4 flex flex-col items-center">
            <div className="text-[13px] text-ink-3">{label}</div>
            <div className="font-serif text-4xl font-bold mt-1">¥{(cents / 100).toFixed(cents % 100 ? 1 : 0)}</div>
            <div className="mt-5 p-4 rounded-3xl bg-white border border-paper-3 shadow-sm">
              <QRCodeSVG value={`${TIP_URL}${TIP_URL.includes("?") ? "&" : "?"}item=${encodeURIComponent(label)}&amount=${cents}`} size={176} fgColor="#2b2b2b" bgColor="#ffffff" level="M"
                imageSettings={{ src: "/brand/logo.svg", height: 34, width: 34, excavate: true }} />
            </div>
            <div className="text-[12px] text-ink-3 mt-3">微信 / 支付宝扫一扫，或截图保存</div>
            <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={40} placeholder="想对算了说的一句话（可不填）"
              className="mt-5 w-full rounded-2xl bg-paper-2 px-4 py-2.5 text-[14px] outline-none border border-paper-3" />
            <div className="flex gap-2 w-full mt-4 mb-2">
              <button onClick={() => setStage("pick")} className="flex-1 rounded-full border border-paper-3 py-2.5 text-[14px] text-ink-2">换一个</button>
              <button onClick={confirm} className="flex-[2] rounded-full bg-cinnabar text-paper py-2.5 text-[14px] font-medium">我已随喜</button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="k" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-3">
            <div className="text-center pt-1">
              <div className="font-serif text-xl font-bold">请算了喝杯热的</div>
              <p className="text-[13px] text-ink-2 mt-1.5 leading-relaxed">
                你们一共聊了 <b className="text-ink">{fmt(state.usage.total)}</b> 算力
                {state.usage.total > 0 && <>，差不多是 {analogize(state.usage.total, state.profile, "tip-total", 2)}</>}。
              </p>
              {social && social.supporters > 0 && <p className="text-[11px] text-ink-3 mt-1">已经有 {social.supporters} 位朋友随喜过{social.today ? `，今天 ${social.today} 份` : ""}</p>}
            </div>
            <div className="flex bg-paper-2 rounded-full p-1 mt-4 text-[13px]">
              {(["tip", "plan"] as const).map((t) => (
                <button key={t} onClick={() => { setTab(t); setSel(t === "tip" ? "latte" : "regular"); sfx.tap(); }}
                  className={`flex-1 rounded-full py-1.5 transition ${tab === t ? "bg-paper shadow-sm text-ink font-medium" : "text-ink-3"}`}>
                  {t === "tip" ? "随喜一份" : "常来坐坐"}
                </button>
              ))}
            </div>
            {tab === "tip" ? (
              <div className="grid grid-cols-2 gap-2.5 mt-4">
                {TIP_TIERS.map((t) => (
                  <button key={t.id} onClick={() => { setSel(t.id); sfx.tap(); }}
                    className={`rounded-3xl p-3.5 text-left border transition active:scale-[0.97] ${sel === t.id ? "border-ink bg-paper-2" : "border-paper-3"}`}>
                    <div className="text-2xl">{t.icon}</div>
                    <div className="font-medium text-[14px] mt-1.5">{t.label}</div>
                    <div className="flex items-baseline justify-between mt-0.5">
                      <span className="text-[11px] text-ink-3">{t.sub}</span>
                      <span className="font-serif font-bold text-[15px]">¥{t.cents / 100}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-2.5 mt-4">
                {PLANS.map((p) => (
                  <button key={p.id} onClick={() => { setSel(p.id); sfx.tap(); }}
                    className={`w-full rounded-3xl p-4 text-left border transition ${sel === p.id ? "border-ink bg-paper-2" : "border-paper-3"}`}>
                    <div className="flex items-baseline justify-between">
                      <span className="font-serif font-bold text-[16px]">{p.label}</span>
                      <span><span className="font-serif font-bold text-lg">¥{p.price / 100}</span><span className="text-[11px] text-ink-3"> / {p.period}</span></span>
                    </div>
                    <ul className="mt-2 space-y-0.5">{p.perks.map((x) => <li key={x} className="text-[12px] text-ink-2">· {x}</li>)}</ul>
                  </button>
                ))}
                {state.support.memberUntil > now && (
                  <div className="text-[12px] text-sage text-center">你已是常客，有效期至 {new Date(state.support.memberUntil).toLocaleDateString("zh-CN")}</div>
                )}
              </div>
            )}
            <button onClick={() => { if (!cents) { toast("先挑一个吧"); return; } setStage("pay"); sfx.tap(); }}
              className="w-full mt-5 rounded-full bg-ink text-paper py-3 text-[15px] font-medium active:scale-[0.98] transition">
              {tab === "tip" ? `随喜 ¥${cents / 100}` : `开通 ¥${cents / 100}`}
            </button>
            <p className="text-center text-[11px] text-ink-3 mt-2.5">不随喜也照样陪你聊，随心就好。</p>
          </motion.div>
        )}
      </AnimatePresence>
    </Sheet>
  );
}

/* ---------------- 长图分享 ---------------- */
export function ShareSheet({ data, onClose }: { data: { q: string; a: string } | null; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [img, setImg] = useState<string | null>(null);
  const [making, setMaking] = useState(false);
  const toast = useToast();
  const { state } = useApp();
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setImg(null);
  }, [data]);

  const make = async () => {
    if (!ref.current) return;
    setMaking(true);
    try {
      const url = await toPng(ref.current, { pixelRatio: 2, backgroundColor: "#faf9f6", cacheBust: true });
      setImg(url);
    } catch {
      toast("生成失败，截个屏也行");
    }
    setMaking(false);
  };
  const date = new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });
  return (
    <Sheet open={!!data} onClose={onClose} title="分享长图" tall>
      {data && (
        <div className="pb-4">
          {img ? (
            <div className="flex flex-col items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt="算了 · 分享图" className="w-full rounded-2xl border border-paper-3 shadow-sm" />
              <div className="text-[12px] text-ink-3 mt-2">长按图片保存，或者</div>
              <a href={img} download="suanle-share.png" className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-ink text-paper px-5 py-2.5 text-[14px]"><Download size={15} />下载图片</a>
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-paper-3 overflow-hidden max-h-[56vh] overflow-y-auto no-scrollbar">
                <div ref={ref} className="bg-paper paper-grain p-6 w-full">
                  <div className="flex items-center gap-2 text-ink"><Logo size={26} /><span className="font-serif font-bold">算了</span><span className="ml-auto text-[11px] text-ink-3">{date}</span></div>
                  {data.q && (
                    <div className="mt-5 rounded-2xl bg-ink text-paper px-4 py-3 text-[14px] leading-relaxed whitespace-pre-wrap break-words">
                      {data.q.replace(/^【.*?】/, "").slice(0, 240)}
                    </div>
                  )}
                  <div className="mt-4"><Markdown text={data.a} /></div>
                  <div className="mt-6 pt-4 border-t border-dashed border-paper-3 flex items-end justify-between">
                    <div>
                      <div className="font-serif text-[15px] font-bold">算一算，然后，算了。</div>
                      <div className="text-[11px] text-ink-3 mt-1">{state.profile.name ? `给 ${state.profile.name} 的一页` : "Suanle · 现代心智镜面"}</div>
                    </div>
                    <div className="bg-white p-1.5 rounded-lg"><QRCodeSVG value="https://github.com/Evan-Joseph/suanle" size={48} /></div>
                  </div>
                </div>
              </div>
              <button onClick={make} disabled={making} className="w-full mt-4 rounded-full bg-ink text-paper py-3 text-[15px] disabled:opacity-50">{making ? "正在冲印……" : "生成长图"}</button>
            </>
          )}
        </div>
      )}
    </Sheet>
  );
}

/* ---------------- 会话抽屉 ---------------- */
export function SessionDrawer({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: () => void }) {
  const { state, set, startSession } = useApp();
  const [q, setQ] = useState("");
  const [tag, setTag] = useState<string>("全部");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const list = useMemo(() => {
    return [...state.sessions]
      .filter((s) => s.messages.length > 1 || s.id === state.activeId)
      .filter((s) => tag === "全部" || s.tag === tag)
      .filter((s) => !q || s.title.includes(q) || s.messages.some((m) => m.content.includes(q)))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [state.sessions, state.activeId, q, tag]);

  const groups = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const g: Record<string, typeof list> = {};
    list.forEach((s) => {
      const k = s.updatedAt >= start ? "今天" : s.updatedAt >= start - 86400000 ? "昨天" : s.updatedAt >= start - 7 * 86400000 ? "这一周" : "更早";
      (g[k] ||= []).push(s);
    });
    return Object.entries(g);
  }, [list]);

  const usedTags = Array.from(new Set(state.sessions.filter((s) => s.messages.length > 1).map((s) => s.tag)));

  const remove = (id: string) => {
    set((s) => {
      let sessions = s.sessions.filter((x) => x.id !== id);
      let activeId = s.activeId;
      if (!sessions.length) {
        const ns = newSession(s.profile);
        sessions = [ns];
      }
      if (activeId === id) activeId = sessions[0].id;
      return { ...s, sessions, activeId };
    });
    setConfirmId(null);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="absolute inset-0 z-40" initial={{ opacity: 1 }} exit={{ opacity: 1 }}>
          <motion.div className="absolute inset-0 bg-ink/25" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside
            className="absolute left-0 top-0 bottom-0 w-[84%] max-w-[360px] bg-paper shadow-2xl flex flex-col safe-t"
            initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 32, stiffness: 340 }}
            drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={{ left: 0.5, right: 0 }}
            onDragEnd={(_, i) => { if (i.offset.x < -80) onClose(); }}
          >
            <div className="flex items-center gap-2 px-4 pt-4 pb-3">
              <Logo size={26} className="text-ink" />
              <div className="font-serif font-bold text-lg">算了</div>
              <button onClick={onClose} className="ml-auto w-9 h-9 rounded-full flex items-center justify-center active:bg-paper-2" aria-label="关闭"><X size={18} /></button>
            </div>
            <div className="px-4">
              <div className="flex items-center gap-2 rounded-2xl bg-paper-2 px-3 py-2">
                <Search size={15} className="text-ink-3" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="翻翻聊过的话" className="bg-transparent outline-none flex-1 text-[14px] min-w-0" />
              </div>
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar mt-3 pb-1">
                {["全部", ...TAGS.filter((t) => usedTags.includes(t))].map((t) => (
                  <button key={t} onClick={() => setTag(t)} className={`shrink-0 rounded-full px-3 py-1 text-[12px] ${tag === t ? "bg-ink text-paper" : "bg-paper-2 text-ink-2"}`}>{t}</button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar px-2 mt-2 pb-4">
              {groups.length === 0 && <div className="text-center text-[13px] text-ink-3 mt-16">这里还空着。<br />聊过的话，都会安静地放在这儿。</div>}
              {groups.map(([k, arr]) => (
                <div key={k} className="mt-3">
                  <div className="px-3 text-[11px] text-ink-3 mb-1">{k}</div>
                  {arr.map((s) => (
                    <div key={s.id} className={`group flex items-center rounded-2xl ${s.id === state.activeId ? "bg-paper-2" : ""}`}>
                      <button onClick={() => { set((st) => ({ ...st, activeId: s.id })); onPick(); }} className="flex-1 min-w-0 text-left px-3 py-2.5">
                        <div className="text-[14px] truncate">{s.messages.length > 1 ? s.title : "新的对话"}</div>
                        <div className="text-[11px] text-ink-3 truncate mt-0.5">{s.tag} · {s.messages.filter((m) => m.role === "user").length} 句 · {fmt(s.tokens)} 算力</div>
                      </button>
                      {confirmId === s.id ? (
                        <button onClick={() => remove(s.id)} className="shrink-0 mr-2 rounded-full bg-cinnabar text-paper text-[11px] px-2.5 py-1">算了，删</button>
                      ) : (
                        <button onClick={() => setConfirmId(s.id)} className="shrink-0 w-9 h-9 mr-1 flex items-center justify-center text-ink-3" aria-label="删除"><Trash2 size={14} /></button>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="px-4 pb-4 safe-b">
              <button onClick={() => { startSession(); onPick(); }} className="w-full rounded-full bg-ink text-paper py-2.5 text-[14px]">开始新的对话</button>
              <div className="text-center text-[11px] text-ink-3 mt-2 line-clamp-1">{saying(new Date().toDateString())}</div>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
