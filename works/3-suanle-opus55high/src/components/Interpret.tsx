"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getUid, HttpError, parseAssistant, postSSE, refreshUser } from "@/lib/client";
import { chunkText } from "@/lib/mock-oracle";
import { getPersona } from "@/lib/personas";
import { useUserState } from "@/lib/client";
import { Markdown } from "./Markdown";
import { ThinkingCard } from "./ui";

export default function InterpretPanel({
  readingId,
  initial,
  auto = true,
  localFallback,
  onLocked,
  label = "请细说",
}: {
  readingId: string | null;
  initial?: string | null;
  auto?: boolean;
  localFallback: () => string;
  onLocked?: () => void;
  label?: string;
}) {
  const { user } = useUserState();
  const p = getPersona(user?.persona);
  const [raw, setRaw] = useState<string>(initial ?? "");
  const [state, setState] = useState<"idle" | "streaming" | "done" | "error">(initial ? "done" : "idle");
  const [offline, setOffline] = useState(false);
  const [ms, setMs] = useState<number | undefined>(undefined);
  const started = useRef(false);
  const ctrlRef = useRef<AbortController | null>(null);

  const runLocal = useCallback(async () => {
    setOffline(true);
    const text = `<think>先用本地推演把要点讲清楚。</think>${localFallback()}`;
    let acc = "";
    for await (const piece of chunkText(text)) {
      acc += piece;
      setRaw(acc);
    }
    setState("done");
  }, [localFallback]);

  const run = useCallback(async () => {
    setState("streaming");
    setRaw("");
    setOffline(false);
    const t0 = Date.now();
    let marked = false;
    if (!readingId || readingId.startsWith("local_")) {
      await runLocal();
      return;
    }
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    let acc = "";
    try {
      await postSSE("/api/interpret", { userId: getUid(), readingId }, (ev, data) => {
        if (ev === "delta") {
          acc += data.t as string;
          if (!marked && (acc.includes("</think>") || (!acc.trimStart().startsWith("<") && acc.length > 4))) { marked = true; setMs(Date.now() - t0); }
          setRaw(acc);
        } else if (ev === "done") {
          setOffline(!!data.offline);
          setState("done");
          refreshUser();
        }
      }, ctrl.signal);
      setState((s) => (s === "streaming" ? "done" : s));
    } catch (e) {
      if (e instanceof HttpError && e.status === 402) {
        setState("idle");
        onLocked?.();
        return;
      }
      if (ctrl.signal.aborted) return;
      if (!acc) await runLocal();
      else setState("error");
    }
  }, [readingId, runLocal, onLocked]);

  useEffect(() => {
    if (auto && !initial && readingId && !started.current) {
      started.current = true;
      run();
    }
  }, [auto, initial, readingId, run]);

  useEffect(() => () => ctrlRef.current?.abort(), []);

  const parsed = parseAssistant(raw);
  const streaming = state === "streaming";

  if (state === "idle") {
    return (
      <button onClick={run} className="flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-[15px] text-paper active:scale-[0.98]">
        <span className="font-serif">{p.avatar}</span> {label}
      </button>
    );
  }

  return (
    <div className="rounded-3xl bg-white p-5">
      <div className="mb-2 flex items-center gap-2 text-[12px] text-sub">
        <span className="flex h-6 w-6 items-center justify-center rounded-full font-serif text-[11px] text-paper" style={{ background: p.tint }}>{p.avatar}</span>
        {p.name}的解读
        {offline && <span className="rounded-full bg-sand px-1.5 py-px text-[10px]">本地推演</span>}
      </div>
      {(streaming || parsed.thinking) && <ThinkingCard text={parsed.thinking} done={!streaming || (parsed.thinkingDone && parsed.body.length > 0)} ms={ms} />}
      {parsed.body ? <Markdown text={parsed.body} streaming={streaming} /> : streaming && parsed.thinkingDone ? <Markdown text="" streaming /> : null}
      {state === "error" && (
        <button onClick={run} className="mt-3 rounded-full border border-line px-4 py-1.5 text-[12.5px] text-sub active:scale-95">没说完，网断了一下 · 重来</button>
      )}
    </div>
  );
}
