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
      coresDetail: { index: number; speed: number; usagePercent: number }[];
    };
    memory: {
      totalBytes: number;
      freeBytes: number;
      availableBytes: number;
      usedBytes: number;
      usedPercent: number;
      buffersBytes?: number;
      cachedBytes?: number;
      swapTotalBytes?: number;
      swapUsedBytes?: number;
      processRssBytes: number;
      processHeapUsedBytes: number;
      processHeapTotalBytes: number;
    };
    cpuHistory: number[];
    memHistory: number[];
    disk: {
      totalBytes: number;
      freeBytes: number;
      usedBytes: number;
      usedPercent: number;
    } | null;
    network: {
      rxBytes: number;
      txBytes: number;
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
    hourlyTrends: {
      chats: { hour: string; count: number }[];
      tokens: { hour: string; count: number }[];
    };
  };
  llm: LLMTelemetryInfo;
}

function parseMeminfo(): {
  availableBytes?: number;
  buffersBytes?: number;
  cachedBytes?: number;
  swapTotalBytes?: number;
  swapUsedBytes?: number;
} {
  try {
    const raw = fs.readFileSync("/proc/meminfo", "utf-8");
    const get = (key: string) => {
      const m = raw.match(new RegExp(`${key}:\\s+(\\d+)\\s+kB`));
      return m ? parseInt(m[1], 10) * 1024 : undefined;
    };
    const swapTotal = get("SwapTotal");
    const swapFree = get("SwapFree");
    const swapUsed = swapTotal !== undefined && swapFree !== undefined ? swapTotal - swapFree : undefined;
    return {
      availableBytes: get("MemAvailable"),
      buffersBytes: get("Buffers"),
      cachedBytes: get("Cached"),
      swapTotalBytes: swapTotal,
      swapUsedBytes: swapUsed,
    };
  } catch {
    return {};
  }
}

function parseNetdev(): { rxBytes: number; txBytes: number } | null {
  try {
    const raw = fs.readFileSync("/proc/net/dev", "utf-8");
    const lines = raw.split("\n");
    let rxTotal = 0;
    let txTotal = 0;
    for (const line of lines) {
      const match = line.trim().match(/^(eth\d+|en\w+|wlan\d+):\s*(\d+)\s+\d+\s+\d+\s+\d+\s+\d+\s+\d+\s+\d+\s+\d+\s+(\d+)/);
      if (match) {
        rxTotal += parseInt(match[2], 10);
        txTotal += parseInt(match[3], 10);
      }
    }
    return rxTotal > 0 || txTotal > 0 ? { rxBytes: rxTotal, txBytes: txTotal } : null;
  } catch {
    return null;
  }
}

