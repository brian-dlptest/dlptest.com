# AGENTS.md

## Cursor Cloud specific instructions

This is an **Astro 6 SSR** site deployed on **Cloudflare Workers**. It is a single-service application with no external dependencies required for local development.

### Quick reference

| Action | Command |
|--------|---------|
| Install deps | `npm install` |
| Dev server | `npm run dev` → http://localhost:4321 |
| Typecheck | `npm run check` |
| Build | `npm run build` |
| Preview (Workers emulation) | `npm run preview` (requires build first) |

### Non-obvious caveats

- **Trailing slashes are required.** The Astro config sets `trailingSlash: "always"`. All page/API URLs must end with `/` (e.g. `/api/http-post/`, not `/api/http-post`). Without the trailing slash, requests return 404.
- **No lint command exists.** The only code-quality check is `npm run check` (TypeScript `tsc --noEmit`). There is no ESLint or Prettier configured.
- **No automated test suite.** There are no unit/integration tests. Verify changes with `npm run check` and manual curl/browser testing against the dev server.
- **R2 bindings are optional.** The `DOWNLOADS` R2 binding is commented out in `wrangler.jsonc`. Download routes will 404 locally — this is expected. The middleware guards on `env.DOWNLOADS` being present.
- **Cloudflare bindings are auto-mocked in dev.** The Astro dev server (`npm run dev`) mocks Cloudflare bindings, so no Cloudflare account or API token is needed for local development.
- **Node.js 22 is required** (matches CI configuration in `.github/workflows/deploy.yml`).
