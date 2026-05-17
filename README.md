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

### Automated news drafts (Cursor Cloud Agent)

[`.github/workflows/news-draft.yml`](.github/workflows/news-draft.yml) runs **weekly**
(Mondays 15:00 UTC, editable cron) and can be triggered manually via **Actions → News discovery**.

It executes [`scripts/news/run-cloud-draft.mjs`](scripts/news/run-cloud-draft.mjs), which calls the
[`@cursor/sdk`](https://cursor.com/docs/api/sdk/typescript) **`Agent.prompt`** API with **`cloud.autoCreatePR: true`**.
The Cursor-hosted agent clones **`staging`** (override with env `NEWS_BASE_REF`), scans **`src/content/news/*.md`** for the newest **`pubDate`**, searches for credible stories **after that cutoff**, drafts new Markdown files that match **`src/content.config.ts`**, runs **`npm run check`** and **`npm run build`**, commits, and opens a PR.

You get alerted the same way as any other PR (GitHub email / mobile). Review and merge into **`staging`** like any content change.

Setup (one-time):

1. Connect this GitHub repo to **Cursor Cloud Agents** ([dashboard](https://cursor.com/dashboard/cloud-agents)).
2. Add repo secret **`CURSOR_API_KEY`** — user API key or team **service account** key from the same dashboard.

Local manual run (same behavior — opens a cloud PR, does **not** use your working tree):

```bash
export CURSOR_API_KEY="cursor_..."
export NEWS_REPO_URL="https://github.com/<owner>/<repo>"   # optional in Actions; uses GITHUB_REPOSITORY there
export NEWS_BASE_REF=staging                               # optional
npm run news:cloud-draft
```

The deploy workflow uses two repo-level configurations:

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
