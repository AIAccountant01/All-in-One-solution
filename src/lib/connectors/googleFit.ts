import type {
  ConnectorContext,
  ConnectResult,
  HealthConnector,
  SyncResult,
} from "./types";
import { demoLiveSyncDays } from "./merge";
import { setProviderTokens, getProviderTokens } from "./tokenStore";
import {
  createPkcePair,
  getGoogleClientId,
  savePkceVerifier,
  takePkceVerifier,
} from "./googleConfig";

const FITNESS_SCOPE =
  "https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.body.read";

async function refreshAccessTokenIfNeeded(): Promise<string | null> {
  const tokens = getProviderTokens("google_fit");
  if (!tokens?.access_token) return null;
  const expiresAt = Number(tokens.expires_at ?? 0);
  if (expiresAt && Date.now() < expiresAt - 60_000) {
    return tokens.access_token;
  }
  if (!tokens.refresh_token) return tokens.access_token;

  const clientId = getGoogleClientId();
  if (!clientId) return tokens.access_token;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      refresh_token: tokens.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) return tokens.access_token;
  const data = (await res.json()) as {
    access_token: string;
    expires_in?: number;
    token_type?: string;
  };
  setProviderTokens("google_fit", {
    ...tokens,
    access_token: data.access_token,
    token_type: data.token_type ?? "Bearer",
    expires_at: String(Date.now() + (data.expires_in ?? 3600) * 1000),
    mode: "oauth",
  });
  return data.access_token;
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
    throw new Error(
      `Google Fit sync failed (${res.status}): ${text.slice(0, 180)}`
    );
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
  connectHint:
    "Sign in with Google (PKCE) to read steps, calories, and active minutes. Paste a Web client ID below if needed.",

  async connect(_ctx: ConnectorContext): Promise<ConnectResult> {
    const id = getGoogleClientId();
    if (!id) {
      return {
        connected: false,
        note: "Add your Google OAuth Web client ID first (Connections → Google setup), then Connect again.",
      };
    }

    const { verifier, challenge } = await createPkcePair();
    savePkceVerifier(verifier);
    const redirectUri = `${window.location.origin}/oauth/google`;
    const params = new URLSearchParams({
      client_id: id,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: FITNESS_SCOPE,
      include_granted_scopes: "true",
      prompt: "consent",
      access_type: "offline",
      state: "google_fit",
      code_challenge: challenge,
      code_challenge_method: "S256",
    });
    return {
      connected: false,
      redirectUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
      note: "Redirecting to Google…",
    };
  },

  async disconnect(ctx) {
    ctx.setTokens(null);
  },

  async sync(ctx): Promise<SyncResult> {
    const tokens = ctx.getTokens();
    if (!tokens) throw new Error("Google Fit is not connected");

    const access =
      (await refreshAccessTokenIfNeeded()) ?? tokens.access_token ?? null;
    if (access) {
      return fetchGoogleFitToday(access);
    }

    return {
      source: "google_fit",
      syncedAt: new Date().toISOString(),
      days: demoLiveSyncDays("google_fit"),
      note: "No Google access token — reconnect Google Fit after adding a client ID.",
    };
  },
};

/** Handle both auth-code (?code=) and legacy hash token returns. */
export async function completeGoogleOAuthReturn(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const hash = window.location.hash.replace(/^#/, "");
  if (hash.includes("access_token")) {
    const params = new URLSearchParams(hash);
    const access = params.get("access_token");
    const state = params.get("state");
    if (access && state === "google_fit") {
      setProviderTokens("google_fit", {
        access_token: access,
        token_type: params.get("token_type") ?? "Bearer",
        expires_at: String(
          Date.now() + Number(params.get("expires_in") ?? 3600) * 1000
        ),
        mode: "oauth",
      });
      window.history.replaceState(
        {},
        "",
        window.location.pathname + window.location.search
      );
      return true;
    }
  }

  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const state = params.get("state");
  const err = params.get("error");
  if (err) return false;
  if (!code || state !== "google_fit") return false;

  const clientId = getGoogleClientId();
  const verifier = takePkceVerifier();
  if (!clientId || !verifier) return false;

  const redirectUri = `${window.location.origin}/oauth/google`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      code,
      code_verifier: verifier,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) return false;
  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
  };
  setProviderTokens("google_fit", {
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? "",
    token_type: data.token_type ?? "Bearer",
    expires_at: String(Date.now() + (data.expires_in ?? 3600) * 1000),
    mode: "oauth",
  });
  window.history.replaceState({}, "", window.location.pathname);
  return true;
}
