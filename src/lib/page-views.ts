import { env } from "cloudflare:workers";

import { cfFields, classifyUserAgent, visitorHash } from "./visitor";

// First-party page views (D1 ANALYTICS_DB, schema in
// migrations/0003_page_views.sql), sent by the beacon in SiteAnalytics.astro.
// Replaces Google Analytics: no cookies, no raw IPs. Every query binds its
// values; nothing from the request is interpolated into SQL.

export interface PageViewInput {
  path: string;
  /** Host of document.referrer, or "" when there's none. */
  referrer: string;
}

const PATH_PATTERN = /^\/[A-Za-z0-9\-._~/%]{0,299}$/;
const HOST_PATTERN = /^[a-z0-9.-]{1,253}$/i;

export function parsePageView(raw: unknown): PageViewInput | null {
  if (!raw || typeof raw !== "object") return null;
  const b = raw as Record<string, unknown>;
  if (typeof b.path !== "string" || !PATH_PATTERN.test(b.path)) return null;
  // Our own tools and endpoints aren't audience traffic.
  if (b.path.startsWith("/admin") || b.path.startsWith("/api/")) return null;
  const referrer = typeof b.referrer === "string" ? b.referrer.toLowerCase() : "";
  return { path: b.path, referrer: HOST_PATTERN.test(referrer) ? referrer : "" };
}

function db(): D1Database {
  const handle = env.ANALYTICS_DB;
  if (!handle) throw new Error("ANALYTICS_DB binding is not configured");
  return handle;
}

export async function recordPageView(
  view: PageViewInput,
  ctx: { envName: string; host: string; ip: string; ua: string; cf: IncomingRequestCfProperties | undefined },
): Promise<void> {
  const ts = new Date().toISOString();
  const day = ts.slice(0, 10);
  const ua = classifyUserAgent(ctx.ua);
  const geo = cfFields(ctx.cf);
  const internal = view.referrer === ctx.host.toLowerCase();
  const visitor = await visitorHash(db(), "analytics_salts", day, ctx.ip, ctx.ua);
  await db()
    .prepare(
      `INSERT INTO page_views
         (ts, day, env, path, visitor, entry, referrer,
          country, region, city, asn, as_org, device, browser, os)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      ts,
      day,
      ctx.envName,
      view.path,
      visitor,
      internal ? 0 : 1,
      internal || !view.referrer ? null : view.referrer,
      geo.country,
      geo.region,
      geo.city,
      geo.asn,
      geo.asOrg,
      ua.device,
      ua.browser,
      ua.os,
    )
    .run();
}

// ── Report (/admin/traffic) ─────────────────────────────────────────────

export interface CountRow {
  key: string;
  views: number;
  visitors: number;
}

export interface VisitorSummary {
  days: number;
  pageViews: number;
  /** Page views that arrived from outside the site (an entrance). */
  visits: number;
  /** Sum of each day's distinct visitors; a returning visitor counts once per day. */
  dailyVisitors: number;
  daily: { day: string; views: number; visitors: number; visits: number }[];
  topPages: CountRow[];
  referrers: CountRow[];
  countries: CountRow[];
  networks: CountRow[];
  devices: CountRow[];
}

/** The last `days` UTC days, today included (today is partial). */
export async function loadVisitorSummary(envName: string, days: number): Promise<VisitorSummary> {
  const d = db();
  const since = new Date(Date.now() - (days - 1) * 86_400_000).toISOString().slice(0, 10);
  const where = "env = ?1 AND day >= ?2";
  const counts = "COUNT(*) AS views, COUNT(DISTINCT day || visitor) AS visitors";
  const top = (col: "path" | "referrer" | "country" | "as_org" | "device", limit: number, extra = "") =>
    d
      .prepare(
        `SELECT COALESCE(${col}, '(unknown)') AS key, ${counts}
           FROM page_views WHERE ${where} ${extra}
          GROUP BY key ORDER BY visitors DESC, views DESC LIMIT ${limit}`,
      )
      .bind(envName, since);

  const results = await d.batch([
    d.prepare(`SELECT ${counts}, SUM(entry) AS visits FROM page_views WHERE ${where}`).bind(envName, since),
    d
      .prepare(
        `SELECT day, COUNT(*) AS views, COUNT(DISTINCT visitor) AS visitors, SUM(entry) AS visits
           FROM page_views WHERE ${where} GROUP BY day ORDER BY day`,
      )
      .bind(envName, since),
    top("path", 25),
    top("referrer", 20, "AND referrer IS NOT NULL"),
    top("country", 20),
    top("as_org", 30),
    top("device", 5),
  ]);

  const totals = (results[0].results[0] ?? {}) as { views?: number; visitors?: number; visits?: number };
  const rows = (i: number): CountRow[] =>
    (results[i].results as CountRow[]).map((r) => ({
      key: String(r.key),
      views: Number(r.views ?? 0),
      visitors: Number(r.visitors ?? 0),
    }));
  return {
    days,
    pageViews: Number(totals.views ?? 0),
    visits: Number(totals.visits ?? 0),
    dailyVisitors: Number(totals.visitors ?? 0),
    daily: (results[1].results as VisitorSummary["daily"]).map((r) => ({
      day: String(r.day),
      views: Number(r.views ?? 0),
      visitors: Number(r.visitors ?? 0),
      visits: Number(r.visits ?? 0),
    })),
    topPages: rows(2),
    referrers: rows(3),
    countries: rows(4),
    networks: rows(5),
    devices: rows(6),
  };
}
