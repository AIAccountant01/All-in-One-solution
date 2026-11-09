type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/**
 * Simple in-process rate limit. Enough to stop casual abuse of paid LLM routes
 * on a single instance; not a distributed quota.
 */
export function rateLimit(
  key: string,
  opts: { limit: number; windowMs: number },
): Response | null {
  const now = Date.now();
  const cur = buckets.get(key);
  if (!cur || cur.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
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

/** LLM / research routes: 30 calls per owner per hour. */
export function limitLlm(ownerId: string, route: string): Response | null {
  return rateLimit(`llm:${ownerId}:${route}`, {
    limit: 30,
    windowMs: 60 * 60 * 1000,
  });
}

/** Sequence writes: 60 per owner per hour. */
export function limitWrite(ownerId: string, route: string): Response | null {
  return rateLimit(`write:${ownerId}:${route}`, {
    limit: 60,
    windowMs: 60 * 60 * 1000,
  });
}
