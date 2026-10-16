"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { uid, dayKey, type Memo } from "@/lib/parse";

export type Tab = "chat" | "explore" | "letgo" | "me";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  tokens?: number;
  offline?: boolean;
  thinkSec?: number;
  deep?: boolean;
  intro?: boolean;
  widgetDone?: boolean;
}

export interface Session {
  id: string; title: string; category: string; emoji: string;
  messages: Message[]; createdAt: number; updatedAt: number; titledAt?: number; archived?: boolean;
}

export interface Profile {
  name?: string; birth?: string; gender?: string; city?: string; facts: string[]; tags: string[];
}

export interface Reading {
  id: string; kind: "coins" | "tarot" | "bazi"; title: string; summary: string; createdAt: number; sessionId?: string;
}

interface AppState {
  anonId: string;
  profile: Profile;
  sessions: Session[];
  currentId: string | null;
  readings: Reading[];
  usage: { total: number; today: number; day: string; turns: number };
  deepUsed: { day: string; n: number };
  lampUntil: number | null;
  letgo: { total: number; day: string; today: number };
  onboarded: boolean;
  syncedAt: number;

  newSession: () => string;
  setCurrent: (id: string | null) => void;
  appendMessage: (sid: string, m: Message) => void;
  updateMessage: (sid: string, mid: string, patch: Partial<Message>) => void;
  removeMessage: (sid: string, mid: string) => void;
  renameSession: (sid: string, patch: Partial<Pick<Session, "title" | "category" | "emoji" | "titledAt" | "archived">>) => void;
  deleteSession: (sid: string) => void;
  mergeMemo: (m: Memo) => void;
  setProfile: (p: Partial<Profile>) => void;
  addUsage: (n: number) => void;
  spendDeep: () => void;
  lightLamp: (days: number) => void;
  addLetgo: () => void;
  addReading: (r: Omit<Reading, "id" | "createdAt">) => void;
  setOnboarded: () => void;
  resetAll: () => void;
  hydrateFromCloud: (d: { profile?: Partial<Profile> | null; sessions?: Session[]; lampUntil?: number | null; tokensTotal?: number }) => void;
}

const emptyProfile = (): Profile => ({ facts: [], tags: [] });

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      anonId: uid() + uid(),
      profile: emptyProfile(),
      sessions: [],
      currentId: null,
      readings: [],
      usage: { total: 0, today: 0, day: dayKey(), turns: 0 },
      deepUsed: { day: dayKey(), n: 0 },
      lampUntil: null,
      letgo: { total: 0, day: dayKey(), today: 0 },
      onboarded: false,
      syncedAt: 0,

      newSession: () => {
        const id = uid();
        const s: Session = { id, title: "新的心事", category: "日常", emoji: "☁️", messages: [], createdAt: Date.now(), updatedAt: Date.now() };
        set((st) => ({ sessions: [s, ...st.sessions], currentId: id }));
        return id;
      },
      setCurrent: (id) => set({ currentId: id }),
      appendMessage: (sid, m) =>
        set((st) => ({ sessions: st.sessions.map((s) => (s.id === sid ? { ...s, messages: [...s.messages, m], updatedAt: Date.now() } : s)) })),
      updateMessage: (sid, mid, patch) =>
        set((st) => ({ sessions: st.sessions.map((s) => (s.id === sid ? { ...s, messages: s.messages.map((m) => (m.id === mid ? { ...m, ...patch } : m)) } : s)) })),
      removeMessage: (sid, mid) =>
        set((st) => ({ sessions: st.sessions.map((s) => (s.id === sid ? { ...s, messages: s.messages.filter((m) => m.id !== mid) } : s)) })),
      renameSession: (sid, patch) => set((st) => ({ sessions: st.sessions.map((s) => (s.id === sid ? { ...s, ...patch } : s)) })),
      deleteSession: (sid) =>
        set((st) => ({ sessions: st.sessions.filter((s) => s.id !== sid), currentId: st.currentId === sid ? null : st.currentId })),
      mergeMemo: (m) =>
        set((st) => {
          const p = { ...st.profile };
          if (m.name && !p.name) p.name = String(m.name).slice(0, 12);
          if (m.birth && /\d{4}-\d{2}-\d{2}/.test(m.birth)) p.birth = m.birth;
          if (m.gender) p.gender = m.gender;
          if (m.city) p.city = m.city;
          if (Array.isArray(m.facts)) p.facts = Array.from(new Set([...p.facts, ...m.facts.filter((x) => typeof x === "string")])).slice(-20);
          if (Array.isArray(m.tags)) p.tags = Array.from(new Set([...p.tags, ...m.tags.filter((x) => typeof x === "string")])).slice(-12);
          return { profile: p };
        }),
      setProfile: (p) => set((st) => ({ profile: { ...st.profile, ...p } })),
      addUsage: (n) =>
        set((st) => {
          const d = dayKey();
          const today = st.usage.day === d ? st.usage.today + n : n;
          return { usage: { total: st.usage.total + n, today, day: d, turns: st.usage.turns + 1 } };
        }),
      spendDeep: () => set((st) => ({ deepUsed: st.deepUsed.day === dayKey() ? { ...st.deepUsed, n: st.deepUsed.n + 1 } : { day: dayKey(), n: 1 } })),
      lightLamp: (days) => set((st) => ({ lampUntil: Math.max(st.lampUntil ?? 0, Date.now()) + days * 86400000 })),
      addLetgo: () =>
        set((st) => {
          const d = dayKey();
          return { letgo: { total: st.letgo.total + 1, day: d, today: st.letgo.day === d ? st.letgo.today + 1 : 1 } };
        }),
      addReading: (r) => set((st) => ({ readings: [{ ...r, id: uid(), createdAt: Date.now() }, ...st.readings].slice(0, 100) })),
      setOnboarded: () => set({ onboarded: true }),
      resetAll: () =>
        set({ profile: emptyProfile(), sessions: [], currentId: null, readings: [], usage: { total: 0, today: 0, day: dayKey(), turns: 0 }, deepUsed: { day: dayKey(), n: 0 }, lampUntil: null, letgo: { total: 0, day: dayKey(), today: 0 }, onboarded: false }),
      hydrateFromCloud: (d) =>
        set((st) => {
          const known = new Set(st.sessions.map((s) => s.id));
          const incoming = (d.sessions ?? []).filter((s) => !known.has(s.id) && Array.isArray(s.messages) && s.messages.length);
          const profile = st.profile.name || st.profile.birth ? st.profile : { ...emptyProfile(), ...(d.profile ?? {}) };
          return {
            profile: { ...profile, facts: profile.facts ?? [], tags: profile.tags ?? [] },
            sessions: [...st.sessions, ...incoming].sort((a, b) => b.updatedAt - a.updatedAt),
            lampUntil: Math.max(st.lampUntil ?? 0, d.lampUntil ?? 0) || null,
            usage: st.usage.total === 0 && d.tokensTotal ? { ...st.usage, total: d.tokensTotal } : st.usage,
            syncedAt: Date.now(),
          };
        }),
    }),
    { name: "suanle.v1", storage: createJSONStorage(() => localStorage), version: 1 },
  ),
);

