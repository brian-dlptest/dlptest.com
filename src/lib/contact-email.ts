import { env } from "cloudflare:workers";

const MAILCHANNELS_SEND_URL = "https://api.mailchannels.net/tx/v1/send";

export type ContactEmailPayload = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export type ContactEmailResult =
  | { ok: true }
  | { ok: false; reason: "not_configured" | "send_failed"; message: string };

/**
 * Deliver a contact form submission via the MailChannels Email API.
 * Requires CONTACT_TO_EMAIL, a verified From address on dlptest.com, Domain
 * Lockdown DNS, and (for the current paid API) MAILCHANNELS_API_KEY.
 *
 * @see https://support.mailchannels.com/hc/en-us/articles/4565898358413
 */
export async function sendContactEmail(
  payload: ContactEmailPayload,
): Promise<ContactEmailResult> {
  const to = env.CONTACT_TO_EMAIL?.trim();
  const from =
    env.CONTACT_FROM_EMAIL?.trim() || "contact@dlptest.com";
  const apiKey = env.MAILCHANNELS_API_KEY?.trim();

  if (!to) {
    return {
      ok: false,
      reason: "not_configured",
      message: "Contact email delivery is not configured.",
    };
  }

  const mailSubject = `[DLP Test] ${payload.subject}`;
  const text = [
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
    "",
    payload.message,
  ].join("\n");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey) {
    headers["X-Api-Key"] = apiKey;
  }

  try {
    const response = await fetch(MAILCHANNELS_SEND_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to, name: "DLP Test" }] }],
        from: { email: from, name: "DLP Test Contact" },
        reply_to: { email: payload.email, name: payload.name },
        subject: mailSubject,
        content: [{ type: "text/plain", value: text }],
      }),
    });

    if (response.ok) {
      return { ok: true };
    }

    const detail = await response.text().catch(() => "");
    console.error("MailChannels contact send failed:", response.status, detail);

    return {
      ok: false,
      reason: "send_failed",
      message: "Failed to send your message. Please try again later.",
    };
  } catch (error) {
    console.error("MailChannels contact send error:", error);
    return {
      ok: false,
      reason: "send_failed",
      message: "Failed to send your message. Please try again later.",
    };
  }
}
