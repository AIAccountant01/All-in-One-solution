import { requirePasscode } from "@/lib/auth";
import { keysFromRequest } from "@/lib/keys";
import { researchSchema, withModels } from "@/lib/llm";
import { fetchText, filterLiveSources, searchWeb } from "@/lib/web";
import type { Profile } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  const denied = requirePasscode(req);
  if (denied) return denied;
  try {
    const body = (await req.json()) as {
      company?: string;
      profile?: Profile;
    };
    const company = body.company?.trim();
    if (!company) {
      return Response.json({ error: "company required" }, { status: 400 });
    }
    const keys = keysFromRequest(req);
    const hits = await searchWeb(
      `${company} funding OR launch OR hiring OR product news -site:linkedin.com`,
    );
    const rolesHits = await searchWeb(`${company} careers OR "open roles" OR hiring`);
    const { live, dropped } = await filterLiveSources([...hits, ...rolesHits].slice(0, 10));
    const pages = await Promise.all(
      live.slice(0, 6).map(async (h) => ({
        ...h,
        text: (await fetchText(h.url)).slice(0, 2500),
      })),
    );

    const sourcesBlock = pages
      .map(
        (p, i) =>
          `[${i}] ${p.title}\nURL: ${p.url}\nSnippet: ${p.snippet}\nExtract: ${p.text.slice(0, 1200)}`,
      )
      .join("\n\n");

    const { result, meta } = await withModels(keys, async ({ generateObject, model }) => {
      const { object } = await generateObject({
        model,
        schema: researchSchema,
        prompt: `You are researching ${company} for cold outreach.
Only use facts present in the SOURCES below. Never invent funding, launches, names, or dates.
If a source did not load or is thin, skip it.
Mark open-role postings that are undated or older than ~60 days into open_roles, not signals used as hooks.
Mark sensitive items (layoffs, lawsuits, personal tragedy) with sensitive=true.
Pick best_hook as the index into signals that is freshest and most useful for a founder/operator outreach — or null if none.

Sender target: ${body.profile?.target || "operator / founder outreach"}
Sender facts (for fit_flags only — do not invent company facts from these):
${body.profile?.facts || ""}

SOURCES:
${sourcesBlock || "(no live sources)"}

Return JSON matching the schema. signals[].url must be one of the source URLs.`,
      });
      return object;
    });

    // Keep only signals whose URL was in live set
    const liveUrls = new Set(live.map((l) => l.url));
    const signals = result.signals.filter((s) => liveUrls.has(s.url) || /^https?:\/\//.test(s.url));
    const verified = [];
    let extraDropped = 0;
    for (const s of signals) {
      if (liveUrls.has(s.url)) verified.push(s);
      else extraDropped++;
    }

    return Response.json({
      ...result,
      signals: verified,
      dropped: dropped + extraDropped,
      models: meta.models,
      claude_down: meta.claude_down,
    });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "research failed" },
      { status: 500 },
    );
  }
}
