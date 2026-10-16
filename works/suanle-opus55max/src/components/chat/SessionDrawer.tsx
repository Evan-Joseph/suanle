"use client";

import { useMemo, useState } from "react";
import { Search, SquarePen, Trash2 } from "lucide-react";
import { useApp, useUI } from "@/lib/store";
import { Icon } from "../icons";
import { Drawer, IconButton, timeAgo } from "../ui";
import { newChat } from "./engine";

const CAT_COLOR: Record<string, string> = {
  情感: "#c4553a",
  事业: "#5a7186",
  学业: "#74866a",
  财运: "#a9844a",
  健康: "#6f8f5e",
  家庭: "#b0705a",
  人际: "#7a6a8a",
  占卜: "#2b2b2b",
  日常: "#958f86",
};

export default function SessionDrawer() {
  const open = useUI((s) => s.sheet === "sessions");
  const close = useUI((s) => s.close);
  const sessions = useApp((s) => s.sessions);
  const currentId = useApp((s) => s.currentId);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const visible = useMemo(() => sessions.filter((s) => s.messages.some((m) => m.role === "user")), [sessions]);
  const cats = useMemo(() => Array.from(new Set(visible.map((s) => s.category))), [visible]);
  const list = visible.filter((s) => (!cat || s.category === cat) && (!q.trim() || s.title.includes(q.trim()) || s.messages.some((m) => m.content.includes(q.trim()))));

  return (
    <Drawer open={open} onClose={close}>
      <div className="pt-safe shrink-0">
        <div className="flex h-14 items-center justify-between pl-5 pr-2">
          <h2 className="font-song text-[19px] font-bold">聊过的事</h2>
          <IconButton
            label="新对话"
            onClick={() => {
              newChat();
              close();
            }}
          >
            <Icon as={SquarePen} size={20} />
          </IconButton>
        </div>
        <div className="px-4">
          <label className="flex h-10 items-center gap-2 rounded-2xl bg-ink/[0.045] px-3">
            <Icon as={Search} size={16} className="text-mute" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="找找聊过的事" className="h-full min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-mute" />
          </label>
        </div>
        {cats.length > 1 && (
          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
            <button type="button" onClick={() => setCat(null)} className={`h-7 shrink-0 rounded-full px-3 text-[12.5px] ${!cat ? "bg-ink text-on-ink" : "bg-ink/[0.045] text-ink-2"}`}>
              全部
            </button>
            {cats.map((c) => (
              <button key={c} type="button" onClick={() => setCat(c === cat ? null : c)} className={`h-7 shrink-0 rounded-full px-3 text-[12.5px] ${cat === c ? "bg-ink text-on-ink" : "bg-ink/[0.045] text-ink-2"}`}>
                {c}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="no-scrollbar mt-2 min-h-0 flex-1 overflow-y-auto px-2 pb-6">
        {list.length === 0 ? (
          <div className="px-6 pt-16 text-center text-[13.5px] leading-relaxed text-mute">{visible.length ? "没找到相关的对话" : "还没有聊过的事。\n说点什么，它会被好好收在这里。"}</div>
        ) : (
          list.map((s) => {
            const active = s.id === currentId;
            return (
              <div key={s.id} className={`group flex items-center gap-1 rounded-2xl pr-1 transition ${active ? "bg-ink/[0.06]" : "hover:bg-ink/[0.03]"}`}>
                <button
                  type="button"
                  onClick={() => {
                    useApp.getState().setCurrent(s.id);
                    useUI.getState().setTab("chat");
                    close();
                  }}
                  className="flex min-w-0 flex-1 items-center gap-3 py-2.5 pl-3 text-left"
                >
                  <span
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] border font-song text-[13px] font-bold"
                    style={{ color: CAT_COLOR[s.category] ?? "#958f86", borderColor: `${CAT_COLOR[s.category] ?? "#958f86"}40` }}
                  >
                    {s.category.charAt(0)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14.5px] text-ink">{s.title}</span>
                    <span className="mt-0.5 block text-[11.5px] text-mute">
                      {s.category} · {timeAgo(s.updatedAt)}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  aria-label="删除"
                  onClick={() => {
                    if (confirmId === s.id) {
                      useApp.getState().deleteSession(s.id);
                      setConfirmId(null);
                      useUI.getState().toast("删掉了，算了");
                    } else {
                      setConfirmId(s.id);
                      setTimeout(() => setConfirmId((v) => (v === s.id ? null : v)), 2400);
                    }
                  }}
                  className={`grid h-9 shrink-0 place-items-center rounded-full px-2 text-[12px] transition ${confirmId === s.id ? "bg-seal/10 text-seal" : "w-9 text-faint hover:text-mute"}`}
                >
                  {confirmId === s.id ? "确认删除" : <Icon as={Trash2} size={16} />}
                </button>
              </div>
            );
          })
        )}
      </div>
    </Drawer>
  );
}
