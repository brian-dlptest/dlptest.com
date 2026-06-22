import { env } from "cloudflare:workers";

const GRAPH_SCOPE = "https://graph.microsoft.com/.default";

export type ContactEmailPayload = {
  name: string;
  email: string;
  company?: string;
  subject: string;
  message: string;
};

export type ContactEmailResult =
  | { ok: true }
  | { ok: false; reason: "not_configured" | "send_failed"; message: string };

/**
 * Deliver a contact form submission through Microsoft Graph (Office 365 /
 * Exchange Online) using the OAuth2 client-credentials flow.
 *
 * Required configuration:
 *   - GRAPH_TENANT_ID     (secret) — Entra ID directory/tenant ID
 *   - GRAPH_CLIENT_ID     (secret) — app registration client ID
 *   - GRAPH_CLIENT_SECRET (secret) — app registration client secret
 *   - CONTACT_FROM_EMAIL  (var)    — mailbox to send AS (the Graph user id)
 *   - CONTACT_TO_EMAIL    (var)    — where submissions are delivered
 *
 * The app registration needs the Microsoft Graph *application* permission
 * `Mail.Send` (admin-consented). Lock it to the single sending mailbox with an
 * Exchange Application Access Policy.
 *
 * @see https://learn.microsoft.com/en-us/graph/api/user-sendmail
 */
export async function sendContactEmail(
  payload: ContactEmailPayload,
): Promise<ContactEmailResult> {
  const to = env.CONTACT_TO_EMAIL?.trim();
  const from = env.CONTACT_FROM_EMAIL?.trim() || "contact@dlptest.com";
  const tenantId = env.GRAPH_TENANT_ID?.trim();
  const clientId = env.GRAPH_CLIENT_ID?.trim();
  const clientSecret = env.GRAPH_CLIENT_SECRET?.trim();

  if (!to || !tenantId || !clientId || !clientSecret) {
    return {
      ok: false,
      reason: "not_configured",
      message: "Contact email delivery is not configured.",
    };
  }

  let accessToken: string;
  try {
    accessToken = await getGraphToken(tenantId, clientId, clientSecret);
  } catch (error) {
    console.error("Graph token request failed:", error);
    return {
      ok: false,
      reason: "send_failed",
      message: "Failed to send your message. Please try again later.",
    };
  }

  const mailSubject = `[DLP Test] ${payload.subject}`;
  const text = [
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
    ...(payload.company ? [`Company: ${payload.company}`] : []),
    "",
    payload.message,
  ].join("\n");

  const sendUrl = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
    from,
  )}/sendMail`;

  try {
    const response = await fetch(sendUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          subject: mailSubject,
          body: { contentType: "Text", content: text },
          toRecipients: [{ emailAddress: { address: to } }],
          replyTo: [
            { emailAddress: { address: payload.email, name: payload.name } },
          ],
        },
        saveToSentItems: false,
      }),
    });

    // Graph sendMail returns 202 Accepted with an empty body on success.
    if (response.ok) {
      return { ok: true };
    }

    const detail = await response.text().catch(() => "");
    console.error("Graph sendMail failed:", response.status, detail);

    return {
      ok: false,
      reason: "send_failed",
      message: "Failed to send your message. Please try again later.",
    };
  } catch (error) {
    console.error("Graph sendMail error:", error);
    return {
      ok: false,
      reason: "send_failed",
      message: "Failed to send your message. Please try again later.",
    };
  }
}

async function getGraphToken(
  tenantId: string,
  clientId: string,
  clientSecret: string,
): Promise<string> {
  const tokenUrl = `https://login.microsoftonline.com/${encodeURIComponent(
    tenantId,
  )}/oauth2/v2.0/token`;

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: GRAPH_SCOPE,
    grant_type: "client_credentials",
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`token endpoint ${response.status}: ${detail}`);
  }

  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error("token endpoint returned no access_token");
  }
  return data.access_token;
}
