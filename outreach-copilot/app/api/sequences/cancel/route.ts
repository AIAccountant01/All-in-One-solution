import { requireApiAccess } from "@/lib/auth";
import { sql } from "@/lib/db";
import { limitWrite } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const auth = await requireApiAccess(req);
  if (auth instanceof Response) return auth;
  const limited = limitWrite(auth.ownerId, "sequences-cancel");
  if (limited) return limited;
  try {
    const body = (await req.json()) as { id?: string };
    if (!body.id) {
      return Response.json({ error: "id required" }, { status: 400 });
    }
    const rows = await sql<{ id: string }>(
      `UPDATE sequences
       SET status = 'cancelled', updated_at = NOW()
       WHERE id = $1 AND owner_id = $2
       RETURNING id`,
      [body.id, auth.ownerId],
    );
    if (!rows.length) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    return Response.json(
      { ok: true },
      { headers: { "cache-control": "private, no-store" } },
    );
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "cancel failed" },
      { status: 500 },
    );
  }
}
