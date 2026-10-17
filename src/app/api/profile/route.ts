import { clientIp, syncUserProfile } from "@/lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = clientIp(req);
  try {
    const body = (await req.json()) as {
      anonId?: string;
      name?: string;
      birth?: string;
      gender?: string;
      city?: string;
    };
    const { anonId, name, birth, gender, city } = body;
    if (!anonId || typeof anonId !== "string") {
      return Response.json({ ok: false, error: "anonId required" }, { status: 400 });
    }
    await syncUserProfile({
      anonId,
      name: typeof name === "string" ? name : undefined,
      birth: typeof birth === "string" ? birth : undefined,
      gender: typeof gender === "string" ? gender : undefined,
      city: typeof city === "string" ? city : undefined,
      ip,
    });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
