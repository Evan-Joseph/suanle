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
  ambient: boolean;
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
  addFact: (fact: string) => void;
  addTag: (tag: string) => void;
  clearMemory: () => void;
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
  importData: (raw: unknown, mode?: "merge" | "replace") => boolean;
  resetAll: () => void;
}

export type AppState = AppData & AppActions;

/** 优先读取本地最高信任锚点，防止普通缓存清理导致自然人身份分裂 */
const getResilientAnonId = (): string => {
  if (typeof window !== "undefined") {
    try {
      const existing = window.localStorage.getItem("suanle_permanent_anon_id");
      if (existing && existing.length >= 12) return existing;
    } catch {}
  }
  const fresh = uid() + uid();
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem("suanle_permanent_anon_id", fresh);
    } catch {}
  }
  return fresh;
};

const initialData = (): AppData => ({
  anonId: getResilientAnonId(),
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
  settings: { sound: true, haptics: true, ambient: false, theme: "system", engine: null },
});

/* 韧性自愈存储 (Storage Self-Healing)：IndexedDB 与 localStorage 双轨镜像 + 互锁自愈补全 */
const resilientStorage: StateStorage = {
  getItem: async (name) => {
    if (typeof window === "undefined") return null;
    let idbVal: string | null = null;
    let lsVal: string | null = null;

    try {
      const v = await idbGet<string>(name);
      if (typeof v === "string" && v.trim()) idbVal = v;
    } catch {
      /* 某些极端无痕模式不支持 IDB */
    }

    try {
      const v = window.localStorage.getItem(name);
      if (v && v.trim()) lsVal = v;
    } catch {
      /* noop */
    }

    // 1. 双边都有有效数据：优先取内容更完整的数据
    if (idbVal && lsVal) {
      return idbVal.length >= lsVal.length ? idbVal : lsVal;
    }

    // 2. 仅 IndexedDB 存在（用户手误清理了 localStorage）：自动自愈回写 localStorage
    if (idbVal && !lsVal) {
      try {
        window.localStorage.setItem(name, idbVal);
      } catch {}
      return idbVal;
    }

    // 3. 仅 localStorage 存在（IndexedDB 被清或重置）：自动自愈回写 IndexedDB
    if (!idbVal && lsVal) {
      try {
        void idbSet(name, lsVal);
      } catch {}
      return lsVal;
    }

    return null;
  },
  setItem: async (name, value) => {
    if (typeof window === "undefined") return;

    // 1. 同步镜像写入 localStorage
    try {
      window.localStorage.setItem(name, value);
    } catch {
      /* 局部配额警告 */
    }

    // 2. 异步镜像写入 IndexedDB
    try {
      await idbSet(name, value);
    } catch {
      /* noop */
    }

    // 3. 将 anonId 独立锚定写入防丢失专有硬键
    try {
      const parsed = JSON.parse(value);
      const anonId = parsed?.state?.anonId;
      if (typeof anonId === "string" && anonId) {
        window.localStorage.setItem("suanle_permanent_anon_id", anonId);
      }
    } catch {}
  },
  removeItem: async (name) => {
    try {
      await idbDel(name);
    } catch {}
    try {
      window.localStorage.removeItem(name);
    } catch {}
  },
};

