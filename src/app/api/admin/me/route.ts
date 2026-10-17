import { verifyAdminRequest } from "@/lib/server/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const isAuthed = await verifyAdminRequest(req);
  return Response.json({ authenticated: isAuthed });
}
