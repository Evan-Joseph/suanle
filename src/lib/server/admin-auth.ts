import "server-only";
import { cookies } from "next/headers";
import { allow, clientIp } from "./store";

const COOKIE_NAME = "suanle_curator_session";
const SESSION_TTL_MS = 7 * 24 * 3600 * 1000; // 7 天有效

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "suanle_curator_hk_2026";
const SECRET_KEY = process.env.ADMIN_SECRET || ADMIN_PASSWORD || "suanle_secret_seal_key_2026";

async function getHmacKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(SECRET_KEY),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function toBase64Url(str: string): string {
  return Buffer.from(str, "utf-8").toString("base64url");
}

function fromBase64Url(str: string): string {
  return Buffer.from(str, "base64url").toString("utf-8");
}

export async function createSessionToken(): Promise<string> {
  const key = await getHmacKey();
  const payload = JSON.stringify({
    role: "curator",
    exp: Date.now() + SESSION_TTL_MS,
  });
  const data = toBase64Url(payload);
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  const signature = Buffer.from(signatureBuffer).toString("hex");
  return `${data}.${signature}`;
}

export async function verifySessionToken(token: string): Promise<boolean> {
  if (!token || !token.includes(".")) return false;
  const [data, signature] = token.split(".");
  if (!data || !signature) return false;

  try {
    const key = await getHmacKey();
    const expectedSigBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
    const expectedSig = Buffer.from(expectedSigBuffer).toString("hex");
    if (expectedSig !== signature) return false;

    const payloadRaw = fromBase64Url(data);
    const payload = JSON.parse(payloadRaw) as { role?: string; exp?: number };
    if (!payload.exp || Date.now() > payload.exp) return false;
    return payload.role === "curator";
  } catch {
    return false;
  }
}

/** 校验请求上下文中的管理员会话 */
export async function verifyAdminRequest(req?: Request): Promise<boolean> {
  // 1. 优先读取 Cookie
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (token && (await verifySessionToken(token))) return true;
  } catch {
    /* cookies() 仅在特定 Next.js 上下文中可用 */
  }

  // 2. 备用读取 Request Header中的 Authorization / Cookie
  if (req) {
    const cookieHeader = req.headers.get("cookie") || "";
    const match = cookieHeader.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
    if (match && (await verifySessionToken(decodeURIComponent(match[1])))) return true;

    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7).trim();
      if (await verifySessionToken(token)) return true;
    }
  }

  return false;
}

export function checkLoginRateLimit(req: Request): boolean {
  const ip = clientIp(req);
  return allow(`admin_login_rate|${ip}`, 6, 10 * 60 * 1000);
}

export function verifyPassword(pwd: string): boolean {
  if (!pwd || typeof pwd !== "string") return false;
  return pwd === ADMIN_PASSWORD;
}

export { COOKIE_NAME };
