import { env } from "cloudflare:workers";

// Server-side read of Cloudflare's zone HTTP analytics (the GraphQL Analytics
// API). Powers the /admin/traffic dashboard so we can answer "how much traffic
// are we getting, and is something hammering us?" without opening the Cloudflare
// dashboard. This is the only place that sees per-IP / per-user-agent data:
// those dimensions live in zone-level analytics, not the Worker invocation
// metrics, and a runaway client that hits a cached/edge path (e.g. POST / → 405)
// never reaches the Worker at all, so Worker logs can't see it.
//
// Config (set as a var + secret):
//   CF_ZONE_ID         — the dlptest.com zone tag (var; zone IDs aren't secret)
//   CF_ANALYTICS_TOKEN — API token with Zone → Analytics → Read (secret)

const GRAPHQL_ENDPOINT = "https://api.cloudflare.com/client/v4/graphql";

export type Row<T> = { count: number; dimensions: T };

export interface TrafficSummary {
  windowHours: number;
  host: string;
  start: string;
  end: string;
  totalRequests: number;
  totalBytes: number;
  byPath: Row<{ clientRequestPath: string }>[];
  byIP: Row<{ clientIP: string; clientAsn: string; clientCountryName: string }>[];
  byUserAgent: Row<{ userAgent: string }>[];
  byStatus: Row<{ edgeResponseStatus: number }>[];
  byCountry: Row<{ clientCountryName: string }>[];
  hourly: Row<{ datetimeHour: string }>[];
}

export class AnalyticsConfigError extends Error {}

// One round-trip: alias several httpRequestsAdaptiveGroups selections under the
// same zone so the page costs a single subrequest instead of six.
//
// dlptest.com and staging.dlptest.com share a single Cloudflare zone, so a
// zoneTag-only query returns the whole zone's traffic (prod + staging combined).
// We scope every selection to $host (clientRequestHTTPHost) so each environment's
// dashboard only reflects its own hostname.
const QUERY = `
query($zone: String!, $start: Time!, $end: Time!, $host: String!) {
  viewer {
    zones(filter: { zoneTag: $zone }) {
      total: httpRequestsAdaptiveGroups(limit: 1, filter: { datetime_geq: $start, datetime_leq: $end, clientRequestHTTPHost: $host }) {
        count
        sum { edgeResponseBytes }
      }
      byPath: httpRequestsAdaptiveGroups(limit: 15, filter: { datetime_geq: $start, datetime_leq: $end, clientRequestHTTPHost: $host }, orderBy: [count_DESC]) {
        count
        dimensions { clientRequestPath }
      }
      byIP: httpRequestsAdaptiveGroups(limit: 15, filter: { datetime_geq: $start, datetime_leq: $end, clientRequestHTTPHost: $host }, orderBy: [count_DESC]) {
        count
        dimensions { clientIP clientAsn clientCountryName }
      }
      byUserAgent: httpRequestsAdaptiveGroups(limit: 15, filter: { datetime_geq: $start, datetime_leq: $end, clientRequestHTTPHost: $host }, orderBy: [count_DESC]) {
        count
        dimensions { userAgent }
      }
      byStatus: httpRequestsAdaptiveGroups(limit: 15, filter: { datetime_geq: $start, datetime_leq: $end, clientRequestHTTPHost: $host }, orderBy: [count_DESC]) {
        count
        dimensions { edgeResponseStatus }
      }
      byCountry: httpRequestsAdaptiveGroups(limit: 10, filter: { datetime_geq: $start, datetime_leq: $end, clientRequestHTTPHost: $host }, orderBy: [count_DESC]) {
        count
        dimensions { clientCountryName }
      }
      hourly: httpRequestsAdaptiveGroups(limit: 168, filter: { datetime_geq: $start, datetime_leq: $end, clientRequestHTTPHost: $host }, orderBy: [datetimeHour_ASC]) {
        count
        dimensions { datetimeHour }
      }
    }
  }
}`;

interface ZoneResult {
  total: { count: number; sum: { edgeResponseBytes: number } }[];
  byPath: TrafficSummary["byPath"];
  byIP: TrafficSummary["byIP"];
  byUserAgent: TrafficSummary["byUserAgent"];
  byStatus: TrafficSummary["byStatus"];
  byCountry: TrafficSummary["byCountry"];
  hourly: TrafficSummary["hourly"];
}

/**
 * Fetch a traffic summary for `host` within the zone over the last `windowHours`.
 * `host` scopes results to a single hostname (e.g. "dlptest.com" vs
 * "staging.dlptest.com") since both share one Cloudflare zone.
 * Throws {@link AnalyticsConfigError} when the token/zone aren't configured so
 * the page can render a friendly "not set up" state instead of a 500.
 */
export async function fetchTrafficSummary(windowHours = 24, host: string): Promise<TrafficSummary> {
  const zone = env.CF_ZONE_ID?.trim();
  const token = env.CF_ANALYTICS_TOKEN?.trim();
  if (!zone || !token) {
    throw new AnalyticsConfigError(
      "CF_ZONE_ID and/or CF_ANALYTICS_TOKEN are not set. " +
        "Add CF_ZONE_ID to wrangler.jsonc vars and run `wrangler secret put CF_ANALYTICS_TOKEN`.",
    );
  }

  const end = new Date();
  const start = new Date(end.getTime() - windowHours * 3600_000);
  const iso = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, "Z");

  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: QUERY,
      variables: { zone, start: iso(start), end: iso(end), host },
    }),
  });

  if (!res.ok) {
    throw new Error(`Cloudflare GraphQL HTTP ${res.status}`);
  }

  const body = (await res.json()) as {
    data?: { viewer?: { zones?: ZoneResult[] } };
    errors?: { message: string }[] | null;
  };

  if (body.errors && body.errors.length > 0) {
    throw new Error(`Cloudflare GraphQL: ${body.errors.map((e) => e.message).join("; ")}`);
  }

  const z = body.data?.viewer?.zones?.[0];
  if (!z) {
    throw new Error("Cloudflare GraphQL returned no zone — check CF_ZONE_ID and token zone scope.");
  }

  return {
    windowHours,
    host,
    start: iso(start),
    end: iso(end),
    totalRequests: z.total[0]?.count ?? 0,
    totalBytes: z.total[0]?.sum.edgeResponseBytes ?? 0,
    byPath: z.byPath ?? [],
    byIP: z.byIP ?? [],
    byUserAgent: z.byUserAgent ?? [],
    byStatus: z.byStatus ?? [],
    byCountry: z.byCountry ?? [],
    hourly: z.hourly ?? [],
  };
}
