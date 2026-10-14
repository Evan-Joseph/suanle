"use client";

import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function Md({ text, streaming }: { text: string; streaming?: boolean }) {
  // close dangling emphasis during streaming to avoid flicker
  let t = text;
  if (streaming) {
    if ((t.match(/\*\*/g) || []).length % 2) t += "**";
    else if ((t.replace(/\*\*/g, "").match(/\*/g) || []).length % 2) t += "*";
  }
  return (
    <div className={`md ${streaming ? "caret" : ""}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{t}</ReactMarkdown>
    </div>
  );
}

export default memo(Md);
