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
  widgetPending: boolean;
}

/** 解析助手原文：<think> 推演、<memo> 画像、```suanle 卡片；兼容流式的半截标签 */
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
      const inner = s.slice(mi + 6, me).replace(/```(json)?/g, "").trim();
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
  // 去掉孤立的闭合标签和流式末尾半截标签
  s = s.replace(/<\/?(think|memo)>/g, "");
  if (streaming) s = s.replace(/<\/?[a-z]{0,6}$/i, "");

  const { text, widgetPending } = sanitizeMarkdown(s.trim(), streaming);
  return { think: think?.trim() ?? null, thinkOpen, body: text, memo, widgetPending };
}

export function sanitizeMarkdown(input: string, streaming: boolean): { text: string; widgetPending: boolean } {
  let s = input;
  let widgetPending = false;
  const fences = s.match(/^\s*```/gm) ?? [];
  if (fences.length % 2 === 1) {
    const last = s.lastIndexOf("```");
    const tail = s.slice(last);
    const firstLine = tail.split("\n")[0];
    const typingLang = streaming && !tail.includes("\n");
    if (firstLine.includes("suanle") || typingLang) {
      s = s.slice(0, last).trimEnd();
      widgetPending = true;
    } else {
      s = s + "\n```";
    }
  }
  if (streaming) {
    // 末尾孤立的标题符/列表符/引用符先藏起来，避免裸露
    s = s.replace(/(^|\n)\s*(#{1,6}|[-*+>]|\d+\.)\s*$/, "$1");
    const lastLine = s.slice(s.lastIndexOf("\n") + 1);
    const bold = (lastLine.match(/\*\*/g) ?? []).length;
    if (bold % 2 === 1) s += "**";
    s = s.replace(/(^|[^*])\*$/, "$1");
  }
  // 标题统一降级，保持对话版面从容
  s = s.replace(/^#{1,2}\s+/gm, "### ");
  return { text: s, widgetPending };
}

/** 发送给模型的历史：去掉画像标签与推演，只保留正文 */
export function stripForHistory(raw: string): string {
  const p = parseAssistant(raw, false);
  return p.body;
}

/** 复制用纯文本 */
export function plainText(body: string): string {
  return body
    .replace(/```suanle[\s\S]*?```/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .trim();
}

export function extractWidget(body: string): { widget: string; [k: string]: unknown } | null {
  const m = body.match(/```suanle\s*([\s\S]*?)```/);
  if (!m) return null;
  try {
    return JSON.parse(m[1].trim());
  } catch {
    return null;
  }
}
