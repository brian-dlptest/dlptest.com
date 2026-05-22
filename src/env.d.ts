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
    /** Inbox for /api/contact/ submissions (MailChannels). */
    CONTACT_TO_EMAIL: string;
    /** From address on dlptest.com (must be authorized via MailChannels DNS). */
    CONTACT_FROM_EMAIL: string;
    /** MailChannels Email API key (paid API; optional if lockdown-only). */
    MAILCHANNELS_API_KEY: string;
    /** Cloudflare Turnstile site key (public — safe to expose in HTML). */
    CF_TURNSTILE_SITE_KEY: string;
    /** Cloudflare Turnstile secret key (server-only — set via wrangler secret put). */
    CF_TURNSTILE_SECRET_KEY: string;
    /** GitHub PAT for creating issues on brian-dlptest/dlptest.com (set via wrangler secret put). */
    GITHUB_TOKEN: string;
  }
}

// Top-level `Env` is also re-exported in some adapter paths (e.g. the Astro
// Cloudflare adapter's `handle(request, env, ctx)` signature). Mirror the
// same shape there for consistency.
interface Env extends Cloudflare.Env {}

interface Window {
  dataLayer?: Record<string, unknown>[];
}
