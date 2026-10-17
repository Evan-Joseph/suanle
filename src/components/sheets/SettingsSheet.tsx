"use client";

import { useRef, useState } from "react";
import { ChevronDown, Cloud, CloudDownload, CloudUpload, Copy, Download, Upload } from "lucide-react";
import { dayKey, exportData, useApp, useUI, type Settings } from "@/lib/store";
import { syncAmbient } from "@/lib/sound";
import { Icon } from "../icons";
import { Sheet } from "../ui";

function Row({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-[56px] items-center justify-between gap-4 py-2">
      <div className="min-w-0">
        <div className="text-[15px] text-ink">{title}</div>
        {sub && <div className="mt-0.5 text-[12px] leading-snug text-mute">{sub}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={`relative h-[30px] w-[50px] rounded-full transition-colors duration-200 ${on ? "bg-ink" : "bg-faint"}`}>
      <span className={`absolute top-[3px] h-6 w-6 rounded-full bg-paper shadow transition-[left] duration-200 ${on ? "left-[23px]" : "left-[3px]"}`} />
    </button>
  );
}

export default function SettingsSheet() {
  const open = useUI((s) => s.sheet === "settings");
  const close = useUI((s) => s.close);
  const settings = useApp((s) => s.settings);
  const set = useApp((s) => s.setSettings);
  const toast = useUI((s) => s.toast);
  const fileRef = useRef<HTMLInputElement>(null);
  const [adv, setAdv] = useState(false);
  const [eng, setEng] = useState(settings.engine ?? { base: "", key: "", model: "" });
  const [wipe, setWipe] = useState(false);

  // 云同步状态
  const [cloudCode, setCloudCode] = useState<string | null>(null);
  const [cloudLoading, setCloudLoading] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoreInput, setRestoreInput] = useState("");
  const [restoreLoading, setRestoreLoading] = useState(false);

  const themes: { id: Settings["theme"]; label: string }[] = [
    { id: "system", label: "跟随系统" },
    { id: "day", label: "日间" },
    { id: "night", label: "夜间" },
  ];

  return (
    <Sheet open={open} onClose={close} title="设置" full>
      <div className="pb-8">
        <div className="divide-y divide-line">
          <Row title="外观">
            <div className="grid grid-cols-3 rounded-full bg-ink/[0.05] p-1">
              {themes.map((t) => (
                <button key={t.id} type="button" onClick={() => set({ theme: t.id })} className={`h-8 rounded-full px-3 text-[12.5px] transition ${settings.theme === t.id ? "bg-card font-semibold text-ink shadow-sm" : "text-mute"}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </Row>
          <Row title="声音" sub="揉纸、铜钱、颂钵的声音">
            <Switch on={settings.sound} onChange={(v) => set({ sound: v })} label="声音" />
          </Row>
          <Row title="茶室白噪音" sub="静心细雨与禅意轻鸣，助你平复心绪">
            <Switch
              on={settings.ambient}
              onChange={(v) => {
                set({ ambient: v });
                syncAmbient(v);
              }}
              label="茶室白噪音"
            />
          </Row>
          <Row title="震动" sub="摇卦、丢纸团时的触感">
            <Switch on={settings.haptics} onChange={(v) => set({ haptics: v })} label="震动" />
          </Row>
        </div>

        <div className="mt-6 text-[12.5px] text-mute">我的数据与换机同步</div>
        <p className="mt-1 text-[12px] leading-relaxed text-mute">聊过的话、命盘和小档案默认保存在本地。你可以导出为文件，也可以生成一串短 ID 云端跨机迁移。</p>
        
        {/* 云端跨机同步短 ID */}
        <div className="mt-3 rounded-[20px] border border-line bg-card/75 p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-ink/[0.06] text-ink">
                <Cloud className="h-4 w-4" />
              </span>
              <span className="text-[13.5px] font-medium text-ink">云备份 · 跨机找回</span>
            </div>
            <span className="text-[11px] text-mute">7天免输文件换机</span>
          </div>

          {cloudCode ? (
            <div className="rounded-xl border border-line/70 bg-paper-2/60 p-3 text-center space-y-2">
              <div className="text-[11.5px] text-mute">你的换机云同步码（7天内有效）：</div>
              <div className="font-mono text-[22px] font-bold tracking-widest text-ink select-all">
                {cloudCode}
              </div>
              <div className="flex justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(cloudCode);
                    toast("已复制同步码");
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1 text-[12px] text-on-ink transition active:scale-95"
                >
                  <Copy className="h-3 w-3" />
                  <span>复制同步码</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const text = `【算了 · 换机同步码】我的同步码是：${cloudCode}。在新设备浏览器打开算了，进入「我」-「设置」-「输入云同步码」填入即可找回全部记录。在新设备提取后，此设备将自动失效。`;
                    navigator.clipboard.writeText(text);
                    toast("已复制完整分享信息");
                  }}
                  className="inline-flex items-center gap-1 rounded-full border border-line bg-card px-3 py-1 text-[12px] text-ink-2 hover:bg-paper-2"
                >
                  <span>复制说明</span>
                </button>
              </div>
              <p className="text-[10.5px] text-mute leading-relaxed">
                在新设备的浏览器打开算了并输入此码即可找回。提取后旧端将自动失效，防止数据冲突。
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={cloudLoading}
                onClick={async () => {
                  setCloudLoading(true);
                  try {
                    const payload = exportData();
                    const anonId = useApp.getState().anonId;
                    const res = await fetch("/api/backup", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "export", anonId, payload }),
                    });
                    const data = await res.json();
                    if (data.ok && data.code) {
                      setCloudCode(data.code);
                      toast("已生成云同步码");
                    } else {
                      toast(data.error || "生成失败，请稍后重试");
                    }
                  } catch {
                    toast("网络异常，生成失败");
                  }
                  setCloudLoading(false);
                }}
                className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-ink px-3 text-[13px] font-medium text-on-ink shadow-sm transition active:scale-[0.98] disabled:opacity-50"
              >
                <CloudUpload className="h-4 w-4" />
                <span>{cloudLoading ? "正在上传..." : "生成云同步码"}</span>
              </button>

              <button
                type="button"
                onClick={() => setRestoreOpen(true)}
                className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-line bg-paper px-3 text-[13px] font-medium text-ink transition hover:bg-paper-2 active:scale-[0.98]"
              >
                <CloudDownload className="h-4 w-4" />
                <span>输入同步码找回</span>
              </button>
            </div>
          )}

          {/* 恢复输入弹窗 */}
          {restoreOpen && (
            <div className="rounded-xl border border-line/80 bg-paper-2/80 p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] font-medium text-ink">输入 8 位换机云同步码</span>
                <button
                  type="button"
                  onClick={() => setRestoreOpen(false)}
                  className="text-[11.5px] text-mute hover:text-ink"
                >
                  取消
                </button>
              </div>
              <input
                type="text"
                value={restoreInput}
                onChange={(e) => setRestoreInput(e.target.value.toUpperCase().replace(/\s+/g, ""))}
                placeholder="例如：SL-K8M4P2"
                className="h-10 w-full rounded-xl border border-line bg-card px-3 text-center font-mono text-[16px] font-bold tracking-widest text-ink outline-none placeholder:font-sans placeholder:text-[13px] placeholder:font-normal placeholder:tracking-normal focus:border-ink/50"
              />
              <button
                type="button"
                disabled={restoreLoading || !restoreInput.trim()}
                onClick={async () => {
                  const code = restoreInput.trim();
                  if (!code) return;
                  setRestoreLoading(true);

                  // 防覆盖保护：若本地已有数据，先自动下载一份本地快照备用
                  const curSessions = useApp.getState().sessions;
                  const curRecords = useApp.getState().records;
                  if (curSessions.length > 0 || curRecords.length > 0) {
                    try {
                      const blob = new Blob([exportData()], { type: "application/json" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `suanle-local-before-restore-${dayKey()}.json`;
                      a.click();
                      setTimeout(() => URL.revokeObjectURL(url), 2000);
                    } catch {}
                  }

                  try {
                    const res = await fetch("/api/backup", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "restore", code, newAnonId: useApp.getState().anonId }),
                    });
                    const data = await res.json();
                    if (data.ok && data.payload) {
                      const parsed = JSON.parse(data.payload);
                      const ok = useApp.getState().importData(parsed);
                      if (ok) {
                        toast("历史记录与命盘已全部找回！欢迎回来");
                        setRestoreOpen(false);
                        setRestoreInput("");
                      } else {
                        toast("备份数据解析异常");
                      }
                    } else {
                      toast(data.error || "找回失败，请核对同步码");
                    }
                  } catch {
                    toast("网络连接失败，请重试");
                  }
                  setRestoreLoading(false);
                }}
                className="h-9 w-full rounded-xl bg-ink text-[12.5px] font-medium text-on-ink transition active:scale-[0.98] disabled:opacity-40"
              >
                {restoreLoading ? "正在同步恢复..." : "立即找回历史进度"}
              </button>
            </div>
          )}
        </div>

        {/* 传统文件备份 */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              const blob = new Blob([exportData()], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `suanle-${dayKey()}.json`;
              a.click();
              setTimeout(() => URL.revokeObjectURL(url), 2000);
              toast("已导出本地备份文件");
            }}
            className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-line bg-card/70 text-[13px] text-ink transition active:scale-[0.98]"
          >
            <Icon as={Download} size={15} /> 导出本地文件
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-line bg-card/70 text-[13px] text-ink transition active:scale-[0.98]"
          >
            <Icon as={Upload} size={15} /> 导入本地文件
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              f.text()
                .then((t) => toast(useApp.getState().importData(JSON.parse(t)) ? "导入成功，都回来了" : "文件格式不兼容"))
                .catch(() => toast("文件读取失败"));
            }}
          />
        </div>
        <button
          type="button"
          onClick={() => {
            if (!wipe) {
              setWipe(true);
              setTimeout(() => setWipe(false), 3000);
              return;
            }
            useApp.getState().resetAll();
            setWipe(false);
            close();
            toast("都清空了。重新开始，也很好");
          }}
          className={`mt-2 h-11 w-full rounded-2xl text-[14px] transition ${wipe ? "bg-seal/10 text-seal" : "text-mute"}`}
        >
          {wipe ? "再点一次，清空全部记录" : "清空全部记录"}
        </button>

        <button type="button" onClick={() => setAdv(!adv)} className="mt-6 flex w-full items-center justify-between py-2 text-[12.5px] text-mute">
          高级
          <Icon as={ChevronDown} size={16} className={`transition-transform ${adv ? "rotate-180" : ""}`} />
        </button>
        {adv && (
          <div className="rounded-[20px] border border-line bg-card/70 p-4">
            <div className="text-[14px] text-ink">使用自己的模型服务</div>
            <p className="mt-1 text-[12px] leading-relaxed text-mute">可选。填好后，对话会改用你自己的服务（需兼容 OpenAI 接口）；留空则使用默认服务。</p>
            <div className="mt-3 space-y-2">
              {(
                [
                  ["base", "服务地址", "https://…/v1"],
                  ["key", "密钥", "sk-…"],
                  ["model", "模型名", "gemini-4-argon"],
                ] as const
              ).map(([k, label, ph]) => (
                <label key={k} className="block">
                  <span className="mb-1 block text-[12px] text-mute">{label}</span>
                  <input
                    value={eng[k]}
                    type={k === "key" ? "password" : "text"}
                    autoComplete="off"
                    spellCheck={false}
                    onChange={(e) => setEng({ ...eng, [k]: e.target.value.trim() })}
                    placeholder={ph}
                    className="h-10 w-full rounded-xl border border-line bg-card px-3 font-mono text-[13px] text-ink outline-none focus:border-ink/40"
                  />
                </label>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  set({ engine: { base: "", key: "", model: "" } });
                  setEng({ base: "", key: "", model: "" });
                  toast("已改回默认服务");
                }}
                className="h-10 rounded-xl border border-line text-[13.5px] text-ink-2"
              >
                恢复默认
              </button>
              <button
                type="button"
                onClick={() => {
                  set({ engine: eng.key ? eng : null });
                  toast(eng.key ? "保存好了" : "已改回默认服务");
                }}
                className="h-10 rounded-xl bg-ink text-[13.5px] text-on-ink"
              >
                保存
              </button>
            </div>
          </div>
        )}
        <div className="mt-10 text-center text-[11.5px] leading-relaxed text-faint">
          算了 · Suanle 1.0
          <br />
          算一算，然后，算了。
        </div>
      </div>
    </Sheet>
  );
}
