"use client";

import { memo, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

function Heading({ children }: { children?: ReactNode }) {
  return <p className="md-h">{children}</p>;
}

const components: Components = {
  h1: Heading,
  h2: Heading,
  h3: Heading,
  h4: Heading,
  h5: Heading,
  h6: Heading,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer noopener">
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="md-table">
      <table>{children}</table>
    </div>
  ),
  img: () => null,
};

function MarkdownInner({ text, streaming = false }: { text: string; streaming?: boolean }) {
  return (
    <div className={`md ${streaming ? "md-stream" : ""}`}>
      <ReactMarkdown remarkPlugins={[[remarkGfm, { singleTilde: false }]]} components={components} skipHtml>
        {text}
      </ReactMarkdown>
    </div>
  );
}

export default memo(MarkdownInner);
