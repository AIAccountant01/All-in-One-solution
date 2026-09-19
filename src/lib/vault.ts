/**
 * Helia local vault — PIN-gated AES-GCM encryption for health data at rest.
 * Key is derived with PBKDF2 and held only in memory while unlocked.
 */

const VAULT_META_KEY = "helia-vault-meta-v1";
const VAULT_BLOB_KEY = "helia-vault-blob-v1";
const LEGACY_PLAIN_KEYS = ["helia-health-v2", "helia-health-v1"];

export type VaultMeta = {
  salt: string; // base64
  iterations: number;
  verifier: string; // base64 AES ciphertext of known plaintext
  lockMinutes: number;
};

let sessionKey: CryptoKey | null = null;
let unlockTimer: ReturnType<typeof setTimeout> | null = null;

function b64encode(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  bytes.forEach((b) => {
    s += String.fromCharCode(b);
  });
  return btoa(s);
}

function b64decode(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function deriveKey(
  pin: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number
) {
  const enc = new TextEncoder();
  const base = await crypto.subtle.importKey(
    "raw",
    enc.encode(pin),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations,
      hash: "SHA-256",
    },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptString(key: CryptoKey, plaintext: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext)
  );
  return `${b64encode(iv)}.${b64encode(cipher)}`;
}

async function decryptString(key: CryptoKey, payload: string) {
  const [ivB64, dataB64] = payload.split(".");
  if (!ivB64 || !dataB64) throw new Error("Corrupt vault payload");
  const iv = b64decode(ivB64);
  const data = b64decode(dataB64);
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    data as BufferSource
  );
  return new TextDecoder().decode(plain);
}

export function readVaultMeta(): VaultMeta | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(VAULT_META_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as VaultMeta;
  } catch {
    return null;
  }
}

export function isVaultConfigured(): boolean {
  return Boolean(readVaultMeta());
}

export function isVaultUnlocked(): boolean {
  return sessionKey !== null;
}

function scheduleAutoLock(minutes: number) {
  if (unlockTimer) clearTimeout(unlockTimer);
  if (minutes <= 0) return;
  unlockTimer = setTimeout(() => {
    lockVault();
    window.dispatchEvent(new CustomEvent("helia:vault-locked"));
  }, minutes * 60 * 1000);
}

export function touchVaultActivity() {
  const meta = readVaultMeta();
  if (meta && sessionKey) scheduleAutoLock(meta.lockMinutes);
}

export function lockVault() {
  sessionKey = null;
  if (unlockTimer) clearTimeout(unlockTimer);
  unlockTimer = null;
}

export async function setupVault(pin: string, lockMinutes = 15) {
  if (pin.length < 4) throw new Error("PIN must be at least 4 digits");
  const iterations = 210_000;
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(pin, salt, iterations);
  const verifier = await encryptString(key, "helia-ok");
  const meta: VaultMeta = {
    salt: b64encode(salt),
    iterations,
    verifier,
    lockMinutes,
  };
  localStorage.setItem(VAULT_META_KEY, JSON.stringify(meta));

  // Migrate any legacy plaintext state into the vault (only remove after save succeeds)
  let initial: unknown = null;
  let legacyKey: string | null = null;
  for (const k of LEGACY_PLAIN_KEYS) {
    const legacy = localStorage.getItem(k);
    if (legacy) {
      try {
        initial = JSON.parse(legacy);
        legacyKey = k;
      } catch {
        initial = null;
        legacyKey = null;
      }
      break;
    }
  }
  sessionKey = key;
  await saveEncryptedState(initial);
  if (legacyKey) localStorage.removeItem(legacyKey);
  scheduleAutoLock(lockMinutes);
  return true;
}

export async function unlockVault(pin: string) {
  const meta = readVaultMeta();
  if (!meta) throw new Error("Vault not set up");
  const key = await deriveKey(pin, b64decode(meta.salt), meta.iterations);
  try {
    const check = await decryptString(key, meta.verifier);
    if (check !== "helia-ok") throw new Error("Bad PIN");
  } catch {
    throw new Error("Incorrect PIN");
  }
  sessionKey = key;
  scheduleAutoLock(meta.lockMinutes);
  return true;
}

export async function loadEncryptedState<T>(): Promise<T | null> {
  if (!sessionKey) throw new Error("Vault locked");
  const blob = localStorage.getItem(VAULT_BLOB_KEY);
  if (!blob) return null;
  const json = await decryptString(sessionKey, blob);
  return JSON.parse(json) as T;
}

export async function saveEncryptedState(state: unknown) {
  if (!sessionKey) throw new Error("Vault locked");
  if (state == null) {
    localStorage.removeItem(VAULT_BLOB_KEY);
    return;
  }
  const payload = await encryptString(sessionKey, JSON.stringify(state));
  localStorage.setItem(VAULT_BLOB_KEY, payload);
  touchVaultActivity();
}

export function wipeVault() {
  lockVault();
  localStorage.removeItem(VAULT_META_KEY);
  localStorage.removeItem(VAULT_BLOB_KEY);
  for (const k of LEGACY_PLAIN_KEYS) localStorage.removeItem(k);
}
