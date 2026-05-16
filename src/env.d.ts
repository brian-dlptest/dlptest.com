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
  }
}

// Top-level `Env` is also re-exported in some adapter paths (e.g. the Astro
// Cloudflare adapter's `handle(request, env, ctx)` signature). Mirror the
// same shape there for consistency.
interface Env extends Cloudflare.Env {}
