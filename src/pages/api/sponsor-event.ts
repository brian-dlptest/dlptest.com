import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

import { ADS_ENABLED } from "@/lib/sponsor-ad";
import { parseSponsorEvent, recordSponsorEvent } from "@/lib/sponsor-metrics";
import { classifyUserAgent, envNameFor, isSameOriginBrowserRequest } from "@/lib/visitor";

// Beacon target for sponsored ad units: one POST per viewable impression or
// click, sent by the script in SponsorAd.astro. Always answers 204 (beacons
// ignore the response, and a forged request learns nothing). See
// src/lib/sponsor-metrics.ts for what gets stored.
export const prerender = false;

const MAX_BODY = 1024;

export const POST: APIRoute = async ({ request, clientAddress, locals }) => {
  const done = new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  if (!ADS_ENABLED) return done;

  // Anything that isn't a browser on one of our pages is a script posting
  // directly, not a person looking at the ad.
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
  const event = parseSponsorEvent(raw);
  if (!event) return done;

  let ip = "";
  try {
    ip = clientAddress;
  } catch {
    // Not available in some dev setups; the hash still works without it.
  }

  const envName = envNameFor(new URL(request.url), env.ENVIRONMENT);

  const write = recordSponsorEvent(event, {
    envName,
    ip,
    ua,
    cf: request.cf as IncomingRequestCfProperties | undefined,
  }).catch((error) => {
    console.error("[sponsor-event] insert failed:", error);
  });
  // Answer right away and finish the write in the background where we can.
  const waitUntil = locals.cfContext?.waitUntil?.bind(locals.cfContext);
  if (waitUntil) waitUntil(write);
  else await write;
  return done;
};
