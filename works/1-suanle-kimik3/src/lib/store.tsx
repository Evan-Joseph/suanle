"use client";

import { createContext, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from "react";
import type { BirthProfile } from "./fortune";
import { todayKey, uid } from "./rand";

// ———————————————— 类型 ————————————————
export type PlanId = "single" | "monthly" | "yearly";
export type PayMethod = "wechat" | "alipay" | "apple";

export const PLANS: Record<PlanId, {
  id: PlanId; name: string; price: number; orig: number; unit: string; tag?: string; desc: string;
}> = {
  single:  { id: "single",  name: "单次锦囊", price: 9.9,  orig: 19.9,  unit: "次", desc: "解开本次完整解卦 · 含人生波段与四大板块" },
  monthly: { id: "monthly", name: "连续包月", price: 19.9, orig: 30,    unit: "月", tag: "轻盈之选", desc: "全部深度权益 · 酒馆深聊不限次" },
  yearly:  { id: "yearly",  name: "年度会员", price: 99,   orig: 238.8, unit: "年", tag: "限时 4 折 · 最超值", desc: "全年全部权益 · 新功能优先体验" },
};

export interface Membership {
  tier: "guest" | "pro";
  plan?: "monthly" | "yearly";
  since?: string;
  until?: string;
  unlocked: string[]; // 单次解锁的卦局 id
}

export interface Order {
  id: string;
  plan: PlanId;
  amount: number;
  method: PayMethod;
  createdAt: string;
  methodLabel: string;
}

export interface ReadingRecord {
  id: string;
  createdAt: string;
  profile: BirthProfile;
  summary: string;
  archetype: string;
}

export interface Fav { id: string; text: string; date: string; from: string }
export interface ApiConfig { baseUrl: string; apiKey: string; model: string }

export interface AppState {
  profile: BirthProfile | null;
  member: Membership;
  orders: Order[];
  readings: ReadingRecord[];
  favs: Fav[];
  fish: { total: number; byDay: Record<string, number> };
  worries: number;
  chatUsage: Record<string, number>;
  chatLog: Record<string, { role: "user" | "assistant"; text: string }[]>;
  api: ApiConfig | null;
}

const DEFAULT_STATE: AppState = {
  profile: null,
  member: { tier: "guest", unlocked: [] },
  orders: [],
  readings: [],
  favs: [],
  fish: { total: 0, byDay: {} },
  worries: 0,
  chatUsage: {},
  chatLog: {},
  api: null,
};

const STORAGE_KEY = "suanle.v1";

// ———————————————— Reducer ————————————————
type Action =
  | { type: "hydrate"; state: AppState }
  | { type: "setProfile"; profile: BirthProfile | null }
  | { type: "purchase"; plan: PlanId; method: PayMethod; methodLabel: string; readingId?: string }
  | { type: "setTier"; tier: "guest" | "monthly" | "yearly" }
  | { type: "addReading"; record: ReadingRecord }
  | { type: "removeReading"; id: string }
  | { type: "toggleFav"; fav: Fav }
  | { type: "fishBump" }
  | { type: "worryBump" }
  | { type: "chatUse" }
  | { type: "chatAppend"; persona: string; role: "user" | "assistant"; text: string }
  | { type: "chatClear"; persona: string }
  | { type: "setApi"; api: ApiConfig | null }
  | { type: "wipe" };

function reducer(state: AppState, a: Action): AppState {
  switch (a.type) {
    case "hydrate":
      return { ...DEFAULT_STATE, ...a.state, member: { ...DEFAULT_STATE.member, ...a.state.member } };
    case "setProfile":
      return { ...state, profile: a.profile };
    case "purchase": {
      const order: Order = {
        id: "SL" + new Date().toISOString().slice(2, 10).replace(/-/g, "") + uid("").toUpperCase().slice(0, 6),
        plan: a.plan, amount: PLANS[a.plan].price, method: a.method,
        methodLabel: a.methodLabel, createdAt: new Date().toISOString(),
      };
      const member = { ...state.member };
      if (a.plan === "single" && a.readingId) {
        member.unlocked = [...new Set([...member.unlocked, a.readingId])];
      } else if (a.plan === "monthly" || a.plan === "yearly") {
        const now = Date.now();
        const base = member.until && new Date(member.until).getTime() > now ? new Date(member.until).getTime() : now;
        const until = new Date(base + (a.plan === "monthly" ? 30 : 365) * 86400000).toISOString();
        Object.assign(member, { tier: "pro" as const, plan: a.plan, since: member.since ?? new Date().toISOString(), until });
      }
      return { ...state, member, orders: [order, ...state.orders] };
    }
    case "setTier": {
      if (a.tier === "guest") {
        return { ...state, member: { tier: "guest", unlocked: state.member.unlocked } };
      }
      const until = new Date(Date.now() + (a.tier === "monthly" ? 30 : 365) * 86400000).toISOString();
      return {
        ...state,
        member: { tier: "pro", plan: a.tier, since: state.member.since ?? new Date().toISOString(), until, unlocked: state.member.unlocked },
      };
    }
    case "addReading": {
      const rest = state.readings.filter((r) => r.id !== a.record.id);
      return { ...state, readings: [a.record, ...rest].slice(0, 60) };
    }
    case "removeReading":
      return { ...state, readings: state.readings.filter((r) => r.id !== a.id) };
    case "toggleFav": {
      const exists = state.favs.some((f) => f.id === a.fav.id);
      return { ...state, favs: exists ? state.favs.filter((f) => f.id !== a.fav.id) : [a.fav, ...state.favs].slice(0, 99) };
    }
    case "fishBump": {
      const k = todayKey();
      return {
        ...state,
        fish: { total: state.fish.total + 1, byDay: { ...state.fish.byDay, [k]: (state.fish.byDay[k] ?? 0) + 1 } },
      };
    }
    case "worryBump":
      return { ...state, worries: state.worries + 1 };
    case "chatUse": {
      const k = todayKey();
      return { ...state, chatUsage: { ...state.chatUsage, [k]: (state.chatUsage[k] ?? 0) + 1 } };
    }
    case "chatAppend": {
      const log = [...(state.chatLog[a.persona] ?? []), { role: a.role, text: a.text }].slice(-80);
      return { ...state, chatLog: { ...state.chatLog, [a.persona]: log } };
    }
    case "chatClear": {
      const chatLog = { ...state.chatLog };
      delete chatLog[a.persona];
      return { ...state, chatLog };
    }
    case "setApi":
      return { ...state, api: a.api };
    case "wipe":
      return { ...DEFAULT_STATE };
    default:
      return state;
  }
}

// ———————————————— Context ————————————————
interface StoreCtx {
  state: AppState;
  ready: boolean;
  isPro: boolean;
  chatLeft: number;
  isUnlocked: (readingId: string) => boolean;
  setProfile: (p: BirthProfile | null) => void;
  purchase: (plan: PlanId, method: PayMethod, methodLabel: string, readingId?: string) => void;
  setTier: (t: "guest" | "monthly" | "yearly") => void;
  addReading: (r: ReadingRecord) => void;
  removeReading: (id: string) => void;
  toggleFav: (f: Fav) => void;
  fishBump: () => void;
  worryBump: () => void;
  chatUse: () => void;
  chatAppend: (persona: string, role: "user" | "assistant", text: string) => void;
  chatClear: (persona: string) => void;
  setApi: (api: ApiConfig | null) => void;
  wipe: () => void;
}

const Ctx = createContext<StoreCtx | null>(null);

export const FREE_CHAT_QUOTA = 8;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, DEFAULT_STATE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) dispatch({ type: "hydrate", state: JSON.parse(raw) as AppState });
    } catch { /* 保持默认状态 */ }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* 存储已满时静默 */ }
  }, [state, ready]);

  const value = useMemo<StoreCtx>(() => {
    const proActive =
      state.member.tier === "pro" && (!state.member.until || new Date(state.member.until).getTime() > Date.now());
    const used = state.chatUsage[todayKey()] ?? 0;
    return {
      state,
      ready,
      isPro: proActive,
      chatLeft: Math.max(0, FREE_CHAT_QUOTA - used),
      isUnlocked: (id) => proActive || state.member.unlocked.includes(id),
      setProfile: (profile) => dispatch({ type: "setProfile", profile }),
      purchase: (plan, method, methodLabel, readingId) =>
        dispatch({ type: "purchase", plan, method, methodLabel, readingId }),
      setTier: (t) => dispatch({ type: "setTier", tier: t }),
      addReading: (record) => dispatch({ type: "addReading", record }),
      removeReading: (id) => dispatch({ type: "removeReading", id }),
      toggleFav: (fav) => dispatch({ type: "toggleFav", fav }),
      fishBump: () => dispatch({ type: "fishBump" }),
      worryBump: () => dispatch({ type: "worryBump" }),
      chatUse: () => dispatch({ type: "chatUse" }),
      chatAppend: (persona, role, text) => dispatch({ type: "chatAppend", persona, role, text }),
      chatClear: (persona) => dispatch({ type: "chatClear", persona }),
      setApi: (api) => dispatch({ type: "setApi", api }),
      wipe: () => dispatch({ type: "wipe" }),
    };
  }, [state, ready]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): StoreCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore 必须在 StoreProvider 内使用");
  return ctx;
}

export function defaultProfile(): BirthProfile {
  return { name: "", gender: "secret", calType: "solar", year: 1998, month: 4, day: 12, hour: 6, city: "" };
}
