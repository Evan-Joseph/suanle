import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  boolean,
  serial,
  index,
} from "drizzle-orm/pg-core";

export type UserProfile = {
  concern?: string;
  gender?: string;
  birthday?: string; // YYYY-MM-DD
  birthHour?: number | null; // 0-23, null = unknown
  city?: string;
  mood?: string;
  notes?: string[];
};

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  nickname: text("nickname"),
  persona: text("persona").notNull().default("xiaosuan"),
  profile: jsonb("profile").$type<UserProfile>().notNull().default({}),
  onboarded: boolean("onboarded").notNull().default(false),
  plan: text("plan").notNull().default("free"),
  planUntil: timestamp("plan_until", { withTimezone: true }),
  credits: integer("credits").notNull().default(0),
  letGoCount: integer("let_go_count").notNull().default(0),
  analogy: jsonb("analogy").$type<{ date: string; tokens: number; text: string; emoji: string; unit: string; count: number } | null>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const conversations = pgTable(
  "conversations",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    title: text("title"),
    persona: text("persona").notNull().default("xiaosuan"),
    letGo: boolean("let_go").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("conv_user_idx").on(t.userId, t.updatedAt)],
);

export type MessageMeta = {
  cast?: { kind: "hexagram" | "tarot"; data: unknown };
  offline?: boolean;
  thinkMs?: number;
};

export const messages = pgTable(
  "messages",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id").notNull(),
    role: text("role").notNull(),
    content: text("content").notNull().default(""),
    thinking: text("thinking"),
    meta: jsonb("meta").$type<MessageMeta>().notNull().default({}),
    tokens: integer("tokens").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("msg_conv_idx").on(t.conversationId, t.createdAt)],
);

export const readings = pgTable(
  "readings",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    kind: text("kind").notNull(), // hexagram | tarot | bazi | kline
    title: text("title").notNull(),
    question: text("question"),
    data: jsonb("data").notNull().default({}),
    interpretation: text("interpretation"),
    pinned: boolean("pinned").notNull().default(false),
    unlocked: boolean("unlocked").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("reading_user_idx").on(t.userId, t.createdAt)],
);

export const usageLogs = pgTable(
  "usage_logs",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    day: text("day").notNull(),
    tokens: integer("tokens").notNull().default(0),
    source: text("source").notNull().default("chat"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("usage_user_day_idx").on(t.userId, t.day)],
);

export const donations = pgTable("donations", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  kind: text("kind").notNull(), // tip | unlock | pass
  item: text("item").notNull(),
  amount: integer("amount").notNull(), // cents
  channel: text("channel").notNull().default("wechat"),
  note: text("note"),
  status: text("status").notNull().default("claimed"), // claimed | confirmed | rejected
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const letGoLogs = pgTable("let_go_logs", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  worry: text("worry").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
