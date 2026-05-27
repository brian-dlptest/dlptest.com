// MCP method dispatch. Pure function: takes a parsed JSON-RPC request,
// returns the corresponding JSON-RPC response (or `null` for notifications,
// which produce no reply per JSON-RPC 2.0 §4.1). No I/O, no streaming —
// this server runs in stateless Streamable HTTP mode on Cloudflare Workers.

import {
  ERR,
  rpcError,
  success,
  type JsonRpcId,
  type JsonRpcRequest,
  type JsonRpcResponse,
} from "./protocol";
import { findTool, TOOLS } from "./tools";

// Protocol versions we accept on `initialize`. If the client requests one
// of these, we echo it back. Otherwise we respond with our preferred version
// and let the client decide whether to continue (per MCP spec §lifecycle).
const SUPPORTED_PROTOCOL_VERSIONS = ["2025-06-18", "2025-03-26"];
const DEFAULT_PROTOCOL_VERSION = "2025-06-18";

export const SERVER_INFO = {
  name: "dlptest-mcp",
  title: "DLP Test Synthetic Data Server",
  version: "1.0.0",
} as const;

const SERVER_INSTRUCTIONS =
  "This MCP server returns SYNTHETIC test data only — never real PII. " +
  "It exists to give DLP, CASB, and endpoint inspection products a known-safe " +
  "public target for testing inspection of MCP (agentic) traffic. All tools " +
  "return fake data that is structurally valid for its type (Luhn-valid CCNs, " +
  "ABA-valid routing numbers, mod-11-valid NHS numbers, etc.) but does not " +
  "correspond to any real person or account. See https://dlptest.com/mcp/ for " +
  "details.";

export function handleRpc(req: unknown, httpRequest?: Request): JsonRpcResponse | null {
  // Validate envelope shape before we trust any field.
  if (typeof req !== "object" || req === null || Array.isArray(req)) {
    return rpcError(null, ERR.INVALID_REQUEST, "request must be a JSON object");
  }
  const r = req as Partial<JsonRpcRequest> & Record<string, unknown>;
  const isNotification = !("id" in r);
  const id: JsonRpcId = isNotification ? null : (r.id ?? null);

  if (r.jsonrpc !== "2.0" || typeof r.method !== "string") {
    if (isNotification) return null;
    return rpcError(id, ERR.INVALID_REQUEST, "invalid JSON-RPC 2.0 request");
  }

  const params = (r.params && typeof r.params === "object" ? r.params : {}) as Record<
    string,
    unknown
  >;

  switch (r.method) {
    case "initialize": {
      const requested =
        typeof params["protocolVersion"] === "string"
          ? (params["protocolVersion"] as string)
          : DEFAULT_PROTOCOL_VERSION;
      const protocolVersion = SUPPORTED_PROTOCOL_VERSIONS.includes(requested)
        ? requested
        : DEFAULT_PROTOCOL_VERSION;
      return success(id, {
        protocolVersion,
        capabilities: {
          tools: { listChanged: false },
        },
        serverInfo: SERVER_INFO,
        instructions: SERVER_INSTRUCTIONS,
      });
    }

    // Lifecycle / control notifications: no response expected.
    case "notifications/initialized":
    case "notifications/cancelled":
    case "notifications/progress":
    case "notifications/roots/list_changed":
      return null;

    case "ping":
      return success(id, {});

    case "tools/list":
      return success(id, {
        tools: TOOLS.map((t) => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema,
        })),
      });

    case "tools/call": {
      const name = typeof params["name"] === "string" ? params["name"] : "";
      const args =
        params["arguments"] && typeof params["arguments"] === "object"
          ? (params["arguments"] as Record<string, unknown>)
          : {};
      const tool = findTool(name);
      if (!tool) {
        // Per MCP spec, tool-level failures go in the result envelope with
        // `isError: true`, not as a JSON-RPC error.
        return success(id, {
          isError: true,
          content: [{ type: "text", text: `unknown tool: ${name}` }],
        });
      }
      try {
        const text = tool.handler(args, httpRequest);
        return success(id, {
          content: [{ type: "text", text }],
        });
      } catch (e) {
        return success(id, {
          isError: true,
          content: [
            { type: "text", text: e instanceof Error ? e.message : String(e) },
          ],
        });
      }
    }

    default:
      if (isNotification) return null;
      return rpcError(id, ERR.METHOD_NOT_FOUND, `unknown method: ${r.method}`);
  }
}
