import { requireApiAccess } from "@/lib/auth";
import { sql } from "@/lib/db";
import { limitWrite } from "@/lib/rate-limit";
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
  const limited = limitWrite(auth.ownerId, "sequences");
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

    const resend = process.env.RESEND_API_KEY?.trim();
    const from = process.env.FROM_EMAIL?.trim() || "raghav.r@onplusone.in";
    if (resend && steps[0]) {
      const first = steps[0];
      const when = new Date(first.send_at_iso).getTime();
      if (when <= Date.now() + 60_000) {
        await fetch("https://api.resend.com/emails", {
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
