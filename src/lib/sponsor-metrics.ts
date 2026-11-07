import { env } from "cloudflare:workers";

import { SPONSOR, SPONSOR_ADS, type SponsorAdUnit } from "./sponsor-ad";

// First-party, cookieless measurement for sponsored ad units (D1 SPONSOR_DB,
// schema in migrations/0002_sponsor_events.sql). The browser sends a beacon on
// a viewable impression or a click; the Worker adds what Cloudflare already
// knows about the request (country/region/city, network ASN + owner) and the
// device class from the user agent. Nothing is written to the visitor's
// browser and no raw IP is stored. Every query binds its values; the only
// interpolated SQL is a column name from a fixed allowlist.

export type SponsorEventType = "impression" | "click";

export interface SponsorEventInput {
  type: SponsorEventType;
  unit: SponsorAdUnit;
  page: string;
  /** Host of document.referrer, or "" for direct visits. */
  referrer: string;
}

const PAGE_PATTERN = /^\/[A-Za-z0-9\-._~/]{0,199}$/;
const HOST_PATTERN = /^[a-z0-9.-]{0,253}$/i;

/**
 * Validate a beacon body. Only the current sponsor and campaign are accepted,
 * so a forged request can't invent sponsors or campaigns in the report.
 */
export function parseSponsorEvent(raw: unknown): SponsorEventInput | null {
  if (!raw || typeof raw !== "object") return null;
  const b = raw as Record<string, unknown>;
  if (b.type !== "impression" && b.type !== "click") return null;
  if (b.sponsor !== SPONSOR.id || b.campaign !== SPONSOR.campaign) return null;
  if (typeof b.unit !== "string" || !Object.hasOwn(SPONSOR_ADS, b.unit)) return null;
  if (typeof b.page !== "string" || !PAGE_PATTERN.test(b.page)) return null;
  const referrer = typeof b.referrer === "string" ? b.referrer.toLowerCase() : "";
  return {
    type: b.type,
    unit: b.unit as SponsorAdUnit,
    page: b.page,
    referrer: HOST_PATTERN.test(referrer) ? referrer : "",
  };
}

// Crawlers, link unfurlers, uptime checks, headless browsers and HTTP
// libraries. Rendering bots (Googlebot, Lighthouse) run the page's JS, so
// without this they'd count as impressions.
const BOT_UA =
  /bot\b|bot\/|crawl|spider|slurp|facebookexternalhit|embedly|preview|headless|lighthouse|pagespeed|gtmetrix|pingdom|uptime|monitor|python|curl|wget|httpclient|java\/|go-http|okhttp|node-fetch|axios|phantom|selenium|puppeteer|playwright|scrapy/i;

export interface UserAgentInfo {
  bot: boolean;
  device: "desktop" | "mobile" | "tablet";
  browser: string;
  os: string;
}

export function classifyUserAgent(ua: string): UserAgentInfo {
  const device = /iPad|Tablet|Android(?!.*Mobile)/i.test(ua)
    ? "tablet"
    : /Mobi|iPhone|iPod|Android/i.test(ua)
      ? "mobile"
      : "desktop";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\/|Opera/.test(ua)
      ? "Opera"
      : /Firefox\/|FxiOS/.test(ua)
        ? "Firefox"
        : /SamsungBrowser/.test(ua)
          ? "Samsung Internet"
          : /CriOS|Chrome\//.test(ua)
            ? "Chrome"
            : /Safari\//.test(ua)
              ? "Safari"
              : "Other";
  const os = /Windows NT/.test(ua)
    ? "Windows"
    : /iPhone|iPad|iPod/.test(ua)
      ? "iOS"
      : /Mac OS X|Macintosh/.test(ua)
        ? "macOS"
        : /Android/.test(ua)
          ? "Android"
          : /CrOS/.test(ua)
            ? "ChromeOS"
            : /Linux/.test(ua)
              ? "Linux"
              : "Other";
  return { bot: !ua || BOT_UA.test(ua), device, browser, os };
}

