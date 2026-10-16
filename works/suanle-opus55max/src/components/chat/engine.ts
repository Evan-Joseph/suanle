"use client";

import { deepLeft, engineHeaders, lampActive, uid, useApp, useUI } from "@/lib/store";
import { introText, localTitle, mockReply, type ChatMsg } from "@/lib/mock";
import { parseAssistant, stripForHistory } from "@/lib/parse";
import { todayAlmanac } from "@/lib/divination";

let abortCtl: AbortController | null = null;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type WidgetKind = "coins" | "tarot" | "bazi" | "ziwei" | "almanac" | "letgo";

export const isBusy = () => !!useUI.getState().live;

export function canDeep(): boolean {
  const s = useApp.getState();
  return lampActive(s) || deepLeft(s) > 0;
}

function announceSent() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("suanle:sent"));
}

function ensureSession(fresh?: boolean): string {
  const app = useApp.getState();
  let sid = fresh ? null : app.currentId;
  const existing = sid ? app.sessions.find((s) => s.id === sid) : undefined;
  if (!sid || !existing) sid = app.newSession();
  const session = useApp.getState().sessions.find((s) => s.id === sid);
  if (session && session.messages.length === 0) {
    app.appendMessage(sid, { id: uid(), role: "assistant", content: introText(app.profile.name), createdAt: Date.now() - 1, intro: true });
  }
  return sid;
}

export async function sendMessage(text: string, opts: { quote?: string; fresh?: boolean; deep?: boolean } = {}) {
  const t = text.trim();
  if (!t || isBusy()) return;
  const deep = !!opts.deep;
  if (deep && !canDeep()) {
    useUI.getState().open("lamp", { reason: "deep" });
    return;
  }
  const sid = ensureSession(opts.fresh);
  const app = useApp.getState();
  app.appendMessage(sid, { id: uid(), role: "user", content: t, quote: opts.quote, createdAt: Date.now() });
  useUI.getState().setQuote(null);
  useUI.getState().setDeepArmed(false);
  if (deep && !lampActive(useApp.getState())) app.spendDeep();
  announceSent();
  await runAssistant(sid, deep);
}

const WIDGET_SCRIPT: Record<WidgetKind, { title: string; user: string; reply: (birth?: string) => string }> = {
  coins: { title: "摇一卦", user: "想摇一卦", reply: () => "好。心里默念一件想问的事，**越具体越好**——比如\"这周要不要主动找他聊聊\"。准备好了就摇，一共六次。" },
  tarot: { title: "三张塔罗", user: "想抽三张塔罗", reply: () => "牌洗好了。深呼吸，凭第一眼的感觉选三张，别想太多。" },
  bazi: { title: "我的八字", user: "看看我的八字", reply: (b) => (b ? "你的盘在这儿。想细看哪一块，跟我说。" : "看命盘得先知道你哪天来到这个世界。填一下就好，时辰不记得也没关系。") },
  ziwei: { title: "紫微命盘", user: "看看我的紫微命盘", reply: (b) => (b ? "十二宫排好了。想细看哪一宫，跟我说。" : "紫微看得细，需要生辰，时辰越准越好。") },
  almanac: {
    title: "今日黄历",
    user: "今天黄历怎么样",
    reply: () => {
      const a = todayAlmanac();
      return `今天农历${a.lunarText}，${a.dayGz}日。宜${a.yi.slice(0, 2).join("、")}，忌${a.ji.slice(0, 2).join("、")}——古人的宜忌听一半，另一半听你自己的。`;
    },
  },
  letgo: { title: "想算了的事", user: "有件事想算了", reply: () => "那就写下来，揉成一团，丢掉。手往往比脑子先学会放下。" },
};

