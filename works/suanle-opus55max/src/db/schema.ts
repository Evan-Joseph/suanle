import { index, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

/** 「算了」计数：只记次数，不记内容 */
export const letgoEvents = pgTable(
  "letgo_events",
  {
    id: serial("id").primaryKey(),
    anonId: text("anon_id").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("letgo_events_created_idx").on(t.createdAt)],
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
