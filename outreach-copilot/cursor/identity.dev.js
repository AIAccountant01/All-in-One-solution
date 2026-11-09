// JS twin of identity.dev.ts so Next/turbopack can resolve identity.ts's
// `./identity.dev.js` import. Keep values in sync with identity.dev.ts.

export const DEV_VIEWER = {
  sub: "user:dev",
  email: "dev@example.com",
  name: "Dev Viewer",
  teamId: 1,
  teamRole: "admin",
};
