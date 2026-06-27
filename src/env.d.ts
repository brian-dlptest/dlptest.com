/// <reference path="../.astro/types.d.ts" />

// `@cloudflare/workers-types` declares `interface Cloudflare.Env {}` and
// types the `env` import from `cloudflare:workers` as `Cloudflare.Env`.
// We extend it here via declaration merging so every consumer sees the
// strongly-typed bindings.
declare namespace Cloudflare {
  interface Env {
    ENVIRONMENT: string;
    ASSETS: Fetcher;
    DOWNLOADS: R2Bucket;
    /** D1 database backing the News Review Queue (news_candidates table). */
    NEWS_DB: D1Database;
    /** Shared bearer secret the Claude discovery job uses to POST candidates (secret). */
    NEWS_INGEST_SECRET: string;
    /** Inbox for /api/contact/ submissions. */
    CONTACT_TO_EMAIL: string;
    /** Mailbox to send AS — also the Microsoft Graph user id for sendMail. */
    CONTACT_FROM_EMAIL: string;
    /** Entra ID directory/tenant ID for the Graph app registration (secret). */
    GRAPH_TENANT_ID: string;
    /** Microsoft Graph app registration client ID (secret). */
    GRAPH_CLIENT_ID: string;
    /** Microsoft Graph app registration client secret (secret). */
    GRAPH_CLIENT_SECRET: string;
    /** Cloudflare Turnstile site key (public — safe to expose in HTML). */
    CF_TURNSTILE_SITE_KEY: string;
    /** Cloudflare Turnstile secret key (server-only — set via wrangler secret put). */
    CF_TURNSTILE_SECRET_KEY: string;
    /** GitHub PAT for creating issues on brian-dlptest/dlptest.com (set via wrangler secret put). */
    GITHUB_TOKEN: string;
    /** GitHub PAT with contents:write used to publish news posts (secret); falls back to GITHUB_TOKEN. */
    NEWS_COMMIT_TOKEN: string;
    /** Cloudflare Access team domain, e.g. "yourteam.cloudflareaccess.com" (for /admin JWT verification). */
    CF_ACCESS_TEAM_DOMAIN: string;
    /** Cloudflare Access application Audience (AUD) tag for /admin and /api/news mutations. */
    CF_ACCESS_AUD: string;
    /** Railway subscribe API key (server-only secret; set via wrangler secret put). */
    SUBSCRIBE_API_KEY: string;
    /** Railway subscribe upstream URL (optional override; code has a default). */
    SUBSCRIBE_API_URL: string;
    /** dlptest.com Cloudflare zone tag — powers /admin/traffic (var; zone IDs aren't secret). */
    CF_ZONE_ID: string;
    /** Cloudflare API token with Zone → Analytics → Read, for /admin/traffic (secret). */
    CF_ANALYTICS_TOKEN: string;
  }
}

// Top-level `Env` is also re-exported in some adapter paths (e.g. the Astro
// Cloudflare adapter's `handle(request, env, ctx)` signature). Mirror the
// same shape there for consistency.
interface Env extends Cloudflare.Env {}

interface Window {
  dataLayer?: Record<string, unknown>[];
}
