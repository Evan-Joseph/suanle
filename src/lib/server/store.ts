import "server-only";
import { and, count, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { letgoEvents, orders, usageLog } from "@/db/schema";

/** 所有写库操作都不应影响用户体验：失败就安静地算了 */

export async function logUsage(anonId: string, kind: string, tokens: number, model: string) {
  try {
    await db.insert(usageLog).values({ anonId: anonId.slice(0, 64), kind, tokens: Math.max(0, Math.round(tokens)), model: model.slice(0, 60) });
  } catch {
    /* 记账失败不影响对话 */
  }
}

export async function letgoCounts(): Promise<{ today: number; total: number } | null> {
  try {
    const since = new Date(Date.now() - 24 * 3600 * 1000);
    const [t] = await db.select({ n: count() }).from(letgoEvents).where(and(gte(letgoEvents.createdAt, since)));
    const [all] = await db.select({ n: count() }).from(letgoEvents);
    return { today: Number(t?.n ?? 0), total: Number(all?.n ?? 0) };
  } catch {
    return null;
  }
}

export async function addLetgo(anonId: string) {
  try {
    await db.insert(letgoEvents).values({ anonId: anonId.slice(0, 64) });
  } catch {
    /* noop */
  }
}

export async function addOrder(o: { id: string; anonId: string; kind: string; tier: string; amountCents: number; channel: string }) {
  try {
    await db.insert(orders).values({ ...o, anonId: o.anonId.slice(0, 64) });
    return true;
  } catch {
    return false;
  }
}

export async function ping() {
  await db.execute(sql`select 1`);
}

/* 简单的内存限流，防止被刷 */
const g = globalThis as typeof globalThis & { __suanleRate?: Map<string, number[]> };
const hits = g.__suanleRate ?? (g.__suanleRate = new Map<string, number[]>());

export function allow(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) {
    hits.set(key, arr);
    return false;
  }
  arr.push(now);
  hits.set(key, arr);
  if (hits.size > 5000) hits.clear();
  return true;
}

export function clientKey(req: Request, anonId?: string) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
  return `${ip}|${(anonId ?? "").slice(0, 32)}`;
}
