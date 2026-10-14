import { pgTable, text, integer, serial, timestamp, bigint } from "drizzle-orm/pg-core";

export const devices = pgTable("devices", {
  id: text("id").primaryKey(),
  nickname: text("nickname"),
  totalTokens: bigint("total_tokens", { mode: "number" }).notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastSeen: timestamp("last_seen").notNull().defaultNow(),
});

export const usageLogs = pgTable("usage_logs", {
  id: serial("id").primaryKey(),
  deviceId: text("device_id").notNull(),
  kind: text("kind").notNull(),
  model: text("model").notNull(),
  promptTokens: integer("prompt_tokens").notNull().default(0),
  completionTokens: integer("completion_tokens").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const tips = pgTable("tips", {
  id: serial("id").primaryKey(),
  deviceId: text("device_id").notNull(),
  amountCents: integer("amount_cents").notNull(),
  item: text("item").notNull(),
  plan: text("plan").notNull().default("tip"),
  message: text("message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
