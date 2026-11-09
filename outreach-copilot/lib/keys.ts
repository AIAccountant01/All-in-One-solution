import type { KeysFromHeaders } from "./types";

export function keysFromRequest(req: Request): KeysFromHeaders {
  return {
    anthropic:
      req.headers.get("x-anthropic-key")?.trim() ||
      process.env.ANTHROPIC_API_KEY?.trim() ||
      undefined,
    moonshot:
      req.headers.get("x-moonshot-key")?.trim() ||
      process.env.MOONSHOT_API_KEY?.trim() ||
      undefined,
    openrouter:
      req.headers.get("x-openrouter-key")?.trim() ||
      process.env.OPENROUTER_API_KEY?.trim() ||
      undefined,
  };
}

export async function testKey(
  id: "anthropic" | "moonshot" | "openrouter",
  key: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (id === "anthropic") {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 16,
          messages: [{ role: "user", content: "ping" }],
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        return { ok: false, error: t.slice(0, 200) };
      }
      return { ok: true };
    }
    if (id === "moonshot") {
      const res = await fetch("https://api.moonshot.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: "moonshot-v1-8k",
          messages: [{ role: "user", content: "ping" }],
          max_tokens: 8,
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        return { ok: false, error: t.slice(0, 200) };
      }
      return { ok: true };
    }
    const res = await fetch("https://openrouter.ai/api/v1/models", {
      headers: { authorization: `Bearer ${key}` },
    });
    if (!res.ok) {
      const t = await res.text();
      return { ok: false, error: t.slice(0, 200) };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "failed" };
  }
}
