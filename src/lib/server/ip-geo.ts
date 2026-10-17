import "server-only";

interface IpCacheEntry {
  location: string;
  timestamp: number;
}

const geoCache = new Map<string, IpCacheEntry>();
const CACHE_TTL_MS = 24 * 3600 * 1000; // 24 小时缓存

function isPrivateIp(ip: string): boolean {
  if (!ip || ip === "local" || ip === "127.0.0.1" || ip === "::1") return true;
  if (ip.startsWith("10.") || ip.startsWith("192.168.") || ip.startsWith("169.254.")) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return true;
  if (/^(fc|fd|fe80)/i.test(ip)) return true;
  return false;
}

export async function resolveIpLocation(rawIp: string): Promise<string> {
  const ip = (rawIp || "").trim();
  if (!ip) return "未知 IP";

  if (isPrivateIp(ip)) {
    return "局域网 / 本机";
  }

  const cached = geoCache.get(ip);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.location;
  }

  // 1. 优先尝试 ip-api.com (免费、支持中文、HK 节点响应通常 <150ms)
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?lang=zh-CN`, {
      signal: AbortSignal.timeout(2000),
      headers: { "User-Agent": "Suanle-Curator/1.0" },
    });
    if (res.ok) {
      const data = (await res.json()) as {
        status?: string;
        country?: string;
        regionName?: string;
        city?: string;
        isp?: string;
      };
      if (data.status === "success") {
        const parts = [
          data.country,
          data.regionName && data.regionName !== data.country ? data.regionName : null,
          data.city && data.city !== data.regionName ? data.city : null,
        ].filter(Boolean);

        let loc = parts.join(" · ") || "未知归属";
        if (data.isp) {
          loc += ` (${data.isp.replace(/,.*$/, "").slice(0, 20)})`;
        }

        geoCache.set(ip, { location: loc, timestamp: Date.now() });
        return loc;
      }
    }
  } catch {
    /* 备用兜底 */
  }

  // 2. 备选尝试 ipwho.is
  try {
    const res2 = await fetch(`https://ipwho.is/${ip}?lang=zh-CN`, {
      signal: AbortSignal.timeout(2000),
    });
    if (res2.ok) {
      const data2 = (await res2.json()) as {
        success?: boolean;
        country?: string;
        region?: string;
        city?: string;
        connection?: { isp?: string };
      };
      if (data2.success) {
        const parts = [
          data2.country,
          data2.region && data2.region !== data2.country ? data2.region : null,
          data2.city && data2.city !== data2.region ? data2.city : null,
        ].filter(Boolean);

        let loc = parts.join(" · ") || "未知归属";
        if (data2.connection?.isp) {
          loc += ` (${data2.connection.isp.replace(/,.*$/, "").slice(0, 20)})`;
        }

        geoCache.set(ip, { location: loc, timestamp: Date.now() });
        return loc;
      }
    }
  } catch {
    /* 静默 */
  }

  const fallback = "未知归属";
  geoCache.set(ip, { location: fallback, timestamp: Date.now() });
  return fallback;
}

export async function batchResolveIpLocations(ips: string[]): Promise<Record<string, string>> {
  const uniqueIps = Array.from(new Set(ips.filter(Boolean)));
  const results: Record<string, string> = {};

  await Promise.allSettled(
    uniqueIps.map(async (ip) => {
      results[ip] = await resolveIpLocation(ip);
    })
  );

  return results;
}