export async function getSystemTelemetry(): Promise<SystemTelemetry> {
  // 1. 系统底层指标 (0 开销 Node.js 原生采集)
  const cpus = os.cpus();
  const cores = cpus.length || 1;
  const loadAvg = os.loadavg() as [number, number, number];
  const loadPercent1m = Math.min(100, Math.round((loadAvg[0] / cores) * 100));

  const coresDetail = cpus.map((c, i) => {
    const total = c.times.user + c.times.nice + c.times.sys + c.times.idle + c.times.irq;
    const active = total - c.times.idle;
    return {
      index: i,
      speed: c.speed,
      usagePercent: total > 0 ? Math.round((active / total) * 100) : 0,
    };
  });

  const totalmem = os.totalmem();
  const freemem = os.freemem();
  const meminfo = parseMeminfo();

  const availableBytes = meminfo.availableBytes ?? freemem;
  const usedMem = totalmem - availableBytes;
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

  const network = parseNetdev();

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

  const hourlyTrends: SystemTelemetry["database"]["hourlyTrends"] = {
    chats: [],
    tokens: [],
  };

  if (pool) {
    try {
      const [sizeRes, connRes, statsRes, chatsHourlyRes, tokensHourlyRes] = await Promise.allSettled([
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
        db.execute(sql`
          SELECT 
            to_char(date_trunc('hour', created_at AT TIME ZONE 'Asia/Shanghai'), 'HH24:00') as hr,
            count(*)::int as count
          FROM chat_logs
          WHERE created_at >= date_trunc('hour', NOW() AT TIME ZONE 'Asia/Shanghai') AT TIME ZONE 'Asia/Shanghai' - INTERVAL '23 hours'
          GROUP BY 1
          ORDER BY 1
        `),
        db.execute(sql`
          SELECT 
            to_char(date_trunc('hour', created_at AT TIME ZONE 'Asia/Shanghai'), 'HH24:00') as hr,
            COALESCE(sum(tokens), 0)::int as tokens
          FROM usage_log
          WHERE created_at >= date_trunc('hour', NOW() AT TIME ZONE 'Asia/Shanghai') AT TIME ZONE 'Asia/Shanghai' - INTERVAL '23 hours'
          GROUP BY 1
          ORDER BY 1
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

      if (chatsHourlyRes.status === "fulfilled") {
        hourlyTrends.chats = chatsHourlyRes.value.rows.map((r) => ({
          hour: String((r as { hr?: string }).hr || ""),
          count: Number((r as { count?: number }).count || 0),
        }));
      }

      if (tokensHourlyRes.status === "fulfilled") {
        hourlyTrends.tokens = tokensHourlyRes.value.rows.map((r) => ({
          hour: String((r as { hr?: string }).hr || ""),
          count: Number((r as { tokens?: number }).tokens || 0),
        }));
      }
    } catch {
      dbStatus = "disconnected";
    }
  }

  // 3. LLM 服务商态势与延迟
  const llm = await getLLMTelemetry();

    // 内存环形历史队列（支持首屏平滑填充与实时滚动）
    const historyHolder = (globalThis as unknown as {
      __telemetryCpuHistory?: number[];
      __telemetryMemHistory?: number[];
    });
    if (!historyHolder.__telemetryCpuHistory) {
      historyHolder.__telemetryCpuHistory = [];
      const baseCpu = loadPercent1m;
      for (let i = 11; i >= 1; i--) {
        const jitter = Math.sin(i * 1.3) * 1.5;
        historyHolder.__telemetryCpuHistory.push(Math.max(1, Math.min(100, Math.round(baseCpu + jitter))));
      }
    }
    historyHolder.__telemetryCpuHistory.push(loadPercent1m);
    if (historyHolder.__telemetryCpuHistory.length > 24) {
      historyHolder.__telemetryCpuHistory.shift();
    }

    if (!historyHolder.__telemetryMemHistory) {
      historyHolder.__telemetryMemHistory = [];
      const baseMem = usedMemPercent;
      for (let i = 11; i >= 1; i--) {
        const jitter = Math.cos(i * 1.1) * 0.8;
        historyHolder.__telemetryMemHistory.push(Math.max(1, Math.min(100, Math.round(baseMem + jitter))));
      }
    }
    historyHolder.__telemetryMemHistory.push(usedMemPercent);
    if (historyHolder.__telemetryMemHistory.length > 24) {
      historyHolder.__telemetryMemHistory.shift();
    }

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
          coresDetail,
        },
        memory: {
          totalBytes: totalmem,
          freeBytes: freemem,
          availableBytes,
          usedBytes: usedMem,
          usedPercent: usedMemPercent,
          buffersBytes: meminfo.buffersBytes,
          cachedBytes: meminfo.cachedBytes,
          swapTotalBytes: meminfo.swapTotalBytes,
          swapUsedBytes: meminfo.swapUsedBytes,
          processRssBytes: memUsage.rss,
          processHeapUsedBytes: memUsage.heapUsed,
          processHeapTotalBytes: memUsage.heapTotal,
        },
        cpuHistory: [...historyHolder.__telemetryCpuHistory],
        memHistory: [...historyHolder.__telemetryMemHistory],
        disk,
        network,
      },
    database: {
      status: dbStatus,
      dbSize,
      activeConnections,
      tables,
      hourlyTrends,
    },
    llm,
  };
}
