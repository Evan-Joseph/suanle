export interface Memo {
  name?: string; birth?: string; gender?: string; city?: string; facts?: string[]; tags?: string[];
}

export type WidgetSpec =
  | { widget: "coins"; question?: string }
  | { widget: "tarot"; question?: string }
  | { widget: "bazi" }
  | { widget: "almanac" }
  | { widget: "letgo"; text?: string }
  | { widget: "tip" };

export interface ParsedAssistant {
  thinking: string;       // 推演笔记（可能为空）
  thinkingOpen: boolean;  // 流式中 <think> 尚未闭合
  body: string;           // 正文（已去除 memo 与 widget 代码块）
  widget: WidgetSpec | null;
  widgetPending: boolean; // 代码块尚未闭合
  memo: Memo | null;
}

const THINK_OPEN = "<think>";
const THINK_CLOSE = "</think>";

export function parseAssistant(raw: string): ParsedAssistant {
  let text = raw ?? "";
  let thinking = "";
  let thinkingOpen = false;

  // 1. 推演
  const ti = text.indexOf(THINK_OPEN);
  if (ti !== -1) {
    const te = text.indexOf(THINK_CLOSE, ti);
    if (te === -1) {
      thinking = text.slice(ti + THINK_OPEN.length);
      text = text.slice(0, ti);
      thinkingOpen = true;
    } else {
      thinking = text.slice(ti + THINK_OPEN.length, te);
      text = text.slice(0, ti) + text.slice(te + THINK_CLOSE.length);
    }
  }
  // 残留的半截标签（流式阶段）
  text = text.replace(/<\/?thin?k?>?$/i, "");

  // 2. memo
  let memo: Memo | null = null;
  const mi = text.indexOf("<memo>");
  if (mi !== -1) {
    const me = text.indexOf("</memo>", mi);
    const json = me === -1 ? "" : text.slice(mi + 6, me);
    text = text.slice(0, mi) + (me === -1 ? "" : text.slice(me + 7));
    if (json) {
      try { memo = JSON.parse(json) as Memo; } catch { memo = null; }
    }
  }
  text = text.replace(/<\/?mem?o?>?$/i, "");

  // 3. widget 代码块
  let widget: WidgetSpec | null = null;
  let widgetPending = false;
  const wi = text.indexOf("```suanle");
  if (wi !== -1) {
    const we = text.indexOf("```", wi + 9);
    if (we === -1) {
      widgetPending = true;
      text = text.slice(0, wi);
    } else {
      const json = text.slice(wi + 9, we).trim();
      text = text.slice(0, wi) + text.slice(we + 3);
      try {
        const obj = JSON.parse(json) as WidgetSpec;
        if (obj && typeof obj.widget === "string") widget = obj;
      } catch { widget = null; }
    }
  } else if (/```s?u?a?n?l?e?$/.test(text.trimEnd()) && raw.trimEnd().endsWith(text.trimEnd().match(/```s?u?a?n?l?e?$/)?.[0] ?? "")) {
    // 流式中代码块刚开头
    text = text.replace(/```s?u?a?n?l?e?$/, "");
    widgetPending = true;
  }

  return { thinking: thinking.trim(), thinkingOpen, body: text.trim(), widget, widgetPending, memo };
}

/** 发给模型的历史：去掉 memo，保留 think 之外的正文与卡片描述 */
export function stripForHistory(raw: string): string {
  const p = parseAssistant(raw);
  const w = p.widget ? `\n（已向用户展示 ${p.widget.widget} 卡片）` : "";
  return p.body + w;
}

/** 流式阶段把未闭合的 Markdown 标记补齐，避免裸露符号 */
export function closeMarkdown(md: string): string {
  let s = md;
  const fences = (s.match(/```/g) || []).length;
  if (fences % 2 === 1) s += "\n```";
  const bold = (s.match(/\*\*/g) || []).length;
  if (bold % 2 === 1) s += "**";
  const lastLine = s.split("\n").pop() ?? "";
  const ticks = (lastLine.match(/`/g) || []).length;
  if (ticks % 2 === 1) s += "`";
  return s;
}

export function fmtTokens(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)} 万`;
  return n.toLocaleString("zh-CN");
}

export function dayKey(d = new Date()): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
