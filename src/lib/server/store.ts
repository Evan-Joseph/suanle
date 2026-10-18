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
  const clean = anonId.slice(0, 64);
  if (retiredAnonIds.has(clean)) return true;
  try {
    const res = await db
      .select({ isBlocked: usersRegistry.isBlocked })
      .from(usersRegistry)
      .where(eq(usersRegistry.anonId, clean))
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

    // 2. 缘友态势表自动递增与缘友档案同步
    if (cleanAnon) {
      const pName = profileName.slice(0, 64);
      const pBirth = profileBirth.slice(0, 64);
      const pGender = profileGender.slice(0, 16);

      await db
        .insert(usersRegistry)
        .values({
          anonId: cleanAnon,
          profileName: pName,
          profileBirth: pBirth,
          profileGender: pGender,
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
            ...(pName ? { profileName: pName } : {}),
            ...(pBirth ? { profileBirth: pBirth } : {}),
            ...(pGender ? { profileGender: pGender } : {}),
          },
        });
    }
  } catch {
    /* 对话存档异常不干扰用户流程 */
  }
}

/** 用户主动修改小档案时，即时同步至服务端缘友台账 */
export async function syncUserProfile(params: {
  anonId: string;
  name?: string;
  birth?: string;
  gender?: string;
  city?: string;
  ip?: string;
}) {
  const { anonId, name = "", birth = "", gender = "", city = "", ip = "local" } = params;
  if (!anonId) return;
  try {
    const cleanAnon = anonId.slice(0, 64);
    const pName = name.slice(0, 64);
    const pBirth = birth.slice(0, 64);
    const pGender = gender.slice(0, 16);
    const pCity = city.slice(0, 64);

    const updateSet: Record<string, unknown> = {
      lastIp: ip.slice(0, 64),
      lastActiveAt: new Date(),
    };
    if (pName) updateSet.profileName = pName;
    if (pBirth) updateSet.profileBirth = pBirth;
    if (pGender) updateSet.profileGender = pGender;
    if (pCity) updateSet.profileCity = pCity;

    await db
      .insert(usersRegistry)
      .values({
        anonId: cleanAnon,
        profileName: pName,
        profileBirth: pBirth,
        profileGender: pGender,
        profileCity: pCity,
        firstIp: ip.slice(0, 64),
        lastIp: ip.slice(0, 64),
        totalChats: 0,
        totalTokens: 0,
        totalLetgos: 0,
        totalMeritCents: 0,
        lastActiveAt: new Date(),
      })
      .onConflictDoUpdate({
        target: usersRegistry.anonId,
        set: updateSet,
      });
  } catch {
    /* 档案同步失败不阻塞前台 */
  }
}

