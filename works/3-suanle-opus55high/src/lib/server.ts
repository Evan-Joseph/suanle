import { db } from "@/db";
import { users, usageLogs, settings } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export const newId = (p = "") => p + crypto.randomUUID().replace(/-/g, "").slice(0, 20);

export const today = () =>
  new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Shanghai" });

export function validUserId(id: unknown): id is string {
  return typeof id === "string" && /^[a-zA-Z0-9_-]{8,64}$/.test(id);
}

export async function ensureUser(id: string) {
  const found = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (found[0]) return found[0];
  await db.insert(users).values({ id }).onConflictDoNothing();
  const again = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return again[0];
}

export function isPass(u: { plan: string; planUntil: Date | null }) {
  return u.plan === "pass" && !!u.planUntil && u.planUntil.getTime() > Date.now();
}

export async function logUsage(userId: string, tokens: number, source: string) {
  if (tokens <= 0) return;
  await db.insert(usageLogs).values({ userId, day: today(), tokens, source });
}

export async function getSetting(key: string) {
  const r = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  return r[0]?.value ?? null;
}

export async function setSetting(key: string, value: string) {
  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: sql`now()` } });
}

export function sseStream(run: (send: (event: string, data: unknown) => void, signal: AbortSignal) => Promise<void>, req: Request) {
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      const send = (event: string, data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          closed = true;
        }
      };
      try {
        await run(send, req.signal);
      } catch (e) {
        send("error", { message: e instanceof Error ? e.message : "unknown" });
      } finally {
        closed = true;
        try { controller.close(); } catch {}
      }
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

/** 拆分模型输出：<think> 内心 / 正文 / <memo> 记忆 */
export function splitOutput(raw: string) {
  let thinking = "";
  let body = raw;
  const t = body.match(/<think>([\s\S]*?)(<\/think>|$)/);
  if (t) {
    thinking = t[1].trim();
    body = body.replace(t[0], "");
  }
  let memo: Record<string, unknown> | null = null;
  const m = body.match(/<memo>([\s\S]*?)<\/memo>/);
  if (m) {
    try { memo = JSON.parse(m[1]); } catch {}
    body = body.replace(m[0], "");
  }
  body = body.replace(/<memo>[\s\S]*$/, "");
  return { thinking, body: body.trim(), memo };
}

export const json = (data: unknown, status = 200) => Response.json(data, { status });
export const bad = (msg = "bad request", status = 400) => Response.json({ error: msg }, { status });
