-- News Review Queue — candidate posts discovered by the daily Claude pass.
--
-- The Claude discovery job (scripts/news/discover.mjs) drafts posts and POSTs
-- them to /api/news/candidates, which inserts them here as `pending`. The
-- /admin/news review page lists pending rows; Publish commits the generated
-- Markdown to git (and flips the row to `published`), Delete flips it to
-- `rejected`. Rejected/published rows are kept so discovery never resurfaces
-- the same story.
--
-- Apply:  wrangler d1 execute dlptest-news --file=migrations/0001_news_candidates.sql --remote
--         (and again with --env staging if you bind a separate staging DB)

CREATE TABLE IF NOT EXISTS news_candidates (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  -- WordPress-style kebab-case slug; also the published filename stem and the
  -- live URL (/<slug>/). Enforced to ^[a-z0-9-]+$ at the ingest endpoint.
  slug          TEXT    NOT NULL UNIQUE,
  title         TEXT    NOT NULL,
  -- ISO 8601 instant (with offset) — mirrors the content collection pubDate.
  pub_date      TEXT    NOT NULL,
  -- JSON array of category strings (e.g. ["News","DLP"]).
  categories    TEXT    NOT NULL DEFAULT '[]',
  excerpt       TEXT    NOT NULL DEFAULT '',
  source_url    TEXT,
  hero_image    TEXT,
  -- Markdown body only (no frontmatter). Frontmatter is generated at publish
  -- time so YAML escaping is controlled server-side, not stored raw.
  body          TEXT    NOT NULL,
  -- One-line "why this qualifies" used in the digest email + review page.
  why           TEXT,
  status        TEXT    NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'published', 'rejected')),
  discovered_at TEXT    NOT NULL,
  reviewed_at   TEXT
);

CREATE INDEX IF NOT EXISTS idx_news_candidates_status
  ON news_candidates (status, discovered_at DESC);
