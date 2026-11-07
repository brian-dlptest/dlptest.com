// Shared pieces of the site's cookieless, first-party measurement (page views
// in ANALYTICS_DB, sponsor ad events in SPONSOR_DB). Nothing here touches the
// visitor's browser storage, and no raw IP leaves this module: the IP only
// goes into a hash whose salt is replaced every UTC day.

/** Which environment a request belongs to; rows carry it so reports can filter. */
export function envNameFor(url: URL, configured: string | undefined): string {
  return /^(localhost|127\.0\.0\.1|\[::1\])$/.test(url.hostname)
    ? "development"
    : configured || "production";
}

/**
 * True for a same-origin request a browser made from one of our pages.
 * Browsers set Sec-Fetch-Site (and Origin on POST); a script posting directly
 * usually sends neither.
 */
export function isSameOriginBrowserRequest(request: Request): boolean {
  const origin = new URL(request.url).origin;
  const fetchSite = request.headers.get("Sec-Fetch-Site");
  const reqOrigin = request.headers.get("Origin");
  if (fetchSite ? fetchSite !== "same-origin" : reqOrigin !== origin) return false;
  return !reqOrigin || reqOrigin === origin;
}

// Crawlers, link unfurlers, uptime checks, headless browsers and HTTP
// libraries. Rendering bots (Googlebot, Lighthouse) run the page's JS, so
// without this they'd count as visitors.
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

/** Location and network fields from Cloudflare's request.cf, trimmed for storage. */
export function cfFields(cf: IncomingRequestCfProperties | undefined) {
  const str = (v: unknown) => (typeof v === "string" && v ? v.slice(0, 200) : null);
  return {
    country: str(cf?.country),
    region: str(cf?.region),
    city: str(cf?.city),
    asn: typeof cf?.asn === "number" ? cf.asn : null,
    asOrg: str(cf?.asOrganization),
  };
}

/** Salt tables. Interpolated into SQL, so this list is the only allowed input. */
export type SaltTable = "sponsor_salts" | "analytics_salts";

const saltCache = new Map<SaltTable, { day: string; salt: string }>();

/**
 * Today's salt, shared by every Worker isolate through D1. The first request
 * of a UTC day creates it and deletes older salts, which is what makes earlier
 * visitor hashes unlinkable.
 */
async function dailySalt(db: D1Database, table: SaltTable, day: string): Promise<string> {
  const cached = saltCache.get(table);
  if (cached?.day === day) return cached.salt;
  const fresh = `${crypto.randomUUID()}${crypto.randomUUID()}`;
  const results = await db.batch<{ salt: string }>([
    db.prepare(`INSERT OR IGNORE INTO ${table} (day, salt) VALUES (?, ?)`).bind(day, fresh),
    db.prepare(`DELETE FROM ${table} WHERE day < ?`).bind(day),
    db.prepare(`SELECT salt FROM ${table} WHERE day = ?`).bind(day),
  ]);
  const salt = results[2]?.results?.[0]?.salt ?? fresh;
  saltCache.set(table, { day, salt });
  return salt;
}

/** 64-bit hex hash of IP + UA under today's salt. Same person, same day, same value. */
export async function visitorHash(
  db: D1Database,
  table: SaltTable,
  day: string,
  ip: string,
  ua: string,
): Promise<string> {
  const salt = await dailySalt(db, table, day);
  const bytes = new TextEncoder().encode(`${salt}|${ip}|${ua}`);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return Array.from(digest.slice(0, 8), (b) => b.toString(16).padStart(2, "0")).join("");
}
