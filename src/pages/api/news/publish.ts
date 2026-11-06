import type { APIRoute } from "astro";

import { verifyAccess } from "@/lib/access";
import { isCrossSite, readFields, redirectOrJson, savedLocation, toId } from "@/lib/news-admin-http";
import { applyEdits, getCandidate, markReviewed } from "@/lib/news-candidates";
import { publishCandidate } from "@/lib/news-publish";

export const prerender = false;

// Publish a queued candidate: commit its Markdown to the deploy branches, then
// flip the row to `published`. Gated by Cloudflare Access JWT verification — this
// writes to the live site, so it must be you, logged in through Access.
//
// The review page's Publish button submits the edit form, so what goes live is
// what's in the boxes, saved or not. The text is stored before the commit, so a
// failed commit doesn't lose it. A caller sending only an id publishes the
// stored text.
export const POST: APIRoute = async ({ request }) => {
  if (isCrossSite(request)) {
    return redirectOrJson(request, "/admin/news/?error=cross_site", 403, "cross_site");
  }

  const access = await verifyAccess(request);
  if (!access.ok) {
    return redirectOrJson(request, `/admin/news/?error=${access.reason}`, access.status, access.reason);
  }

  const fields = await readFields(request);
  const id = toId(fields?.id);
  if (!fields || id == null) return redirectOrJson(request, "/admin/news/?error=bad_id", 400, "bad_id");

  const candidate = await getCandidate(id);
  if (!candidate) return redirectOrJson(request, "/admin/news/?error=not_found", 404, "not_found");
  if (candidate.status !== "pending") {
    return redirectOrJson(request, "/admin/news/?error=already_reviewed", 409, "already_reviewed");
  }

  let toPublish = candidate;
  if ("title" in fields || "excerpt" in fields || "body" in fields) {
    const result = await applyEdits(candidate, fields);
    if (!result.ok) {
      const status = result.error === "stale_edit" || result.error === "already_reviewed" ? 409 : 400;
      return redirectOrJson(request, `/admin/news/?error=${result.error}`, status, result.error);
    }
    // Removing HTML changed the text. Hold it so the reviewer sees the result
    // before it goes live, rather than finding out on the published post.
    if (result.strippedHtml) {
      return redirectOrJson(request, savedLocation(candidate, true), 409, "html_stripped");
    }
    toPublish = result.candidate;
  }

  const published = await publishCandidate(toPublish);
  if (!published.ok) {
    return redirectOrJson(request, `/admin/news/?error=${published.reason}`, 502, published.reason);
  }

  // Commit succeeded — record the decision. If this somehow lost the race
  // (already reviewed), the post is still committed; surface it but don't error.
  await markReviewed(id, "published");

  return redirectOrJson(request, `/admin/news/?published=${encodeURIComponent(candidate.slug)}`, 200, "published");
};
