"use client";

import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { del as idbDel, get as idbGet, set as idbSet } from "idb-keyval";
import type { Memo } from "./parse";
import { FREE_DEEP_PER_DAY } from "./meter";

/* ───────── 数据模型 ───────── */

export type Role = "user" | "assistant";

export interface Msg {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
  tokens?: number;
  thinkSec?: number;
  deep?: boolean;
  quote?: string;
  intro?: boolean;
  local?: boolean;
}

export interface Session {
  id: string;
  title: string;
  category: string;
  createdAt: number;
  updatedAt: number;
  messages: Msg[];
  titledAt?: number;
}

export interface Profile {
  name?: string;
  birth?: string;
  gender?: string;
  city?: string;
  facts: string[];
  tags: string[];
  firstSeen: number;
}

export type RecordKind = "coins" | "tarot" | "bazi" | "ziwei" | "annual";

export interface DivRecord {
  id: string;
  key?: string;
  kind: RecordKind;
  title: string;
  summary: string;
  text: string;
  payload: unknown;
  createdAt: number;
  updatedAt?: number;
}

export interface EngineSettings {
  base: string;
  key: string;
  model: string;
}

export interface Settings {
  sound: boolean;
  haptics: boolean;
  theme: "system" | "day" | "night";
  engine: EngineSettings | null;
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

interface AppData {
  anonId: string;
  profile: Profile;
  sessions: Session[];
  currentId: string | null;
  records: DivRecord[];
  widgetResults: Record<string, unknown>;
  usage: { total: number; day: string; today: number; analogy?: { items: { emoji: string; text: string }[]; line: string; at: number } };
  letgo: { total: number; day: string; today: number };
  merit: { cents: number; count: number; lampUntil: number; lastAt: number };
  deep: { day: string; used: number };
  nudgeDay: string;
  settings: Settings;
}

interface AppActions {
  newSession: () => string;
  setCurrent: (id: string | null) => void;
  deleteSession: (id: string) => void;
  patchSession: (id: string, patch: Partial<Pick<Session, "title" | "category" | "titledAt">>) => void;
  appendMessage: (sid: string, m: Msg) => void;
  removeMessage: (sid: string, mid: string) => void;
  mergeMemo: (memo: Memo) => void;
  setProfile: (p: Partial<Profile>) => void;
  removeFact: (i: number) => void;
  removeTag: (i: number) => void;
  upsertRecord: (r: Omit<DivRecord, "id" | "createdAt">) => string;
  removeRecord: (id: string) => void;
  setWidgetResult: (key: string, v: unknown) => void;
  addUsage: (n: number) => void;
  setAnalogy: (a: { items: { emoji: string; text: string }[]; line: string }) => void;
  addLetgo: () => void;
  addMerit: (cents: number, lampDays?: number) => void;
  spendDeep: () => void;
  dismissNudge: () => void;
  setSettings: (p: Partial<Settings>) => void;
  importData: (raw: unknown) => boolean;
  resetAll: () => void;
}

export type AppState = AppData & AppActions;

const initialData = (): AppData => ({
  anonId: uid() + uid(),
  profile: { facts: [], tags: [], firstSeen: Date.now() },
  sessions: [],
  currentId: null,
  records: [],
  widgetResults: {},
  usage: { total: 0, day: dayKey(), today: 0 },
  letgo: { total: 0, day: dayKey(), today: 0 },
  merit: { cents: 0, count: 0, lampUntil: 0, lastAt: 0 },
  deep: { day: dayKey(), used: 0 },
  nudgeDay: "",
  settings: { sound: true, haptics: true, theme: "system", engine: null },
});

/* IndexedDB 为主，localStorage 兜底 */
const idbStorage: StateStorage = {
  getItem: async (name) => {
    if (typeof window === "undefined") return null;
    try {
      const v = await idbGet<string>(name);
      if (typeof v === "string") return v;
    } catch {
      /* 某些隐私模式不支持 IndexedDB */
    }
    try {
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: async (name, value) => {
    if (typeof window === "undefined") return;
    try {
      await idbSet(name, value);
    } catch {
      try {
        window.localStorage.setItem(name, value);
      } catch {
        /* 存储已满 */
      }
    }
  },
  removeItem: async (name) => {
    try {
      await idbDel(name);
    } catch {
      /* noop */
    }
    try {
      window.localStorage.removeItem(name);
    } catch {
      /* noop */
    }
  },
};

const clip = (v: unknown, n: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, n) : undefined);

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialData(),
      newSession: () => {
        const id = uid();
        const now = Date.now();
        set((s) => ({ sessions: [{ id, title: "新的对话", category: "日常", createdAt: now, updatedAt: now, messages: [] }, ...s.sessions], currentId: id }));
        return id;
      },
      setCurrent: (id) => set({ currentId: id }),
      deleteSession: (id) => set((s) => ({ sessions: s.sessions.filter((x) => x.id !== id), currentId: s.currentId === id ? null : s.currentId })),
      patchSession: (id, patch) => set((s) => ({ sessions: s.sessions.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      appendMessage: (sid, m) =>
        set((s) => ({
          sessions: s.sessions
            .map((x) => (x.id === sid ? { ...x, messages: [...x.messages, m], updatedAt: Date.now() } : x))
            .sort((a, b) => b.updatedAt - a.updatedAt),
        })),
      removeMessage: (sid, mid) => set((s) => ({ sessions: s.sessions.map((x) => (x.id === sid ? { ...x, messages: x.messages.filter((m) => m.id !== mid) } : x)) })),
      mergeMemo: (memo) => {
        const p = get().profile;
        const next: Profile = { ...p };
        if (clip(memo.name, 16)) next.name = clip(memo.name, 16);
        const b = clip(memo.birth, 20);
        if (b && /\d{4}\D\d{1,2}\D\d{1,2}/.test(b)) next.birth = b;
        if (clip(memo.gender, 4)) next.gender = clip(memo.gender, 4);
        if (clip(memo.city, 20)) next.city = clip(memo.city, 20);
        if (Array.isArray(memo.facts)) {
          const add = memo.facts.map((f) => String(f).trim().slice(0, 60)).filter((f) => f && !p.facts.includes(f));
          next.facts = [...p.facts, ...add].slice(-40);
        }
        if (Array.isArray(memo.tags)) {
          const add = memo.tags.map((f) => String(f).trim().slice(0, 10)).filter((f) => f && !p.tags.includes(f));
          next.tags = [...p.tags, ...add].slice(-16);
        }
        set({ profile: next });
      },
      setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
      removeFact: (i) => set((s) => ({ profile: { ...s.profile, facts: s.profile.facts.filter((_, k) => k !== i) } })),
      removeTag: (i) => set((s) => ({ profile: { ...s.profile, tags: s.profile.tags.filter((_, k) => k !== i) } })),
      upsertRecord: (r) => {
        const existing = r.key ? get().records.find((x) => x.key === r.key) : undefined;
        if (existing) {
          set((s) => ({ records: s.records.map((x) => (x.id === existing.id ? { ...x, ...r, updatedAt: Date.now() } : x)) }));
          return existing.id;
        }
        const id = uid();
        set((s) => ({ records: [{ ...r, id, createdAt: Date.now() }, ...s.records].slice(0, 300) }));
        return id;
      },
      removeRecord: (id) => set((s) => ({ records: s.records.filter((r) => r.id !== id) })),
      setWidgetResult: (key, v) => set((s) => ({ widgetResults: { ...s.widgetResults, [key]: v } })),
      addUsage: (n) =>
        set((s) => {
          const add = Math.max(0, Math.round(n));
          const today = dayKey();
          return { usage: { ...s.usage, total: s.usage.total + add, day: today, today: (s.usage.day === today ? s.usage.today : 0) + add } };
        }),
      setAnalogy: (a) => set((s) => ({ usage: { ...s.usage, analogy: { ...a, at: s.usage.total } } })),
      addLetgo: () =>
        set((s) => {
          const today = dayKey();
          return { letgo: { total: s.letgo.total + 1, day: today, today: s.letgo.day === today ? s.letgo.today + 1 : 1 } };
        }),
      addMerit: (cents, lampDays) =>
        set((s) => ({
          merit: {
            cents: s.merit.cents + cents,
            count: s.merit.count + 1,
            lastAt: Date.now(),
            lampUntil: lampDays ? Math.max(Date.now(), s.merit.lampUntil) + lampDays * 86400000 : s.merit.lampUntil,
          },
        })),
      spendDeep: () =>
        set((s) => {
          const today = dayKey();
          return { deep: { day: today, used: s.deep.day === today ? s.deep.used + 1 : 1 } };
        }),
      dismissNudge: () => set({ nudgeDay: dayKey() }),
      setSettings: (p) => set((s) => ({ settings: { ...s.settings, ...p } })),
      importData: (raw) => {
        if (!raw || typeof raw !== "object") return false;
        const o = raw as Partial<AppData>;
        if (!Array.isArray(o.sessions) || !o.profile) return false;
        const base = initialData();
        set({
          ...base,
          ...o,
          anonId: get().anonId,
          profile: { ...base.profile, ...o.profile },
          settings: { ...base.settings, ...(o.settings ?? {}) },
          currentId: null,
        });
        return true;
      },
      resetAll: () => set({ ...initialData(), anonId: get().anonId, settings: get().settings }),
    }),
    {
      name: "suanle-v2",
      storage: createJSONStorage(() => idbStorage),
      version: 2,
      skipHydration: true,
      partialize: (s) => {
        const { newSession, setCurrent, deleteSession, patchSession, appendMessage, removeMessage, mergeMemo, setProfile, removeFact, removeTag, upsertRecord, removeRecord, setWidgetResult, addUsage, setAnalogy, addLetgo, addMerit, spendDeep, dismissNudge, setSettings, importData, resetAll, ...data } = s;
        void [newSession, setCurrent, deleteSession, patchSession, appendMessage, removeMessage, mergeMemo, setProfile, removeFact, removeTag, upsertRecord, removeRecord, setWidgetResult, addUsage, setAnalogy, addLetgo, addMerit, spendDeep, dismissNudge, setSettings, importData, resetAll];
        return data;
      },
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AppData>;
        const base = initialData();
        return {
          ...current,
          ...p,
          profile: { ...base.profile, ...(p.profile ?? {}) },
          usage: { ...base.usage, ...(p.usage ?? {}) },
          letgo: { ...base.letgo, ...(p.letgo ?? {}) },
          merit: { ...base.merit, ...(p.merit ?? {}) },
          deep: { ...base.deep, ...(p.deep ?? {}) },
          settings: { ...base.settings, ...(p.settings ?? {}) },
        };
      },
    },
  ),
);

