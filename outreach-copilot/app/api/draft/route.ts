import { requireApiAccess } from "@/lib/auth";
import { limitLlm } from "@/lib/rate-limit";
import { scoreCopy } from "@/lib/jev";
import { keysFromRequest } from "@/lib/keys";
import { draftSchema, withModels } from "@/lib/llm";
import type { Person, Profile, Research, SeqItem, Thesis } from "@/lib/types";

export const maxDuration = 90;

export async function POST(req: Request) {
  const auth = await requireApiAccess(req);
  if (auth instanceof Response) return auth;
  const limited = await limitLlm(auth.ownerId, "draft");
  if (limited) return limited;
  try {
    const body = (await req.json()) as {
      research?: Research;
      thesis?: Thesis;
      qa?: { q: string; a: string }[];
      poc?: Person | null;
      profile?: Profile;
    };
    if (!body.research || !body.thesis) {
      return Response.json({ error: "research and thesis required" }, { status: 400 });
    }
    const keys = keysFromRequest(req);
    const profile = body.profile || {
      name: "Raghav R",
      target: "",
      facts: "",
      banned: "",
      voice: "",
    };
    const first =
      body.poc?.name?.split(/\s+/)[0] || "there";

    const { result, meta } = await withModels(keys, async ({ generateObject, model }) => {
      const { object } = await generateObject({
        model,
        schema: draftSchema,
        prompt: `Draft a 3-email + LinkedIn cold sequence. No invented company facts.
Use only research signals. Mirror the sender voice sample when possible.
Replace recipient first name with {{first}} (will be filled as ${first}).

Company: ${body.research!.name}
Summary: ${body.research!.summary}
Signals: ${JSON.stringify(body.research!.signals)}
Thesis: ${JSON.stringify(body.thesis)}
Recipient: ${JSON.stringify(body.poc)}
Q&A from sender: ${JSON.stringify(body.qa || [])}
Sender name: ${profile.name}
Sender facts: ${profile.facts}
Banned: ${profile.banned}
Voice sample:
${profile.voice}

Rules:
- Email 1 opens on a sourced signal when possible
- Each email has a different hook/proof; no copy-paste
- Plain text, short, one clear ask
- LinkedIn 1 is a connect note under ~280 chars
- opening_signal_facts[i] for emails 0..2; proofs[i] array of proof phrases used`,
      });
      return object;
    });

    const facts = body.research.signals.map((s) => s.fact);
    const mk = (text: string, kind: "email" | "linkedin", i: number): SeqItem => {
      let draft = text.replaceAll("{{first}}", first);
      let jev = scoreCopy(draft, { profile, kind, companyFacts: facts });
      const attempts = [{ route: jev.route, composite: jev.composite }];
      let tries = 0;
      // light rewrite loop if blocked/rewrite
      while ((jev.route === "BLOCK" || jev.route === "REWRITE") && tries < 1) {
        tries++;
        draft = draft
          .replace(/\b(synergy|leverage|cutting-edge|revolutionary)\b/gi, "")
          .replace(/\s+/g, " ")
          .trim();
        jev = scoreCopy(draft, { profile, kind, companyFacts: facts });
        attempts.push({ route: jev.route, composite: jev.composite });
      }
      return {
        text: draft,
        jev: { ...jev, attempts },
        tries: tries || undefined,
        opening_signal_fact: result.opening_signal_facts?.[i],
        proofs: result.proofs?.[i] || [],
      };
    };

    const items: Record<string, SeqItem> = {
      email1: mk(result.email1, "email", 0),
      email2: mk(result.email2, "email", 1),
      email3: mk(result.email3, "email", 2),
      linkedin1: mk(result.linkedin1, "linkedin", 0),
    };
    if (result.linkedin2) items.linkedin2 = mk(result.linkedin2, "linkedin", 1);
    if (result.linkedin3) items.linkedin3 = mk(result.linkedin3, "linkedin", 2);

    const emails = [items.email1!, items.email2!, items.email3!];
    const distinct = {
      ok: true,
      emails: emails.map((e) => ({
        opening_signal_fact: e.opening_signal_fact,
        proofs: e.proofs || [],
      })),
      overlaps_left: {} as Record<string, string>,
    };
    const openings = emails.map((e) => (e.opening_signal_fact || "").toLowerCase());
    if (openings[0] && openings[0] === openings[1]) {
      distinct.ok = false;
      distinct.overlaps_left.email1_email2 = "same opening signal";
    }

    const sensitive = (body.research.signals || []).filter((s) => s.sensitive);

    return Response.json({
      subjects: result.subjects,
      items,
      distinct,
      sensitive,
      models: meta.models,
      claude_down: meta.claude_down,
    });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "draft failed" },
      { status: 500 },
    );
  }
}
