"use client";

import { useState } from "react";
import type { User } from "./App";
import { buzz } from "./App";

const PLANS = [
  { sku: "quarter", name: "季度 · 无忧卡", price: 68, sub: "约 ¥0.75 / 天", tag: "最松弛" , perks: ["90 天无限畅聊", "深度复盘不限次", "年度运势全景展开", "老算记得你的每一局"] },
  { sku: "month", name: "月度 · 松弛卡", price: 28, sub: "约 ¥0.93 / 天", tag: "", perks: ["30 天无限畅聊", "深度复盘不限次", "老算记得你的每一局"] },
  { sku: "single", name: "一次深谈", price: 6.6, sub: "单次买断", tag: "", perks: ["一次完整的深度复盘", "卦象切入 · 分段细聊"] },
] as const;

const COPY = {
  quota: { t: "今晚聊得有点多了", s: "免费的几句用完了。想接着说，老算还在吧台后面。" },
  deep: { t: "这件事，值得认真摆一摆", s: "深度复盘会从卦象和时运切入，把来龙去脉、你卡在哪、下一步怎么走，一次讲透。" },
  browse: { t: "给自己留一个座位", s: "心里乱的时候，有个地方能说，挺好的。" },
};

export default function Paywall({ reason, user, onClose, onPaid }: { reason: "quota" | "deep" | "browse"; user: User; onClose: () => void; onPaid: (u: User, sku: string) => void }) {
  const [sel, setSel] = useState<string>(reason === "deep" ? "single" : "quarter");
  const [ch, setCh] = useState<"wechat" | "alipay">("wechat");
  const [stage, setStage] = useState<"pick" | "paying" | "done">("pick");
  const [err, setErr] = useState("");
  const plan = PLANS.find((p) => p.sku === sel)!;

  const pay = async () => {
    buzz(15);
    setErr("");
    setStage("paying");
    try {
      const r = await fetch("/api/checkout", { method: "POST", body: JSON.stringify({ uid: user.id, sku: sel, channel: ch }) });
      const o = await r.json();
      await new Promise((res) => setTimeout(res, 1400));
      const c = await fetch("/api/checkout", { method: "PUT", body: JSON.stringify({ uid: user.id, orderId: o.orderId }) });
      if (!c.ok) throw new Error();
      const u = await c.json();
      setStage("done");
      buzz(30);
      setTimeout(() => onPaid(u, sel), 1300);
    } catch {
      setStage("pick");
      setErr("支付没有完成，钱不会被扣，再试一次就好");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="fade absolute inset-0 bg-ink/40" onClick={stage === "pick" ? onClose : undefined} />
      <div className="sheet pb-safe relative max-h-[92dvh] w-full max-w-[640px] overflow-y-auto rounded-t-[28px] bg-paper px-5 pt-3">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-ink/15" />
        {stage === "done" ? (
          <div className="fade py-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-moss text-[28px] text-white">✓</div>
            <div className="mt-5 font-serif text-[22px] font-bold">好了，坐下慢慢说</div>
            <div className="mt-2 text-[13.5px] text-ink2">买都买了，那就别再跟自己较劲了。</div>
          </div>
        ) : (
          <>
            <div className="font-serif text-[22px] font-bold">{COPY[reason].t}</div>
            <p className="mt-1.5 text-[13.5px] leading-6 text-ink2">{COPY[reason].s}</p>
            <div className="mt-5 flex flex-col gap-2.5">
              {PLANS.map((p) => (
                <button key={p.sku} onClick={() => { buzz(); setSel(p.sku); }} className={`relative rounded-2xl border-[1.5px] p-4 text-left transition active:scale-[.99] ${sel === p.sku ? "border-ink bg-white" : "border-ink/10 bg-white/50"}`}>
                  {p.tag && <span className="absolute -top-2.5 right-4 rounded-full bg-clay px-2.5 py-0.5 text-[11px] text-white">{p.tag}</span>}
                  <div className="flex items-baseline justify-between">
                    <span className="text-[15.5px] font-semibold">{p.name}</span>
                    <span><span className="text-[13px]">¥</span><span className="font-serif text-[24px] font-bold">{p.price}</span></span>
                  </div>
                  <div className="mt-0.5 text-[12px] text-ink3">{p.sub}</div>
                  {sel === p.sku && (
                    <ul className="fade mt-3 grid grid-cols-2 gap-x-2 gap-y-1.5 text-[12.5px] text-ink2">
                      {p.perks.map((k) => <li key={k} className="flex gap-1.5"><span className="text-moss">✓</span>{k}</li>)}
                    </ul>
                  )}
                </button>
              ))}
            </div>
            <div className="mt-5 flex gap-2.5">
              {([["wechat", "微信支付", "#07C160"], ["alipay", "支付宝", "#1677FF"]] as const).map(([k, n, c]) => (
                <button key={k} onClick={() => setCh(k)} className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-[13.5px] ${ch === k ? "border-ink/60 bg-white" : "border-ink/10"}`}>
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />{n}
                </button>
              ))}
            </div>
            {err && <div className="mt-3 text-center text-[12.5px] text-clay">{err}</div>}
            <button disabled={stage === "paying"} onClick={pay} className="mt-4 flex h-[52px] w-full items-center justify-center rounded-2xl bg-ink text-[16px] font-medium text-paper active:scale-[.98] disabled:opacity-70">
              {stage === "paying" ? "正在确认支付…" : `${ch === "wechat" ? "微信" : "支付宝"}支付 ¥${plan.price}`}
            </button>
            <p className="mt-3 pb-2 text-center text-[11px] leading-5 text-ink3">
              会员到期不自动续费 · 未使用的深谈券长期有效<br />内容仅供自我觉察与娱乐参考，不构成任何决策建议
            </p>
            <button onClick={onClose} className="mb-2 w-full py-2 text-[13px] text-ink3">先不了，算了</button>
          </>
        )}
      </div>
    </div>
  );
}
