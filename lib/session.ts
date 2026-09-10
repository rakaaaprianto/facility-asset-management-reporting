export type SessionPayload = {
  uid: string;
  role: string;
  iat?: number;
  exp: number;
};

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("FATAL: SESSION_SECRET or NEXTAUTH_SECRET environment variable is required in production mode.");
    }
    return "dev-only-insecure-secret-change-me";
  }
  if (process.env.NODE_ENV === "production" && secret === "dev-only-insecure-secret-change-me") {
    throw new Error("FATAL: Insecure development secret cannot be used in production.");
  }
  return secret;
}

const SECRET = getSessionSecret();
export const SESSION_COOKIE = "amrs_session";
export const MAX_AGE_SECONDS = 60 * 60 * 24; // 24 hours absolute enterprise limit

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlToBytes(str: string): Uint8Array {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function stringToBufferSource(str: string): BufferSource {
  return new TextEncoder().encode(str) as unknown as BufferSource;
}

function bytesToString(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

async function getKey(): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    "raw",
    stringToBufferSource(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function createSessionToken(uid: string, role: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    uid,
    role,
    iat: now,
    exp: now + MAX_AGE_SECONDS,
  };
  const body = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const key = await getKey();
  const signatureBytes = await crypto.subtle.sign("HMAC", key, stringToBufferSource(body));
  const sig = bytesToBase64Url(new Uint8Array(signatureBytes));
  return `${body}.${sig}`;
}

export async function verifySessionToken(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  try {
    const key = await getKey();
    const sigBytes = base64UrlToBytes(sig);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes as unknown as BufferSource,
      stringToBufferSource(body)
    );
    if (!valid) return null;

    const payloadJson = bytesToString(base64UrlToBytes(body));
    const payload = JSON.parse(payloadJson) as SessionPayload;
    if (!payload.uid || typeof payload.exp !== "number") return null;
    if (payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE_SECONDS,
};
