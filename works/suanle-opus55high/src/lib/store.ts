import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Memo } from "./parse";
import { DEFAULT_BASIS, type Basis } from "./meter";

export type Role = "user" | "assistant";

export interface Msg {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
  tokens?: number;
  offline?: boolean;
  quote?: string;
  thinkSec?: number;
  deep?: boolean;
  intro?: boolean;
}

export interface Session {
  id: string;
  title: string;
  category: string;
  emoji: string;
  createdAt: number;
  updatedAt: number;
  messages: Msg[];
  titledAt?: number;
  pinned?: boolean;
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

export type RecordKind = "coins" | "tarot" | "bazi" | "kline";
export interface DivRecord {
  id: string;
  kind: RecordKind;
  title: string;
  summary: string;
  text: string;
  createdAt: number;
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

interface AppState {
  profile: Profile;
  sessions: Session[];
  currentId: string | null;
  records: DivRecord[];
  widgetResults: Record<string, unknown>;
  usage: { total: number; today: number; day: string; basis: Basis[]; basisLine: string; basisAt: number };
  letgo: { total: number; day: string; today: number };
  merit: { cents: number; count: number; lampUntil: number };
  deep: { day: string; used: number };
  sound: boolean;

  newSession: () => string;
  setCurrent: (id: string | null) => void;
  deleteSession: (id: string) => void;
  patchSession: (id: string, patch: Partial<Pick<Session, "title" | "category" | "emoji" | "titledAt" | "pinned">>) => void;
  appendMessage: (sid: string, m: Msg) => void;
  removeMessage: (sid: string, mid: string) => void;
  mergeMemo: (memo: Memo) => void;
  setProfile: (p: Partial<Profile>) => void;
  removeFact: (i: number) => void;
  removeTag: (i: number) => void;
  addRecord: (r: Omit<DivRecord, "id" | "createdAt">) => void;
  removeRecord: (id: string) => void;
  setWidgetResult: (key: string, v: unknown) => void;
  addUsage: (n: number) => void;
  setBasis: (b: Basis[], line: string) => void;
  addLetgo: () => void;
  addMerit: (cents: number, lampDays?: number) => void;
  spendDeep: () => void;
  toggleSound: () => void;
  resetAll: () => void;
}

const initial = () => ({
  profile: { facts: [], tags: [], firstSeen: Date.now() } as Profile,
  sessions: [] as Session[],
  currentId: null as string | null,
  records: [] as DivRecord[],
  widgetResults: {} as Record<string, unknown>,
  usage: { total: 0, today: 0, day: dayKey(), basis: DEFAULT_BASIS, basisLine: "", basisAt: 0 },
  letgo: { total: 0, day: dayKey(), today: 0 },
  merit: { cents: 0, count: 0, lampUntil: 0 },
  deep: { day: dayKey(), used: 0 },
  sound: true,
});

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      ...initial(),
      newSession: () => {
        const id = uid();
        const now = Date.now();
        set((s) => ({
          sessions: [{ id, title: "新的对话", category: "日常", emoji: "☁️", createdAt: now, updatedAt: now, messages: [] }, ...s.sessions],
          currentId: id,
        }));
        return id;
      },
      setCurrent: (id) => set({ currentId: id }),
      deleteSession: (id) =>
        set((s) => ({ sessions: s.sessions.filter((x) => x.id !== id), currentId: s.currentId === id ? null : s.currentId })),
      patchSession: (id, patch) => set((s) => ({ sessions: s.sessions.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      appendMessage: (sid, m) =>
        set((s) => ({
          sessions: s.sessions.map((x) => (x.id === sid ? { ...x, messages: [...x.messages, m], updatedAt: Date.now() } : x)),
        })),
      removeMessage: (sid, mid) =>
        set((s) => ({ sessions: s.sessions.map((x) => (x.id === sid ? { ...x, messages: x.messages.filter((m) => m.id !== mid) } : x)) })),
      mergeMemo: (memo) => {
        const p = get().profile;
        const next: Profile = { ...p };
        const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 40) : undefined);
        if (str(memo.name)) next.name = str(memo.name);
        if (str(memo.birth) && /\d{4}/.test(String(memo.birth))) next.birth = str(memo.birth);
        if (str(memo.gender)) next.gender = str(memo.gender);
        if (str(memo.city)) next.city = str(memo.city);
        if (Array.isArray(memo.facts)) {
          const add = memo.facts.map((f) => String(f).trim().slice(0, 60)).filter((f) => f && !p.facts.includes(f));
          next.facts = [...p.facts, ...add].slice(-30);
        }
        if (Array.isArray(memo.tags)) {
          const add = memo.tags.map((f) => String(f).trim().slice(0, 12)).filter((f) => f && !p.tags.includes(f));
          next.tags = [...p.tags, ...add].slice(-16);
        }
        set({ profile: next });
      },
      setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
      removeFact: (i) => set((s) => ({ profile: { ...s.profile, facts: s.profile.facts.filter((_, k) => k !== i) } })),
      removeTag: (i) => set((s) => ({ profile: { ...s.profile, tags: s.profile.tags.filter((_, k) => k !== i) } })),
      addRecord: (r) => set((s) => ({ records: [{ ...r, id: uid(), createdAt: Date.now() }, ...s.records].slice(0, 200) })),
      removeRecord: (id) => set((s) => ({ records: s.records.filter((r) => r.id !== id) })),
      setWidgetResult: (key, v) => set((s) => ({ widgetResults: { ...s.widgetResults, [key]: v } })),
      addUsage: (n) =>
        set((s) => {
          const today = dayKey();
          const add = Math.max(0, Math.round(n));
          return { usage: { ...s.usage, total: s.usage.total + add, day: today, today: (s.usage.day === today ? s.usage.today : 0) + add } };
        }),
      setBasis: (basis, basisLine) => set((s) => ({ usage: { ...s.usage, basis, basisLine, basisAt: Date.now() } })),
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
            lampUntil: lampDays ? Math.max(Date.now(), s.merit.lampUntil) + lampDays * 86400000 : s.merit.lampUntil,
          },
        })),
      spendDeep: () =>
        set((s) => {
          const today = dayKey();
          return { deep: { day: today, used: s.deep.day === today ? s.deep.used + 1 : 1 } };
        }),
      toggleSound: () => set((s) => ({ sound: !s.sound })),
      resetAll: () => set({ ...initial() }),
    }),
    { name: "suanle-final-v1", storage: createJSONStorage(() => localStorage), version: 1 },
  ),
);

