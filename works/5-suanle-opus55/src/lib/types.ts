export type Role = "user" | "assistant";

export interface Msg {
  id: string;
  role: Role;
  content: string;
  reasoning?: string;
  tokens?: number;
  createdAt: number;
  status?: "streaming" | "done" | "error" | "stopped";
  offline?: boolean;
  quote?: string;
  /** a widget result that was posted by the user from an inline card */
  fromWidget?: string;
  /** widgets already completed in this assistant message */
  usedWidgets?: string[];
}

export interface Session {
  id: string;
  title: string;
  tag: string;
  createdAt: number;
  updatedAt: number;
  messages: Msg[];
  tokens: number;
  analogy?: string;
  metaAt?: number;
}

export interface Profile {
  name: string;
  birthDate: string; // YYYY-MM-DD
  birthTime: string; // HH:mm or ''
  gender: string;
  city: string;
  concerns: string[];
  notes: string;
  likes: string; // little things they love, used for analogies
}

export type RecordKind = "liuyao" | "tarot" | "bazi" | "qian" | "letgo";

export interface DivRecord {
  id: string;
  kind: RecordKind;
  title: string;
  summary: string;
  detail: string; // human readable text, can be sent to chat
  createdAt: number;
}

export interface AppState {
  deviceId: string;
  profile: Profile;
  sessions: Session[];
  activeId: string | null;
  records: DivRecord[];
  usage: { total: number; byDay: Record<string, number> };
  support: { count: number; totalCents: number; memberUntil: number };
  letgo: number;
  muted: boolean;
  onboarded: boolean;
}

export const emptyProfile: Profile = {
  name: "",
  birthDate: "",
  birthTime: "",
  gender: "",
  city: "",
  concerns: [],
  notes: "",
  likes: "",
};

export const TAGS = ["事业", "感情", "自我", "家人", "钱财", "占卜", "日常"] as const;
