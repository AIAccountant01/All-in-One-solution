import type { DayMetrics, FoodEntry, IntegrationId } from "@/lib/types";

export type ConnectorAuthMode =
  | "oauth"
  | "health_import"
  | "hub_bridge"
  | "manual";

export type SyncDayPatch = Partial<
  Omit<DayMetrics, "date" | "lastMovementAt">
> & {
  date: string;
  lastMovementAt?: string;
};

export type SyncResult = {
  source: IntegrationId;
  syncedAt: string;
  days: SyncDayPatch[];
  foods?: Omit<FoodEntry, "id">[];
  note?: string;
};

export type ConnectResult = {
  connected: boolean;
  accountLabel?: string;
  note?: string;
  /** OAuth redirect URL — caller should navigate */
  redirectUrl?: string;
};

export type ConnectorContext = {
  /** Other integrations' connected flags (for hub bridges) */
  hubs: {
    apple_health: boolean;
    google_fit: boolean;
  };
  /** Encrypted-at-rest token bag (provider-specific) */
  getTokens: () => Record<string, string> | null;
  setTokens: (tokens: Record<string, string> | null) => void;
};

export type HealthConnector = {
  id: IntegrationId;
  authMode: ConnectorAuthMode;
  label: string;
  /** Short how-to shown on the card */
  connectHint: string;
  connect: (ctx: ConnectorContext) => Promise<ConnectResult>;
  disconnect: (ctx: ConnectorContext) => Promise<void>;
  sync: (ctx: ConnectorContext) => Promise<SyncResult>;
};
