import type { APIRoute } from "astro";
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
  const subject = (form.get("subject") || "").toString().trim();
  const message = (form.get("message") || "").toString().trim();
  const subscribeUpdates = form.get("subscribe_updates") != null;

  if (!name || !email || !subject || !message) {
    return jsonResponse({ ok: false, error: "missing_field" }, 400);
  }

  const mail = await sendContactEmail({ name, email, subject, message });
  if (!mail.ok) {
    const status = mail.reason === "not_configured" ? 503 : 502;
    return jsonResponse(
      { ok: false, error: mail.reason, message: mail.message },
      status,
    );
  }

  if (subscribeUpdates) {
    await addSubscriber({ email, name });
  }

  return jsonResponse({ ok: true, message: "received" }, 200);
};

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
