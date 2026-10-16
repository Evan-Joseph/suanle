"use client";

import { useRef, useState } from "react";
import { ChevronDown, Download, Upload } from "lucide-react";
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

        <div className="mt-6 text-[12.5px] text-mute">我的数据</div>
        <p className="mt-1 text-[12px] leading-relaxed text-mute">聊过的话、命盘和小档案都只存在这台设备上。换手机前，记得先备份。</p>
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
              toast("备份好了");
            }}
            className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-line bg-card/70 text-[14px] text-ink transition active:scale-[0.98]"
          >
            <Icon as={Download} size={17} /> 备份到文件
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-line bg-card/70 text-[14px] text-ink transition active:scale-[0.98]">
            <Icon as={Upload} size={17} /> 从备份恢复
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
                .then((t) => toast(useApp.getState().importData(JSON.parse(t)) ? "都回来了" : "这个文件好像不太对"))
                .catch(() => toast("这个文件好像不太对"));
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
