import type { MiddlewareHandler } from "astro";
import { env } from "cloudflare:workers";
import { DOWNLOAD_KEYS, serveR2Object } from "@/lib/downloads";

const NO_INDEX_HEADER =
  "noindex, nofollow, noarchive, nosnippet, noimageindex, notranslate";

// ────────────────────────────────────────────────────────────────────────────
// Security headers applied to every response that exits the Worker.
//
// CSP allowances are narrow on purpose: the only external resources the
// browser actually loads are Google Tag Manager and the GA endpoints it
// chains to. Server-to-server fetches (MailChannels, the Railway subscribe
// upstream) don't need CSP allowances because they originate from the Worker,
// not the browser.
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
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://www.googletagmanager.com https://www.google-analytics.com",
  "font-src 'self' data:",
  "connect-src 'self' https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com",
  "frame-src https://www.googletagmanager.com",
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

/** Generate the no-index robots.txt body used on staging hosts. */
function noIndexRobots(): string {
  return [
    "# Staging — do not crawl",
    "User-agent: *",
    "Disallow: /",
    "",
    "# Common AI crawlers",
    "User-agent: GPTBot",
    "Disallow: /",
    "User-agent: Google-Extended",
    "Disallow: /",
    "User-agent: ClaudeBot",
    "Disallow: /",
    "User-agent: Bytespider",
    "Disallow: /",
    "User-agent: CCBot",
    "Disallow: /",
    "",
  ].join("\n");
}

export const onRequest: MiddlewareHandler = async (context, next) => {
  const url = new URL(context.request.url);
  const hostname = url.hostname;
  const blockIndexing = shouldBlockIndexing(env.ENVIRONMENT, hostname);

  // Legacy permalink: /https-post/ merged into /http-post/
  const normalizedPath = url.pathname.replace(/\/+$/, "") || "/";
  if (normalizedPath === "/https-post") {
    return Response.redirect(new URL("/http-post/", url), 301);
  }

  // robots.txt — only override the static asset when we want to block crawling.
  if (url.pathname === "/robots.txt" && blockIndexing) {
    return setSecurityHeaders(
      new Response(noIndexRobots(), {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "public, max-age=600",
          "X-Robots-Tag": NO_INDEX_HEADER,
        },
      }),
    );
  }

  // Serve R2-backed downloads at both /downloads/<key> and the legacy root path
  // /<key> (e.g. /sample-data.csv, /334-MB-Test-CSV.csv). This preserves
  // permalinks that exist in the wild while letting us host the actual
  // bytes in R2 instead of bundling them with the Worker.
  if (env.DOWNLOADS) {
    const downloadsPrefix = "/downloads/";
    if (url.pathname.startsWith(downloadsPrefix)) {
      const key = url.pathname.slice(downloadsPrefix.length);
      if (key && DOWNLOAD_KEYS.has(key)) {
        return setSecurityHeaders(
          await serveR2Object(env.DOWNLOADS, key, context.request),
        );
      }
    } else {
      const key = url.pathname.replace(/^\//, "");
      if (key && DOWNLOAD_KEYS.has(key)) {
        return setSecurityHeaders(
          await serveR2Object(env.DOWNLOADS, key, context.request),
        );
      }
    }
  }

  const response = await next();

  if (blockIndexing) {
    response.headers.set("X-Robots-Tag", NO_INDEX_HEADER);
  }
  return setSecurityHeaders(response);
};
