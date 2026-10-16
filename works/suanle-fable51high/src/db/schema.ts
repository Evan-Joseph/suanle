import { pgTable, text, integer, timestamp, jsonb, serial, boolean } from "drizzle-orm/pg-core";

/** 匿名用户画像（以浏览器生成的 anonId 为主键） */
export const profiles = pgTable("profiles", {
  anonId: text("anon_id").primaryKey(),
  data: jsonb("data").$type<Record<string, unknown>>().notNull().default({}),
  tokensTotal: integer("tokens_total").notNull().default(0),
  lampUntil: timestamp("lamp_until", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** 会话快照：消息整体以 JSON 存储，方便跨设备找回 */
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  anonId: text("anon_id").notNull(),
  title: text("title").notNull().default("新的心事"),
  category: text("category").notNull().default("日常"),
  emoji: text("emoji").notNull().default("☁️"),
  messages: jsonb("messages").$type<unknown[]>().notNull().default([]),
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** 算力消耗流水 */
export const usageLogs = pgTable("usage_logs", {
  id: serial("id").primaryKey(),
  anonId: text("anon_id").notNull(),
  sessionId: text("session_id"),
  model: text("model"),
  promptTokens: integer("prompt_tokens").notNull().default(0),
  completionTokens: integer("completion_tokens").notNull().default(0),
  totalTokens: integer("total_tokens").notNull().default(0),
  deep: boolean("deep").notNull().default(false),
  offline: boolean("offline").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** 赞赏 / 点灯记录 */
export const tips = pgTable("tips", {
  id: serial("id").primaryKey(),
  anonId: text("anon_id").notNull(),
  kind: text("kind").notNull(), // tip | lamp
  amount: integer("amount").notNull().default(0), // 单位：分
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** 全站「算了」计数（纸团丢进纸篓的次数） */
export const letgoEvents = pgTable("letgo_events", {
  id: serial("id").primaryKey(),
  anonId: text("anon_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
