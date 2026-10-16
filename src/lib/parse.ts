import remend from "remend";

export interface Memo {
  name?: string;
  birth?: string;
  gender?: string;
  city?: string;
  facts?: string[];
  tags?: string[];
}

export interface ParsedReply {
  think: string | null;
  thinkOpen: boolean;
  body: string;
  memo: Memo | null;
}

/** 解析助手原文：<think> 推演笔记、<memo> 画像；兼容流式中的半截标签 */
export function parseAssistant(raw: string, streaming = false): ParsedReply {
  let s = raw ?? "";
  let think: string | null = null;
  let thinkOpen = false;

  const ti = s.indexOf("<think>");
  if (ti !== -1) {
    const te = s.indexOf("</think>", ti);
    if (te === -1) {
      think = s.slice(ti + 7);
      thinkOpen = true;
      s = s.slice(0, ti);
    } else {
      think = s.slice(ti + 7, te);
      s = s.slice(0, ti) + s.slice(te + 8);
    }
  }

  let memo: Memo | null = null;
  const mi = s.indexOf("<memo>");
  if (mi !== -1) {
    const me = s.indexOf("</memo>", mi);
    if (me !== -1) {
      const inner = s
        .slice(mi + 6, me)
        .replace(/```(?:json)?/g, "")
        .trim();
      try {
        memo = JSON.parse(inner) as Memo;
      } catch {
        memo = null;
      }
      s = s.slice(0, mi) + s.slice(me + 7);
    } else {
      s = s.slice(0, mi);
    }
  }
  s = s.replace(/<\/?(think|memo)>/g, "");
  if (streaming) s = s.replace(/<\/?[a-z]{0,6}$/i, "");
  return { think: think?.trim() ?? null, thinkOpen, body: s.trim(), memo };
}

export type Segment = { kind: "md"; text: string } | { kind: "widget"; raw: string; idx: number };

/** 把正文切成 Markdown 段与互动卡片段；流式时隐藏半截卡片、补齐未闭合标记 */
export function segmentBody(body: string, streaming: boolean): { segments: Segment[]; widgetPending: boolean } {
  let s = body;
  let widgetPending = false;
  const fences = (s.match(/```/g) ?? []).length;
  if (fences % 2 === 1) {
    const last = s.lastIndexOf("```");
    const tail = s.slice(last);
    const typingLang = !tail.includes("\n") && !tail.includes("{");
    if (tail.startsWith("```suanle") || (streaming && typingLang)) {
      s = s.slice(0, last).trimEnd();
      widgetPending = streaming;
    } else {
      s = `${s}\n\`\`\``;
    }
  }
  const raw: Segment[] = [];
  const re = /```suanle\s*([\s\S]*?)```/g;
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  let wi = 0;
  while ((m = re.exec(s))) {
    if (m.index > lastIdx) raw.push({ kind: "md", text: s.slice(lastIdx, m.index) });
    raw.push({ kind: "widget", raw: m[1].trim(), idx: wi++ });
    lastIdx = m.index + m[0].length;
  }
  if (lastIdx < s.length) raw.push({ kind: "md", text: s.slice(lastIdx) });
  const segments = raw
    .map((seg, i): Segment => (seg.kind === "md" ? { kind: "md", text: tidyMarkdown(seg.text, streaming && i === raw.length - 1) } : seg))
    .filter((seg) => seg.kind === "widget" || seg.text.trim().length > 0);
  return { segments, widgetPending };
}

/** 对话版面规范：标题降为加粗、去掉裸露的标记符，流式时用 remend 补齐 */
export function tidyMarkdown(input: string, streaming: boolean): string {
  let s = input.replace(/\r/g, "");
  s = s.replace(/^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/gm, (_m, t: string) => `**${t.replace(/\*\*/g, "").trim()}**`);
  s = s.replace(/^\s{0,3}#{1,6}\s*$/gm, "");
  s = s.replace(/^\s*(\*{3,}|-{3,}|_{3,})\s*$/gm, "---");
  if (streaming) {
    s = s.replace(/(^|\n)\s*(#{1,6}|[-*+>]|\d+[.)、])\s*$/, "$1");
    s = remend(s);
  }
  return s.trim();
}

/** 发送给模型的历史：去掉画像标签与推演笔记 */
export function stripForHistory(raw: string): string {
  return parseAssistant(raw, false).body;
}

/** 复制 / 分享用纯文本 */
export function plainText(body: string): string {
  return body
    .replace(/```suanle[\s\S]*?```/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1$2")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** 取出回复里的「算了」箴言（最后一个引用块） */
export function letgoLine(body: string): string | null {
  const quotes = body.match(/^>\s?.+$/gm);
  if (!quotes?.length) return null;
  return quotes[quotes.length - 1].replace(/^>\s?/, "").replace(/\*\*/g, "").trim() || null;
}
