import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

import { parsePageView, recordPageView } from "@/lib/page-views";
import { classifyUserAgent, envNameFor, isSameOriginBrowserRequest } from "@/lib/visitor";

// Beacon target for first-party page views, one POST per page load from the
// script in SiteAnalytics.astro. Always answers 204. See src/lib/page-views.ts
// for what gets stored.
export const prerender = false;

const MAX_BODY = 1024;

export const POST: APIRoute = async ({ request, clientAddress, locals }) => {
  const done = new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  if (!isSameOriginBrowserRequest(request)) return done;

  const ua = request.headers.get("User-Agent") ?? "";
  if (classifyUserAgent(ua).bot) return done;

  let raw: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY) return done;
    raw = JSON.parse(text);
  } catch {
    return done;
  }
  const view = parsePageView(raw);
  if (!view) return done;

  let ip = "";
  try {
    ip = clientAddress;
  } catch {
    // Not available in some dev setups; the hash still works without it.
  }

  const url = new URL(request.url);
  const write = recordPageView(view, {
    envName: envNameFor(url, env.ENVIRONMENT),
    host: url.hostname,
    ip,
    ua,
    cf: request.cf as IncomingRequestCfProperties | undefined,
  }).catch((error) => {
    console.error("[page-view] insert failed:", error);
  });
  const waitUntil = locals.cfContext?.waitUntil?.bind(locals.cfContext);
  if (waitUntil) waitUntil(write);
  else await write;
  return done;
};