export function exportData(): string {
  const s = useApp.getState();
  const data = { app: "suanle", version: 2, exportedAt: new Date().toISOString(), profile: s.profile, sessions: s.sessions, records: s.records, usage: s.usage, letgo: s.letgo, merit: s.merit, settings: { ...s.settings, engine: null } };
  return JSON.stringify(data, null, 2);
}

export function lampActive(s: { merit: { lampUntil: number } }) {
  return s.merit.lampUntil > Date.now();
}

export function deepLeft(s: { deep: { day: string; used: number } }) {
  return Math.max(0, FREE_DEEP_PER_DAY - (s.deep.day === dayKey() ? s.deep.used : 0));
}

export function todayLetgo(s: { letgo: { day: string; today: number } }) {
  return s.letgo.day === dayKey() ? s.letgo.today : 0;
}

export function todayUsage(s: { usage: { day: string; today: number } }) {
  return s.usage.day === dayKey() ? s.usage.today : 0;
}

export function profileHint(p: Profile): string {
  return [...p.tags, ...p.facts.slice(-8)].join(" ");
}

/* ───────── 非持久化的界面状态 ───────── */

export type Tab = "chat" | "explore" | "letgo" | "me";
export type SheetName = "tip" | "lamp" | "sessions" | "profile" | "settings" | "record" | "share" | null;
export type PanelName = "coins" | "tarot" | "bazi" | "ziwei" | "annual" | "almanac" | null;

