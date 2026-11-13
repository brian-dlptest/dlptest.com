import { env } from "cloudflare:workers";

import { TOOLS } from "./mcp/tools";
import { cfFields, visitorHash } from "./visitor";

// Which MCP tools get called (D1 ANALYTICS_DB, schema in migrations/0004_mcp_calls.sql).
// One row per JSON-RPC request; notifications aren't recorded. Same model as page
// views: no raw IP, and a visitor hash that resets every UTC day.
//
// Nothing a caller sends is stored except the method, the tool name (only if it's
// one of ours) and the client name from `initialize`. Arguments, results and error
// text never leave the request. Every query binds its values.

const METHODS = new Set(["initialize", "tools/list", "tools/call", "ping"]);
const TOOL_NAMES = new Set(TOOLS.map((t) => t.name));

export interface McpCall {
  method: string;
  tool: string | null;
  ok: boolean;
  client: string | null;
}

/**
 * The row for one request and the response it got, or null for a notification
 * (no id, no response), which isn't recorded.
 */
export function describeCall(request: unknown, response: unknown): McpCall | null {
  if (response === null || response === undefined) return null;
  const req = request && typeof request === "object" && !Array.isArray(request)
    ? (request as Record<string, unknown>)
    : {};
  const params = req.params && typeof req.params === "object" ? (req.params as Record<string, unknown>) : {};
  const method = typeof req.method === "string" && METHODS.has(req.method) ? req.method : "other";

  let tool: string | null = null;
  if (method === "tools/call") {
    tool = typeof params.name === "string" && TOOL_NAMES.has(params.name) ? params.name : "(unknown)";
  }

  let client: string | null = null;
  if (method === "initialize" && params.clientInfo && typeof params.clientInfo === "object") {
    const name = (params.clientInfo as Record<string, unknown>).name;
    if (typeof name === "string") client = /^[\w .@()/+-]{1,60}$/.test(name) ? name : "(other)";
  }

  const res = response as Record<string, unknown>;
  const result = res.result && typeof res.result === "object" ? (res.result as Record<string, unknown>) : null;
  const ok = !("error" in res) && result?.isError !== true;

  return { method, tool, ok, client };
}

/**
 * The first product in a User-Agent, without its version: "claude-user/1.0 (…)"
 * gives "claude-user". Browsers all start "Mozilla/5.0", so they read "browser".
 */
export function agentOf(ua: string): string | null {
  const m = /^([A-Za-z0-9._-]{1,40})/.exec(ua.trim());
  if (!m) return null;
  return m[1] === "Mozilla" ? "browser" : m[1];
}

function db(): D1Database {
  const handle = env.ANALYTICS_DB;
  if (!handle) throw new Error("ANALYTICS_DB binding is not configured");
  return handle;
}

export async function recordMcpCalls(
  calls: McpCall[],
  ctx: { envName: string; ip: string; ua: string; cf: IncomingRequestCfProperties | undefined },
): Promise<void> {
  if (calls.length === 0) return;
  const ts = new Date().toISOString();
  const day = ts.slice(0, 10);
  const geo = cfFields(ctx.cf);
  const agent = agentOf(ctx.ua);
  const visitor = await visitorHash(db(), "analytics_salts", day, ctx.ip, ctx.ua);
  const insert = db().prepare(
    `INSERT INTO mcp_calls
       (ts, day, env, method, tool, ok, client, agent, visitor, country, asn, as_org)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  await db().batch(
    calls.map((c) =>
      insert.bind(ts, day, ctx.envName, c.method, c.tool, c.ok ? 1 : 0, c.client, agent, visitor, geo.country, geo.asn, geo.asOrg),
    ),
  );
}

// ── Report (/admin/traffic) ─────────────────────────────────────────────

export interface McpCountRow {
  key: string;
  calls: number;
  callers: number;
  errors: number;
}

export interface McpSummary {
  days: number;
  /** tools/call requests. */
  toolCalls: number;
  toolErrors: number;
  /** initialize requests: a client connecting (most clients do this once per session). */
  connections: number;
  /** Sum of each day's distinct callers, across every method. */
  dailyCallers: number;
  daily: { day: string; toolCalls: number; callers: number }[];
  tools: McpCountRow[];
  clients: McpCountRow[];
  agents: McpCountRow[];
  networks: McpCountRow[];
  countries: McpCountRow[];
}

/** The last `days` UTC days, today included (today is partial). */
export async function loadMcpSummary(envName: string, days: number): Promise<McpSummary> {
  const d = db();
  const since = new Date(Date.now() - (days - 1) * 86_400_000).toISOString().slice(0, 10);
  const where = "env = ?1 AND day >= ?2";
  const counts =
    "COUNT(*) AS calls, COUNT(DISTINCT day || visitor) AS callers, SUM(CASE WHEN ok = 0 THEN 1 ELSE 0 END) AS errors";
  const top = (col: "tool" | "client" | "agent" | "as_org" | "country", extra: string, limit = 20) =>
    d
      .prepare(
        `SELECT COALESCE(${col}, '(unknown)') AS key, ${counts}
           FROM mcp_calls WHERE ${where} ${extra}
          GROUP BY key ORDER BY calls DESC LIMIT ${limit}`,
      )
      .bind(envName, since);

  const results = await d.batch([
    d
      .prepare(
        `SELECT SUM(method = 'tools/call') AS toolCalls,
                SUM(method = 'tools/call' AND ok = 0) AS toolErrors,
                SUM(method = 'initialize') AS connections,
                COUNT(DISTINCT day || visitor) AS dailyCallers
           FROM mcp_calls WHERE ${where}`,
      )
      .bind(envName, since),
    d
      .prepare(
        `SELECT day, SUM(method = 'tools/call') AS toolCalls, COUNT(DISTINCT visitor) AS callers
           FROM mcp_calls WHERE ${where} GROUP BY day ORDER BY day`,
      )
      .bind(envName, since),
    top("tool", "AND method = 'tools/call'", 40),
    top("client", "AND method = 'initialize'"),
    top("agent", ""),
    top("as_org", ""),
    top("country", ""),
  ]);

  const rows = <T,>(i: number) => (results[i].results ?? []) as T[];
  const totals = rows<Record<string, number | null>>(0)[0] ?? {};
  const n = (v: unknown) => Number(v ?? 0);
  const countRows = (i: number) =>
    rows<Record<string, unknown>>(i).map((r) => ({
      key: String(r.key),
      calls: n(r.calls),
      callers: n(r.callers),
      errors: n(r.errors),
    }));

  return {
    days,
    toolCalls: n(totals.toolCalls),
    toolErrors: n(totals.toolErrors),
    connections: n(totals.connections),
    dailyCallers: n(totals.dailyCallers),
    daily: rows<Record<string, unknown>>(1).map((r) => ({
      day: String(r.day),
      toolCalls: n(r.toolCalls),
      callers: n(r.callers),
    })),
    tools: countRows(2),
    clients: countRows(3),
    agents: countRows(4),
    networks: countRows(5),
    countries: countRows(6),
  };
}
