import { useApp, useUI, uid, lampActive } from "./store";
import { mockReply, welcomeBack, WELCOME_NEW, type ChatMsg } from "./mock";
import { parseAssistant, stripForHistory } from "./parse";
import { streamChat, complete, extractJSON, type LLMMessage } from "./llm";
import { buildSystemPrompt, TITLE_PROMPT, BASIS_PROMPT } from "./prompt";
import { pickLocalBasis, type Basis } from "./meter";

let abortCtl: AbortController | null = null;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const isBusy = () => !!useUI.getState().live;

export function introText() {
  const name = useApp.getState().profile.name;
  return name ? welcomeBack(name) : WELCOME_NEW;
}

export async function sendMessage(text: string, opts: { quote?: string; fresh?: boolean; deep?: boolean } = {}) {
  const t = text.trim();
  if (!t || isBusy()) return;
  const app = useApp.getState();
  let sid = opts.fresh ? null : app.currentId;
  if (!sid || !app.sessions.find((s) => s.id === sid)) sid = app.newSession();
  else app.setCurrent(sid);
  const session = useApp.getState().sessions.find((s) => s.id === sid);
  if (session && session.messages.length === 0) {
    app.appendMessage(sid, { id: uid(), role: "assistant", content: introText(), createdAt: Date.now() - 1, intro: true });
  }
  app.appendMessage(sid, { id: uid(), role: "user", content: t, quote: opts.quote, createdAt: Date.now() });
  useUI.getState().setQuote(null);
  const deep = !!opts.deep;
  if (deep && !lampActive(useApp.getState())) app.spendDeep();
  await runAssistant(sid, deep);
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

  const messages: LLMMessage[] = [{ role: "system", content: buildSystemPrompt(profile, { deep }) }, ...history];

  try {
    for await (const ev of streamChat(messages, { signal: ctl.signal, maxTokens: deep ? 3200 : 2000 })) {
      if (ev.type === "content") content += ev.text;
      else if (ev.type === "reasoning") reasoning += ev.text;
      else if (ev.type === "usage") tokens = ev.total;
      schedule();
    }
  } catch {
    if (!ctl.signal.aborted && !content && !reasoning) {
      // 线路不通也不让人落空：本地的老朋友接住
      offline = true;
      await sleep(500);
      const text = mockReply(history, profile);
      const chunks = text.match(/[\s\S]{1,4}/g) ?? [];
      for (const c of chunks) {
        if (ctl.signal.aborted) break;
        content += c;
        schedule();
        await sleep(18);
      }
    }
  }
  if (raf) cancelAnimationFrame(raf);
  const final = compose();
  if (!tokens) tokens = Math.ceil((JSON.stringify(messages).length + final.length) * 0.75);
  const thinkSec = Math.max(1, Math.round(((thinkEnd || Date.now()) - started) / 1000));

  if (final.trim()) {
    useApp.getState().appendMessage(sid, { id: msgId, role: "assistant", content: final, createdAt: Date.now(), tokens, offline, thinkSec, deep });
    const parsed = parseAssistant(final);
    if (parsed.memo) useApp.getState().mergeMemo(parsed.memo);
    useApp.getState().addUsage(tokens);
  } else if (!ctl.signal.aborted) {
    useApp.getState().appendMessage(sid, { id: msgId, role: "assistant", content: "刚刚那句话好像被风吹走了。要不，再说一次？", createdAt: Date.now(), offline: true });
  }
  useUI.getState().setLive(null);
  if (abortCtl === ctl) abortCtl = null;
  void maybeTitle(sid);
  void maybeRefreshBasis();
}

async function maybeTitle(sid: string) {
  const s = useApp.getState().sessions.find((x) => x.id === sid);
  if (!s) return;
  const msgs = s.messages.filter((m) => !m.intro);
  const n = msgs.length;
  const due = s.titledAt === undefined ? n >= 2 : n - s.titledAt >= 8;
  if (!due) return;
  useApp.getState().patchSession(sid, { titledAt: n });
  const convo = msgs
    .slice(-10)
    .map((m) => `${m.role === "user" ? "我" : "算了"}：${(m.role === "assistant" ? stripForHistory(m.content) : m.content).replace(/```suanle[\s\S]*?```/g, "").slice(0, 200)}`)
    .join("\n");
  try {
    const out = await complete([{ role: "system", content: TITLE_PROMPT }, { role: "user", content: convo }], { maxTokens: 120, temperature: 0.4 });
    const j = extractJSON<{ title?: string; category?: string; emoji?: string }>(out);
    if (j?.title) {
      useApp.getState().patchSession(sid, { title: j.title.replace(/[《》"「」]/g, "").slice(0, 14), category: j.category || "日常", emoji: j.emoji || "☁️" });
      return;
    }
    throw new Error("bad");
  } catch {
    const first = msgs.find((m) => m.role === "user")?.content ?? "随便聊聊";
    const t = first.replace(/\s+/g, " ").replace(/^(我想问|帮我|请问)[:：]?/, "").split("\n")[0];
    const cat = /卦|摇/.test(first) ? ["占卜", "🪙"] : /塔罗|牌/.test(first) ? ["占卜", "🃏"] : /生辰|八字|命/.test(first) ? ["命理", "📜"] : /烦|累|难过|焦虑/.test(first) ? ["情绪", "🌧️"] : ["日常", "☁️"];
    useApp.getState().patchSession(sid, { title: t.slice(0, 12), category: cat[0], emoji: cat[1] });
  }
}

let basisBusy = false;
/** 每隔一阵子，根据对方的画像重新挑选“生活类比物” */
export async function maybeRefreshBasis(force = false) {
  const s = useApp.getState();
  const { usage, profile } = s;
  const stale = Date.now() - usage.basisAt > 1000 * 60 * 60 * 6;
  if (basisBusy || (!force && usage.basisAt && !stale)) return;
  if (!force && !profile.tags.length && !profile.facts.length && usage.basisAt) return;
  basisBusy = true;
  const persona = [
    profile.name && `称呼${profile.name}`,
    profile.gender,
    profile.city && `在${profile.city}`,
    profile.tags.length && `关键词：${profile.tags.join("、")}`,
    profile.facts.length && `近况：${profile.facts.slice(-6).join("；")}`,
  ]
    .filter(Boolean)
    .join("；");
  try {
    const out = await complete([{ role: "system", content: BASIS_PROMPT }, { role: "user", content: persona || "一位刚认识的客人，还不太了解。" }], { maxTokens: 300, temperature: 0.9 });
    const j = extractJSON<{ items?: Basis[]; line?: string }>(out);
    const items = (j?.items ?? []).filter((x) => x && x.name && Number(x.yuan) > 0).slice(0, 3).map((x) => ({ emoji: String(x.emoji || "✨").slice(0, 4), name: String(x.name).slice(0, 10), unit: String(x.unit || "份").slice(0, 2), yuan: Number(x.yuan) }));
    if (items.length >= 2) useApp.getState().setBasis(items, (j?.line ?? "").slice(0, 30));
    else throw new Error("bad");
  } catch {
    useApp.getState().setBasis(pickLocalBasis(profile.tags, profile.facts.length), "");
  } finally {
    basisBusy = false;
  }
}

/** 从其他页面把内容带进对话 */
export function bringToChat(text: string, opts: { fresh?: boolean; deep?: boolean } = {}) {
  useUI.getState().setTab("chat");
  setTimeout(() => void sendMessage(text, { fresh: opts.fresh ?? true, deep: opts.deep }), 80);
}
