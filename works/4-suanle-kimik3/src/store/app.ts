"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { uid, todayKey } from "@/lib/utils";
import { consumeSSE } from "@/lib/stream";
import { DEFAULT_PERSONA, personaById } from "@/lib/personas";

/* ───────── types ───────── */

export type Role = "user" | "assistant";
export type TabKey = "chat" | "divine" | "archive" | "me";
export type ReadingType = "tarot" | "liuyao" | "bazi";

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  thinking?: string;
  ts: number;
  streaming?: boolean;
  thinkStreaming?: boolean;
  error?: boolean;
}

export interface Session {
  id: string;
  title: string;
  personaId: string;
  kind: "chat" | ReadingType;
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
}

export interface Reading {
  id: string;
  type: ReadingType;
  title: string;
  summary: string; // 给人看的结构化结果
  llmContext: string; // 给大师看的推演依据
  question?: string;
  createdAt: number;
  favorite?: boolean;
}

export interface Profile {
  name?: string;
  birthday?: string; // YYYY-MM-DD
  birthHour?: number | null;
  gender?: "male" | "female" | "secret";
}

interface Toast {
  id: string;
  text: string;
}

interface UsageState {
  total: number;
  today: number;
  day: string;
  metaphor?: string;
  metaphorDay?: string;
}

interface SendOpts {
  readingContext?: string;
  displayText?: string; // 界面上展示的用户消息（可与发给模型的不同）
}

/* ───────── store ───────── */

interface AppState {
  onboarded: boolean;
  tab: TabKey;
  drawerOpen: boolean;
  tipOpen: boolean;
  muted: boolean;

  profile: Profile;
  memory: string[];
  sessions: Session[];
  messages: Record<string, ChatMessage[]>;
  activeSessionId: string | null;
  readings: Reading[];
  usage: UsageState;
  donations: { count: number; total: number };
  woodfish: number;
  toasts: Toast[];

  // ui
  setTab: (t: TabKey) => void;
  setDrawer: (open: boolean) => void;
  setTipOpen: (open: boolean) => void;
  toggleMuted: () => void;
  completeOnboarding: () => void;
  toast: (text: string) => void;
  dismissToast: (id: string) => void;

  // profile & memory
  setProfile: (p: Partial<Profile>) => void;
  addMemoryFacts: (facts: string[]) => void;
  removeMemory: (idx: number) => void;

  // sessions
  newSession: (personaId?: string, kind?: Session["kind"]) => string;
  openSession: (id: string) => void;
  deleteSession: (id: string) => void;
  renameSession: (id: string, title: string) => void;
  pinSession: (id: string) => void;
  setSessionPersona: (id: string, personaId: string) => void;

  // messaging
  send: (text: string, opts?: SendOpts) => Promise<void>;
  stop: () => void;
  regenerate: () => Promise<void>;
  insertGreeting: () => void;

  // readings
  saveReading: (r: Omit<Reading, "id" | "createdAt" | "favorite">) => string;
  removeReading: (id: string) => void;
  toggleFavReading: (id: string) => void;
  askAboutReading: (reading: Reading) => void;

  // usage & donations
  addUsage: (n: number) => void;
  setMetaphor: (m: string) => void;
  donate: (amount: number) => void;
  knockWood: () => void;

  resetAll: () => void;
}

const DEFAULT_TITLE = "新起一炉";

