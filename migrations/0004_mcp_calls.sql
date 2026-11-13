-- Database: dlptest-analytics (binding ANALYTICS_DB). Not the news or sponsor DB.
--
--   npx wrangler d1 execute dlptest-analytics --remote --file=migrations/0004_mcp_calls.sql
--   npx wrangler d1 execute dlptest-analytics --local  --file=migrations/0004_mcp_calls.sql
--
-- One row per JSON-RPC request to the MCP server (POST /api/mcp/, also served at
-- mcp.dlptest.com), written by src/lib/mcp-calls.ts. Notifications aren't
-- recorded. Same model as page_views: no raw IP, and `visitor` is the same
-- daily-salted hash (analytics_salts), so it only links calls within one UTC day.
--
-- Never stored: the tool arguments, the result, error text, or the full user
-- agent. Callers send test data and regexes; none of that is kept.

CREATE TABLE IF NOT EXISTS mcp_calls (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  ts        TEXT NOT NULL,                 -- ISO 8601, UTC
  day       TEXT NOT NULL,                 -- YYYY-MM-DD, UTC
  env       TEXT NOT NULL,                 -- production | staging | development
  method    TEXT NOT NULL,                 -- initialize | tools/list | tools/call | ping | other
  tool      TEXT,                          -- tools/call only: a tool name we serve, or '(unknown)'
  ok        INTEGER NOT NULL,              -- 1 = answered without an error
  client    TEXT,                          -- initialize only: clientInfo.name the client sent
  agent     TEXT,                          -- first User-Agent product, without its version
  visitor   TEXT NOT NULL,                 -- daily-salted hash of IP + user agent
  country   TEXT,                          -- Cloudflare request.cf geo
  asn       INTEGER,
  as_org    TEXT
);

CREATE INDEX IF NOT EXISTS mcp_calls_env_day ON mcp_calls (env, day);