/** 直接在对话里摆出一张互动卡片，不必等模型回话 */
export function openWidget(kind: WidgetKind, opts: { fresh?: boolean } = {}) {
  if (isBusy()) {
    useUI.getState().toast("等我说完这句");
    return;
  }
  useUI.getState().setTab("chat");
  const sid = ensureSession(opts.fresh);
  const app = useApp.getState();
  const script = WIDGET_SCRIPT[kind];
  const now = Date.now();
  app.appendMessage(sid, { id: uid(), role: "user", content: script.user, createdAt: now });
  app.appendMessage(sid, {
    id: uid(),
    role: "assistant",
    content: `${script.reply(app.profile.birth)}\n\n\`\`\`suanle\n${JSON.stringify({ widget: kind })}\n\`\`\``,
    createdAt: now + 1,
    local: true,
  });
  const s = useApp.getState().sessions.find((x) => x.id === sid);
  if (s && s.titledAt === undefined && s.messages.filter((m) => m.role === "user").length <= 1) app.patchSession(sid, { title: script.title, category: "占卜" });
  announceSent();
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
    content: m.role === "assistant" ? stripForHistory(m.content) : m.quote ? `（引用你说过的：「${m.quote}」）\n${m.content}` : m.content,
  }));
  const p = app.profile;
  const profile = { name: p.name, birth: p.birth, gender: p.gender, city: p.city, facts: p.facts.slice(-12), tags: p.tags };

  const msgId = uid();
  const started = Date.now();
  useUI.getState().setLive({ sessionId: sid, msgId, content: "", started, deep });
  const ctl = new AbortController();
  abortCtl = ctl;

  let content = "";
  let reasoning = "";
  let tokens = 0;
  let local = false;
  let thinkEnd = 0;
  let raf = 0;

  const compose = () => (reasoning ? `<think>${reasoning}${content ? "</think>" : ""}${content}` : content);
  const flush = () => {
    raf = 0;
    useUI.getState().setLive({ sessionId: sid, msgId, content: compose(), started, deep });
  };
  const schedule = () => {
    if (!thinkEnd && ((reasoning && content) || content.includes("</think>") || (content.length > 8 && !content.includes("<think>")))) thinkEnd = Date.now();
    if (!raf) raf = requestAnimationFrame(flush);
  };

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...engineHeaders() },
      body: JSON.stringify({ messages: history, profile, deep, anonId: app.anonId, tzOffset: new Date().getTimezoneOffset() }),
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
          ev = JSON.parse(line) as { t: string; v?: unknown };
        } catch {
          continue;
        }
        if (ev.t === "d") content += String(ev.v ?? "");
        else if (ev.t === "r") reasoning += String(ev.v ?? "");
        else if (ev.t === "u") tokens = Number(ev.v) || 0;
        else if (ev.t === "l") local = true;
        schedule();
      }
    }
  } catch {
    if (!ctl.signal.aborted && !content && !reasoning) {
      // 网络断了也不让人落空：本地接住
      local = true;
      const text = mockReply(history, profile, { deep });
      for (const c of text.match(/[\s\S]{1,4}/g) ?? []) {
        if (ctl.signal.aborted) break;
        content += c;
        schedule();
        await sleep(14);
      }
    }
  }
  if (raf) cancelAnimationFrame(raf);
  const final = compose();
  const thinkSec = Math.max(1, Math.round(((thinkEnd || Date.now()) - started) / 1000));

  if (final.trim()) {
    const cost = local ? 0 : tokens || Math.ceil((JSON.stringify(history).length + final.length) * 0.9) + 1200;
    useApp.getState().appendMessage(sid, { id: msgId, role: "assistant", content: final, createdAt: Date.now(), tokens: cost, thinkSec, deep, local });
    const parsed = parseAssistant(final);
    if (parsed.memo) useApp.getState().mergeMemo(parsed.memo);
    if (cost) useApp.getState().addUsage(cost);
  } else if (!ctl.signal.aborted) {
    useApp.getState().appendMessage(sid, { id: msgId, role: "assistant", content: "刚刚那句话好像被风吹走了。要不，再说一次？", createdAt: Date.now(), local: true });
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
  const due = s.titledAt === undefined ? n >= 2 : n - s.titledAt >= 8;
  if (!due) return;
  useApp.getState().patchSession(sid, { titledAt: n });
  const payload = msgs.slice(-10).map((m) => ({ role: m.role, content: m.role === "assistant" ? stripForHistory(m.content).slice(0, 400) : m.content.slice(0, 400) }));
  const firstUser = msgs.find((m) => m.role === "user")?.content ?? "";
  try {
    const r = await fetch("/api/title", { method: "POST", headers: { "Content-Type": "application/json", ...engineHeaders() }, body: JSON.stringify({ messages: payload }) });
    const j = (await r.json()) as { title?: string; category?: string };
    if (j.title) useApp.getState().patchSession(sid, { title: j.title, category: j.category ?? "日常" });
  } catch {
    useApp.getState().patchSession(sid, localTitle(firstUser));
  }
}

/** 从其它页面把内容带进对话 */
export function bringToChat(text: string, opts: { fresh?: boolean; deep?: boolean } = {}) {
  useUI.getState().closePanel();
  useUI.getState().close();
  useUI.getState().setTab("chat");
  setTimeout(() => void sendMessage(text, { fresh: opts.fresh ?? true, deep: opts.deep }), 80);
}

export function newChat() {
  if (isBusy()) stopStreaming();
  useApp.getState().setCurrent(null);
  useUI.getState().setQuote(null);
  useUI.getState().setTab("chat");
}
