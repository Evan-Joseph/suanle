import { cookies } from "next/headers";
import {
  checkLoginRateLimit,
  COOKIE_NAME,
  createSessionToken,
  verifyPassword,
} from "@/lib/server/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!checkLoginRateLimit(req)) {
    return Response.json(
      { error: "密码尝试次数过多，请稍候再试（锁定 10 分钟）。" },
      { status: 429 }
    );
  }

  let body: { password?: string } = {};
  try {
    body = (await req.json()) as { password?: string };
  } catch {
    return Response.json({ error: "请求格式错误" }, { status: 400 });
  }

  if (!body.password || !verifyPassword(body.password)) {
    return Response.json({ error: "口令不符，无权开启内阁。" }, { status: 401 });
  }

  const token = await createSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 7 * 24 * 3600, // 7 天
  });

  return Response.json({ ok: true, message: "内阁开启" });
}