function db(): D1Database {
  const handle = env.SPONSOR_DB;
  if (!handle) throw new Error("SPONSOR_DB binding is not configured");
  return handle;
}

let saltCache: { day: string; salt: string } | null = null;

/**
 * Today's salt, shared by every Worker isolate through D1. The first request
 * of a UTC day creates it and deletes older salts, which is what makes earlier
 * visitor hashes unlinkable.
 */
async function dailySalt(day: string): Promise<string> {
  if (saltCache?.day === day) return saltCache.salt;
  const d = db();
  const fresh = `${crypto.randomUUID()}${crypto.randomUUID()}`;
  const results = await d.batch<{ salt: string }>([
    d.prepare("INSERT OR IGNORE INTO sponsor_salts (day, salt) VALUES (?, ?)").bind(day, fresh),
    d.prepare("DELETE FROM sponsor_salts WHERE day < ?").bind(day),
    d.prepare("SELECT salt FROM sponsor_salts WHERE day = ?").bind(day),
  ]);
  const salt = results[2]?.results?.[0]?.salt ?? fresh;
  saltCache = { day, salt };
  return salt;
}

async function visitorHash(day: string, ip: string, ua: string): Promise<string> {
  const salt = await dailySalt(day);
  const bytes = new TextEncoder().encode(`${salt}|${ip}|${ua}`);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return Array.from(digest.slice(0, 8), (b) => b.toString(16).padStart(2, "0")).join("");
}

export interface RequestContext {
  envName: string;
  ip: string;
  ua: string;
  cf: IncomingRequestCfProperties | undefined;
}

