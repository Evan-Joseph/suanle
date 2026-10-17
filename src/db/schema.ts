import { boolean, index, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

/** 「算了」心事归档与计数 */
export const letgoEvents = pgTable(
  "letgo_events",
  {
    id: serial("id").primaryKey(),
    anonId: text("anon_id").notNull().default(""),
    content: text("content").notNull().default(""),
    ip: text("ip").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("letgo_events_created_idx").on(t.createdAt)],
);

/** 对话审查与合规归档 */
export const chatLogs = pgTable(
  "chat_logs",
  {
    id: serial("id").primaryKey(),
    anonId: text("anon_id").notNull().default(""),
    ip: text("ip").notNull().default(""),
    userAgent: text("user_agent").notNull().default(""),
    userPrompt: text("user_prompt").notNull().default(""),
    assistantReply: text("assistant_reply").notNull().default(""),
    model: text("model").notNull().default(""),
    tokens: integer("tokens").notNull().default(0),
    isDeep: boolean("is_deep").notNull().default(false),
    profileName: text("profile_name").notNull().default(""),
    profileBirth: text("profile_birth").notNull().default(""),
    profileGender: text("profile_gender").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("chat_logs_created_idx").on(t.createdAt),
    index("chat_logs_anon_idx").on(t.anonId, t.createdAt),
    index("chat_logs_ip_idx").on(t.ip),
  ],
);

/** 缘友总账与风控 */
export const usersRegistry = pgTable(
  "users_registry",
  {
    anonId: text("anon_id").primaryKey(),
    firstIp: text("first_ip").notNull().default(""),
    lastIp: text("last_ip").notNull().default(""),
    totalChats: integer("total_chats").notNull().default(0),
    totalTokens: integer("total_tokens").notNull().default(0),
    totalLetgos: integer("total_letgos").notNull().default(0),
    totalMeritCents: integer("total_merit_cents").notNull().default(0),
    isBlocked: boolean("is_blocked").notNull().default(false),
    blockedReason: text("blocked_reason").notNull().default(""),
    lastActiveAt: timestamp("last_active_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("users_registry_last_active_idx").on(t.lastActiveAt),
    index("users_registry_blocked_idx").on(t.isBlocked),
  ],
);

/** 随喜与长明灯 */
export const orders = pgTable(
  "orders",
  {
    id: text("id").primaryKey(),
    anonId: text("anon_id").notNull().default(""),
    kind: text("kind").notNull(),
    tier: text("tier").notNull(),
    amountCents: integer("amount_cents").notNull().default(0),
    channel: text("channel").notNull().default("wechat"),
    status: text("status").notNull().default("claimed"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("orders_anon_idx").on(t.anonId)],
);

/** 算力账本 */
export const usageLog = pgTable(
  "usage_log",
  {
    id: serial("id").primaryKey(),
    anonId: text("anon_id").notNull().default(""),
    kind: text("kind").notNull().default("chat"),
    tokens: integer("tokens").notNull().default(0),
    model: text("model").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("usage_log_anon_idx").on(t.anonId, t.createdAt)],
);