export const FREE_DEEP_PER_DAY = 3;
export const lampActive = (s: { merit: { lampUntil: number } }) => s.merit.lampUntil > Date.now();
export const deepLeft = (s: { deep: { day: string; used: number } }) =>
  Math.max(0, FREE_DEEP_PER_DAY - (s.deep.day === dayKey() ? s.deep.used : 0));

/* ───────── 非持久化界面状态 ───────── */

export type Tab = "chat" | "explore" | "letgo" | "me";
export type SheetName = "tip" | "lamp" | "share" | "profile" | null;

interface UIState {
  tab: Tab;
  drawer: boolean;
  sheet: SheetName;
  sheetPayload: Record<string, unknown> | null;
  toastText: string | null;
  letgoDraft: string;
  quote: string | null;
  inputFocused: boolean;
  deepMode: boolean;
  live: { sessionId: string; msgId: string; content: string; started: number } | null;
  setTab: (t: Tab) => void;
  setDrawer: (b: boolean) => void;
  open: (s: SheetName, payload?: Record<string, unknown>) => void;
  close: () => void;
  toast: (t: string) => void;
  setLetgoDraft: (t: string) => void;
  setQuote: (q: string | null) => void;
  setFocused: (f: boolean) => void;
  setDeepMode: (b: boolean) => void;
  setLive: (l: UIState["live"]) => void;
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useUI = create<UIState>()((set) => ({
  tab: "chat",
  drawer: false,
  sheet: null,
  sheetPayload: null,
  toastText: null,
  letgoDraft: "",
  quote: null,
  inputFocused: false,
  deepMode: false,
  live: null,
  setTab: (tab) => set({ tab, drawer: false }),
  setDrawer: (drawer) => set({ drawer }),
  open: (sheet, payload) => set({ sheet, sheetPayload: payload ?? null }),
  close: () => set({ sheet: null }),
  toast: (toastText) => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ toastText });
    toastTimer = setTimeout(() => set({ toastText: null }), 2200);
  },
  setLetgoDraft: (letgoDraft) => set({ letgoDraft }),
  setQuote: (quote) => set({ quote }),
  setFocused: (inputFocused) => set({ inputFocused }),
  setDeepMode: (deepMode) => set({ deepMode }),
  setLive: (live) => set({ live }),
}));
