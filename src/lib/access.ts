import { env } from "cloudflare:workers";

// Server-side verification of the Cloudflare Access identity JWT.
//
// Cloudflare Access protects /admin/* (and the /api/news mutation endpoints) at
// the edge via a dashboard policy. This verifies the signed assertion at the
// origin too, so a request that reaches the Worker directly — bypassing the edge
// policy — still can't publish or reject. Belt and suspenders for a path that
// can write to the live site.
//
// Config (set as vars/secrets):
//   CF_ACCESS_TEAM_DOMAIN — e.g. "yourteam.cloudflareaccess.com"
//   CF_ACCESS_AUD         — the Access application's Audience (AUD) tag
//
// When unconfigured: deny on production/staging (fail closed), allow on local
// dev so the page is usable without an Access tunnel.

const JWT_HEADER = "Cf-Access-Jwt-Assertion";
const COOKIE = "CF_Authorization";

export type AccessResult =
  | { ok: true; email: string | null }
  | { ok: false; status: number; reason: string };

type Jwk = JsonWebKey & { kid?: string };
let jwksCache: { keys: Jwk[]; fetchedAt: number; domain: string } | null = null;
const JWKS_TTL_MS = 60 * 60 * 1000; // 1h

function b64urlToBytes(input: string): Uint8Array {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function decodeJson(segment: string): Record<string, unknown> {
  return JSON.parse(new TextDecoder().decode(b64urlToBytes(segment)));
}

async function getJwks(teamDomain: string): Promise<Jwk[]> {
  if (jwksCache && jwksCache.domain === teamDomain && Date.now() - jwksCache.fetchedAt < JWKS_TTL_MS) {
    return jwksCache.keys;
  }
  const res = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`);
  if (!res.ok) throw new Error(`JWKS fetch ${res.status}`);
  const data = (await res.json()) as { keys?: Jwk[] };
  const keys = data.keys ?? [];
  jwksCache = { keys, fetchedAt: Date.now(), domain: teamDomain };
  return keys;
}

function readToken(request: Request): string | null {
  const header = request.headers.get(JWT_HEADER);
  if (header) return header.trim();
  const cookie = request.headers.get("cookie");
  if (cookie) {
    const match = new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`).exec(cookie);
    if (match) return decodeURIComponent(match[1]);
  }
  return null;
}

/**
 * Verify the Access JWT on the request. Returns the authenticated email on
 * success. See module docs for the unconfigured-environment behavior.
 */
export async function verifyAccess(request: Request): Promise<AccessResult> {
  const teamDomain = env.CF_ACCESS_TEAM_DOMAIN?.trim();
  const aud = env.CF_ACCESS_AUD?.trim();

  if (!teamDomain || !aud) {
    // Local `astro dev` has no Access in front of it. Detect it via Vite's
    // build-time DEV flag (statically false in the deployed Worker) rather than
    // env.ENVIRONMENT, which the platform proxy injects as "production" even
    // locally. Deployed + unconfigured fails closed.
    if (import.meta.env.DEV) return { ok: true, email: "dev@localhost" };
    return { ok: false, status: 503, reason: "access_not_configured" };
  }

  const token = readToken(request);
  if (!token) return { ok: false, status: 401, reason: "no_token" };

  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false, status: 401, reason: "malformed_token" };
  const [headerB64, payloadB64, sigB64] = parts;

  let header: Record<string, unknown>;
  let payload: Record<string, unknown>;
  try {
    header = decodeJson(headerB64);
    payload = decodeJson(payloadB64);
  } catch {
    return { ok: false, status: 401, reason: "undecodable_token" };
  }

  if (header.alg !== "RS256") return { ok: false, status: 401, reason: "bad_alg" };

  // Issuer + audience + expiry checks.
  const issuer = `https://${teamDomain}`;
  if (payload.iss !== issuer) return { ok: false, status: 401, reason: "bad_issuer" };
  const audClaim = payload.aud;
  const audList = Array.isArray(audClaim) ? audClaim : [audClaim];
  if (!audList.includes(aud)) return { ok: false, status: 401, reason: "bad_audience" };
  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp === "number" && payload.exp < now) {
    return { ok: false, status: 401, reason: "expired" };
  }

  // Signature verification against the matching JWKS key.
  let keys: Jwk[];
  try {
    keys = await getJwks(teamDomain);
  } catch (error) {
    console.error("[access] JWKS fetch failed:", error);
    return { ok: false, status: 503, reason: "jwks_unavailable" };
  }
  const jwk = keys.find((k) => k.kid === header.kid) ?? keys[0];
  if (!jwk) return { ok: false, status: 401, reason: "no_signing_key" };

  let valid = false;
  try {
    const key = await crypto.subtle.importKey(
      "jwk",
      { ...jwk, alg: "RS256", ext: true },
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`) as BufferSource;
    const sig = b64urlToBytes(sigB64) as BufferSource;
    valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, sig, data);
  } catch (error) {
    console.error("[access] signature verify error:", error);
    return { ok: false, status: 401, reason: "verify_error" };
  }
  if (!valid) return { ok: false, status: 401, reason: "bad_signature" };

  const email = typeof payload.email === "string" ? payload.email : null;
  return { ok: true, email };
}
