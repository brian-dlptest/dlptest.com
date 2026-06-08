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
  }
}

// Top-level `Env` is also re-exported in some adapter paths (e.g. the Astro
// Cloudflare adapter's `handle(request, env, ctx)` signature). Mirror the
// same shape there for consistency.
interface Env extends Cloudflare.Env {}

interface Window {
  dataLayer?: Record<string, unknown>[];
}
