"use client";

import { memo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import WidgetBlock from "./Widgets";

function Markdown({ text, msgId, widgets = "live" }: { text: string; msgId: string; widgets?: "live" | "pending" | "hidden" }) {
  const components: Components = {
    pre: ({ children }) => <>{children}</>,
    code: ({ className, children }) => {
      const raw = String(children ?? "");
      const lang = /language-(\w+)/.exec(className || "")?.[1];
      if (lang === "suanle") {
        if (widgets === "hidden") return null;
        if (widgets === "pending") return <div className="my-3 h-24 animate-pulse rounded-3xl border border-line bg-white/50" />;
        return <WidgetBlock raw={raw.trim()} msgId={msgId} interactive />;
      }
      if (lang || raw.includes("\n")) {
        return (
          <pre>
            <code>{raw.replace(/\n$/, "")}</code>
          </pre>
        );
      }
      return <code>{children}</code>;
    },
    a: ({ href, children }) => (
      <a href={href} target="_blank" rel="noreferrer noopener">
        {children}
      </a>
    ),
    img: () => null,
  };
  return (
    <div className="md">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {text}
      </ReactMarkdown>
    </div>
  );
}

export default memo(Markdown);
