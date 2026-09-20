import type {
  ConnectorContext,
  ConnectResult,
  HealthConnector,
  SyncResult,
} from "./types";
import { demoLiveSyncDays } from "./merge";
import { setProviderTokens } from "./tokenStore";

const FITNESS_SCOPE =
  "https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.body.read";

function clientId(): string | undefined {
  return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || undefined;
}

async function fetchGoogleFitToday(accessToken: string): Promise<SyncResult> {
  const end = Date.now();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const body = {
    aggregateBy: [
      { dataTypeName: "com.google.step_count.delta" },
      { dataTypeName: "com.google.calories.expended" },
      { dataTypeName: "com.google.active_minutes" },
    ],
    bucketByTime: { durationMillis: 86400000 },
    startTimeMillis: start.getTime(),
    endTimeMillis: end,
  };

  const res = await fetch(
    "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Fit sync failed (${res.status}): ${text.slice(0, 180)}`);
  }

  const data = (await res.json()) as {
    bucket?: Array<{
      dataset?: Array<{
        dataSourceId?: string;
        point?: Array<{
          value?: Array<{ intVal?: number; fpVal?: number }>;
        }>;
      }>;
    }>;
  };

  let steps = 0;
  let caloriesBurned = 0;
  let activeMinutes = 0;

  for (const bucket of data.bucket ?? []) {
    for (const ds of bucket.dataset ?? []) {
      const id = ds.dataSourceId ?? "";
      const sum = (ds.point ?? []).reduce((acc, p) => {
        const v = p.value?.[0];
        return acc + (v?.intVal ?? v?.fpVal ?? 0);
      }, 0);
      if (id.includes("step_count")) steps += sum;
      else if (id.includes("calories")) caloriesBurned += sum;
      else if (id.includes("active_minutes")) activeMinutes += sum;
    }
  }

  const date = new Date().toISOString().slice(0, 10);
  return {
    source: "google_fit",
    syncedAt: new Date().toISOString(),
    days: [
      {
        date,
        steps: Math.round(steps),
        caloriesBurned: Math.round(caloriesBurned),
        activeMinutes: Math.round(activeMinutes),
        lastMovementAt: new Date().toISOString(),
      },
    ],
    note: "Synced from Google Fit API",
  };
}

export const googleFitConnector: HealthConnector = {
  id: "google_fit",
  authMode: "oauth",
  label: "Google Fit",
  connectHint: clientId()
    ? "Sign in with Google to read steps, calories, and active minutes."
    : "Add NEXT_PUBLIC_GOOGLE_CLIENT_ID for live OAuth, or connect now for a live-shaped sync pipeline.",

  async connect(ctx: ConnectorContext): Promise<ConnectResult> {
    const id = clientId();
    if (id) {
      const redirectUri = `${window.location.origin}/oauth/google`;
      const params = new URLSearchParams({
        client_id: id,
        redirect_uri: redirectUri,
        response_type: "token",
        scope: FITNESS_SCOPE,
        include_granted_scopes: "true",
        prompt: "consent",
        state: "google_fit",
      });
      return {
        connected: false,
        redirectUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
        note: "Redirecting to Google…",
      };
    }

    ctx.setTokens({ mode: "demo_live", connectedAt: new Date().toISOString() });
    return {
      connected: true,
      accountLabel: "Demo live sync (no Google client ID)",
      note: "Configured Google OAuth later for real Fit data. Sync still updates Today from the connector pipeline.",
    };
  },

  async disconnect(ctx) {
    ctx.setTokens(null);
  },

  async sync(ctx): Promise<SyncResult> {
    const tokens = ctx.getTokens();
    if (!tokens) throw new Error("Google Fit is not connected");

    if (tokens.access_token) {
      return fetchGoogleFitToday(tokens.access_token);
    }

    return {
      source: "google_fit",
      syncedAt: new Date().toISOString(),
      days: demoLiveSyncDays("google_fit"),
      note: "Demo live sync — set NEXT_PUBLIC_GOOGLE_CLIENT_ID for real Fit reads.",
    };
  },
};

/** Persist tokens returned in the OAuth hash fragment. */
export function captureGoogleOAuthHash(): boolean {
  if (typeof window === "undefined") return false;
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash.includes("access_token")) return false;
  const params = new URLSearchParams(hash);
  const access = params.get("access_token");
  const state = params.get("state");
  if (!access || state !== "google_fit") return false;
  setProviderTokens("google_fit", {
    access_token: access,
    token_type: params.get("token_type") ?? "Bearer",
    expires_at: String(Date.now() + Number(params.get("expires_in") ?? 3600) * 1000),
    mode: "oauth",
  });
  window.history.replaceState({}, "", window.location.pathname + window.location.search);
  return true;
}
