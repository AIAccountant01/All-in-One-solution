import { requirePasscode } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function POST(req: Request) {
  const denied = requirePasscode(req);
  if (denied) return denied;
  try {
    const body = (await req.json()) as { id?: string };
    if (!body.id) {
      return Response.json({ error: "id required" }, { status: 400 });
    }
    await sql(
      `UPDATE sequences SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
      [body.id],
    );
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "cancel failed" },
      { status: 500 },
    );
  }
}
