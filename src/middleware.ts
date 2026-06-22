import type { MiddlewareHandler } from "astro";
import { env } from "cloudflare:workers";

const NO_INDEX_HEADER =
  "noindex, nofollow, noarchive, nosnippet, noimageindex, notranslate";

// NOTE: legacy permalink redirects and R2 file downloads are NOT handled here.
// Cloudflare Workers Assets serves static files / the 404 for any path that
// isn't a real Astro route (notably extension-bearing paths) WITHOUT invoking
// the Worker, so middleware never runs for them. Redirects live in
// public/_redirects (Assets layer); downloads are served by the extensionless
// route src/pages/downloads/index.ts (/downloads/?file=<key>).

// ────────────────────────────────────────────────────────────────────────────
// Security headers applied to every response that exits the Worker.
//
// CSP allowances are narrow on purpose. Browser-loaded externals:
//   * Google Tag Manager (+ the GA endpoints it chains to) — analytics.
//   * Cloudflare Turnstile (challenges.cloudflare.com) — the feedback modal's
//     CAPTCHA. The modal lives in BaseLayout, so it renders on every page;
//     its api.js (script-src) and challenge iframe (frame-src) must be allowed.
// Server-to-server fetches (Microsoft Graph for contact email, the Railway
// subscribe upstream, GitHub issues) don't need CSP allowances because they
// originate from the Worker, not the browser.
//
// NOTE: keep this CSP in sync with `public/_headers`, which applies the same
// headers to prerendered static pages (the Worker — and thus this middleware —
// does not run for static asset responses).
//
// 'unsafe-inline' is required for both script and style:
//   * script — the head-of-document theme bootstrap, GTM bootstrap, and
//     Astro's hydration shims are all inline.
//   * style  — every Astro component generates scoped <style> blocks.
// Switching to nonces is the right long-term tightening; we'd need to plumb
// a per-request nonce through Astro and inject it into every script/style
// tag, which is invasive enough to be its own change.
//
// frame-ancestors 'none' replaces X-Frame-Options: DENY (CSP-level supersedes
// the legacy header in modern browsers, but we set both for old browsers).
// ────────────────────────────────────────────────────────────────────────────

const CSP_DIRECTIVES = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://www.googletagmanager.com https://www.google-analytics.com",
  "font-src 'self' data:",
  "connect-src 'self' https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com",
  "frame-src https://www.googletagmanager.com https://challenges.cloudflare.com",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const PERMISSIONS_POLICY = [
  "accelerometer=()",
  "camera=()",
  "geolocation=()",
  "gyroscope=()",
  "interest-cohort=()",
  "magnetometer=()",
  "microphone=()",
  "payment=()",
  "usb=()",
].join(", ");

/**
 * Apply baseline security headers to a response. Idempotent — calling this on
 * a response that already has these headers just re-sets the same values.
 *
 * Skips the redirect response in the legacy /https-post/ flow because
 * setting headers on a 301 is harmless but pointless; the browser follows
 * Location: and gets the real headers on the destination.
 */
function setSecurityHeaders(response: Response): Response {
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains",
  );
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Content-Security-Policy", CSP_DIRECTIVES);
  response.headers.set("Permissions-Policy", PERMISSIONS_POLICY);
  return response;
}

/** Treat hostname or wrangler env as non-indexable (staging / preview hosts). */
function shouldBlockIndexing(environment: string | undefined, hostname: string): boolean {
  if (environment === "staging") return true;
  if (hostname.startsWith("staging.")) return true;
  if (hostname.endsWith(".workers.dev")) return true;
  return false;
}

export const onRequest: MiddlewareHandler = async (context, next) => {
  const url = new URL(context.request.url);
  const hostname = url.hostname;
  const blockIndexing = shouldBlockIndexing(env.ENVIRONMENT, hostname);

  // MCP subdomain: route every request on mcp.dlptest.com (and any
  // mcp.* preview host) to the single MCP endpoint at /api/mcp. The
  // subdomain is configured as a Custom Domain in the Cloudflare dashboard
  // and points at the same Worker; this rewrite lets the canonical URL be
  // `https://mcp.dlptest.com/` while keeping the implementation as a
  // standard Astro API route.
  if (hostname === "mcp.dlptest.com" || hostname.startsWith("mcp.")) {
    return context.rewrite("/api/mcp/");
  }

  const response = await next();

  if (blockIndexing) {
    response.headers.set("X-Robots-Tag", NO_INDEX_HEADER);
  }
  return setSecurityHeaders(response);
};
