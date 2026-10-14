"use client";

import { useSyncExternalStore } from "react";
import type { UserProfile } from "@/db/schema";

export type ClientUser = {
  id: string;
  nickname: string | null;
  persona: string;
  profile: UserProfile;
  onboarded: boolean;
  plan: string;
  planUntil: string | null;
  pass: boolean;
  letGoCount: number;
};
export type Stats = { conversations: number; readings: number; tokens: number; tokensToday: number; letGo: number };

const UID_KEY = "suanle.uid";
const USER_KEY = "suanle.user";

export function getUid(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(UID_KEY);
  if (!id) {
    const rnd = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "")
      : Array.from({ length: 24 }, () => Math.floor(Math.random() * 36).toString(36)).join("");
    id = "u_" + rnd.slice(0, 24);
    localStorage.setItem(UID_KEY, id);
  }
  return id;
}

type State = { user: ClientUser | null; stats: Stats | null; loading: boolean; offline: boolean };
let state: State = { user: null, stats: null, loading: true, offline: false };
const SERVER_STATE: State = { user: null, stats: null, loading: true, offline: false };
const listeners = new Set<() => void>();
function setState(p: Partial<State>) {
  state = { ...state, ...p };
  listeners.forEach((l) => l());
}
export function useUserState() {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => state,
    () => SERVER_STATE,
  );
}
export const getUserState = () => state;

function cache(u: ClientUser | null, s: Stats | null) {
  try { localStorage.setItem(USER_KEY, JSON.stringify({ user: u, stats: s })); } catch {}
}

export async function refreshUser() {
  const id = getUid();
  if (!state.user) {
    try {
      const c = JSON.parse(localStorage.getItem(USER_KEY) || "null");
      if (c?.user?.id === id) setState({ user: c.user, stats: c.stats });
    } catch {}
  }
  try {
    const r = await api<{ user: ClientUser; stats: Stats }>(`/api/user?id=${id}`);
    setState({ user: r.user, stats: r.stats, loading: false, offline: false });
    cache(r.user, r.stats);
  } catch {
    setState({ loading: false, offline: true });
  }
}

export async function patchUser(patch: Partial<Pick<ClientUser, "nickname" | "persona" | "onboarded">> & { profile?: Partial<UserProfile> }) {
  const id = getUid();
  if (state.user) setState({ user: { ...state.user, ...patch, profile: { ...state.user.profile, ...(patch.profile ?? {}) } } as ClientUser });
  const r = await api<{ user: ClientUser; stats: Stats }>(`/api/user`, { method: "PATCH", body: { id, ...patch } });
  setState({ user: r.user, stats: r.stats });
  cache(r.user, r.stats);
  return r;
}

export function setLocalUser(p: Partial<ClientUser>) {
  if (state.user) {
    setState({ user: { ...state.user, ...p } });
    cache(state.user, state.stats);
  }
}

export class HttpError extends Error {
  constructor(public status: number, msg: string) { super(msg); }
}

export async function api<T>(url: string, opts: { method?: string; body?: unknown; timeout?: number } = {}): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), opts.timeout ?? 15000);
  try {
    const res = await fetch(url, {
      method: opts.method ?? (opts.body ? "POST" : "GET"),
      headers: opts.body ? { "Content-Type": "application/json" } : undefined,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal: ctrl.signal,
      cache: "no-store",
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new HttpError(res.status, j.error || res.statusText);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

export async function postSSE(
  url: string,
  body: unknown,
  onEvent: (event: string, data: Record<string, unknown>) => void,
  signal?: AbortSignal,
) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok || !res.body) {
    const j = await res.json().catch(() => ({}));
    throw new HttpError(res.status, j.error || "stream failed");
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i: number;
    while ((i = buf.indexOf("\n\n")) >= 0) {
      const chunk = buf.slice(0, i);
      buf = buf.slice(i + 2);
      let ev = "message";
      let data = "";
      for (const line of chunk.split("\n")) {
        if (line.startsWith("event:")) ev = line.slice(6).trim();
        else if (line.startsWith("data:")) data += line.slice(5).trim();
      }
      if (data) {
        try { onEvent(ev, JSON.parse(data)); } catch {}
      }
    }
  }
}

export function haptic(p: number | number[] = 10) {
  try { navigator.vibrate?.(p); } catch {}
}

/** 解析模型输出（流式安全） */
export function parseAssistant(raw: string) {
  let thinking = "";
  let body = raw;
  let thinkingDone = true;
  const open = body.indexOf("<think>");
  if (open >= 0) {
    const close = body.indexOf("</think>", open);
    if (close >= 0) {
      thinking = body.slice(open + 7, close).trim();
      body = body.slice(0, open) + body.slice(close + 8);
    } else {
      thinking = body.slice(open + 7).trim();
      body = body.slice(0, open);
      thinkingDone = false;
    }
  } else if ("<think>".startsWith(body.trim()) && body.trim().length > 0) {
    body = "";
    thinkingDone = false;
  }
  body = body.replace(/<memo>[\s\S]*?(<\/memo>|$)/g, "").replace(/<\/?m?e?m?o?$/, "");
  let cast: "hexagram" | "tarot" | null = null;
  const m = body.match(/\[\[cast:(hexagram|tarot)\]\]/);
  if (m) cast = m[1] as "hexagram" | "tarot";
  body = body.replace(/\[\[cast:\w*\]?\]?/g, "").replace(/\[\[?[a-z:]*$/, "");
  return { thinking, body: body.trim(), thinkingDone, cast };
}

export function relTime(iso: string | Date) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return "刚刚";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (d >= today) return d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false });
  if (d.getTime() >= today.getTime() - 86400000) return "昨天";
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

export function greetingByHour() {
  const h = new Date().getHours();
  if (h < 5) return "夜深了";
  if (h < 9) return "早上好";
  if (h < 12) return "上午好";
  if (h < 14) return "中午好";
  if (h < 18) return "下午好";
  if (h < 22) return "晚上好";
  return "这么晚啦";
}