let syncTimer: ReturnType<typeof setTimeout> | null = null;
export function reportProfileToServer(anonId: string, profile: Partial<Profile>) {
  if (typeof window === "undefined" || !anonId) return;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    try {
      fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anonId,
          name: profile.name,
          birth: profile.birth,
          gender: profile.gender,
          city: profile.city,
        }),
      }).catch(() => {});
    } catch {
      /* 静默 */
    }
  }, 400);
}

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
        reportProfileToServer(get().anonId, next);
      },
      setProfile: (p) => {
        set((s) => {
          const next = { ...s.profile, ...p };
          reportProfileToServer(s.anonId, next);
          return { profile: next };
        });
      },
      removeFact: (i) => set((s) => ({ profile: { ...s.profile, facts: s.profile.facts.filter((_, k) => k !== i) } })),
      removeTag: (i) => set((s) => ({ profile: { ...s.profile, tags: s.profile.tags.filter((_, k) => k !== i) } })),
      addFact: (fact) => {
        const f = String(fact).trim().slice(0, 60);
        if (!f) return;
        set((s) => ({ profile: { ...s.profile, facts: [...s.profile.facts.filter((x) => x !== f), f].slice(-40) } }));
      },
      addTag: (tag) => {
        const t = String(tag).trim().slice(0, 10);
        if (!t) return;
        set((s) => ({ profile: { ...s.profile, tags: [...s.profile.tags.filter((x) => x !== t), t].slice(-16) } }));
      },
      clearMemory: () => set((s) => ({ profile: { ...s.profile, facts: [], tags: [] } })),
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
      importData: (raw, mode = "merge") => {
        if (!raw || typeof raw !== "object") return false;
        const o = raw as Partial<AppData>;
        if (!Array.isArray(o.sessions) || !o.profile) return false;
        const current = get();
        const base = initialData();

        if (mode === "replace") {
          set({
            ...base,
            ...o,
            anonId: current.anonId,
            profile: { ...base.profile, ...o.profile },
            settings: { ...base.settings, ...(o.settings ?? {}) },
            currentId: o.sessions[0]?.id ?? null,
          });
          reportProfileToServer(current.anonId, { ...base.profile, ...o.profile });
          return true;
        }

        // 默认智能无损幂等合并 (Idempotent Lossless Merge)
        // 1. 会话去重合并：根据 id 归拢，若有冲突保留消息数更多或更新时间更近的会话
        const sessionMap = new Map<string, Session>();
        current.sessions.forEach((s) => sessionMap.set(s.id, s));
        o.sessions.forEach((incoming) => {
          if (!incoming || !incoming.id) return;
          const existing = sessionMap.get(incoming.id);
          if (!existing) {
            sessionMap.set(incoming.id, incoming);
          } else {
            const preferred =
              (incoming.messages?.length ?? 0) >= (existing.messages?.length ?? 0) ||
              (incoming.updatedAt ?? 0) > (existing.updatedAt ?? 0)
                ? incoming
                : existing;
            sessionMap.set(incoming.id, preferred);
          }
        });
        const mergedSessions = Array.from(sessionMap.values()).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

        // 2. 占卜记录去重合并
        const recordMap = new Map<string, DivRecord>();
        current.records.forEach((r) => recordMap.set(r.id, r));
        (o.records ?? []).forEach((r) => {
          if (r && r.id) recordMap.set(r.id, r);
        });
        const mergedRecords = Array.from(recordMap.values()).sort((a, b) => b.createdAt - a.createdAt);

        // 3. 画像资料融合（非空覆盖，标签事实取并集）
        const p = current.profile;
        const op = o.profile;
        const mergedFacts = Array.from(new Set([...p.facts, ...(op.facts ?? [])])).slice(-40);
        const mergedTags = Array.from(new Set([...p.tags, ...(op.tags ?? [])])).slice(-16);
        const mergedProfile: Profile = {
          ...p,
          name: op.name || p.name,
          birth: op.birth || p.birth,
          gender: op.gender || p.gender,
          city: op.city || p.city,
          facts: mergedFacts,
          tags: mergedTags,
          firstSeen: Math.min(p.firstSeen || Date.now(), op.firstSeen || Date.now()),
        };

        // 4. 纸篓与功德计数取最大并集
        const mergedLetgo = {
          total: Math.max(current.letgo.total, o.letgo?.total ?? 0),
          day: dayKey(),
          today: current.letgo.day === dayKey() ? current.letgo.today : 0,
        };
        const mergedMerit = {
          cents: Math.max(current.merit.cents, o.merit?.cents ?? 0),
          count: Math.max(current.merit.count, o.merit?.count ?? 0),
          lastAt: Math.max(current.merit.lastAt, o.merit?.lastAt ?? 0),
          lampUntil: Math.max(current.merit.lampUntil, o.merit?.lampUntil ?? 0),
        };

        set({
          sessions: mergedSessions,
          records: mergedRecords,
          profile: mergedProfile,
          letgo: mergedLetgo,
          merit: mergedMerit,
          settings: { ...current.settings, ...(o.settings ?? {}) },
          currentId: mergedSessions[0]?.id ?? null,
        });

        // 将融合后的最新画像回传总账
        reportProfileToServer(current.anonId, mergedProfile);
        return true;
      },
      resetAll: () => set({ ...initialData(), anonId: get().anonId, settings: get().settings }),
    }),
    {
      name: "suanle-v2",
      storage: createJSONStorage(() => resilientStorage),
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
  const data = {
    app: "suanle",
    schemaVersion: 2,
    exportedAt: new Date().toISOString(),
    anonId: s.anonId,
    profile: s.profile,
    sessions: s.sessions,
    records: s.records,
    usage: s.usage,
    letgo: s.letgo,
    merit: s.merit,
    settings: { ...s.settings, engine: null },
  };
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
  setTab: (tab) => set({ tab, panel: null }),
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
