import { requireApiAccess } from "@/lib/auth";
import { limitLlm } from "@/lib/rate-limit";
import { testKey } from "@/lib/keys";

export async function POST(req: Request) {
  const auth = await requireApiAccess(req);
  if (auth instanceof Response) return auth;
  const limited = await limitLlm(auth.ownerId, "keys-test");
  if (limited) return limited;
  try {
    const body = (await req.json()) as {
      id?: "anthropic" | "moonshot" | "openrouter";
      key?: string;
    };
    if (!body.id || !body.key) {
      return Response.json({ error: "id and key required" }, { status: 400 });
    }
    const result = await testKey(body.id, body.key);
    return Response.json(result);
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "test failed" },
      { status: 500 },
    );
  }
}
