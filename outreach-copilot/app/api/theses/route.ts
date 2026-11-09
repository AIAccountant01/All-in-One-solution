import { requirePasscode } from "@/lib/auth";
import { pickRecommend, scoreCopy } from "@/lib/jev";
import { keysFromRequest } from "@/lib/keys";
import { thesesSchema, withModels } from "@/lib/llm";
import type { Profile, Research } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  const denied = requirePasscode(req);
  if (denied) return denied;
  try {
    const body = (await req.json()) as {
      company?: string;
      research?: Research;
      own?: string;
      profile?: Profile;
    };
    if (!body.research) {
      return Response.json({ error: "research required" }, { status: 400 });
    }
    const keys = keysFromRequest(req);
    const profile = body.profile || {
      name: "",
      target: "",
      facts: "",
      banned: "",
      voice: "",
    };

    const { result, meta } = await withModels(keys, async ({ generateObject, model }) => {
      const { object } = await generateObject({
        model,
        schema: thesesSchema,
        prompt: `Write exactly two problem theses for outreach to ${body.research!.name || body.company}.
Each thesis must use only researched signals (no invented company facts).
Connect the org signal to the sender's proof from their facts.
${body.own ? `Sender's own read to incorporate: ${body.own}` : ""}

Research summary: ${body.research!.summary}
Takeaway: ${body.research!.takeaway || ""}
Signals: ${JSON.stringify(body.research!.signals)}
Sender facts: ${profile.facts}
Sender target: ${profile.target}
Banned claims (never use): ${profile.banned}

Return two theses with labels Thesis A / Thesis B.`,
      });
      return object;
    });

    const theses = result.theses.slice(0, 2).map((t) => ({
      ...t,
      jev: scoreCopy(
        `${t.title}\n${t.org_signal}\n${t.proof}\n${t.why}`,
        {
          profile,
          kind: "thesis",
          companyFacts: body.research!.signals.map((s) => s.fact),
        },
      ),
    }));
    const { recommend, close } = pickRecommend(theses.map((t) => t.jev.composite));

    return Response.json({
      theses,
      recommend,
      close,
      models: meta.models,
      claude_down: meta.claude_down,
    });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "theses failed" },
      { status: 500 },
    );
  }
}
