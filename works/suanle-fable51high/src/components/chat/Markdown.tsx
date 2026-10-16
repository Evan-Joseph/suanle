"use client";

import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { closeMarkdown } from "@/lib/parse";

export const Markdown = memo(function Markdown({ text, streaming, className = "" }: { text: string; streaming?: boolean; className?: string }) {
  const src = streaming ? closeMarkdown(text) : text;
  return (
    <div className={`md ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer">{children}</a>,
          img: () => null,
        }}
      >
        {src}
      </ReactMarkdown>
    </div>
  );
});
