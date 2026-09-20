import type { IntegrationId } from "@/lib/types";
import { appleHealthConnector } from "./appleHealth";
import { googleFitConnector } from "./googleFit";
import { gabitConnector, ultrahumanConnector } from "./rings";
import type { HealthConnector } from "./types";
import { getProviderTokens, setProviderTokens } from "./tokenStore";
import type { ConnectorContext } from "./types";

const PRIMARY: HealthConnector[] = [
  googleFitConnector,
  appleHealthConnector,
  gabitConnector,
  ultrahumanConnector,
];

const byId = new Map(PRIMARY.map((c) => [c.id, c]));

export function getConnector(id: IntegrationId): HealthConnector | null {
  return byId.get(id) ?? null;
}

export function listPrimaryConnectors(): HealthConnector[] {
  return PRIMARY;
}

export function makeConnectorContext(hubs: {
  apple_health: boolean;
  google_fit: boolean;
}): (id: IntegrationId) => ConnectorContext {
  return (id) => ({
    hubs,
    getTokens: () => getProviderTokens(id),
    setTokens: (tokens) => setProviderTokens(id, tokens),
  });
}
