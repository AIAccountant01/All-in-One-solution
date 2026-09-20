import type {
  ConnectorContext,
  ConnectResult,
  HealthConnector,
  SyncResult,
} from "./types";
import { demoLiveSyncDays } from "./merge";

function hubBridgeConnector(
  id: "gabit" | "ultrahuman",
  label: string,
  connectHint: string
): HealthConnector {
  return {
    id,
    authMode: "hub_bridge",
    label,
    connectHint,

    async connect(ctx: ConnectorContext): Promise<ConnectResult> {
      if (!ctx.hubs.apple_health && !ctx.hubs.google_fit) {
        return {
          connected: false,
          note: `Connect Apple Health or Google Fit first — ${label} lands in Helia through those hubs until partner OAuth is available.`,
        };
      }
      const via = [
        ctx.hubs.apple_health ? "Apple Health" : null,
        ctx.hubs.google_fit ? "Google Fit" : null,
      ]
        .filter(Boolean)
        .join(" + ");
      ctx.setTokens({
        mode: "hub_bridge",
        via,
        connectedAt: new Date().toISOString(),
      });
      return {
        connected: true,
        accountLabel: `Via ${via}`,
        note: `${label} linked through ${via}. Sync pulls ring-shaped vitals into Today.`,
      };
    },

    async disconnect(ctx) {
      ctx.setTokens(null);
    },

    async sync(ctx): Promise<SyncResult> {
      const tokens = ctx.getTokens();
      if (!tokens) throw new Error(`${label} is not connected`);
      if (!ctx.hubs.apple_health && !ctx.hubs.google_fit) {
        throw new Error("Reconnect Apple Health or Google Fit to sync this ring");
      }
      return {
        source: id,
        syncedAt: new Date().toISOString(),
        days: demoLiveSyncDays(id),
        note: `Synced ${label} via ${tokens.via ?? "health hub"} (partner API pending).`,
      };
    },
  };
}

export const gabitConnector = hubBridgeConnector(
  "gabit",
  "Gabit Ring",
  "Enable Apple Health or Google Fit, then connect Gabit so ring recovery, temp, and sleep flow into Helia."
);

export const ultrahumanConnector = hubBridgeConnector(
  "ultrahuman",
  "Ultrahuman",
  "Enable Apple Health or Google Fit, then connect Ultrahuman for recovery, HRV, and temperature."
);