export interface Live {
  sessionId: string;
  msgId: string;
  content: string;
  started: number;
  deep: boolean;
}

interface UIState {
  tab: Tab;
  sheet: SheetName;
  sheetPayload: Record<string, unknown> | null;
  panel: PanelName;
  toastText: string | null;
  quote: string | null;
  live: Live | null;
  letgoDraft: string;
  keyboard: boolean;
  deepArmed: boolean;
  setTab: (t: Tab) => void;
  open: (s: Exclude<SheetName, null>, payload?: Record<string, unknown>) => void;
  close: () => void;
  openPanel: (p: Exclude<PanelName, null>) => void;
  closePanel: () => void;
  toast: (t: string) => void;
  setQuote: (q: string | null) => void;
  setLive: (l: Live | null) => void;
  setLetgoDraft: (t: string) => void;
  setKeyboard: (k: boolean) => void;
  setDeepArmed: (d: boolean) => void;
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useUI = create<UIState>()((set) => ({
  tab: "chat",
  sheet: null,
  sheetPayload: null,
  panel: null,
  toastText: null,
  quote: null,
  live: null,
  letgoDraft: "",
  keyboard: false,
  deepArmed: false,
  setTab: (tab) => set({ tab }),
  open: (sheet, payload) => set({ sheet, sheetPayload: payload ?? null }),
  close: () => set({ sheet: null }),
  openPanel: (panel) => set({ panel }),
  closePanel: () => set({ panel: null }),
  toast: (toastText) => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ toastText });
    toastTimer = setTimeout(() => set({ toastText: null }), 2200);
  },
  setQuote: (quote) => set({ quote }),
  setLive: (live) => set({ live }),
  setLetgoDraft: (letgoDraft) => set({ letgoDraft }),
  setKeyboard: (keyboard) => set({ keyboard }),
  setDeepArmed: (deepArmed) => set({ deepArmed }),
}));

/** 自定义模型服务的请求头 */
export function engineHeaders(): Record<string, string> {
  const e = useApp.getState().settings.engine;
  if (!e || !e.key.trim()) return {};
  const h: Record<string, string> = { "x-engine-key": e.key.trim() };
  if (e.base.trim()) h["x-engine-base"] = e.base.trim();
  if (e.model.trim()) h["x-engine-model"] = e.model.trim();
  return h;
}
