import type { APIRoute } from "astro";

import { verifyAccess } from "@/lib/access";
import { isCrossSite, readId, redirectOrJson } from "@/lib/news-admin-http";
import { getCandidate, markReviewed } from "@/lib/news-candidates";
import { publishCandidate } from "@/lib/news-publish";

export const prerender = false;

// Publish a queued candidate: commit its Markdown to the deploy branches, then
// flip the row to `published`. Gated by Cloudflare Access JWT verification — this
// writes to the live site, so it must be you, logged in through Access.
export const POST: APIRoute = async ({ request }) => {
  if (isCrossSite(request)) {
    return redirectOrJson(request, "/admin/news/?error=cross_site", 403, "cross_site");
  }

  const access = await verifyAccess(request);
  if (!access.ok) {
    return redirectOrJson(request, `/admin/news/?error=${access.reason}`, access.status, access.reason);
  }

  const id = await readId(request);
  if (id == null) return redirectOrJson(request, "/admin/news/?error=bad_id", 400, "bad_id");

  const candidate = await getCandidate(id);
  if (!candidate) return redirectOrJson(request, "/admin/news/?error=not_found", 404, "not_found");
  if (candidate.status !== "pending") {
    return redirectOrJson(request, "/admin/news/?error=already_reviewed", 409, "already_reviewed");
  }

  const published = await publishCandidate(candidate);
  if (!published.ok) {
    return redirectOrJson(request, `/admin/news/?error=${published.reason}`, 502, published.reason);
  }

  // Commit succeeded — record the decision. If this somehow lost the race
  // (already reviewed), the post is still committed; surface it but don't error.
  await markReviewed(id, "published");

  return redirectOrJson(request, `/admin/news/?published=${encodeURIComponent(candidate.slug)}`, 200, "published");
};
