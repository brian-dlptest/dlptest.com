-- Database: dlptest-analytics (binding ANALYTICS_DB). Not the news or sponsor DB.
--
--   npx wrangler d1 execute dlptest-analytics --remote --file=migrations/0003_page_views.sql
--   npx wrangler d1 execute dlptest-analytics --local  --file=migrations/0003_page_views.sql
--
-- First-party page views, written by POST /api/page-view/. Replaces Google
-- Analytics, which set cookies. Same model as sponsor_events: no cookies, no
-- raw IP. `visitor` is a hash of IP + user agent with a salt that rotates
-- every UTC day and is then deleted, so it only links views within one day.

CREATE TABLE IF NOT EXISTS page_views (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  ts        TEXT NOT NULL,                 -- ISO 8601, UTC
  day       TEXT NOT NULL,                 -- YYYY-MM-DD, UTC
  env       TEXT NOT NULL,                 -- production | staging | development
  path      TEXT NOT NULL,                 -- pathname only, never the query
  visitor   TEXT NOT NULL,                 -- daily-salted hash, see above
  entry     INTEGER NOT NULL,              -- 1 = arrived from outside the site (a visit)
  referrer  TEXT,                          -- external referring host, NULL if none/internal
  country   TEXT,                          -- Cloudflare request.cf geo
  region    TEXT,
  city      TEXT,
  asn       INTEGER,
  as_org    TEXT,
  device    TEXT,                          -- desktop | mobile | tablet
  browser   TEXT,
  os        TEXT
);

CREATE INDEX IF NOT EXISTS page_views_env_day ON page_views (env, day);

CREATE TABLE IF NOT EXISTS analytics_salts (
  day   TEXT PRIMARY KEY,                  -- YYYY-MM-DD, UTC
  salt  TEXT NOT NULL
);
