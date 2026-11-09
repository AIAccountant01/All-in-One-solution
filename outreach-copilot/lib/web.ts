import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export type SearchHit = {
  title: string;
  url: string;
  snippet: string;
};

function isPrivateIp(ip: string): boolean {
  const v = ip.toLowerCase();
  if (v === "::1" || v === "0.0.0.0") return true;
  if (v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80")) return true;
  const m = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(v);
  if (!m) return false;
  const a = Number(m[1]);
  const b = Number(m[2]);
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  return false;
}

const BLOCKED_HOSTS = new Set([
  "localhost",
  "metadata",
  "metadata.google.internal",
  "kubernetes.default",
  "kubernetes.default.svc",
]);

/** Only allow fetching public http(s) URLs — blocks SSRF to private/metadata hosts. */
export async function assertPublicHttpUrl(raw: string): Promise<URL | null> {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  if (u.username || u.password) return null;

  const host = u.hostname.toLowerCase().replace(/\.$/, "");
  if (!host || BLOCKED_HOSTS.has(host) || host.endsWith(".localhost") || host.endsWith(".local")) {
    return null;
  }
  if (isIP(host) && isPrivateIp(host)) return null;

  try {
    const addrs = await lookup(host, { all: true, verbatim: true });
    if (!addrs.length || addrs.some((a) => isPrivateIp(a.address))) return null;
  } catch {
    return null;
  }
  return u;
}

async function safeFetch(
  raw: string,
  init?: RequestInit,
): Promise<Response | null> {
  const u = await assertPublicHttpUrl(raw);
  if (!u) return null;
  try {
    // Do not auto-follow redirects into private networks.
    const res = await fetch(u.toString(), {
      ...init,
      redirect: "manual",
      signal: init?.signal ?? AbortSignal.timeout(10000),
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; OutreachCopilot/1.0; +https://cursor.com)",
        ...(init?.headers || {}),
      },
    });
    if ([301, 302, 303, 307, 308].includes(res.status)) {
      const loc = res.headers.get("location");
      if (!loc) return null;
      const next = await assertPublicHttpUrl(new URL(loc, u).toString());
      if (!next) return null;
      return fetch(next.toString(), {
        ...init,
        redirect: "manual",
        signal: init?.signal ?? AbortSignal.timeout(10000),
        headers: {
          "user-agent":
            "Mozilla/5.0 (compatible; OutreachCopilot/1.0; +https://cursor.com)",
          ...(init?.headers || {}),
        },
      });
    }
    return res;
  } catch {
    return null;
  }
}

async function urlLoads(url: string): Promise<boolean> {
  const res = await safeFetch(url, {
    method: "GET",
    signal: AbortSignal.timeout(8000),
  });
  if (!res) return false;
  return res.ok || res.status === 403 || res.status === 401;
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
      if (!(await assertPublicHttpUrl(link))) continue;
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
      if (!(await assertPublicHttpUrl(link))) continue;
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
  const res = await safeFetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res || !res.ok) return "";
  try {
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
