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
  if (a === 100 && b >= 64 && b <= 127) return true;
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
    const res = await fetch(u.toString(), {
      ...init,
      redirect: "manual",
      signal: init?.signal ?? AbortSignal.timeout(10000),
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
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
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
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

function decodeDuck(href: string): string {
  try {
    let h = href.replace(/&amp;/g, "&").trim();
    if (h.startsWith("//")) h = `https:${h}`;
    if (!h.startsWith("http")) {
      h = new URL(h, "https://duckduckgo.com").toString();
    }
    const u = new URL(h);
    const uddg = u.searchParams.get("uddg");
    if (uddg) return uddg;
    return h;
  } catch {
    return href;
  }
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function parseDdgHtml(html: string): SearchHit[] {
  const hits: SearchHit[] = [];
  const seen = new Set<string>();
  // Flexible attribute order; title from result__a, optional nearby snippet.
  const re =
    /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>([\s\S]*?)(?=<a[^>]*class="result__a"|$)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) && hits.length < 10) {
    const link = decodeDuck(m[1] || "");
    if (!link || /duckduckgo\.com/i.test(link)) continue;
    if (seen.has(link)) continue;
    seen.add(link);
    const title = stripTags(m[2] || "");
    const chunk = m[3] || "";
    const snipMatch = /class="result__snippet"[^>]*>([\s\S]*?)<\/(?:a|div|td|span)/i.exec(
      chunk,
    );
    hits.push({
      url: link,
      title: title || link,
      snippet: stripTags(snipMatch?.[1] || ""),
    });
  }
  return hits;
}

async function searchDdg(query: string): Promise<SearchHit[]> {
  // Keep queries simple — boolean operators often trigger DDG anomaly/202 pages.
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        accept: "text/html",
      },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok && res.status !== 202) return [];
    const html = await res.text();
    if (/anomaly-modal|challenge-form|bots?/i.test(html) && !/result__a/i.test(html)) {
      return [];
    }
    const parsed = parseDdgHtml(html);
    const out: SearchHit[] = [];
    for (const h of parsed) {
      if (await assertPublicHttpUrl(h.url)) out.push(h);
      if (out.length >= 8) break;
    }
    return out;
  } catch {
    return [];
  }
}

async function searchWikipedia(query: string): Promise<SearchHit[]> {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=3&namespace=0&format=json`;
    const res = await fetch(url, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as [string, string[], string[], string[]];
    const titles = data[1] || [];
    const descs = data[2] || [];
    const links = data[3] || [];
    const hits: SearchHit[] = [];
    for (let i = 0; i < links.length; i++) {
      const link = links[i]!;
      if (!(await assertPublicHttpUrl(link))) continue;
      hits.push({
        url: link,
        title: titles[i] || query,
        snippet: descs[i] || "",
      });
    }
    return hits;
  } catch {
    return [];
  }
}

async function searchGoogleNewsRss(query: string): Promise<SearchHit[]> {
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-GB&gl=GB&ceid=GB:en`;
    const res = await fetch(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const hits: SearchHit[] = [];
    const itemRe = /<item>([\s\S]*?)<\/item>/gi;
    let m: RegExpExecArray | null;
    while ((m = itemRe.exec(xml)) && hits.length < 6) {
      const block = m[1]!;
      const title = stripTags(/<title>([\s\S]*?)<\/title>/i.exec(block)?.[1] || "");
      const linkRaw = /<link>([\s\S]*?)<\/link>/i.exec(block)?.[1]?.trim() || "";
      const desc = stripTags(/<description>([\s\S]*?)<\/description>/i.exec(block)?.[1] || "");
      // Google News links redirect; keep if public http(s)
      if (!linkRaw || !(await assertPublicHttpUrl(linkRaw))) continue;
      hits.push({ url: linkRaw, title: title || query, snippet: desc.slice(0, 280) });
    }
    return hits;
  } catch {
    return [];
  }
}

/** Multi-provider search. Prefer simple queries (no boolean operators). */
export async function searchWeb(query: string): Promise<SearchHit[]> {
  const clean = query.replace(/\s+/g, " ").trim();
  const seen = new Set<string>();
  const out: SearchHit[] = [];

  const add = (hits: SearchHit[]) => {
    for (const h of hits) {
      if (seen.has(h.url)) continue;
      seen.add(h.url);
      out.push(h);
    }
  };

  add(await searchDdg(clean));
  if (out.length < 4) add(await searchGoogleNewsRss(clean));
  if (out.length < 3) add(await searchWikipedia(clean));

  // Soften overly complex queries that DDG anomaly-blocks
  if (!out.length && /OR|-site:|site:/i.test(clean)) {
    const simple = clean
      .replace(/\bOR\b/gi, " ")
      .replace(/-?site:\S+/gi, " ")
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .slice(0, 6)
      .join(" ");
    if (simple && simple !== clean) {
      add(await searchDdg(simple));
      if (out.length < 4) add(await searchGoogleNewsRss(simple));
      if (out.length < 3) add(await searchWikipedia(simple));
    }
  }

  return out.slice(0, 10);
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
