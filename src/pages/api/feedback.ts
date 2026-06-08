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
  // Optional self-attribution. Validated as a real GitHub handle; anything
  // else (including empty) is treated as anonymous.
  const githubUser = parseGithubUsername(body.githubUsername);

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

  // Create a GitHub issue from the submission.
  // Skip if the token isn't configured (local dev fallback) — mirrors the
  // Turnstile skip above so the form still "works" locally without secrets.
  const ghToken = env.GITHUB_TOKEN?.trim();
  if (ghToken) {
    const ghRes = await fetch(
      `https://api.github.com/repos/${FEEDBACK_REPO}/issues`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ghToken}`,
          "Content-Type": "application/json",
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          // GitHub rejects requests without a User-Agent.
          "User-Agent": "dlptest.com-feedback",
        },
        body: JSON.stringify({
          title,
          body: issueBody(description, githubUser),
          labels: [category],
        }),
      },
    );
    if (!ghRes.ok) {
      // Log status + detail server-side; don't leak GitHub internals to the client.
      const detail = await ghRes.text().catch(() => "");
      console.error("[feedback] GitHub issue creation failed", ghRes.status, detail);
      return jsonResponse({ ok: false, error: "github_error" }, 502);
    }
  } else {
    console.warn(
      "[feedback] GITHUB_TOKEN not configured — skipping issue creation",
    );
  }

  console.log("[feedback]", { category, title, descriptionLength: description.length });

  return jsonResponse({ ok: true }, 200);
};

/** owner/repo that receives feedback issues. */
const FEEDBACK_REPO = "brian-dlptest/dlptest.com";

/**
 * Validate an optional, user-supplied GitHub username. Strips a leading "@"
 * and enforces GitHub's handle rules (1–39 chars, alphanumeric or single
 * internal hyphens, no leading/trailing hyphen). Returns "" for anything that
 * doesn't match — so a junk value silently falls back to anonymous rather than
 * producing a broken profile link.
 */
function parseGithubUsername(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const handle = raw.trim().replace(/^@/, "");
  return /^[a-zA-Z0-9](?:-?[a-zA-Z0-9])*$/.test(handle) && handle.length <= 39
    ? handle
    : "";
}

/**
 * Wrap the user-submitted description for the issue body. The description is
 * untrusted free text rendered as Markdown — note that for the maintainer
 * reading the issue. `githubUser` is already validated; it's rendered as a
 * plain profile link (NOT a bare @-mention), so a submitter can self-attribute
 * without us pinging arbitrary GitHub users.
 */
function issueBody(description: string, githubUser: string): string {
  const attribution = githubUser
    ? `_Submitted via the dlptest.com feedback form by [@${githubUser}](https://github.com/${githubUser})._`
    : "_Submitted anonymously via the dlptest.com feedback form._";
  return [attribution, "", description].join("\n");
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