export async function recordSponsorEvent(event: SponsorEventInput, ctx: RequestContext): Promise<void> {
  const now = new Date();
  const ts = now.toISOString();
  const day = ts.slice(0, 10);
  const ua = classifyUserAgent(ctx.ua);
  const visitor = await visitorHash(day, ctx.ip, ctx.ua);
  const cf = ctx.cf;
  await db()
    .prepare(
      `INSERT INTO sponsor_events
         (ts, day, env, sponsor, campaign, type, unit, page, visitor,
          country, region, city, asn, as_org, device, browser, os, referrer)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      ts,
      day,
      ctx.envName,
      SPONSOR.id,
      SPONSOR.campaign,
      event.type,
      event.unit,
      event.page,
      visitor,
      str(cf?.country),
      str(cf?.region),
      str(cf?.city),
      typeof cf?.asn === "number" ? cf.asn : null,
      str(cf?.asOrganization),
      ua.device,
      ua.browser,
      ua.os,
      event.referrer || null,
    )
    .run();
}

function str(v: unknown): string | null {
  return typeof v === "string" && v ? v.slice(0, 200) : null;
}

// ── Report ──────────────────────────────────────────────────────────────

export interface BreakdownRow {
  key: string;
  impressions: number;
  clicks: number;
}

export interface ClickRow {
  ts: string;
  page: string;
  unit: string;
  country: string | null;
  region: string | null;
  city: string | null;
  as_org: string | null;
  asn: number | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  referrer: string | null;
}

export interface SponsorReport {
  impressions: number;
  clicks: number;
  /** Sum of each day's distinct visitors (hashes only link within a day). */
  dailyUniqueViewers: number;
  dailyUniqueClickers: number;
  firstDay: string | null;
  lastDay: string | null;
  daily: { day: string; impressions: number; clicks: number }[];
  byCampaign: BreakdownRow[];
  byUnit: BreakdownRow[];
  byPage: BreakdownRow[];
  byNetwork: BreakdownRow[];
  byCountry: BreakdownRow[];
  byDevice: BreakdownRow[];
  byOs: BreakdownRow[];
  byBrowser: BreakdownRow[];
  byReferrer: BreakdownRow[];
  recentClicks: ClickRow[];
}

// Columns a breakdown may group by. Interpolated into SQL, so never extend
// this from user input.
const BREAKDOWN_COLUMNS = {
  campaign: "campaign",
  unit: "unit",
  page: "page",
  network: "as_org",
  country: "country",
  device: "device",
  os: "os",
  browser: "browser",
  referrer: "referrer",
} as const;

/** Report for one sponsor in one environment, optionally from `sinceDay`. */
export async function loadSponsorReport(opts: {
  envName: string;
  sponsor: string;
  sinceDay: string | null;
}): Promise<SponsorReport> {
  const d = db();
  const where = "env = ?1 AND sponsor = ?2 AND (?3 IS NULL OR day >= ?3)";
  const args = [opts.envName, opts.sponsor, opts.sinceDay];
  const counts = "SUM(type = 'impression') AS impressions, SUM(type = 'click') AS clicks";
  const breakdown = (col: string, limit: number) =>
    d
      .prepare(
        `SELECT COALESCE(${col}, '(unknown)') AS key, ${counts}
           FROM sponsor_events WHERE ${where}
          GROUP BY key ORDER BY clicks DESC, impressions DESC LIMIT ${limit}`,
      )
      .bind(...args);

  const results = await d.batch([
    d
      .prepare(
        `SELECT ${counts},
                COUNT(DISTINCT CASE WHEN type = 'impression' THEN day || visitor END) AS uv,
                COUNT(DISTINCT CASE WHEN type = 'click' THEN day || visitor END) AS uc,
                MIN(day) AS first_day, MAX(day) AS last_day
           FROM sponsor_events WHERE ${where}`,
      )
      .bind(...args),
    d
      .prepare(`SELECT day AS key, ${counts} FROM sponsor_events WHERE ${where} GROUP BY day ORDER BY day`)
      .bind(...args),
    breakdown(BREAKDOWN_COLUMNS.campaign, 20),
    breakdown(BREAKDOWN_COLUMNS.unit, 10),
    breakdown(BREAKDOWN_COLUMNS.page, 25),
    breakdown(BREAKDOWN_COLUMNS.network, 40),
    breakdown(BREAKDOWN_COLUMNS.country, 25),
    breakdown(BREAKDOWN_COLUMNS.device, 5),
    breakdown(BREAKDOWN_COLUMNS.os, 10),
    breakdown(BREAKDOWN_COLUMNS.browser, 10),
    breakdown(BREAKDOWN_COLUMNS.referrer, 15),
    d
      .prepare(
        `SELECT ts, page, unit, country, region, city, as_org, asn, device, browser, os, referrer
           FROM sponsor_events WHERE ${where} AND type = 'click'
          ORDER BY id DESC LIMIT 100`,
      )
      .bind(...args),
  ]);

  type Totals = {
    impressions: number | null;
    clicks: number | null;
    uv: number;
    uc: number;
    first_day: string | null;
    last_day: string | null;
  };
  const totals = (results[0].results[0] ?? {}) as Partial<Totals>;
  const rows = (i: number): BreakdownRow[] =>
    (results[i].results as BreakdownRow[]).map((r) => ({
      key: String(r.key),
      impressions: Number(r.impressions ?? 0),
      clicks: Number(r.clicks ?? 0),
    }));

  return {
    impressions: Number(totals.impressions ?? 0),
    clicks: Number(totals.clicks ?? 0),
    dailyUniqueViewers: Number(totals.uv ?? 0),
    dailyUniqueClickers: Number(totals.uc ?? 0),
    firstDay: totals.first_day ?? null,
    lastDay: totals.last_day ?? null,
    daily: rows(1).map((r) => ({ day: r.key, impressions: r.impressions, clicks: r.clicks })),
    byCampaign: rows(2),
    byUnit: rows(3),
    byPage: rows(4),
    byNetwork: rows(5),
    byCountry: rows(6),
    byDevice: rows(7),
    byOs: rows(8),
    byBrowser: rows(9),
    byReferrer: rows(10),
    recentClicks: results[11].results as unknown as ClickRow[],
  };
}