/* ───────────── 派生 ───────────── */
export const lampActive = (s: Pick<AppState, "lampUntil">) => !!s.lampUntil && s.lampUntil > Date.now();
export const DEEP_FREE = 3;
export const deepLeft = (s: Pick<AppState, "deepUsed">) => Math.max(0, DEEP_FREE - (s.deepUsed.day === dayKey() ? s.deepUsed.n : 0));

/* ───────────── 非持久 UI 状态 ───────────── */
export interface Live { sessionId: string; msgId: string; content: string; started: number }
export interface Toast { id: string; text: string; icon?: string }
export type Sheet = null | { kind: "tip"; tokens?: number } | { kind: "lamp" } | { kind: "share"; text: string } | { kind: "bazi" };

interface UIState {
  tab: Tab;
  drawer: boolean;
  live: Live | null;
  toasts: Toast[];
  sheet: Sheet;
  letgoDraft: string;
  setTab: (t: Tab) => void;
  setDrawer: (b: boolean) => void;
  setLive: (l: Live | null) => void;
  toast: (text: string, icon?: string) => void;
  dismissToast: (id: string) => void;
  setSheet: (s: Sheet) => void;
  setLetgoDraft: (t: string) => void;
}

export const useUI = create<UIState>()((set) => ({
  tab: "chat", drawer: false, live: null, toasts: [], sheet: null, letgoDraft: "",
  setTab: (tab) => set({ tab, drawer: false }),
  setDrawer: (drawer) => set({ drawer }),
  setLive: (live) => set({ live }),
  toast: (text, icon) => {
    const id = uid();
    set((s) => ({ toasts: [...s.toasts, { id, text, icon }].slice(-3) }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 2200);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  setSheet: (sheet) => set({ sheet }),
  setLetgoDraft: (letgoDraft) => set({ letgoDraft }),
}));

/* ───────────── 云同步（节流） ───────────── */
let syncTimer: ReturnType<typeof setTimeout> | null = null;
export function scheduleSync() {
  if (typeof window === "undefined") return;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(async () => {
    const s = useApp.getState();
    try {
      await fetch("/api/sync", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anonId: s.anonId, profile: s.profile, lampUntil: s.lampUntil, sessions: s.sessions.slice(0, 20) }),
      });
    } catch { /* 离线无妨 */ }
  }, 2500);
}

export async function pullCloud() {
  const s = useApp.getState();
  try {
    const r = await fetch(`/api/sync?anonId=${encodeURIComponent(s.anonId)}`);
    const j = await r.json();
    if (j && !j.offline) useApp.getState().hydrateFromCloud(j);
  } catch { /* ignore */ }
}
