# News Review Queue — setup

Replaces the old Cursor cloud-agent + dual-PR flow. A daily Claude job discovers
data-security stories and drops them into a D1-backed **review queue**; you get
one digest email and triage everything at `/admin/news/` with **Publish**
(commits straight to live) or **Delete**.

```
GitHub Actions cron ──▶ scripts/news/discover.mjs (Claude + web_search)
                          │  POST /api/news/candidates/  (Bearer secret)
                          ▼
Cloudflare Worker ── D1 `news_candidates` ── digest email (Graph)
                          │
            /admin/news/ (Cloudflare Access) ── Publish → git commit → deploy
                                              └ Delete  → mark rejected
```

## One-time setup

### 1. Create the D1 database + apply the schema
wrangler is a dev dependency here, so call it with `npx` (or `npx wrangler login`
first if you aren't authenticated). Run each command on its own line — don't
paste the `#` comments.

```sh
npx wrangler d1 create dlptest-news
```
Copy the printed `database_id` into BOTH `database_id` fields in `wrangler.jsonc`
(the top-level block and the `env.staging` block), then:
```sh
npx wrangler d1 execute dlptest-news --remote --file=migrations/0001_news_candidates.sql
```

### 2. Worker secrets (Cloudflare)
```sh
npx wrangler secret put NEWS_INGEST_SECRET   # long random string; shared with GH Actions
npx wrangler secret put NEWS_COMMIT_TOKEN    # GitHub PAT, contents:write on brian-dlptest/dlptest.com
                                             # (optional — falls back to the existing GITHUB_TOKEN)
npx wrangler secret put CF_ACCESS_AUD        # Access application Audience (AUD) tag from step 4
```
`CF_ACCESS_TEAM_DOMAIN` can be a var or secret, e.g. `yourteam.cloudflareaccess.com`.
Repeat each `secret put` with `--env staging` for the staging Worker.

### 3. GitHub Actions secrets
In the repo settings → Secrets and variables → Actions:
- `ANTHROPIC_API_KEY` — Claude API key
- `NEWS_INGEST_SECRET` — **must match** the Worker secret above
- (optional) variable `NEWS_SITE_URL` — defaults to `https://dlptest.com`

### 4. Cloudflare Access policy
Protect the admin surface in the Cloudflare dashboard (Zero Trust → Access →
Applications). Add a self-hosted application covering:
- `dlptest.com/admin/*`
- `dlptest.com/api/news/publish/`
- `dlptest.com/api/news/reject/`

with a policy allowing your email only. Copy the application's **Audience (AUD)
tag** into `CF_ACCESS_AUD`. The Worker re-verifies the Access JWT, so these paths
are protected even if a request reaches the origin directly.

> Do **not** put `/api/news/candidates/` behind Access — the discovery job
> authenticates with `NEWS_INGEST_SECRET`, not an Access login.

## Run it

- Scheduled daily at 15:00 UTC, or trigger manually: Actions → "News discovery" →
  Run workflow.
- New stories → one digest email → review at `https://dlptest.com/admin/news/`.

## Local preview

`astro dev` has no Access in front of it, so the admin page is open locally
(`import.meta.env.DEV` bypass). To see real cards, seed the local D1:
```sh
npx wrangler d1 execute dlptest-news --local --file=migrations/0001_news_candidates.sql
npx wrangler d1 execute dlptest-news --local --file=scripts/news/seed-local.sql
npm run dev   # → http://localhost:4321/admin/news/
```
