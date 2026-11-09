import { requirePasscode } from "@/lib/auth";
import { testKey } from "@/lib/keys";

export async function POST(req: Request) {
  const denied = requirePasscode(req);
  if (denied) return denied;
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
