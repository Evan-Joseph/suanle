import "server-only";
import { and, count, desc, eq, gte, ilike, sql } from "drizzle-orm";
import { db } from "@/db";
import { chatLogs, letgoEvents, orders, usageLog, usersRegistry } from "@/db/schema";

/** 所有写库操作都不应影响用户体验：失败就安静地算了 */

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}

export function clientKey(req: Request, anonId?: string): string {
  const ip = clientIp(req);
  return `${ip}|${(anonId ?? "").slice(0, 32)}`;
}

export async function isUserBlocked(anonId: string): Promise<boolean> {
  if (!anonId) return false;
  try {
    const res = await db
      .select({ isBlocked: usersRegistry.isBlocked })
      .from(usersRegistry)
      .where(eq(usersRegistry.anonId, anonId.slice(0, 64)))
      .limit(1);
    return res[0]?.isBlocked === true;
  } catch {
    return false;
  }
}

export async function logUsage(anonId: string, kind: string, tokens: number, model: string) {
  try {
    await db.insert(usageLog).values({
      anonId: anonId.slice(0, 64),
      kind,
      tokens: Math.max(0, Math.round(tokens)),
      model: model.slice(0, 60),
    });
  } catch {
    /* 记账失败不影响对话 */
  }
}

export async function logChat(params: {
  anonId: string;
  ip: string;
  userAgent?: string;
  userPrompt: string;
  assistantReply: string;
  model: string;
  tokens: number;
  isDeep: boolean;
  profileName?: string;
  profileBirth?: string;
  profileGender?: string;
}) {
  const {
    anonId = "",
    ip = "local",
    userAgent = "",
    userPrompt = "",
    assistantReply = "",
    model = "",
    tokens = 0,
    isDeep = false,
    profileName = "",
    profileBirth = "",
    profileGender = "",
  } = params;

  try {
    const cleanAnon = anonId.slice(0, 64);
    // 1. 合规归档入库
    await db.insert(chatLogs).values({
      anonId: cleanAnon,
      ip: ip.slice(0, 64),
      userAgent: userAgent.slice(0, 512),
      userPrompt: userPrompt.slice(0, 10000),
      assistantReply: assistantReply.slice(0, 20000),
      model: model.slice(0, 64),
      tokens: Math.max(0, Math.round(tokens)),
      isDeep,
      profileName: profileName.slice(0, 64),
      profileBirth: profileBirth.slice(0, 64),
      profileGender: profileGender.slice(0, 16),
    });

    // 2. 缘友态势表自动递增
    if (cleanAnon) {
      await db
        .insert(usersRegistry)
        .values({
          anonId: cleanAnon,
          firstIp: ip.slice(0, 64),
          lastIp: ip.slice(0, 64),
          totalChats: 1,
          totalTokens: Math.max(0, Math.round(tokens)),
          totalLetgos: 0,
          totalMeritCents: 0,
          lastActiveAt: new Date(),
        })
        .onConflictDoUpdate({
          target: usersRegistry.anonId,
          set: {
            lastIp: ip.slice(0, 64),
            totalChats: sql`${usersRegistry.totalChats} + 1`,
            totalTokens: sql`${usersRegistry.totalTokens} + ${Math.max(0, Math.round(tokens))}`,
            lastActiveAt: new Date(),
          },
        });
    }
  } catch {
    /* 对话存档异常不干扰用户流程 */
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

export async function addLetgo(anonId: string, content: string = "", ip: string = "local") {
  try {
    const cleanAnon = anonId.slice(0, 64);
    await db.insert(letgoEvents).values({
      anonId: cleanAnon,
      content: content.slice(0, 1000),
      ip: ip.slice(0, 64),
    });

    if (cleanAnon) {
      await db
        .insert(usersRegistry)
        .values({
          anonId: cleanAnon,
          firstIp: ip.slice(0, 64),
          lastIp: ip.slice(0, 64),
          totalChats: 0,
          totalTokens: 0,
          totalLetgos: 1,
          totalMeritCents: 0,
          lastActiveAt: new Date(),
        })
        .onConflictDoUpdate({
          target: usersRegistry.anonId,
          set: {
            lastIp: ip.slice(0, 64),
            totalLetgos: sql`${usersRegistry.totalLetgos} + 1`,
            lastActiveAt: new Date(),
          },
        });
    }
  } catch {
    /* noop */
  }
}

export async function addOrder(o: { id: string; anonId: string; kind: string; tier: string; amountCents: number; channel: string }) {
  try {
    const cleanAnon = o.anonId.slice(0, 64);
    await db.insert(orders).values({ ...o, anonId: cleanAnon });
    if (cleanAnon && o.amountCents > 0) {
      await db
        .insert(usersRegistry)
        .values({
          anonId: cleanAnon,
          firstIp: "local",
          lastIp: "local",
          totalChats: 0,
          totalTokens: 0,
          totalLetgos: 0,
          totalMeritCents: o.amountCents,
          lastActiveAt: new Date(),
        })
        .onConflictDoUpdate({
          target: usersRegistry.anonId,
          set: {
            totalMeritCents: sql`${usersRegistry.totalMeritCents} + ${o.amountCents}`,
            lastActiveAt: new Date(),
          },
        });
    }
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

