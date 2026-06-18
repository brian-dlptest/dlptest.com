import type { APIRoute } from "astro";

import { verifyAccess } from "@/lib/access";
import { readId, redirectOrJson } from "@/lib/news-admin-http";
import { getCandidate, markReviewed } from "@/lib/news-candidates";

export const prerender = false;

// Reject (Delete) a queued candidate: flip the row to `rejected` so it stays
// recorded and discovery never resurfaces it. Access-gated like publish — though
// it doesn't touch the live site, it acts on the queue.
export const POST: APIRoute = async ({ request }) => {
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

  await markReviewed(id, "rejected");
  return redirectOrJson(request, `/admin/news/?rejected=${encodeURIComponent(candidate.slug)}`, 200, "rejected");
};
