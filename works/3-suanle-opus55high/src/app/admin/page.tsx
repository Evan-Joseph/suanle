"use client";

import { useEffect, useState } from "react";
import { yuan } from "@/lib/pricing";
import { Logo } from "@/components/ui";

type Data = {
  donations: { id: string; userId: string; kind: string; item: string; amount: number; channel: string; status: string; createdAt: string }[];
  stats: { users: number; conversations: number; readings: number; revenue: number };
  settings: { wechat: string | null; alipay: string | null; payee: string | null };
};

async function call(method: string, token: string, body?: unknown) {
  const res = await fetch("/api/admin", { method, headers: { "Content-Type": "application/json", "x-admin-token": token }, body: body ? JSON.stringify({ token, ...body }) : undefined });
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}

function fileToDataUrl(f: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(f);
  });
}

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState("");
  const [payee, setPayee] = useState("");

  const load = async (t = token) => {
    setErr("");
    try {
      const d: Data = await call("GET", t);
      setData(d);
      setPayee(d.settings.payee ?? "");
      sessionStorage.setItem("suanle.admin", t);
    } catch {
      setErr("口令不对");
      setData(null);
    }
  };

  useEffect(() => {
    const t = sessionStorage.getItem("suanle.admin");
    if (t) { setToken(t); load(t); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const upload = async (k: "wechat" | "alipay", f?: File) => {
    if (!f) return;
    if (f.size > 1_000_000) { setErr("图片请小于 1MB"); return; }
    const url = await fileToDataUrl(f);
    await call("POST", token, { [k]: url }).catch(() => setErr("上传失败"));
    load();
  };

  if (!data) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-8">
        <Logo size={44} className="text-ink" />
        <div className="mt-4 font-serif text-[18px]">后台</div>
        <input type="password" value={token} onChange={(e) => setToken(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} placeholder="管理口令" className="mt-6 w-full max-w-[300px] rounded-2xl border border-line bg-white px-4 py-3 outline-none" />
        <button onClick={() => load()} className="mt-3 w-full max-w-[300px] rounded-full bg-ink py-3 text-paper">进入</button>
        {err && <div className="mt-3 text-[13px] text-clay">{err}</div>}
      </div>
    );
  }

  return (
    <div className="scroll-area h-full px-4 pb-10" style={{ paddingTop: "calc(var(--safe-t) + 20px)" }}>
      <div className="flex items-center justify-between">
        <div className="font-serif text-[22px]">后台</div>
        <button onClick={() => { sessionStorage.removeItem("suanle.admin"); setData(null); }} className="text-[13px] text-sub">退出</button>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2 text-center">
        {[["用户", data.stats.users], ["对话", data.stats.conversations], ["档案", data.stats.readings], ["累计 ¥", yuan(data.stats.revenue)]].map(([k, v]) => (
          <div key={k} className="rounded-2xl bg-white p-3"><div className="text-[11px] text-sub">{k}</div><div className="mt-1 font-mono text-[16px]">{v}</div></div>
        ))}
      </div>

      <div className="mt-5 rounded-3xl bg-white p-4">
        <div className="mb-3 font-serif text-[16px]">收款码</div>
        <div className="grid grid-cols-2 gap-3">
          {(["wechat", "alipay"] as const).map((k) => (
            <label key={k} className="flex cursor-pointer flex-col items-center rounded-2xl border border-dashed border-line p-3">
              {data.settings[k] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.settings[k]!} alt={k} className="h-28 w-28 object-contain" />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center text-[12px] text-faint">点击上传</div>
              )}
              <div className="mt-2 text-[12.5px] text-sub">{k === "wechat" ? "微信" : "支付宝"}</div>
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => upload(k, e.target.files?.[0])} />
            </label>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input value={payee} onChange={(e) => setPayee(e.target.value)} placeholder="收款方名称" className="min-w-0 flex-1 rounded-xl border border-line px-3 py-2 text-[14px] outline-none" />
          <button onClick={async () => { await call("POST", token, { payee }); load(); }} className="shrink-0 rounded-xl bg-ink px-4 text-[13px] text-paper">保存</button>
        </div>
        {err && <div className="mt-2 text-[12.5px] text-clay">{err}</div>}
      </div>

      <div className="mt-5 rounded-3xl bg-white p-4">
        <div className="mb-2 font-serif text-[16px]">付款记录</div>
        {data.donations.length === 0 ? (
          <div className="py-6 text-center text-[13px] text-faint">还没有记录</div>
        ) : data.donations.map((d) => (
          <div key={d.id} className="flex items-center gap-2 border-t border-line py-2.5 text-[12.5px] first:border-0">
            <div className="min-w-0 flex-1">
              <div className="truncate text-ink">{d.item}</div>
              <div className="truncate text-[11px] text-faint">{d.userId.slice(0, 10)} · {d.channel} · {new Date(d.createdAt).toLocaleString("zh-CN", { hour12: false })}</div>
            </div>
            <div className="shrink-0 font-mono">¥{yuan(d.amount)}</div>
            <select value={d.status} onChange={async (e) => { await call("PATCH", token, { id: d.id, status: e.target.value }); load(); }} className="shrink-0 rounded-lg border border-line bg-paper px-1.5 py-1 text-[11.5px]">
              <option value="claimed">待核对</option>
              <option value="confirmed">已到账</option>
              <option value="rejected">未到账</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
