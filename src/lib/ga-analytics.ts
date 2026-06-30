import { env } from "cloudflare:workers";

// Server-side read of Google Analytics 4 via the Data API (runReport). Powers
// the GA panel on /admin/traffic, alongside the Cloudflare zone numbers, so the
// two can be read side by side. They measure different things on purpose:
// Cloudflare counts every edge request (assets, bots, automated DLP-test
// traffic); GA counts only visitors who ran the analytics tag and consented, so
// it sits well below the Cloudflare request counts.
//
// Auth mirrors the JWT pattern in lib/access.ts, but signs instead of verifying:
// we mint a short-lived RS256 assertion with the service-account key, exchange
// it for an OAuth access token, and call the Data API. All via Web Crypto — no
// Node-only google-auth libraries.
//
// Config (all set via `wrangler secret put`):
//   GA4_PROPERTY_ID     — the numeric GA4 property id (not the G-XXXX id)
//   GA_SA_CLIENT_EMAIL  — service-account email (Viewer on the GA4 property)
//   GA_SA_PRIVATE_KEY   — service-account private key (PKCS8 PEM)

const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GA_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const DATA_API = "https://analyticsdata.googleapis.com/v1beta";

export class GaConfigError extends Error {}

export interface GaSummary {
  days: number;
  startDate: string;
  endDate: string;
  pageViews: number;
  totalUsers: number;
  newUsers: number;
  sessions: number;
  topPages: { path: string; views: number }[];
  topEvents: { name: string; count: number }[];
}

function bytesToB64url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function strToB64url(s: string): string {
  return bytesToB64url(new TextEncoder().encode(s));
}
function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// Import a service-account PKCS8 PEM for RS256 signing. The key from the
// service-account JSON often carries literal `\n` escapes; normalize those back
// to real newlines before stripping the PEM armor.
async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const normalized = pem.includes("\\n") ? pem.replace(/\\n/g, "\n") : pem;
  const body = normalized
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const der = b64ToBytes(body);
  return crypto.subtle.importKey(
    "pkcs8",
    der as BufferSource,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

// Access tokens are good for ~1h; cache in module scope so a burst of page loads
// reuses one token instead of re-signing + re-exchanging each time.
let tokenCache: { token: string; exp: number } | null = null;

async function getAccessToken(clientEmail: string, privateKeyPem: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (tokenCache && tokenCache.exp - 60 > now) return tokenCache.token;

  const header = strToB64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = strToB64url(
    JSON.stringify({
      iss: clientEmail,
      scope: GA_SCOPE,
      aud: TOKEN_ENDPOINT,
      iat: now,
      exp: now + 3600,
    }),
  );
  const unsigned = `${header}.${claim}`;
  const key = await importPrivateKey(privateKeyPem);
  const sigBuf = await crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5" },
    key,
    new TextEncoder().encode(unsigned) as BufferSource,
  );
  const jwt = `${unsigned}.${bytesToB64url(new Uint8Array(sigBuf))}`;

  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google token exchange ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) throw new Error("Google token exchange returned no access_token");
  tokenCache = { token: data.access_token, exp: now + (data.expires_in ?? 3600) };
  return data.access_token;
}

interface GaRow {
  dimensionValues?: { value: string }[];
  metricValues?: { value: string }[];
}
interface BatchResponse {
  reports?: { rows?: GaRow[] }[];
}

/**
 * Fetch a GA4 summary over a window matching the dashboard's hour window
 * (rounded to whole days, min 1). Throws {@link GaConfigError} when the
 * service-account secrets aren't configured so the page can render a friendly
 * "not set up" state instead of a 500.
 */
export async function fetchGaSummary(windowHours = 24): Promise<GaSummary> {
  const propertyId = env.GA4_PROPERTY_ID?.trim();
  const clientEmail = env.GA_SA_CLIENT_EMAIL?.trim();
  const privateKey = env.GA_SA_PRIVATE_KEY?.trim();
  if (!propertyId || !clientEmail || !privateKey) {
    throw new GaConfigError(
      "GA4_PROPERTY_ID, GA_SA_CLIENT_EMAIL and/or GA_SA_PRIVATE_KEY are not set. " +
        "Set them via `wrangler secret put`.",
    );
  }

  // GA reports in whole days; map the dashboard's hour window onto a day range.
  const days = Math.max(1, Math.round(windowHours / 24));
  const startDate = `${days}daysAgo`;
  const endDate = "today";
  const dateRanges = [{ startDate, endDate }];

  const token = await getAccessToken(clientEmail, privateKey);

  // One round-trip: totals + top pages + top events via batchRunReports.
  const body = {
    requests: [
      {
        dateRanges,
        metrics: [
          { name: "screenPageViews" },
          { name: "totalUsers" },
          { name: "newUsers" },
          { name: "sessions" },
        ],
      },
      {
        dateRanges,
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 15,
      },
      {
        dateRanges,
        dimensions: [{ name: "eventName" }],
        metrics: [{ name: "eventCount" }],
        orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
        limit: 15,
      },
    ],
  };

  const res = await fetch(`${DATA_API}/properties/${propertyId}:batchRunReports`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GA Data API ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as BatchResponse;
  const [totals, pages, events] = data.reports ?? [];

  const num = (s?: string) => Number(s ?? 0) || 0;
  const t = totals?.rows?.[0]?.metricValues ?? [];

  return {
    days,
    startDate,
    endDate,
    pageViews: num(t[0]?.value),
    totalUsers: num(t[1]?.value),
    newUsers: num(t[2]?.value),
    sessions: num(t[3]?.value),
    topPages: (pages?.rows ?? []).map((r) => ({
      path: r.dimensionValues?.[0]?.value ?? "",
      views: num(r.metricValues?.[0]?.value),
    })),
    topEvents: (events?.rows ?? []).map((r) => ({
      name: r.dimensionValues?.[0]?.value ?? "",
      count: num(r.metricValues?.[0]?.value),
    })),
  };
}
