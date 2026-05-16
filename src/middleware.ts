import type { MiddlewareHandler } from "astro";
import { env } from "cloudflare:workers";
import { DOWNLOAD_KEYS, serveR2Object } from "@/lib/downloads";

const NO_INDEX_HEADER =
  "noindex, nofollow, noarchive, nosnippet, noimageindex, notranslate";

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

  // robots.txt — only override the static asset when we want to block crawling.
  if (url.pathname === "/robots.txt" && blockIndexing) {
    return new Response(noIndexRobots(), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=600",
        "X-Robots-Tag": NO_INDEX_HEADER,
      },
    });
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
        return serveR2Object(env.DOWNLOADS, key, context.request);
      }
    } else {
      const key = url.pathname.replace(/^\//, "");
      if (key && DOWNLOAD_KEYS.has(key)) {
        return serveR2Object(env.DOWNLOADS, key, context.request);
      }
    }
  }

  const response = await next();

  if (blockIndexing) {
    response.headers.set("X-Robots-Tag", NO_INDEX_HEADER);
  }
  return response;
};
