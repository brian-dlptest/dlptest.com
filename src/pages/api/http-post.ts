import type { APIRoute } from "astro";

const MAX_BODY_BYTES = 100 * 1024 * 1024;

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
            { status: 413, headers: { "Content-Type": "application/json" } },
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
      },
    },
  );
};

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify({
      ok: true,
      hint: "POST to this endpoint with any body. See /http-post/ for the test form.",
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
