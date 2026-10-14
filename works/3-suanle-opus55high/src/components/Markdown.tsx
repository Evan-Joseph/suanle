"use client";

import { memo, type ReactNode } from "react";

function balance(text: string) {
  // 流式中补齐未闭合的标记，避免闪烁
  let t = text.replace(/\*+$/, (m) => (m.length >= 2 ? "" : m === "*" ? "" : m));
  const bold = (t.match(/\*\*/g) || []).length;
  if (bold % 2) t += "**";
  const single = (t.replace(/\*\*/g, "").match(/\*/g) || []).length;
  if (single % 2) t += "*";
  const tick = (t.match(/`/g) || []).length;
  if (tick % 2) t += "`";
  return t;
}

function inline(text: string, key: string, streaming: boolean): ReactNode[] {
  const src = streaming ? balance(text) : text;
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+?\*\*|\*[^*\n]+?\*|`[^`]+?`|\[[^\]]+\]\((https?:\/\/[^)\s]+)\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(src))) {
    if (m.index > last) out.push(src.slice(last, m.index));
    const tok = m[0];
    const k = `${key}-${i++}`;
    if (tok.startsWith("**")) out.push(<strong key={k} className="font-semibold text-ink">{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith("*")) out.push(<span key={k} className="stage">{tok.slice(1, -1)}</span>);
    else if (tok.startsWith("`")) out.push(<code key={k} className="rounded bg-sand px-1 py-0.5 font-mono text-[0.88em]">{tok.slice(1, -1)}</code>);
    else {
      const lm = tok.match(/\[([^\]]+)\]\(([^)]+)\)/);
      out.push(<a key={k} href={lm?.[2]} target="_blank" rel="noreferrer" className="text-mist underline underline-offset-2">{lm?.[1]}</a>);
    }
    last = m.index + tok.length;
  }
  if (last < src.length) out.push(src.slice(last));
  return out;
}

type Block =
  | { t: "p"; lines: string[] }
  | { t: "h"; text: string }
  | { t: "ul" | "ol"; items: string[] }
  | { t: "quote"; lines: string[] }
  | { t: "code"; text: string }
  | { t: "table"; rows: string[][] }
  | { t: "hr" };

function parse(src: string): Block[] {
  const lines = src.replace(/\r/g, "").split("\n");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^\s*```/.test(line)) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^\s*```/.test(lines[i])) buf.push(lines[i++]);
      i++;
      blocks.push({ t: "code", text: buf.join("\n") });
      continue;
    }
    if (!line.trim()) { i++; continue; }
    if (/^\s*(---+|\*\*\*+)\s*$/.test(line)) { blocks.push({ t: "hr" }); i++; continue; }
    if (/^#{1,6}\s/.test(line)) { blocks.push({ t: "h", text: line.replace(/^#+\s*/, "") }); i++; continue; }
    if (/^\s*\|/.test(line)) {
      const rows: string[][] = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) {
        const cells = lines[i].trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
        if (!cells.every((c) => /^:?-{2,}:?$/.test(c) || c === "")) rows.push(cells);
        i++;
      }
      blocks.push({ t: "table", rows });
      continue;
    }
    if (/^\s*>/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) buf.push(lines[i++].replace(/^\s*>\s?/, ""));
      blocks.push({ t: "quote", lines: buf });
      continue;
    }
    const ul = /^\s*[-•]\s+/;
    const ol = /^\s*\d+[.)、]\s+/;
    if (ul.test(line) || ol.test(line)) {
      const kind = ul.test(line) ? "ul" : "ol";
      const re = kind === "ul" ? ul : ol;
      const items: string[] = [];
      while (i < lines.length && re.test(lines[i])) items.push(lines[i++].replace(re, ""));
      blocks.push({ t: kind, items });
      continue;
    }
    const buf: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^\s*(```|>|\||#{1,6}\s|[-•]\s|\d+[.)、]\s)/.test(lines[i])) buf.push(lines[i++]);
    if (!buf.length) buf.push(lines[i++]);
    blocks.push({ t: "p", lines: buf });
  }
  return blocks;
}

function MarkdownInner({ text, streaming = false, className = "" }: { text: string; streaming?: boolean; className?: string }) {
  const blocks = parse(text);
  return (
    <div className={`md min-w-0 break-words text-[15px] leading-[1.75] text-ink-2 ${streaming ? "caret-last" : ""} ${className}`}>
      {blocks.map((b, bi) => {
        const last = streaming && bi === blocks.length - 1;
        const k = `b${bi}`;
        switch (b.t) {
          case "p":
            return (
              <p key={k} className={last ? "caret" : ""}>
                {b.lines.map((l, li) => (
                  <span key={li}>{li > 0 && <br />}{inline(l, `${k}-${li}`, last)}</span>
                ))}
              </p>
            );
          case "h":
            return <h4 key={k} className="mt-4 mb-1 font-serif text-[15.5px] font-semibold text-ink first:mt-0">{inline(b.text, k, last)}</h4>;
          case "ul":
          case "ol": {
            const Tag = b.t === "ul" ? "ul" : "ol";
            return (
              <Tag key={k} className={`my-1.5 space-y-1 pl-5 ${b.t === "ul" ? "list-disc marker:text-faint" : "list-decimal marker:text-sub"}`}>
                {b.items.map((it, ii) => <li key={ii} className={last && ii === b.items.length - 1 ? "caret" : ""}>{inline(it, `${k}-${ii}`, last)}</li>)}
              </Tag>
            );
          }
          case "quote":
            return <blockquote key={k} className="border-l-2 border-clay/40 pl-3 text-sub">{b.lines.map((l, li) => <p key={li}>{inline(l, `${k}-${li}`, last)}</p>)}</blockquote>;
          case "code":
            return <pre key={k} className="no-scrollbar my-2 overflow-x-auto rounded-xl bg-sand/70 p-3 font-mono text-[12.5px] leading-relaxed"><code>{b.text}</code></pre>;
          case "table":
            return (
              <div key={k} className="no-scrollbar my-2 overflow-x-auto rounded-xl border border-line">
                <table className="min-w-full text-[13px]">
                  <tbody>
                    {b.rows.map((r, ri) => (
                      <tr key={ri} className={ri === 0 ? "bg-sand/60 font-medium text-ink" : "border-t border-line"}>
                        {r.map((c, ci) => <td key={ci} className="px-3 py-2 whitespace-nowrap">{inline(c, `${k}-${ri}-${ci}`, false)}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "hr":
            return <hr key={k} className="my-3 border-line" />;
        }
      })}
      {streaming && blocks.length === 0 && <span className="caret" />}
    </div>
  );
}

export const Markdown = memo(MarkdownInner);
