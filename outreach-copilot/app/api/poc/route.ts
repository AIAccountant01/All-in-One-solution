import { requirePasscode } from "@/lib/auth";
import { keysFromRequest } from "@/lib/keys";
import { liveWebCheck, peopleSchema, withModels } from "@/lib/llm";
import { filterLiveSources, searchWeb } from "@/lib/web";
import type { Profile, Research, Thesis } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  const denied = requirePasscode(req);
  if (denied) return denied;
  try {
    const body = (await req.json()) as {
      research?: Research;
      thesis?: Thesis;
      profile?: Profile;
    };
    if (!body.research) {
      return Response.json({ error: "research required" }, { status: 400 });
    }
    const company = body.research.name;
    const keys = keysFromRequest(req);
    const hits = await searchWeb(
      `${company} founder OR CEO OR "founder's office" OR COO OR "head of" site:linkedin.com OR site:theorg.com OR team`,
    );
    const { live } = await filterLiveSources(hits.slice(0, 8));

    const { result, meta } = await withModels(keys, async ({ generateObject, model }) => {
      const { object } = await generateObject({
        model,
        schema: peopleSchema,
        prompt: `Find 1-4 real decision-makers at ${company} who fit this outreach thesis.
Only include people with a source_url that appears in SOURCES (must load).
Prefer founders / 0-to-1 owners / GTM or ops leaders matching: ${body.profile?.target || ""}
Thesis: ${body.thesis?.title} — ${body.thesis?.org_signal}
If you can infer a common email pattern from a source, set email_guess + pattern_example; never invent a verified email.

SOURCES:
${live.map((h, i) => `[${i}] ${h.title}\n${h.url}\n${h.snippet}`).join("\n\n") || "(none)"}`,
      });
      return object;
    });

    const people = [];
    for (const p of result.people) {
      const ok = live.some((l) => l.url === p.source_url) || /^https?:\/\//.test(p.source_url);
      if (!ok) continue;
      people.push(p);
    }

    const check = await liveWebCheck(
      keys,
      `Confirm these people currently work at or with ${company}: ${people.map((p) => p.name + " " + p.title).join("; ")}. Be brief.`,
    );

    return Response.json({
      people,
      recommend:
        people.length && result.recommend >= 0 && result.recommend < people.length
          ? result.recommend
          : people.length
            ? 0
            : -1,
      recommend_reason: result.recommend_reason,
      web_check: check,
      models: meta.models,
      claude_down: meta.claude_down,
    });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "poc failed" },
      { status: 500 },
    );
  }
}
