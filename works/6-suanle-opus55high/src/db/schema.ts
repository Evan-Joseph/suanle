import { integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

/** 随喜 / 长明灯 记录（只记心意，不存隐私） */
export const tips = pgTable("tips", {
  id: serial("id").primaryKey(),
  anonId: varchar("anon_id", { length: 64 }).notNull(),
  kind: varchar("kind", { length: 32 }).notNull(), // tip | lamp
  item: varchar("item", { length: 64 }).notNull(),
  amountCents: integer("amount_cents").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** “算了”事件：只计数，不保存任何文字 */
export const letgos = pgTable("letgos", {
  id: serial("id").primaryKey(),
  anonId: varchar("anon_id", { length: 64 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
