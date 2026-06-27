import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { sendContactEmail } from "@/lib/contact-email";
import { addSubscriber } from "@/lib/subscribe";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonResponse({ ok: false, error: "bad_request" }, 400);
  }

  // Honeypot — silently 200 to anything that filled the hidden field.
  if ((form.get("website") || "").toString().trim().length > 0) {
    return jsonResponse({ ok: true }, 200);
  }

  const name = (form.get("name") || "").toString().trim();
  const email = (form.get("email") || "").toString().trim();
  const company = (form.get("company") || "").toString().trim();
  const subject = (form.get("subject") || "").toString().trim();
  const message = (form.get("message") || "").toString().trim();
  const turnstileToken = (form.get("turnstileToken") || "").toString().trim();
  const subscribeUpdates = form.get("subscribe_updates") != null;

  if (!name || !email || !subject || !message) {
    return jsonResponse({ ok: false, error: "missing_field" }, 400);
  }

  // Verify Cloudflare Turnstile token to block form-spam bots.
  // Skip verification if the secret key isn't configured (local dev fallback) —
  // mirrors src/pages/api/feedback.ts.
  const tsSecret = env.CF_TURNSTILE_SECRET_KEY?.trim();
  if (tsSecret) {
    if (!turnstileToken) {
      return jsonResponse({ ok: false, error: "captcha_failed" }, 403);
    }
    const tsRes = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: tsSecret, response: turnstileToken }),
      },
    );
    const tsData = (await tsRes.json()) as {
      success: boolean;
      "error-codes"?: string[];
    };
    if (!tsData.success) {
      // Log Cloudflare's error-codes so the cause is diagnosable from
      // `wrangler tail` — e.g. "invalid-input-secret" (secret doesn't match
      // the site key) vs "timeout-or-duplicate" (token already used/expired).
      console.error(
        "[contact] Turnstile siteverify failed",
        tsData["error-codes"] ?? [],
      );
      return jsonResponse({ ok: false, error: "captcha_failed" }, 403);
    }
  } else {
    console.warn(
      "[contact] CF_TURNSTILE_SECRET_KEY not configured — skipping Turnstile verification",
    );
  }

  const mail = await sendContactEmail({
    name,
    email,
    company: company || undefined,
    subject,
    message,
  });
  if (!mail.ok) {
    const status = mail.reason === "not_configured" ? 503 : 502;
    return jsonResponse(
      { ok: false, error: mail.reason, message: mail.message },
      status,
    );
  }

  if (subscribeUpdates) {
    await addSubscriber({ email, name, company: company || undefined });
  }

  return jsonResponse({ ok: true, message: "received" }, 200);
};

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
