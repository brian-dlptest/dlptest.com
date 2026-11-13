import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

import { describeCall, recordMcpCalls, type McpCall } from "@/lib/mcp-calls";
import { handleRpc } from "@/lib/mcp/server";
import { ERR, rpcError } from "@/lib/mcp/protocol";
import { envNameFor } from "@/lib/visitor";

// MCP server endpoint. Implements the Streamable HTTP transport (MCP spec
// rev 2025-03-26 / 2025-06-18) in *stateless* mode:
//
//   - POST: accept one JSON-RPC request (or a batch array) and return the
//     corresponding JSON-RPC response. Notifications produce 202 Accepted.
//   - GET / DELETE: not supported (no server-initiated streams, no sessions).
//   - No `Mcp-Session-Id` is ever issued — every request is independent.
//
// The endpoint also serves as the rewrite target for the mcp.dlptest.com
// subdomain (see src/middleware.ts), so requests to that host land here
// regardless of path.

export const prerender = false;

// JSON-RPC bodies for `initialize` / `tools/call` are small. 1 MB is a
// generous cap that still bounds abuse — well below the Workers 100 MB
// request-body limit.
const MAX_BODY_BYTES = 1 * 1024 * 1024;

function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, Mcp-Session-Id, Mcp-Protocol-Version",
    "Access-Control-Expose-Headers": "Mcp-Protocol-Version",
    "Access-Control-Max-Age": "86400",
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...corsHeaders(),
    },
  });
}

export const OPTIONS: APIRoute = async () =>
  new Response(null, { status: 204, headers: corsHeaders() });

// GET is reserved by the MCP spec for the server-initiated SSE stream. In
// stateless mode we don't expose one. Return a hint so curious humans (and
// `mcp-inspector --transport http`) get a useful message instead of a 404.
export const GET: APIRoute = async () =>
  jsonResponse(
    rpcError(
      null,
      ERR.INVALID_REQUEST,
      "This MCP server uses Streamable HTTP in stateless mode. POST your JSON-RPC request to this URL with Content-Type: application/json. See https://dlptest.com/mcp/ for examples.",
    ),
    405,
  );

export const POST: APIRoute = async (context) => {
  const { request } = context;
  const contentType = (request.headers.get("content-type") || "").toLowerCase();
  if (!contentType.includes("application/json")) {
    return jsonResponse(
      rpcError(null, ERR.PARSE, "expected Content-Type: application/json"),
      415,
    );
  }

  const declaredLength = request.headers.get("content-length");
  if (declaredLength && Number(declaredLength) > MAX_BODY_BYTES) {
    return jsonResponse(
      rpcError(null, ERR.INVALID_REQUEST, "request body exceeds 1 MB limit"),
      413,
    );
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return jsonResponse(
      rpcError(null, ERR.PARSE, "failed to read request body"),
      400,
    );
  }
  if (raw.length > MAX_BODY_BYTES) {
    return jsonResponse(
      rpcError(null, ERR.INVALID_REQUEST, "request body exceeds 1 MB limit"),
      413,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return jsonResponse(rpcError(null, ERR.PARSE, "JSON parse error"), 400);
  }

  // JSON-RPC 2.0 batch support: body may be a single request or an array.
  // MCP's Streamable HTTP transport explicitly permits this.
  const isBatch = Array.isArray(parsed);
  const requests = isBatch ? (parsed as unknown[]) : [parsed];

  if (isBatch && requests.length === 0) {
    return jsonResponse(
      rpcError(null, ERR.INVALID_REQUEST, "empty batch"),
      400,
    );
  }

  const answered = requests.map((req) => ({ req, res: handleRpc(req, request) }));
  const responses = answered
    .map((a) => a.res)
    .filter((r): r is NonNullable<typeof r> => r !== null);

  recordCalls(
    answered.map((a) => describeCall(a.req, a.res)).filter((c): c is McpCall => c !== null),
    context,
  );

  if (responses.length === 0) {
    // All entries were notifications. Per JSON-RPC 2.0 there is no response
    // body; 202 Accepted is the conventional status.
    return new Response(null, { status: 202, headers: corsHeaders() });
  }

  return jsonResponse(isBatch ? responses : responses[0]);
};

// Which tools get called, for /admin/traffic (src/lib/mcp-calls.ts). Written after
// the response goes out, and a failed write is only logged: analytics must never
// slow down or break a tool call.
function recordCalls(calls: McpCall[], context: Parameters<APIRoute>[0]): void {
  if (calls.length === 0) return;
  const { request, locals } = context;
  let ip = "";
  try {
    // A getter that throws where the adapter can't supply it, so read it here.
    ip = context.clientAddress;
  } catch {
    // The hash still works without it.
  }
  const write = recordMcpCalls(calls, {
    envName: envNameFor(new URL(request.url), env.ENVIRONMENT),
    ip,
    ua: request.headers.get("User-Agent") ?? "",
    cf: request.cf as IncomingRequestCfProperties | undefined,
  }).catch((error) => {
    console.error("[mcp] call log insert failed:", error);
  });
  const waitUntil = locals.cfContext?.waitUntil?.bind(locals.cfContext);
  if (waitUntil) waitUntil(write);
  else void write;
}
