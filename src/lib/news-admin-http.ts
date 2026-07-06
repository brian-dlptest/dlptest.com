// Tiny request/response helpers shared by the /api/news/publish and /reject
// endpoints, which accept both no-JS HTML form posts and JSON callers.

/**
 * Reject cross-site browser requests (CSRF guard). Astro's built-in origin
 * check is disabled site-wide (`security.checkOrigin: false` in
 * astro.config.mjs) because /api/http-post must accept arbitrary cross-origin
 * POSTs — that's the product. But the news mutation endpoints authenticate via
 * the CF_Authorization cookie, so a cross-site form post from a malicious page
 * would otherwise ride an admin's logged-in session.
 *
 * Browsers send `Sec-Fetch-Site` and/or `Origin` on cross-origin POSTs; a
 * same-origin form post (the /admin/news/ review UI) sends same-origin values,
 * and non-browser clients (curl with the JWT header) send neither — both pass.
 */
export function isCrossSite(request: Request): boolean {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
    return true;
  }
  const origin = request.headers.get("origin");
  if (origin) {
    const host = request.headers.get("host");
    try {
      if (new URL(origin).host !== host) return true;
    } catch {
      return true;
    }
  }
  return false;
}

/** Accept either a form post (id field) or JSON ({id}). Returns a positive int or null. */
export async function readId(request: Request): Promise<number | null> {
  const contentType = request.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("application/json")) {
      const body = (await request.json()) as { id?: unknown };
      return toId(body.id);
    }
    const form = await request.formData();
    return toId(form.get("id"));
  } catch {
    return null;
  }
}

function toId(value: unknown): number | null {
  const n = typeof value === "number" ? value : parseInt(String(value ?? ""), 10);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/**
 * Form posts get a 303 back to the review page; JSON callers get JSON. Keeps the
 * no-JS HTML form flow working while staying API-friendly.
 */
export function redirectOrJson(
  request: Request,
  location: string,
  status: number,
  message: string,
): Response {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return new Response(JSON.stringify({ ok: status < 400, message }), {
      status,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }
  return new Response(null, {
    status: 303,
    headers: { Location: location, "Cache-Control": "no-store" },
  });
}
