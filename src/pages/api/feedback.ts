import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: "bad_request" }, 400);
  }

  // Honeypot — silently succeed if bot filled the hidden field.
  if (typeof body.website === "string" && body.website.trim().length > 0) {
    return jsonResponse({ ok: true }, 200);
  }

  const category =
    typeof body.category === "string" ? body.category.trim() : "";
  const title =
    typeof body.title === "string" ? body.title.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  const turnstileToken =
    typeof body.turnstileToken === "string" ? body.turnstileToken.trim() : "";

  if (!category || !title || !description || !turnstileToken) {
    return jsonResponse({ ok: false, error: "missing_field" }, 400);
  }
  if (title.length > 256 || description.length > 5000) {
    return jsonResponse({ ok: false, error: "field_too_long" }, 400);
  }
  if (category !== "bug" && category !== "enhancement") {
    return jsonResponse({ ok: false, error: "invalid_category" }, 400);
  }

  // Verify Cloudflare Turnstile token.
  // Skip verification if the secret key isn't configured (local dev fallback).
  const tsSecret = env.CF_TURNSTILE_SECRET_KEY?.trim();
  if (tsSecret) {
    const tsRes = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: tsSecret, response: turnstileToken }),
      },
    );
    const tsData = (await tsRes.json()) as { success: boolean };
    if (!tsData.success) {
      return jsonResponse({ ok: false, error: "captcha_failed" }, 403);
    }
  } else {
    console.warn(
      "[feedback] CF_TURNSTILE_SECRET_KEY not configured — skipping Turnstile verification",
    );
  }

  // TODO: Create GitHub issue — uncomment and set GITHUB_TOKEN when ready.
  // const ghRes = await fetch(
  //   "https://api.github.com/repos/brian-dlptest/dlptest.com/issues",
  //   {
  //     method: "POST",
  //     headers: {
  //       Authorization: `Bearer ${env.GITHUB_TOKEN}`,
  //       "Content-Type": "application/json",
  //       Accept: "application/vnd.github+json",
  //       "X-GitHub-Api-Version": "2022-11-28",
  //       "User-Agent": "dlptest.com",
  //     },
  //     body: JSON.stringify({
  //       title,
  //       body: `**Submitted via dlptest.com feedback form**\n\n${description}`,
  //       labels: [category],
  //     }),
  //   },
  // );
  // if (!ghRes.ok) return jsonResponse({ ok: false, error: "github_error" }, 502);

  console.log("[feedback]", { category, title, descriptionLength: description.length });

  return jsonResponse({ ok: true }, 200);
};

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
