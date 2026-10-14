import { pgTable, text, integer, timestamp, serial, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  nickname: text("nickname"),
  birth: text("birth"),
  concern: text("concern"),
  onboarded: boolean("onboarded").notNull().default(false),
  plan: text("plan").notNull().default("free"),
  planExpires: timestamp("plan_expires"),
  credits: integer("credits").notNull().default(0),
  usedDate: text("used_date"),
  usedCount: integer("used_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title"),
  category: text("category"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: text("conversation_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  deep: boolean("deep").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const orders = pgTable("orders", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  sku: text("sku").notNull(),
  amount: integer("amount").notNull(),
  channel: text("channel"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
