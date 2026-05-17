// @ts-check
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import rehypeExternalLinks from "rehype-external-links";

// Astro on Cloudflare Workers. On-demand rendering enabled (output: "server")
// because we need:
//  - POST endpoints (/api/http-post, /api/contact) that accept-and-discard
//  - Middleware-based X-Robots-Tag for staging
//  - R2-backed file downloads (large DLP test files)
//
// Pre-render the static content pages explicitly via `export const prerender = true`
// in each .astro file; only the API routes and middleware-driven paths stay dynamic.
export default defineConfig({
  site: "https://dlptest.com",
  output: "server",
  markdown: {
    rehypePlugins: [
      [rehypeExternalLinks, { target: "_blank", rel: ["noopener", "noreferrer"] }],
    ],
  },
  adapter: cloudflare({
    // Use directory output so Wrangler can wire static assets + Worker entry.
    imageService: "passthrough",
  }),
  // Trailing-slash policy must match the legacy WordPress URLs (which use trailing slashes
  // for content pages, e.g. /sample-data/, /ftp-test/). Keep trailing slashes consistent.
  trailingSlash: "always",
  security: {
    // Astro 6 enables cross-origin POST protection by default. We deliberately
    // disable it: /api/http-post is the entire reason this site exists — DLP
    // tools, scripts, and ad-hoc curl invocations need to POST arbitrary data
    // here and receive a 200. Per-route honeypots / Turnstile / rate-limiting
    // are handled in the individual API handlers.
    checkOrigin: false,
  },
});
