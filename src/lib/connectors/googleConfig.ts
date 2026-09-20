const CLIENT_ID_KEY = "helia-google-client-id-v1";
const PKCE_VERIFIER_KEY = "helia-google-pkce-verifier";

export function getGoogleClientId(): string | undefined {
  if (typeof window !== "undefined") {
    const local = localStorage.getItem(CLIENT_ID_KEY)?.trim();
    if (local) return local;
  }
  const env = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
  return env || undefined;
}

export function setGoogleClientId(id: string | null) {
  if (typeof window === "undefined") return;
  if (!id?.trim()) localStorage.removeItem(CLIENT_ID_KEY);
  else localStorage.setItem(CLIENT_ID_KEY, id.trim());
}

export function savePkceVerifier(verifier: string) {
  sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);
}

export function takePkceVerifier(): string | null {
  const v = sessionStorage.getItem(PKCE_VERIFIER_KEY);
  sessionStorage.removeItem(PKCE_VERIFIER_KEY);
  return v;
}

function base64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = "";
  bytes.forEach((b) => {
    s += String.fromCharCode(b);
  });
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function createPkcePair() {
  const verifierBytes = crypto.getRandomValues(new Uint8Array(32));
  const verifier = base64Url(verifierBytes.buffer);
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier)
  );
  return { verifier, challenge: base64Url(digest) };
}
