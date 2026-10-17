import "server-only";
import os from "os";
import fs from "fs";
import { sql } from "drizzle-orm";
import { db, pool } from "@/db";
import { getLLMTelemetry, type LLMTelemetryInfo } from "./llm";

export interface SystemTelemetry {
  server: {
    hostname: string;
    platform: string;
    arch: string;
    uptimeSeconds: number;
    processUptimeSeconds: number;
    nodeVersion: string;
    cpu: {
      model: string;
      cores: number;
      loadAvg: [number, number, number];
      loadPercent1m: number;
    };
    memory: {
      totalBytes: number;
      freeBytes: number;
      usedBytes: number;
      usedPercent: number;
      processRssBytes: number;
      processHeapUsedBytes: number;
      processHeapTotalBytes: number;
    };
    disk: {
      totalBytes: number;
      freeBytes: number;
      usedBytes: number;
      usedPercent: number;
    } | null;
  };
  database: {
    status: "connected" | "disconnected";
    dbSize: string;
    activeConnections: number;
    tables: {
      chatsTotal: number;
      chatsToday: number;
      letgosTotal: number;
      letgosToday: number;
      usersTotal: number;
      usersBlocked: number;
      ordersTotal: number;
      meritTotalCents: number;
      tokensTotal: number;
    };
  };
  llm: LLMTelemetryInfo;
}

export async function getSystemTelemetry(): Promise<SystemTelemetry> {
  // 1. 系统底层指标 (0 开销 Node.js 原生采集)
  const cpus = os.cpus();
  const cores = cpus.length || 1;
  const loadAvg = os.loadavg() as [number, number, number];
  const loadPercent1m = Math.min(100, Math.round((loadAvg[0] / cores) * 100));

  const totalmem = os.totalmem();
  const freemem = os.freemem();
  const usedMem = totalmem - freemem;
  const usedMemPercent = Math.min(100, Math.round((usedMem / totalmem) * 100));

  const memUsage = process.memoryUsage();

  let disk: SystemTelemetry["server"]["disk"] = null;
  try {
    const stat = fs.statfsSync("/");
    const total = stat.bsize * stat.blocks;
    const free = stat.bsize * stat.bavail;
    const used = total - free;
    disk = {
      totalBytes: total,
      freeBytes: free,
      usedBytes: used,
      usedPercent: Math.min(100, Math.round((used / total) * 100)),
    };
  } catch {
    /* 某些虚拟环境可能无法 statfs */
  }

  // 2. 数据库态势指标
  let dbStatus: "connected" | "disconnected" = "disconnected";
  let dbSize = "0 MB";
  let activeConnections = 0;
  const tables = {
    chatsTotal: 0,
    chatsToday: 0,
    letgosTotal: 0,
    letgosToday: 0,
    usersTotal: 0,
    usersBlocked: 0,
    ordersTotal: 0,
    meritTotalCents: 0,
    tokensTotal: 0,
  };

  if (pool) {
    try {
      const [sizeRes, connRes, statsRes] = await Promise.allSettled([
        db.execute(sql`SELECT pg_size_pretty(pg_database_size(current_database())) as size`),
        db.execute(sql`SELECT count(*)::int as count FROM pg_stat_activity WHERE datname = current_database()`),
        db.execute(sql`
          SELECT
            (SELECT count(*)::int FROM chat_logs) as chats_total,
            (SELECT count(*)::int FROM chat_logs WHERE created_at >= NOW() - INTERVAL '24 hours') as chats_today,
            (SELECT count(*)::int FROM letgo_events) as letgos_total,
            (SELECT count(*)::int FROM letgo_events WHERE created_at >= NOW() - INTERVAL '24 hours') as letgos_today,
            (SELECT count(*)::int FROM users_registry) as users_total,
            (SELECT count(*)::int FROM users_registry WHERE is_blocked = true) as users_blocked,
            (SELECT count(*)::int FROM orders) as orders_total,
            (SELECT COALESCE(sum(amount_cents), 0)::int FROM orders) as merit_cents,
            (SELECT COALESCE(sum(tokens), 0)::int FROM usage_log) as tokens_total
        `),
      ]);

      dbStatus = "connected";

      if (sizeRes.status === "fulfilled" && sizeRes.value.rows[0]) {
        dbSize = String((sizeRes.value.rows[0] as { size?: string }).size || "0 MB");
      }
      if (connRes.status === "fulfilled" && connRes.value.rows[0]) {
        activeConnections = Number((connRes.value.rows[0] as { count?: number }).count || 0);
      }
      if (statsRes.status === "fulfilled" && statsRes.value.rows[0]) {
        const row = statsRes.value.rows[0] as Record<string, number>;
        tables.chatsTotal = Number(row.chats_total || 0);
        tables.chatsToday = Number(row.chats_today || 0);
        tables.letgosTotal = Number(row.letgos_total || 0);
        tables.letgosToday = Number(row.letgos_today || 0);
        tables.usersTotal = Number(row.users_total || 0);
        tables.usersBlocked = Number(row.users_blocked || 0);
        tables.ordersTotal = Number(row.orders_total || 0);
        tables.meritTotalCents = Number(row.merit_cents || 0);
        tables.tokensTotal = Number(row.tokens_total || 0);
      }
    } catch {
      dbStatus = "disconnected";
    }
  }

  // 3. LLM 服务商态势与延迟
  const llm = await getLLMTelemetry();

  return {
    server: {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      uptimeSeconds: Math.floor(os.uptime()),
      processUptimeSeconds: Math.floor(process.uptime()),
      nodeVersion: process.version,
      cpu: {
        model: cpus[0]?.model || "Unknown CPU",
        cores,
        loadAvg,
        loadPercent1m,
      },
      memory: {
        totalBytes: totalmem,
        freeBytes: freemem,
        usedBytes: usedMem,
        usedPercent: usedMemPercent,
        processRssBytes: memUsage.rss,
        processHeapUsedBytes: memUsage.heapUsed,
        processHeapTotalBytes: memUsage.heapTotal,
      },
      disk,
    },
    database: {
      status: dbStatus,
      dbSize,
      activeConnections,
      tables,
    },
    llm,
  };
}
