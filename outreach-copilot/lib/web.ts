export type SearchHit = {
  title: string;
  url: string;
  snippet: string;
};

async function urlLoads(url: string): Promise<boolean> {
  try {
    const ctrl = AbortSignal.timeout(8000);
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: ctrl,
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; OutreachCopilot/1.0; +https://cursor.com)",
      },
    });
    return res.ok || res.status === 403 || res.status === 401;
  } catch {
    return false;
  }
}

export async function searchWeb(query: string): Promise<SearchHit[]> {
  // DuckDuckGo lite HTML — no API key
  const url = `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; OutreachCopilot/1.0; +https://cursor.com)",
      },
      signal: AbortSignal.timeout(12000),
    });
    const html = await res.text();
    const hits: SearchHit[] = [];
    const re =
      /<a[^>]+rel="nofollow"[^>]+href="(https?:\/\/[^"]+)"[^>]*>([^<]*)<\/a>[\s\S]*?<td[^>]*class="result-snippet"[^>]*>([\s\S]*?)<\/td>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) && hits.length < 8) {
      const link = m[1]!;
      if (/duckduckgo\.com|youtube\.com\/watch/i.test(link)) continue;
      hits.push({
        url: link,
        title: m[2]!.replace(/\s+/g, " ").trim(),
        snippet: m[3]!.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
      });
    }
    if (hits.length) return hits;
  } catch {
    // fall through
  }

  // Bing-style fallback via DuckDuckGo HTML variant
  try {
    const res = await fetch(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
      {
        headers: {
          "user-agent":
            "Mozilla/5.0 (compatible; OutreachCopilot/1.0; +https://cursor.com)",
        },
        signal: AbortSignal.timeout(12000),
      },
    );
    const html = await res.text();
    const hits: SearchHit[] = [];
    const re =
      /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>|<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) && hits.length < 8) {
      const link = decodeDuck(m[1] || m[4] || "");
      if (!link || /duckduckgo\.com/i.test(link)) continue;
      hits.push({
        url: link,
        title: (m[2] || m[5] || "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim(),
        snippet: (m[3] || "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim(),
      });
    }
    return hits;
  } catch {
    return [];
  }
}

function decodeDuck(href: string): string {
  try {
    if (href.startsWith("http")) return href;
    const u = new URL(href, "https://duckduckgo.com");
    const uddg = u.searchParams.get("uddg");
    return uddg ? decodeURIComponent(uddg) : href;
  } catch {
    return href;
  }
}

export async function filterLiveSources(
  hits: SearchHit[],
): Promise<{ live: SearchHit[]; dropped: number }> {
  const checks = await Promise.all(
    hits.map(async (h) => ({ h, ok: await urlLoads(h.url) })),
  );
  const live = checks.filter((c) => c.ok).map((c) => c.h);
  return { live, dropped: checks.length - live.length };
}

export async function fetchText(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; OutreachCopilot/1.0; +https://cursor.com)",
      },
    });
    if (!res.ok) return "";
    const html = await res.text();
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 6000);
  } catch {
    return "";
  }
}
