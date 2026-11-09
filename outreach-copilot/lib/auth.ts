import { createHash } from "node:crypto";
import { getIdentity, requireIdentity } from "../cursor/identity";

export type AuthOk = { ownerId: string; stage: "production" | "preview" | "local" };

function isPublishedHost(): boolean {
  return Boolean(process.env.CURSOR_APP_ID?.trim() || process.env.VERCEL);
}

function passcodeOk(req: Request): boolean {
  const expected = process.env.APP_PASSCODE?.trim() ?? "";
  if (!expected) return false;
  return (req.headers.get("x-passcode")?.trim() ?? "") === expected;
}

function passcodeOwner(): string {
  const expected = process.env.APP_PASSCODE?.trim() ?? "";
  const digest = createHash("sha256").update(expected).digest("hex").slice(0, 24);
  return `passcode:${digest}`;
}

/**
 * API gate: optional APP_PASSCODE when set; published hosts always require a
 * verified Cursor identity (passcode alone is not enough to leave the app open).
 * Local/zip runs may stay open for beginners and use a simulated viewer.
 */
export async function requireApiAccess(req: Request): Promise<Response | AuthOk> {
  const expected = process.env.APP_PASSCODE?.trim() ?? "";
  if (expected && !passcodeOk(req)) {
    return Response.json({ error: "Wrong passcode" }, { status: 401 });
  }

  if (isPublishedHost()) {
    const identity = await requireIdentity(req);
    if (identity instanceof Response) {
      // Never leave a published host open without a verified viewer.
      return identity;
    }
    const stage = identity.stage === "preview" ? "preview" : "production";
    return { ownerId: `${stage}:${identity.sub}`, stage };
  }

  // Local / share-zip: passcode already checked if configured.
  const identity = await getIdentity(req);
  if (identity.verified) {
    return { ownerId: `local:${identity.sub}`, stage: "local" };
  }
  if (expected) {
    return { ownerId: passcodeOwner(), stage: "local" };
  }
  return { ownerId: "local:anonymous", stage: "local" };
}

/** @deprecated Prefer requireApiAccess — kept for any leftover imports. */
export async function requirePasscode(req: Request): Promise<Response | null> {
  const result = await requireApiAccess(req);
  return result instanceof Response ? result : null;
}
