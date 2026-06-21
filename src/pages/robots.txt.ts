import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { INDEXABLE_ROBOTS, NOINDEX_ROBOTS } from "@/lib/robots";

// Prerendered to a static /robots.txt at build time. Because staging and prod
// are separate builds (CLOUDFLARE_ENV), `env.ENVIRONMENT` is baked in here the
// same way the staging noindex <meta> is: the staging build emits a
// disallow-everything policy, the production build emits the crawlable one.
// This replaces the old static public/robots.txt, which couldn't differ by
// environment and was also being overridden by Cloudflare's managed robots.txt.
export const prerender = true;

export const GET: APIRoute = () => {
  const body = env.ENVIRONMENT === "production" ? INDEXABLE_ROBOTS : NOINDEX_ROBOTS;
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
