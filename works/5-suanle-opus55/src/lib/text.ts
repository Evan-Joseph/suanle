import type { Profile } from "./types";

export const WIDGETS = ["六爻", "塔罗", "八字", "求签", "纸篓"] as const;
export type WidgetName = (typeof WIDGETS)[number];

export interface Parsed {
  think: string;
  thinking: boolean; // think block still open
  body: string;
  widgets: WidgetName[];
  profile: Partial<Profile> | null;
}

/** Split a raw assistant stream into think / body / widgets / profile. Safe for partial input. */
export function parseAssistant(raw: string, reasoning = ""): Parsed {
  let text = raw;
  let think = reasoning;
  let thinking = false;
  // <think> blocks
  const open = text.indexOf("<think>");
  if (open !== -1) {
    const close = text.indexOf("</think>", open);
    if (close === -1) {
      think += text.slice(open + 7);
      text = text.slice(0, open);
      thinking = true;
    } else {
      think += text.slice(open + 7, close);
      text = text.slice(0, open) + text.slice(close + 8);
    }
  }
  // profile
  let profile: Partial<Profile> | null = null;
  text = text.replace(/<profile>([\s\S]*?)<\/profile>/g, (_, j: string) => {
    try {
      const m = j.match(/\{[\s\S]*\}/);
      if (m) profile = { ...(profile || {}), ...JSON.parse(m[0]) };
    } catch {
      /* ignore */
    }
    return "";
  });
  text = text.replace(/<profile>[\s\S]*$/, "");
  // widgets
  const widgets: WidgetName[] = [];
  text = text.replace(/\[\[卡片[:：]\s*([^\]\s]+)\s*\]\]/g, (_, n: string) => {
    const w = WIDGETS.find((x) => n.includes(x));
    if (w && !widgets.includes(w)) widgets.push(w);
    return "";
  });
  // strip trailing partial tags/markers
  text = text.replace(/<\/?[a-z]{0,8}$/i, "").replace(/\[\[[^\]]*$/, "").replace(/\[$/, "");
  return { think: think.trim(), thinking, body: text.replace(/\n{3,}/g, "\n\n").trim(), widgets, profile };
}

/** Make partial markdown safe to render while streaming. */
export function safeMarkdown(md: string, streaming: boolean): string {
  let s = md;
  const fences = (s.match(/^\s*```/gm) || []).length;
  if (fences % 2 === 1) s += "\n```";
  if (streaming) {
    // close dangling bold
    const outsideCode = s.replace(/```[\s\S]*?```/g, "");
    if ((outsideCode.match(/\*\*/g) || []).length % 2 === 1) s += "**";
    // lone heading marks at end
    s = s.replace(/\n#{1,6}\s*$/, "\n");
  }
  // remove stray heading marks with no text
  s = s.replace(/^#{1,6}\s*$/gm, "");
  return s;
}

export function plainText(md: string) {
  return md
    .replace(/```[\s\S]*?```/g, (m) => m.replace(/```\w*/g, ""))
    .replace(/[*_`>#]/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .trim();
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
