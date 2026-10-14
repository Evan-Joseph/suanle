"use client";

import { useApp, useUI, uid, lampActive, deepLeft } from "@/lib/store";
import { mockReply, welcomeBack, WELCOME_NEW, type ChatMsg } from "@/lib/mock";
import { parseAssistant, stripForHistory } from "@/lib/parse";

let abortCtl: AbortController | null = null;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function isBusy() {
  return !!useUI.getState().live;
}

export function introText() {
  const name = useApp.getState().profile.name;
  return name ? welcomeBack(name) : WELCOME_NEW;
}

/** 深度推演额度：长明灯不限，普通每日 3 次 */
export function canDeep(): boolean {
  const s = useApp.getState();
  return lampActive(s) || deepLeft(s) > 0;
}

export async function sendMessage(text: string, opts: { quote?: string; fresh?: boolean; deep?: boolean } = {}) {
  const t = text.trim();
  if (!t || isBusy()) return;
  const app = useApp.getState();
  let sid = opts.fresh ? null : app.currentId;
  if (!sid || !app.sessions.find((s) => s.id === sid)) sid = app.newSession();
  const session = useApp.getState().sessions.find((s) => s.id === sid);
  if (session && session.messages.length === 0) {
    app.appendMessage(sid, { id: uid(), role: "assistant", content: introText(), createdAt: Date.now() - 1, intro: true });
  }
  app.appendMessage(sid, { id: uid(), role: "user", content: t, quote: opts.quote, createdAt: Date.now() });
  useUI.getState().setQuote(null);
  let deep = !!opts.deep;
  if (deep) {
    if (!lampActive(useApp.getState())) app.spendDeep();
  }
  await runAssistant(sid, deep);
  deep = false;
}

export async function regenerate(sid: string) {
  if (isBusy()) return;
  const s = useApp.getState().sessions.find((x) => x.id === sid);
  if (!s) return;
  const last = s.messages[s.messages.length - 1];
  if (last?.role === "assistant" && !last.intro) useApp.getState().removeMessage(sid, last.id);
  await runAssistant(sid, !!last?.deep);
}

export function stopStreaming() {
  abortCtl?.abort();
}

async function runAssistant(sid: string, deep: boolean) {
  const app = useApp.getState();
  const session = app.sessions.find((s) => s.id === sid);
  if (!session) return;
  const history: ChatMsg[] = session.messages.slice(-20).map((m) => ({
    role: m.role,
    content: m.role === "assistant" ? stripForHistory(m.content) : m.quote ? `（引用你说的：「${m.quote}」）\n${m.content}` : m.content,
  }));
  const p = app.profile;
  const profile = { name: p.name, birth: p.birth, gender: p.gender, city: p.city, facts: p.facts, tags: p.tags };

  const msgId = uid();
  const started = Date.now();
  useUI.getState().setLive({ sessionId: sid, msgId, content: "", started });
  const ctl = new AbortController();
  abortCtl = ctl;

  let content = "";
  let reasoning = "";
  let tokens = 0;
  let offline = false;
  let thinkEnd = 0;
  let raf = 0;

  const compose = () => (reasoning ? `<think>${reasoning}${content ? "</think>" : ""}${content}` : content);
  const flush = () => {
    raf = 0;
    useUI.getState().setLive({ sessionId: sid, msgId, content: compose(), started });
  };
  const schedule = () => {
    if (!thinkEnd && ((reasoning && content) || content.includes("</think>") || (content.length > 8 && !content.includes("<think>")))) {
      thinkEnd = Date.now();
    }
    if (!raf) raf = requestAnimationFrame(flush);
  };

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history, profile, deep }),
      signal: ctl.signal,
    });
    if (!res.ok || !res.body) throw new Error("bad response");
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let idx: number;
      while ((idx = buf.indexOf("\n")) !== -1) {
        const line = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 1);
        if (!line) continue;
        let ev: { t: string; v?: unknown };
        try {
          ev = JSON.parse(line);
        } catch {
          continue;
        }
        if (ev.t === "d") content += String(ev.v ?? "");
        else if (ev.t === "r") reasoning += String(ev.v ?? "");
        else if (ev.t === "u") tokens = Number(ev.v) || 0;
        else if (ev.t === "o") offline = true;
        schedule();
      }
    }
  } catch {
    if (!ctl.signal.aborted && !content && !reasoning) {
      // 网络断了也不让人落空：本地老友接住
      offline = true;
      const text = mockReply(history, profile);
      const chunks = text.match(/[\s\S]{1,5}/g) ?? [];
      for (const c of chunks) {
        if (ctl.signal.aborted) break;
        content += c;
        schedule();
        await sleep(16);
      }
    }
  }
  if (raf) cancelAnimationFrame(raf);
  const final = compose();
  if (!tokens) tokens = Math.ceil((JSON.stringify(history).length + final.length) * 0.9) + 1200;
  const thinkSec = Math.max(1, Math.round(((thinkEnd || Date.now()) - started) / 1000));

  if (final.trim()) {
    useApp.getState().appendMessage(sid, { id: msgId, role: "assistant", content: final, createdAt: Date.now(), tokens, offline, thinkSec, deep });
    const parsed = parseAssistant(final);
    if (parsed.memo) useApp.getState().mergeMemo(parsed.memo);
    useApp.getState().addUsage(tokens);
  } else if (!ctl.signal.aborted) {
    useApp.getState().appendMessage(sid, {
      id: msgId,
      role: "assistant",
      content: "刚刚那句话好像被风吹走了。要不，再说一次？",
      createdAt: Date.now(),
      offline: true,
    });
  }
  useUI.getState().setLive(null);
  if (abortCtl === ctl) abortCtl = null;
  void maybeTitle(sid);
}

async function maybeTitle(sid: string) {
  const s = useApp.getState().sessions.find((x) => x.id === sid);
  if (!s) return;
  const msgs = s.messages.filter((m) => !m.intro);
  const n = msgs.length;
  const due = s.titledAt === undefined ? n >= 2 : n - s.titledAt >= 6;
  if (!due) return;
  useApp.getState().renameSession(sid, { titledAt: n });
  const payload = msgs.slice(-10).map((m) => ({ role: m.role, content: m.role === "assistant" ? stripForHistory(m.content) : m.content }));
  try {
    const r = await fetch("/api/title", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: payload }) });
    const j = (await r.json()) as { title?: string; category?: string; emoji?: string };
    if (j.title) useApp.getState().renameSession(sid, { title: j.title, category: j.category ?? "日常", emoji: j.emoji ?? "☁️" });
  } catch {
    const first = msgs.find((m) => m.role === "user")?.content ?? "随便聊聊";
    useApp.getState().renameSession(sid, { title: first.slice(0, 10) });
  }
}

/** 从其他页面把内容带进对话 */
export function bringToChat(text: string, opts: { fresh?: boolean; deep?: boolean } = {}) {
  useUI.getState().setTab("chat");
  setTimeout(() => void sendMessage(text, { fresh: opts.fresh ?? true, deep: opts.deep }), 60);
}
