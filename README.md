# dlptest.com

[dlptest.com](https://dlptest.com) — a public test site for Data Loss
Prevention tools. Provides sample PII/PCI data, downloadable test files,
and HTTP/HTTPS/FTP endpoints that intentionally look like data
exfiltration so you can verify your DLP detection rules end-to-end.

Built on [Astro](https://astro.build) running on
[Cloudflare Workers](https://workers.cloudflare.com).

## Repo layout

```
src/
  pages/               Astro pages (one file per route)
    api/               POST endpoints — accept and discard data
  components/          Reusable Astro components
  layouts/             Page layouts (shared head, header, footer)
  data/                Sample PII/PCI tables and file metadata
  lib/                 Shared helpers (R2 download serving, etc.)
  middleware.ts        Worker middleware (robots.txt, X-Robots-Tag, R2 routing)
  styles/              Global CSS
public/                Static files served as-is at the site root
astro.config.mjs       Astro + Cloudflare adapter config
wrangler.jsonc         Cloudflare Workers config (prod + staging envs)
```

Every POST endpoint reads the request body to simulate processing and
then drops it. The site never persists, logs, or forwards request data.

## Environments

| Branch    | Worker                  | URL (post DNS cutover)        |
| --------- | ----------------------- | ----------------------------- |
| `staging` | `dlptest-com-staging`   | `https://staging.dlptest.com` |
| `main`    | `dlptest-com-prod`      | `https://dlptest.com`         |

Daily work happens on `staging`. When changes are ready for production,
merge `staging` into `main` (fast-forward) and push.

```bash
git checkout main
git merge staging --ff-only
git push                       # triggers production deploy
git checkout staging           # back to working branch
```

## CI/CD

GitHub Actions handles all deploys. See
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

- Push to `staging` → deploys `dlptest-com-staging`
- Push to `main` → deploys `dlptest-com-prod`
- Pull requests → run typecheck + build as a status check, no deploy

The workflow uses two repo-level configurations:

- **Secret** `CLOUDFLARE_API_TOKEN` — scoped Cloudflare API token
  (Workers Scripts: Edit, KV: Edit, R2: Edit, Observability: Edit,
  Account/User: Read). Revoke at
  [Cloudflare → Profile → API Tokens](https://dash.cloudflare.com/profile/api-tokens)
  if it ever leaks.
- **Variable** `CLOUDFLARE_ACCOUNT_ID` — the Cloudflare account UUID
  the Workers live in. Not sensitive.

## Local development

```bash
npm install
npm run dev            # Astro dev server at http://localhost:4321
```

The dev server mocks Cloudflare bindings, so you don't need any
Cloudflare account or token to work on pages, components, or styles.

### Manual deploys (rarely needed — CI handles it)

```bash
npm run deploy:staging  # builds with CLOUDFLARE_ENV=staging, deploys to staging Worker
npm run deploy          # builds default (prod), deploys to prod Worker
```

These require a local Cloudflare login (`npx wrangler login`) tied to a
member of the account hosting the Workers.

## Contributing

1. Get added as a GitHub collaborator on this repo (write access).
2. Clone, `npm install`, `npm run dev`.
3. Branch off `staging` (e.g. `feature/blog-import`).
4. Open a PR against `staging`. CI runs typecheck + build.
5. Merge → CI deploys to `dlptest-com-staging` automatically.
6. Once verified on `staging.dlptest.com`, the project owner merges
   `staging` → `main` to promote to production.

Contributors don't need a Cloudflare account — the deploy is handled
entirely by CI.
