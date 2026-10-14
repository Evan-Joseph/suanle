import "server-only";
import { db } from "@/db";
import { devices, usageLogs } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function touchDevice(deviceId: string, nickname?: string) {
  await db
    .insert(devices)
    .values({ id: deviceId, nickname: nickname || null })
    .onConflictDoUpdate({ target: devices.id, set: { lastSeen: sql`now()`, ...(nickname ? { nickname } : {}) } });
}

export async function recordUsage(deviceId: string, kind: string, model: string, promptTokens: number, completionTokens: number) {
  await touchDevice(deviceId);
  await db.insert(usageLogs).values({ deviceId, kind, model, promptTokens: Math.max(0, promptTokens), completionTokens: Math.max(0, completionTokens) });
  await db
    .update(devices)
    .set({ totalTokens: sql`${devices.totalTokens} + ${Math.max(0, promptTokens + completionTokens)}` })
    .where(sql`${devices.id} = ${deviceId}`);
}