let abortRef: AbortController | null = null;
let titleRunning = false;
let memoryRunning = false;
const genTimers = new Map<string, ReturnType<typeof setTimeout>>();

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      onboarded: false,
      tab: "chat",
      drawerOpen: false,
      tipOpen: false,
      muted: false,

      profile: {},
      memory: [],
      sessions: [],
      messages: {},
      activeSessionId: null,
      readings: [],
      usage: { total: 0, today: 0, day: todayKey() },
      donations: { count: 0, total: 0 },
      woodfish: 0,
      toasts: [],

      setTab: (t) => set({ tab: t }),
      setDrawer: (open) => set({ drawerOpen: open }),
      setTipOpen: (open) => set({ tipOpen: open }),
      toggleMuted: () => set((s) => ({ muted: !s.muted })),
      completeOnboarding: () => set({ onboarded: true }),

      toast: (text) => {
        const id = uid("t");
        set((s) => ({ toasts: [...s.toasts.slice(-2), { id, text }] }));
        setTimeout(() => get().dismissToast(id), 2600);
      },
      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

      setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),

      addMemoryFacts: (facts) =>
        set((s) => {
          const merged = [...s.memory];
          for (const f of facts) {
            if (!merged.some((m) => m === f)) merged.push(f);
          }
          return { memory: merged.slice(-24) };
        }),
      removeMemory: (idx) =>
        set((s) => ({ memory: s.memory.filter((_, i) => i !== idx) })),

      newSession: (personaId, kind = "chat") => {
        const id = uid("s");
        const st = get();
        const currentPersona = st.sessions.find((x) => x.id === st.activeSessionId)?.personaId;
        const session: Session = {
          id,
          title: DEFAULT_TITLE,
          personaId: personaId ?? currentPersona ?? DEFAULT_PERSONA.id,
          kind,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((s) => ({
          sessions: [session, ...s.sessions],
          messages: { ...s.messages, [id]: [] },
          activeSessionId: id,
          drawerOpen: false,
        }));
        return id;
      },
      openSession: (id) => set({ activeSessionId: id, drawerOpen: false }),
      deleteSession: (id) =>
        set((s) => {
          const sessions = s.sessions.filter((x) => x.id !== id);
          const messages = { ...s.messages };
          delete messages[id];
          return {
            sessions,
            messages,
            activeSessionId:
              s.activeSessionId === id ? sessions[0]?.id ?? null : s.activeSessionId,
          };
        }),
      renameSession: (id, title) =>
        set((s) => ({
          sessions: s.sessions.map((x) => (x.id === id ? { ...x, title: title.slice(0, 24) } : x)),
        })),
      pinSession: (id) =>
        set((s) => ({
          sessions: s.sessions.map((x) => (x.id === id ? { ...x, pinned: !x.pinned } : x)),
        })),
      setSessionPersona: (id, personaId) =>
        set((s) => ({
          sessions: s.sessions.map((x) => (x.id === id ? { ...x, personaId } : x)),
        })),

      insertGreeting: () => {
        const s = get();
        const sid = s.activeSessionId;
        if (!sid) return;
        const msgs = s.messages[sid] ?? [];
        if (msgs.length > 0) return;
        const persona = personaById(s.sessions.find((x) => x.id === sid)?.personaId);
        const greet: ChatMessage = {
          id: uid("m"),
          role: "assistant",
          content: persona.greeting,
          ts: Date.now(),
        };
        set({ messages: { ...s.messages, [sid]: [greet] } });
      },

      send: async (text, opts) => {
        const state = get();
        let sid = state.activeSessionId;
        if (!sid || !state.sessions.some((x) => x.id === sid)) {
          sid = state.newSession();
        }
        const sessionId = sid;
        const display = opts?.displayText ?? text;

        const userMsg: ChatMessage = { id: uid("m"), role: "user", content: display, ts: Date.now() };
        const asstMsg: ChatMessage = {
          id: uid("m"),
          role: "assistant",
          content: "",
          thinking: "",
          ts: Date.now(),
          streaming: true,
        };

        set((s) => ({
          messages: {
            ...s.messages,
            [sessionId]: [...(s.messages[sessionId] ?? []), userMsg, asstMsg],
          },
          sessions: s.sessions.map((x) =>
            x.id === sessionId ? { ...x, updatedAt: Date.now() } : x
          ),
        }));

        // 组装发给模型的历史（不含展示层占位）
        const history = (get().messages[sessionId] ?? [])
          .filter((m) => m.id !== asstMsg.id)
          .map((m) => {
            if (m.id === userMsg.id && opts?.readingContext) {
              return { role: "user" as const, content: text };
            }
            return { role: m.role, content: m.content };
          });
        if (opts?.readingContext && history[history.length - 1]?.content === display) {
          history[history.length - 1] = { role: "user", content: text };
        }

        const session = get().sessions.find((x) => x.id === sessionId);
        const profile = get().profile;

        abortRef = new AbortController();
        let raw = "";
        let usageTokens = 0;

        const patch = (fn: (m: ChatMessage) => Partial<ChatMessage>) => {
          set((s) => {
            const list = s.messages[sessionId] ?? [];
            return {
              messages: {
                ...s.messages,
                [sessionId]: list.map((m) => (m.id === asstMsg.id ? { ...m, ...fn(m) } : m)),
              },
            };
          });
        };

        const applyRaw = () => {
          const trimmed = raw.trimStart();
          const thinkMatch = trimmed.match(/^<think>([\s\S]*?)(<\/think>|$)/);
          if (thinkMatch) {
            const thinking = thinkMatch[1].trim();
            const closed = trimmed.includes("</think>");
            const body = closed
              ? trimmed.slice(trimmed.indexOf("</think>") + 8).trimStart()
              : "";
            patch(() => ({
              thinking,
              content: body,
              thinkStreaming: !closed,
            }));
          } else {
            patch(() => ({ content: trimmed }));
          }
        };

        try {
          const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: history.slice(-24),
              personaId: session?.personaId,
              memory: get().memory,
              profile: {
                name: profile.name,
                birthday:
                  profile.birthday +
                  (profile.birthHour != null ? ` ${String(profile.birthHour).padStart(2, "0")}时` : ""),
                gender: profile.gender,
              },
              readingContext: opts?.readingContext,
            }),
            signal: abortRef.signal,
          });

          if (!res.ok) throw new Error(`http ${res.status}`);

          await consumeSSE(
            res,
            {
              onDelta: (d) => {
                raw += d;
                applyRaw();
              },
              onUsage: (n) => {
                usageTokens = n;
              },
              onDone: () => {
                if (!raw.trim()) {
                  const g = get();
                  const persona = personaById(session?.personaId);
                  patch(() => ({
                    content: `*${persona.name}皱了皱眉，掐指一算*\n\n怪了，方才天机晃了一下没接住。你再说一遍？这回我凝神听。`,
                    streaming: false,
                    thinkStreaming: false,
                  }));
                  void g;
                } else {
                  patch(() => ({ streaming: false, thinkStreaming: false }));
                }
                const promptChars = history.reduce((acc, m) => acc + m.content.length, 0);
                const est = Math.ceil((promptChars + raw.length) * 0.7);
                get().addUsage(usageTokens > 0 ? usageTokens : est);
                afterStream(sessionId);
              },
              onError: () => {
                patch(() => ({
                  streaming: false,
                  thinkStreaming: false,
                  error: true,
                  content:
                    raw.trim() ||
                    "*窗外的风忽然乱了，线香也断了*\n\n方才与你说话时，馆里的线香「啪」地断了一截——信号被风吹散了。你重新说一遍？这回我给你拿最稳的那支香。",
                }));
              },
            },
            abortRef.signal
          );
        } catch (e) {
          if ((e as Error).name === "AbortError") {
            patch(() => ({ streaming: false, thinkStreaming: false }));
          } else {
            patch(() => ({
              streaming: false,
              thinkStreaming: false,
              error: true,
              content:
                "*馆里的灯笼晃了晃*\n\n刚才你与我说话时，小馆的灯笼晃了一下，声音没传过来。再说一遍？我支起耳朵听着呢。",
            }));
          }
        }

        async function afterStream(sid2: string) {
          // 会话标题（第 2 条用户消息后异步归纳）
          const s = get();
          const msgs = s.messages[sid2] ?? [];
          const userCount = msgs.filter((m) => m.role === "user").length;
          const session2 = s.sessions.find((x) => x.id === sid2);
          if (session2 && session2.title === DEFAULT_TITLE && userCount >= 1 && !titleRunning) {
            titleRunning = true;
            try {
              const res2 = await fetch("/api/title", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  messages: msgs.slice(0, 8).map((m) => ({ role: m.role, content: m.content })),
                }),
              });
              const data = (await res2.json()) as { title?: string };
              if (data.title) get().renameSession(sid2, data.title);
            } catch {
              /* 保持默认标题 */
            } finally {
              titleRunning = false;
            }
          }
          // 记忆抽取（每 2 轮用户消息一次）
          if (userCount > 0 && userCount % 2 === 0 && !memoryRunning) {
            memoryRunning = true;
            try {
              const res3 = await fetch("/api/memory", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  messages: msgs.slice(-10).map((m) => ({ role: m.role, content: m.content })),
                  existing: get().memory,
                }),
              });
              const data = (await res3.json()) as { facts?: string[] };
              if (data.facts?.length) get().addMemoryFacts(data.facts);
            } catch {
              /* 静默 */
            } finally {
              memoryRunning = false;
            }
          }
        }
      },

      stop: () => {
        abortRef?.abort();
        abortRef = null;
      },

      regenerate: async () => {
        const s = get();
        const sid = s.activeSessionId;
        if (!sid) return;
        const msgs = s.messages[sid] ?? [];
        const lastUserIdx = [...msgs].map((m) => m.role).lastIndexOf("user");
        if (lastUserIdx < 0) return;
        const lastUser = msgs[lastUserIdx];
        // 移除最后一条用户消息之后的全部内容（含该用户消息，重发）
        set((st) => ({
          messages: { ...st.messages, [sid]: msgs.slice(0, lastUserIdx) },
        }));
        await get().send(lastUser.content);
      },

      saveReading: (r) => {
        const id = uid("r");
        set((s) => ({
          readings: [{ ...r, id, createdAt: Date.now() }, ...s.readings],
        }));
        return id;
      },
      removeReading: (id) => set((s) => ({ readings: s.readings.filter((r) => r.id !== id) })),
      toggleFavReading: (id) =>
        set((s) => ({
          readings: s.readings.map((r) => (r.id === id ? { ...r, favorite: !r.favorite } : r)),
        })),

      askAboutReading: (reading) => {
        const personaFor =
          reading.type === "tarot" ? "selena" : reading.type === "liuyao" ? "xuanji" : "xuanji";
        const sid = get().newSession(personaFor, reading.type);
        set({ tab: "chat", activeSessionId: sid });
        const display =
          reading.type === "tarot"
            ? `我刚抽了牌（${reading.title}），帮我解解。`
            : reading.type === "liuyao"
              ? `我刚摇了一卦（${reading.title}），劳烦帮我断一断。`
              : `我排了自己的八字（${reading.title}），帮我讲讲。`;
        void get().send(`【馆内起课】\n${reading.llmContext}`, {
          readingContext: reading.llmContext,
          displayText: display,
        });
      },

      addUsage: (n) =>
        set((s) => {
          const day = todayKey();
          const sameDay = s.usage.day === day;
          return {
            usage: {
              ...s.usage,
              day,
              today: (sameDay ? s.usage.today : 0) + n,
              total: s.usage.total + n,
            },
          };
        }),
      setMetaphor: (m) => set((s) => ({ usage: { ...s.usage, metaphor: m, metaphorDay: todayKey() } })),

      donate: (amount) =>
        set((s) => ({
          donations: { count: s.donations.count + 1, total: s.donations.total + amount },
          tipOpen: false,
        })),
      knockWood: () => set((s) => ({ woodfish: s.woodfish + 1 })),

      resetAll: () => {
        for (const [, timer] of genTimers) clearTimeout(timer);
        set({
          onboarded: true,
          profile: {},
          memory: [],
          sessions: [],
          messages: {},
          activeSessionId: null,
          readings: [],
          usage: { total: 0, today: 0, day: todayKey() },
          donations: { count: 0, total: 0 },
          woodfish: 0,
        });
      },
    }),
    {
      name: "suanle-store-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        onboarded: s.onboarded,
        profile: s.profile,
        memory: s.memory,
        sessions: s.sessions,
        messages: s.messages,
        activeSessionId: s.activeSessionId,
        readings: s.readings,
        usage: s.usage,
        donations: s.donations,
        woodfish: s.woodfish,
        muted: s.muted,
        tab: s.tab,
      }),
    }
  )
);

// TS: computed property in object literal — expose helper
export function useActiveSession() {
  const sessions = useApp((s) => s.sessions);
  const activeId = useApp((s) => s.activeSessionId);
  return sessions.find((x) => x.id === activeId) ?? null;
}
