import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

import { DOWNLOAD_KEYS, serveR2Object } from "@/lib/downloads";

// R2-backed file downloads, served at /downloads/?file=<key>.
//
// Why a query param instead of /downloads/<key>: Cloudflare Workers Assets
// serves static files / the 404 for any request that LOOKS like an asset —
// i.e. has a file extension — WITHOUT invoking the Worker. So /downloads/<key>
// (which ends in .csv/.xlsx/…) never reaches us. An extensionless path like
// /downloads/ does reach the Worker (same as /api/*), so the filename rides in
// a query param. Content-Disposition restores the correct download filename.
export const prerender = false;

const handler: APIRoute = async ({ url, request }) => {
  const file = url.searchParams.get("file") ?? "";
  if (!file || !DOWNLOAD_KEYS.has(file)) {
    return new Response("Not found", { status: 404 });
  }
  if (!env.DOWNLOADS) {
    return new Response("Downloads are not configured", { status: 503 });
  }

  const response = await serveR2Object(env.DOWNLOADS, file, request);
  // The URL no longer carries the filename, so set it explicitly.
  if (response.status === 200 || response.status === 206) {
    response.headers.set("content-disposition", `attachment; filename="${file}"`);
  }
  return response;
};

export const GET = handler;
// HEAD lets clients/CDNs probe size and Range support without downloading.
export const HEAD = handler;
