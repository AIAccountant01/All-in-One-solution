import { requireApiAccess } from "@/lib/auth";
import { sql } from "@/lib/db";
import { limitEmail, limitWrite } from "@/lib/rate-limit";
import { randomUUID } from "node:crypto";

export async function GET(req: Request) {
  const auth = await requireApiAccess(req);
  if (auth instanceof Response) return auth;
  try {
    const rows = await sql<{
      id: string;
      company: string;
      poc: unknown;
      to: string;
      to_checked: boolean;
      subject: string;
      steps: unknown;
      linkedin: unknown;
      status: string;
      test: boolean;
      created_at: string;
    }>(
      `SELECT id, company, poc, "to", to_checked, subject, steps, linkedin, status, test, created_at
       FROM sequences
       WHERE owner_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [auth.ownerId],
    );
    return Response.json(
      {
        sequences: rows.map((r) => ({
          id: r.id,
          company: r.company,
          poc: r.poc,
          to: r.to,
          to_checked: r.to_checked,
          subject: r.subject,
          steps: r.steps,
          linkedin: r.linkedin,
          status: r.status,
          test: r.test,
          created_at: r.created_at,
        })),
      },
      { headers: { "cache-control": "private, no-store" } },
    );
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "list failed" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const auth = await requireApiAccess(req);
  if (auth instanceof Response) return auth;
  const limited = await limitWrite(auth.ownerId, "sequences");
  if (limited) return limited;
  try {
    const body = (await req.json()) as {
      company?: string;
      poc?: unknown;
      to?: string;
      to_checked?: boolean;
      subject?: string;
      steps?: {
        body: string;
        send_at_iso: string;
        gate?: { route: string; composite?: number };
      }[];
      linkedin?: string[];
      test?: boolean;
      /** Explicit opt-in — never auto-send just because a step is due soon. */
      send_now?: boolean;
    };
    if (!body.company || !body.to || !body.subject || !body.steps?.length) {
      return Response.json({ error: "incomplete sequence" }, { status: 400 });
    }
    const id = randomUUID();
    const steps = body.steps.map((s, i) => ({
      n: i + 1,
      body: s.body,
      send_at_iso: s.send_at_iso,
      gate: s.gate,
      sent: false,
    }));
    const linkedin = body.linkedin || [];
    await sql(
      `INSERT INTO sequences (id, owner_id, company, poc, "to", to_checked, subject, steps, linkedin, status, test)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'active',$10)`,
      [
        id,
        auth.ownerId,
        body.company,
        JSON.stringify(body.poc ?? null),
        body.to,
        !!body.to_checked,
        body.subject,
        JSON.stringify(steps),
        JSON.stringify(linkedin),
        !!body.test,
      ],
    );

    // Only send immediately when the client explicitly opts in (Approve → Send now).
    // Never auto-fire Resend just because a step timestamp is near — that burns quota.
    const resend = process.env.RESEND_API_KEY?.trim();
    const from = process.env.FROM_EMAIL?.trim() || "raghav.r@onplusone.in";
    let emailed = false;
    if (body.send_now && resend && steps[0] && !body.test) {
      const emailLimited = await limitEmail(auth.ownerId);
      if (!emailLimited) {
        const first = steps[0];
        const sent = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            authorization: `Bearer ${resend}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            from,
            to: body.to,
            subject: body.subject,
            text: first.body,
          }),
        }).catch(() => null);
        emailed = !!sent?.ok;
        if (emailed) {
          steps[0] = { ...first, sent: true };
          await sql(
            `UPDATE sequences SET steps = $1, updated_at = NOW() WHERE id = $2 AND owner_id = $3`,
            [JSON.stringify(steps), id, auth.ownerId],
          );
        }
      }
    }

    return Response.json(
      {
        sequence: {
          id,
          company: body.company,
          to: body.to,
          steps,
          linkedin,
          status: "active",
          emailed,
        },
      },
      { headers: { "cache-control": "private, no-store" } },
    );
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "save failed" },
      { status: 500 },
    );
  }
}