let hasBackfilledProfiles = false;
/** 历史对话日志画像回填总账（老用户在 chat_logs 中留有名字生辰的自动合流） */
export async function backfillProfilesFromChatLogs() {
  if (hasBackfilledProfiles) return;
  hasBackfilledProfiles = true;
  try {
    await db.execute(sql`
      UPDATE users_registry u
      SET 
        profile_name = CASE WHEN (u.profile_name IS NULL OR u.profile_name = '') THEN c.profile_name ELSE u.profile_name END,
        profile_birth = CASE WHEN (u.profile_birth IS NULL OR u.profile_birth = '') THEN c.profile_birth ELSE u.profile_birth END,
        profile_gender = CASE WHEN (u.profile_gender IS NULL OR u.profile_gender = '') THEN c.profile_gender ELSE u.profile_gender END
      FROM (
        SELECT DISTINCT ON (anon_id) anon_id, profile_name, profile_birth, profile_gender
        FROM chat_logs
        WHERE (profile_name IS NOT NULL AND profile_name != '') OR (profile_birth IS NOT NULL AND profile_birth != '')
        ORDER BY anon_id, id DESC
      ) c
      WHERE u.anon_id = c.anon_id AND (u.profile_name IS NULL OR u.profile_name = '' OR u.profile_birth IS NULL OR u.profile_birth = '');
    `);
  } catch {
    /* 静默 */
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

/* ───────── 云备份与跨设备换机迁移 ───────── */

const memBackups = new Map<string, { anonId: string; payload: string; ip: string; expiresAt: number; claimed: boolean; claimedBy: string }>();
const retiredAnonIds = new Set<string>();

/** 生成不易混淆的 8 位大写云同步码，如 SL-8K3P9M */
function generateSyncCode(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // 剔除 0, 1, O, I 等易混淆字符
  let str = "";
  for (let i = 0; i < 6; i++) {
    str += chars[Math.floor(Math.random() * chars.length)];
  }
  return `SL-${str}`;
}

export async function createCloudBackup(anonId: string, payload: string, ip: string): Promise<{ ok: boolean; code?: string; expiresAt?: number; error?: string }> {
  try {
    const code = generateSyncCode();
    const expiresAt = Date.now() + 7 * 86400 * 1000; // 7 天有效期
    const cleanPayload = payload.slice(0, 5 * 1024 * 1024); // 最大 5MB

    // 内存兜底
    memBackups.set(code, {
      anonId,
      payload: cleanPayload,
      ip,
      expiresAt,
      claimed: false,
      claimedBy: "",
    });

    // 尝试写入 Postgres
    try {
      const { cloudBackups } = await import("@/db/schema");
      await db.insert(cloudBackups).values({
        code,
        anonId: anonId.slice(0, 64),
        payload: cleanPayload,
        ip: ip.slice(0, 64),
        claimed: false,
        expiresAt: new Date(expiresAt),
      });
    } catch {
      /* 数据库未准备好时内存有效 */
    }

    return { ok: true, code, expiresAt };
  } catch (err) {
    return { ok: false, error: "生成云备份失败，请重试" };
  }
}

export async function restoreCloudBackup(rawCode: string, newAnonId: string): Promise<{ ok: boolean; payload?: string; migratedFrom?: string; error?: string }> {
  const code = (rawCode || "").trim().toUpperCase();
  const cleanNewAnon = (newAnonId || "").trim().slice(0, 64);
  if (!code) return { ok: false, error: "请输入有效的云同步码" };

  // 1. 尝试从数据库查询
  try {
    const { cloudBackups } = await import("@/db/schema");
    const rows = await db
      .select()
      .from(cloudBackups)
      .where(eq(cloudBackups.code, code))
      .limit(1);

    if (rows.length > 0) {
      const b = rows[0];
      if (b.expiresAt.getTime() < Date.now()) {
        return { ok: false, error: "该云同步码已过期（超过7天），请重新从旧设备生成" };
      }
      if (b.claimed) {
        if (cleanNewAnon && b.claimedBy === cleanNewAnon) {
          return { ok: true, payload: b.payload, migratedFrom: b.anonId };
        }
        return { ok: false, error: "该云同步码已被新设备提取并失效。为保障安全，一份同步码仅可提取一次" };
      }

      const oldAnonId = b.anonId.slice(0, 64);

      // 标记为已提取
      await db
        .update(cloudBackups)
        .set({
          claimed: true,
          claimedBy: cleanNewAnon,
          claimedAt: new Date(),
        })
        .where(eq(cloudBackups.code, code));

      // 若为跨设备换机迁移，执行服务端身份缝合 (Identity Stitching)
      if (oldAnonId && cleanNewAnon && oldAnonId !== cleanNewAnon) {
        retiredAnonIds.add(oldAnonId);

        try {
          const [oldUser] = await db.select().from(usersRegistry).where(eq(usersRegistry.anonId, oldAnonId)).limit(1);
          const [newUser] = await db.select().from(usersRegistry).where(eq(usersRegistry.anonId, cleanNewAnon)).limit(1);

          let backupProfile: Record<string, any> = {};
          try {
            const parsed = JSON.parse(b.payload);
            if (parsed?.profile && typeof parsed.profile === "object") {
              backupProfile = parsed.profile;
            }
          } catch {}

          const mergedName = newUser?.profileName || oldUser?.profileName || backupProfile.name || "";
          const mergedBirth = newUser?.profileBirth || oldUser?.profileBirth || backupProfile.birth || "";
          const mergedGender = newUser?.profileGender || oldUser?.profileGender || backupProfile.gender || "";
          const mergedCity = newUser?.profileCity || oldUser?.profileCity || backupProfile.city || "";
          const mergedFirstIp = oldUser?.firstIp || newUser?.firstIp || "local";
          const mergedLastIp = newUser?.lastIp || oldUser?.lastIp || "local";
          const addChats = oldUser?.totalChats || 0;
          const addTokens = oldUser?.totalTokens || 0;
          const addLetgos = oldUser?.totalLetgos || 0;
          const addMerit = oldUser?.totalMeritCents || 0;

          // A. 在 usersRegistry 中合并并充实 newAnonId
          await db
            .insert(usersRegistry)
            .values({
              anonId: cleanNewAnon,
              profileName: mergedName,
              profileBirth: mergedBirth,
              profileGender: mergedGender,
              profileCity: mergedCity,
              firstIp: mergedFirstIp,
              lastIp: mergedLastIp,
              totalChats: (newUser?.totalChats || 0) + addChats,
              totalTokens: (newUser?.totalTokens || 0) + addTokens,
              totalLetgos: (newUser?.totalLetgos || 0) + addLetgos,
              totalMeritCents: (newUser?.totalMeritCents || 0) + addMerit,
              isBlocked: false,
              lastActiveAt: new Date(),
            })
            .onConflictDoUpdate({
              target: usersRegistry.anonId,
              set: {
                profileName: mergedName,
                profileBirth: mergedBirth,
                profileGender: mergedGender,
                profileCity: mergedCity,
                totalChats: sql`${usersRegistry.totalChats} + ${addChats}`,
                totalTokens: sql`${usersRegistry.totalTokens} + ${addTokens}`,
                totalLetgos: sql`${usersRegistry.totalLetgos} + ${addLetgos}`,
                totalMeritCents: sql`${usersRegistry.totalMeritCents} + ${addMerit}`,
                lastActiveAt: new Date(),
              },
            });

          // B. 将 oldAnonId 标记为已换机迁出 (MIGRATED)，旧端失效防冲突
          await db
            .insert(usersRegistry)
            .values({
              anonId: oldAnonId,
              profileName: oldUser?.profileName || backupProfile.name || "",
              profileBirth: oldUser?.profileBirth || backupProfile.birth || "",
              profileGender: oldUser?.profileGender || backupProfile.gender || "",
              profileCity: oldUser?.profileCity || backupProfile.city || "",
              firstIp: oldUser?.firstIp || "local",
              lastIp: oldUser?.lastIp || "local",
              isBlocked: true,
              blockedReason: `MIGRATED: 档案已通过云同步码迁移至新设备 [${cleanNewAnon.slice(0, 16)}]`,
              lastActiveAt: new Date(),
            })
            .onConflictDoUpdate({
              target: usersRegistry.anonId,
              set: {
                isBlocked: true,
                blockedReason: `MIGRATED: 档案已通过云同步码迁移至新设备 [${cleanNewAnon.slice(0, 16)}]`,
                lastActiveAt: new Date(),
              },
            });

          // C. 历史关联业务事件无缝合流至新身份 (Identity Stitching)
          await db.update(chatLogs).set({ anonId: cleanNewAnon }).where(eq(chatLogs.anonId, oldAnonId));
          await db.update(orders).set({ anonId: cleanNewAnon }).where(eq(orders.anonId, oldAnonId));
          await db.update(letgoEvents).set({ anonId: cleanNewAnon }).where(eq(letgoEvents.anonId, oldAnonId));
          await db.update(usageLog).set({ anonId: cleanNewAnon }).where(eq(usageLog.anonId, oldAnonId));
        } catch (e) {
          console.error("[Identity Stitching Error]", e);
        }
      }

      return { ok: true, payload: b.payload, migratedFrom: b.anonId };
    }
  } catch {
    /* 降级内存检查 */
  }

  // 2. 内存检查
  const mem = memBackups.get(code);
  if (!mem) return { ok: false, error: "未找到该同步码，请检查是否输入有误" };
  if (mem.expiresAt < Date.now()) return { ok: false, error: "该云同步码已过期，请重新从旧设备生成" };
  if (mem.claimed) {
    if (cleanNewAnon && mem.claimedBy === cleanNewAnon) {
      return { ok: true, payload: mem.payload, migratedFrom: mem.anonId };
    }
    return { ok: false, error: "该云同步码已被提取并失效，一份同步码仅可提取一次" };
  }

  mem.claimed = true;
  mem.claimedBy = cleanNewAnon;
  if (cleanNewAnon && mem.anonId !== cleanNewAnon) {
    retiredAnonIds.add(mem.anonId);
  }

  return { ok: true, payload: mem.payload, migratedFrom: mem.anonId };
}

export async function isAnonMigrated(anonId: string): Promise<boolean> {
  if (!anonId) return false;
  const clean = anonId.slice(0, 64);
  if (retiredAnonIds.has(clean)) return true;
  try {
    const user = await db
      .select({ isBlocked: usersRegistry.isBlocked, blockedReason: usersRegistry.blockedReason })
      .from(usersRegistry)
      .where(eq(usersRegistry.anonId, clean))
      .limit(1);
    if (user.length > 0 && user[0].isBlocked && (user[0].blockedReason || "").startsWith("MIGRATED")) {
      retiredAnonIds.add(clean);
      return true;
    }

    const { cloudBackups } = await import("@/db/schema");
    const claimedRows = await db
      .select({ code: cloudBackups.code })
      .from(cloudBackups)
      .where(and(eq(cloudBackups.anonId, clean), eq(cloudBackups.claimed, true)))
      .limit(1);
    if (claimedRows.length > 0) {
      retiredAnonIds.add(clean);
      return true;
    }
  } catch {
    /* 降级内存检查 */
  }
  return false;
}



