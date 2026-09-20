/** Encrypted-alongside vault meta: OAuth tokens & import markers (never plaintext health). */

const TOKEN_BAG_KEY = "helia-connector-tokens-v1";

export type ConnectorTokenBag = Record<string, Record<string, string>>;

export function readConnectorTokens(): ConnectorTokenBag {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(TOKEN_BAG_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as ConnectorTokenBag;
  } catch {
    return {};
  }
}

export function writeConnectorTokens(bag: ConnectorTokenBag) {
  localStorage.setItem(TOKEN_BAG_KEY, JSON.stringify(bag));
}

export function getProviderTokens(id: string): Record<string, string> | null {
  const bag = readConnectorTokens();
  return bag[id] ?? null;
}

export function setProviderTokens(
  id: string,
  tokens: Record<string, string> | null
) {
  const bag = readConnectorTokens();
  if (!tokens || Object.keys(tokens).length === 0) {
    delete bag[id];
  } else {
    bag[id] = tokens;
  }
  writeConnectorTokens(bag);
}

export function wipeConnectorTokens() {
  localStorage.removeItem(TOKEN_BAG_KEY);
}
