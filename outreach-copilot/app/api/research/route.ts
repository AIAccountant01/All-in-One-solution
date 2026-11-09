import { requireApiAccess } from "@/lib/auth";
import { limitLlm } from "@/lib/rate-limit";
import { keysFromRequest } from "@/lib/keys";
import { researchSchema, withModels } from "@/lib/llm";
import { fetchText, filterLiveSources, searchWeb } from "@/lib/web";
import type { Profile } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const auth = await requireApiAccess(req);
    if (auth instanceof Response) return auth;
    const limited = await limitLlm(auth.ownerId, "research");
    if (limited) return limited;

    const body = (await req.json()) as {
      company?: string;
      profile?: Profile;
    };
    const company = body.company?.trim();
    if (!company) {
      return Response.json({ error: "company required" }, { status: 400 });
    }
    const keys = keysFromRequest(req);
    if (!keys.anthropic && !keys.moonshot && !keys.openrouter) {
      return Response.json(
        {
          error:
            "No AI key available. Add Moonshot or OpenRouter in Profile, or bind server secrets.",
        },
        { status: 400 },
      );
    }

    // Two simple queries — boolean operators often get search providers blocked.
    const [companyHits, newsHits] = await Promise.all([
      searchWeb(company),
      searchWeb(`${company} news`),
    ]);
    const merged = [...companyHits, ...newsHits];
    const dedup = [...new Map(merged.map((h) => [h.url, h])).values()];
    const { live, dropped } = await filterLiveSources(dedup.slice(0, 10));
    const pages = await Promise.all(
      live.slice(0, 5).map(async (h) => ({
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

    if (!pages.length && !live.length) {
      return Response.json(
        {
          error: `No live sources found for "${company}". Check the spelling, or try again.`,
        },
        { status: 422 },
      );
    }

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
Always set name to the company common name and write a 2-4 sentence summary from the sources.

Sender target: ${body.profile?.target || "operator / founder outreach"}
Sender facts (for fit_flags only — do not invent company facts from these):
${body.profile?.facts || ""}

SOURCES:
${sourcesBlock || "(no live sources)"}

Return JSON matching the schema. signals[].url must be one of the source URLs.`,
      });
      return object;
    });

    const liveUrls = new Set(live.map((l) => l.url));
    const signals = (result.signals || []).filter(
      (s) => liveUrls.has(s.url) || /^https?:\/\//.test(s.url),
    );
    const verified = [];
    let extraDropped = 0;
    for (const s of signals) {
      if (liveUrls.has(s.url)) verified.push(s);
      else extraDropped++;
    }

    const name = (result.name || "").trim() || company;
    const summary =
      (result.summary || "").trim() ||
      (live.length
        ? `Found ${live.length} live source(s) for ${company}, but the model returned a thin summary.`
        : `No live web sources loaded for ${company}.`);

    return Response.json({
      ...result,
      name,
      summary,
      signals: verified,
      dropped: dropped + extraDropped,
      models: meta.models,
      claude_down: meta.claude_down,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "research failed";
    return Response.json(
      { error: message },
      {
        status: 500,
        headers: { "content-type": "application/json", "cache-control": "private, no-store" },
      },
    );
  }
}
