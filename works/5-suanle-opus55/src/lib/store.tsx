"use client";
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { emptyProfile, type AppState, type DivRecord, type Msg, type Profile, type Session } from "./types";
import { uid } from "./text";

const KEY = "suanle:v1";

function initial(): AppState {
  return {
    deviceId: "",
    profile: { ...emptyProfile },
    sessions: [],
    activeId: null,
    records: [],
    usage: { total: 0, byDay: {} },
    support: { count: 0, totalCents: 0, memberUntil: 0 },
    letgo: 0,
    muted: false,
    onboarded: false,
  };
}

export function dayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function greetingMsg(profile: Profile): Msg {
  const h = new Date().getHours();
  const time = h < 5 ? "这么晚还没睡呀" : h < 11 ? "早呀" : h < 14 ? "中午好" : h < 18 ? "下午好" : h < 22 ? "晚上好" : "夜深了";
  const content = profile.name
    ? `${time}，${profile.name}。今天想算点什么，还是……只是想找个人说说话？`
    : `${time}。我是**算了**——一个会点八字、六爻、塔罗，但更擅长陪人聊天的老朋友。\n\n不用填表，也不用想好要问什么。最近有什么事在心里打转吗？或者，先告诉我该怎么称呼你？`;
  return { id: uid(), role: "assistant", content, createdAt: Date.now(), status: "done" };
}

export function newSession(profile: Profile): Session {
  const now = Date.now();
  return { id: uid(), title: "新的对话", tag: "日常", createdAt: now, updatedAt: now, messages: [greetingMsg(profile)], tokens: 0 };
}

interface Ctx {
  state: AppState;
  ready: boolean;
  set: (fn: (s: AppState) => AppState) => void;
  active: Session | null;
  updateSession: (id: string, fn: (s: Session) => Session) => void;
  addRecord: (r: Omit<DivRecord, "id" | "createdAt">) => DivRecord;
  mergeProfile: (p: Partial<Profile>) => void;
  addUsage: (n: number) => void;
  startSession: () => string;
}

const C = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initial);
  const [ready, setReady] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(state);
  useLayoutEffect(() => {
    latest.current = state;
  });

  useEffect(() => {
    let s = initial();
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        s = { ...s, ...parsed, profile: { ...emptyProfile, ...(parsed.profile || {}) } };
        // any message left streaming from a closed tab becomes stopped
        s.sessions = s.sessions.map((x) => ({
          ...x,
          messages: x.messages.map((m) => (m.status === "streaming" ? { ...m, status: "stopped" as const } : m)),
        }));
      }
    } catch {
      /* corrupted storage: start fresh */
    }
    if (!s.deviceId) s.deviceId = (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : uid() + uid());
    if (!s.sessions.length) {
      const ns = newSession(s.profile);
      s.sessions = [ns];
      s.activeId = ns.id;
    }
    if (!s.activeId || !s.sessions.find((x) => x.id === s.activeId)) s.activeId = s.sessions[0].id;
    latest.current = s;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(s);
    setReady(true);
  }, []);

  const persist = useCallback(() => {
    if (timer.current) return;
    timer.current = setTimeout(() => {
      timer.current = null;
      try {
        localStorage.setItem(KEY, JSON.stringify(latest.current));
      } catch {
        // quota: trim oldest sessions
        try {
          const s = { ...latest.current, sessions: latest.current.sessions.slice(0, 20) };
          localStorage.setItem(KEY, JSON.stringify(s));
        } catch { /* give up quietly */ }
      }
    }, 400);
  }, []);

  useEffect(() => {
    if (ready) persist();
  }, [state, ready, persist]);

  useEffect(() => {
    const flush = () => {
      try { localStorage.setItem(KEY, JSON.stringify(latest.current)); } catch { /* noop */ }
    };
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, []);

  const set = useCallback((fn: (s: AppState) => AppState) => setState(fn), []);

  const updateSession = useCallback((id: string, fn: (s: Session) => Session) => {
    setState((s) => ({ ...s, sessions: s.sessions.map((x) => (x.id === id ? fn(x) : x)) }));
  }, []);

  const addRecord = useCallback((r: Omit<DivRecord, "id" | "createdAt">) => {
    const rec: DivRecord = { ...r, id: uid(), createdAt: Date.now() };
    setState((s) => ({ ...s, records: [rec, ...s.records].slice(0, 300), letgo: r.kind === "letgo" ? s.letgo + 1 : s.letgo }));
    return rec;
  }, []);

  const mergeProfile = useCallback((p: Partial<Profile>) => {
    setState((s) => {
      const next = { ...s.profile };
      (Object.keys(p) as (keyof Profile)[]).forEach((k) => {
        const v = p[k];
        if (v === undefined || v === null || v === "") return;
        if (k === "concerns") {
          const arr = Array.isArray(v) ? v : [String(v)];
          next.concerns = Array.from(new Set([...next.concerns, ...arr.map(String)])).slice(-6);
        } else {
          (next as unknown as Record<string, string>)[k] = String(v).slice(0, 60);
        }
      });
      return { ...s, profile: next };
    });
  }, []);

  const addUsage = useCallback((n: number) => {
    const k = dayKey();
    setState((s) => ({ ...s, usage: { total: s.usage.total + n, byDay: { ...s.usage.byDay, [k]: (s.usage.byDay[k] || 0) + n } } }));
  }, []);

  const startSession = useCallback(() => {
    const cur = latest.current;
    const act = cur.sessions.find((x) => x.id === cur.activeId);
    // reuse an untouched session
    if (act && act.messages.length <= 1) return act.id;
    const ns = newSession(cur.profile);
    setState((s) => ({ ...s, sessions: [ns, ...s.sessions], activeId: ns.id }));
    return ns.id;
  }, []);

  const active = state.sessions.find((x) => x.id === state.activeId) || null;

  return (
    <C.Provider value={{ state, ready, set, active, updateSession, addRecord, mergeProfile, addUsage, startSession }}>
      {children}
    </C.Provider>
  );
}

export function useApp() {
  const c = useContext(C);
  if (!c) throw new Error("StoreProvider missing");
  return c;
}
