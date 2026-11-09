import { requireApiAccess } from "@/lib/auth";
import { limitLlm } from "@/lib/rate-limit";
import { scoreCopy } from "@/lib/jev";
import { keysFromRequest } from "@/lib/keys";
import { questionsSchema, withModels } from "@/lib/llm";
import type { Person, Profile, Research, Thesis } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  const auth = await requireApiAccess(req);
  if (auth instanceof Response) return auth;
  const limited = limitLlm(auth.ownerId, "questions");
  if (limited) return limited;
  try {
    const body = (await req.json()) as {
      research?: Research;
      thesis?: Thesis;
      poc?: Person | null;
      profile?: Profile;
    };
    if (!body.research || !body.thesis) {
      return Response.json({ error: "research and thesis required" }, { status: 400 });
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
        schema: questionsSchema,
        prompt: `Propose 4 short questions the sender should answer before drafting cold outreach.
They should sharpen the angle for ${body.research!.name}, thesis "${body.thesis!.title}", recipient ${body.poc?.name || "founder"} (${body.poc?.title || "unknown"}).
Avoid yes/no fluff. Make them specific to signals and the sender's proof.
Signals: ${JSON.stringify(body.research!.signals.slice(0, 5))}
Sender facts: ${profile.facts}`,
      });
      return object;
    });

    const kept = result.questions.map((q) =>
      scoreCopy(q, { profile, kind: "question", companyFacts: body.research!.signals.map((s) => s.fact) }),
    );

    return Response.json({
      questions: result.questions,
      kept,
      models: meta.models,
      claude_down: meta.claude_down,
    });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "questions failed" },
      { status: 500 },
    );
  }
}
