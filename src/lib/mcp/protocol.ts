// JSON-RPC 2.0 envelope types and helpers for the MCP server.
// The Model Context Protocol's "Streamable HTTP" transport (spec rev
// 2025-03-26 / 2025-06-18) layers MCP messages on top of JSON-RPC 2.0.
// In stateless mode every request is a self-contained POST that produces
// either a single JSON-RPC response or, for notifications, no response.

export type JsonRpcId = string | number | null;

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  // id is omitted for notifications. Use `"id" in req` to distinguish.
  id?: JsonRpcId;
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcSuccess {
  jsonrpc: "2.0";
  id: JsonRpcId;
  result: unknown;
}

export interface JsonRpcErrorEnvelope {
  jsonrpc: "2.0";
  id: JsonRpcId;
  error: { code: number; message: string; data?: unknown };
}

export type JsonRpcResponse = JsonRpcSuccess | JsonRpcErrorEnvelope;

// Standard JSON-RPC 2.0 error codes. MCP reserves the JSON-RPC error
// channel for protocol-level failures; tool-execution errors are returned
// inside the `result` as `{ isError: true, content: [...] }` per the MCP
// spec, NOT as JSON-RPC errors.
export const ERR = {
  PARSE: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL: -32603,
} as const;

export function success(id: JsonRpcId, result: unknown): JsonRpcSuccess {
  return { jsonrpc: "2.0", id, result };
}

export function rpcError(
  id: JsonRpcId,
  code: number,
  message: string,
  data?: unknown,
): JsonRpcErrorEnvelope {
  return {
    jsonrpc: "2.0",
    id,
    error: { code, message, ...(data !== undefined && { data }) },
  };
}
