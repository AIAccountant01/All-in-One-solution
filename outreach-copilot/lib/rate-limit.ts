import { sql } from "@/lib/db";

type Bucket = { count: number; resetAt: number };

const memory = new Map<string, Bucket>();
const hasDb = Boolean(process.env.DATABASE_URL?.trim());

async function rateLimitDb(
  key: string,
  opts: { limit: number; windowMs: number },
): Promise<Response | null> {
  const now = Date.now();
  const resetAt = new Date(now + opts.windowMs);
  try {
    const rows = await sql<{ count: number; reset_at: string }>(
      `SELECT count, reset_at FROM rate_limits WHERE bucket_key = $1`,
      [key],
    );
    const row = rows[0];
    if (!row || new Date(row.reset_at).getTime() <= now) {
      await sql(
        `INSERT INTO rate_limits (bucket_key, count, reset_at)
         VALUES ($1, 1, $2)
         ON CONFLICT (bucket_key) DO UPDATE
         SET count = 1, reset_at = EXCLUDED.reset_at`,
        [key, resetAt.toISOString()],
      );
      return null;
    }
    if (row.count >= opts.limit) {
      const retry = Math.max(
        1,
        Math.ceil((new Date(row.reset_at).getTime() - now) / 1000),
      );
      return Response.json(
        { error: `Rate limit exceeded. Try again in ~${retry}s.` },
        {
          status: 429,
          headers: {
            "retry-after": String(retry),
            "cache-control": "private, no-store",
          },
        },
      );
    }
    await sql(
      `UPDATE rate_limits SET count = count + 1 WHERE bucket_key = $1`,
      [key],
    );
    return null;
  } catch {
    // Fall through to memory if the table is not migrated yet.
    return rateLimitMemory(key, opts);
  }
}

function rateLimitMemory(
  key: string,
  opts: { limit: number; windowMs: number },
): Response | null {
  const now = Date.now();
  const cur = memory.get(key);
  if (!cur || cur.resetAt <= now) {
    memory.set(key, { count: 1, resetAt: now + opts.windowMs });
    return null;
  }
  if (cur.count >= opts.limit) {
    const retry = Math.max(1, Math.ceil((cur.resetAt - now) / 1000));
    return Response.json(
      { error: `Rate limit exceeded. Try again in ~${retry}s.` },
      {
        status: 429,
        headers: {
          "retry-after": String(retry),
          "cache-control": "private, no-store",
        },
      },
    );
  }
  cur.count += 1;
  return null;
}

/** Shared across instances when DATABASE_URL is set; otherwise in-process. */
export async function rateLimit(
  key: string,
  opts: { limit: number; windowMs: number },
): Promise<Response | null> {
  if (hasDb) return rateLimitDb(key, opts);
  return rateLimitMemory(key, opts);
}

export async function limitLlm(ownerId: string, route: string): Promise<Response | null> {
  return rateLimit(`llm:${ownerId}:${route}`, {
    limit: 30,
    windowMs: 60 * 60 * 1000,
  });
}

export async function limitWrite(ownerId: string, route: string): Promise<Response | null> {
  return rateLimit(`write:${ownerId}:${route}`, {
    limit: 60,
    windowMs: 60 * 60 * 1000,
  });
}

/** Outbound email via Resend — tight cap. */
export async function limitEmail(ownerId: string): Promise<Response | null> {
  return rateLimit(`email:${ownerId}`, {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
}
