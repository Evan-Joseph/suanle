"use client";

import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/**
 * 稳定的流式 Markdown 渲染。
 * 以内容字符串为 memo key，流式追加时平滑重绘、不抖动。
 */
export const Markdown = memo(function Markdown({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <div className={cn("md", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  );
});
