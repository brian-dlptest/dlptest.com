-- Database: dlptest-sponsor (binding SPONSOR_DB). This is NOT the news DB.
--
--   npx wrangler d1 execute dlptest-sponsor --remote --file=migrations/0002_sponsor_events.sql
--   npx wrangler d1 execute dlptest-sponsor --local  --file=migrations/0002_sponsor_events.sql
--
-- One row per viewable impression or click on a sponsored ad unit, written by
-- POST /api/sponsor-event/. Cookieless: nothing is stored in the visitor's
-- browser. No raw IP is stored. `visitor` is a hash of IP + user agent with a
-- salt that rotates every UTC day and is then deleted, so it can only link
-- events within one day (daily unique counts) and can't be reversed later.

CREATE TABLE IF NOT EXISTS sponsor_events (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  ts        TEXT NOT NULL,                 -- ISO 8601, UTC
  day       TEXT NOT NULL,                 -- YYYY-MM-DD, UTC
  env       TEXT NOT NULL,                 -- production | staging | development
  sponsor   TEXT NOT NULL,                 -- SPONSOR.id, e.g. "ent"
  campaign  TEXT NOT NULL,                 -- SPONSOR.campaign
  type      TEXT NOT NULL CHECK (type IN ('impression', 'click')),
  unit      TEXT NOT NULL,                 -- billboard | skyscraper
  page      TEXT NOT NULL,                 -- path the ad was on
  visitor   TEXT NOT NULL,                 -- daily-salted hash, see above
  country   TEXT,                          -- Cloudflare request.cf geo
  region    TEXT,
  city      TEXT,
  asn       INTEGER,                       -- network the visitor came from
  as_org    TEXT,                          -- that network's owner
  device    TEXT,                          -- desktop | mobile | tablet
  browser   TEXT,
  os        TEXT,
  referrer  TEXT                           -- host that sent them to dlptest.com
);

CREATE INDEX IF NOT EXISTS sponsor_events_env_sponsor_day
  ON sponsor_events (env, sponsor, day);

CREATE TABLE IF NOT EXISTS sponsor_salts (
  day   TEXT PRIMARY KEY,                  -- YYYY-MM-DD, UTC
  salt  TEXT NOT NULL
);
