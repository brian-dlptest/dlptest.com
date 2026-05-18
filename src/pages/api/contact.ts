import type { APIRoute } from "astro";
import { addSubscriber } from "@/lib/subscribe";

export const prerender = false;

// Contact form handler. Reads the submission, validates the honeypot, and
// returns 200. Email delivery (MailChannels / Resend) is intentionally
// deferred until the form goes live; in this scaffold we just acknowledge
// and discard. The submission is NOT logged or persisted.
//
// When subscribe_updates is checked, name and email are also sent to the
// contacts list via the Railway subscribe API (best-effort; does not block
// the contact acknowledgement).
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
  const subject = (form.get("subject") || "").toString().trim();
  const message = (form.get("message") || "").toString().trim();
  const subscribeUpdates = form.get("subscribe_updates") != null;

  if (!name || !email || !subject || !message) {
    return jsonResponse({ ok: false, error: "missing_field" }, 400);
  }

  if (subscribeUpdates) {
    await addSubscriber({ email, name });
  }

  // TODO: send via MailChannels or Resend once the domain is on Cloudflare
  // and SPF/DKIM are in place.
  return jsonResponse({ ok: true, message: "received" }, 200);
};

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
};
