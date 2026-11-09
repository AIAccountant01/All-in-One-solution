import { requireApiAccess } from "@/lib/auth";
import { scoreCopy } from "@/lib/jev";
import { limitWrite } from "@/lib/rate-limit";
import type { Profile } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const auth = await requireApiAccess(req);
    if (auth instanceof Response) return auth;
    const limited = await limitWrite(auth.ownerId, "gate");
    if (limited) return limited;
    const body = (await req.json()) as {
      body?: string;
      profile?: Profile;
      kind?: "email" | "linkedin";
    };
    const profile = body.profile || {
      name: "",
      target: "",
      facts: "",
      banned: "",
      voice: "",
    };
    const jev = scoreCopy(body.body || "", {
      profile,
      kind: body.kind || "email",
    });
    return Response.json({ jev });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "gate failed" },
      { status: 500 },
    );
  }
}
