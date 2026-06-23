import type { APIRoute } from "astro";

const MAX_BODY_BYTES = 100 * 1024 * 1024;

function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

// Accept-and-discard endpoint. We deliberately read enough of the body that
// the request fully traverses the network (so a DLP product can inspect it
// in flight via SSL inspection, ICAP, SSE agents, or endpoint hooking),
// then immediately drop the content without persisting, logging, or
// forwarding any of it.
export const POST: APIRoute = async ({ request }) => {
  if (request.body) {
    const reader = request.body.getReader();
    let totalBytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        totalBytes += value.byteLength;
        if (totalBytes > MAX_BODY_BYTES) {
          reader.cancel().catch(() => {});
          return new Response(
            JSON.stringify({
              ok: false,
              error: "payload_too_large",
              message: `Request body exceeds the ${Math.round(MAX_BODY_BYTES / (1024 * 1024))} MB limit.`,
            }),
            {
              status: 413,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders(),
              },
            },
          );
        }
      }
    }
  }

  return new Response(
    JSON.stringify({
      ok: true,
      message: "Received. Nothing was stored, logged, or forwarded.",
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        ...corsHeaders(),
      },
    },
  );
};

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify({
      ok: true,
      endpoint: "/api/https-post/",
      hint: "POST any body (JSON, urlencoded, binary, multipart). JSON response. See /https-post/ for the browser form and curl examples.",
      curl_example:
        'curl -sS -X POST "https://dlptest.com/api/https-post/" -d "message=test"',
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        ...corsHeaders(),
      },
    },
  );

export const OPTIONS: APIRoute = () =>
  new Response(null, {
    status: 204,
    headers: corsHeaders(),
  });
