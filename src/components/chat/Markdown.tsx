"use client";

import { memo, useState, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy, Share2 } from "lucide-react";
import { useUI } from "@/lib/store";
import { copyText } from "../ui";
import { Icon } from "../icons";

function Heading({ children }: { children?: ReactNode }) {
  return <p className="md-h">{children}</p>;
}

function extractText(node: ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (node && typeof node === "object" && "props" in node && node.props && typeof node.props === "object") {
    return extractText((node.props as { children?: ReactNode }).children);
  }
  return "";
}

function SuanleCard({ raw }: { raw: string }) {
  const [copied, setCopied] = useState(false);
  const text = raw.replace(/\*\*/g, "").trim();

  const handleCopy = () => {
    void copyText(text).then((ok) => {
      if (ok) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        useUI.getState().toast("已复制箴言");
      }
    });
  };

  const handleShare = () => {
    useUI.getState().open("share", {
      kicker: "算了说",
      line: text,
      body: text,
    });
  };

  return (
    <div className="my-3.5 overflow-hidden rounded-[20px] border border-seal/30 bg-gradient-to-br from-seal/[0.08] via-card/90 to-card p-4 shadow-[0_2px_14px_rgba(180,60,40,0.05)]">
      <div className="flex items-center justify-between gap-2 border-b border-seal/15 pb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="grid h-5 w-5 place-items-center rounded-md border border-seal/40 bg-seal/10 font-song text-[11px] font-bold text-seal">
            印
          </span>
          <span className="font-song text-[12.5px] font-semibold tracking-wider text-seal">
            算了 · 箴言
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex h-7 items-center gap-1 rounded-full bg-ink/[0.04] px-2.5 text-[11.5px] text-mute transition hover:bg-ink/[0.08] active:scale-95"
            title="复制这句"
          >
            <Icon as={copied ? Check : Copy} size={13} className={copied ? "text-sage" : ""} />
            <span>{copied ? "已复制" : "复制"}</span>
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex h-7 items-center gap-1 rounded-full bg-seal/10 px-2.5 text-[11.5px] font-medium text-seal transition hover:bg-seal/15 active:scale-95"
            title="做成卡片"
          >
            <Icon as={Share2} size={13} />
            <span>做成卡片</span>
          </button>
        </div>
      </div>
      <div className="mt-3 font-song text-[16px] font-bold leading-relaxed tracking-wide text-ink">
        {text}
      </div>
    </div>
  );
}

function CustomBlockquote({ children }: { children?: ReactNode }) {
  const raw = extractText(children);
  const trimmed = raw.trim();
  if (trimmed.startsWith("算了") || trimmed.includes("算了，") || trimmed.includes("算了。")) {
    return <SuanleCard raw={trimmed} />;
  }
  return <blockquote>{children}</blockquote>;
}

const components: Components = {
  h1: Heading,
  h2: Heading,
  h3: Heading,
  h4: Heading,
  h5: Heading,
  h6: Heading,
  blockquote: CustomBlockquote,
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
