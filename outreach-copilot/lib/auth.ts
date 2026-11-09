export function requirePasscode(req: Request): Response | null {
  const expected = process.env.APP_PASSCODE?.trim() ?? "";
  if (!expected) return null; // open when unset (local/dev)
  const got = req.headers.get("x-passcode")?.trim() ?? "";
  if (got !== expected) {
    return Response.json({ error: "Wrong passcode" }, { status: 401 });
  }
  return null;
}
