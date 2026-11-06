import type { APIRoute } from "astro";

import { verifyAccess } from "@/lib/access";
import { isCrossSite, readFields, redirectOrJson, savedLocation, toId } from "@/lib/news-admin-http";
import { applyEdits, getCandidate } from "@/lib/news-candidates";

export const prerender = false;

// Save a reviewer's edits to a queued candidate's title, excerpt and body.
// Lives under /admin/ on purpose: the Cloudflare Access edge policy covers
// /admin/* but lists its /api/news/ routes one by one, so a route here is behind
// Access with no dashboard change. Access is verified again here at the origin,
// the same as publish and reject.
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

  const result = await applyEdits(candidate, fields);
  if (!result.ok) {
    const status = result.error === "stale_edit" || result.error === "already_reviewed" ? 409 : 400;
    return redirectOrJson(request, `/admin/news/?error=${result.error}`, status, result.error);
  }

  return redirectOrJson(request, savedLocation(candidate, result.strippedHtml), 200, "saved");
};
