import { env } from "cloudflare:workers";

import type { DraftCandidate } from "./news-candidates";

// Daily digest email for the News Review Queue. Sent from the ingest endpoint
// after new candidates land, so Brian gets ONE "N stories waiting" nudge with a
// link to the review page instead of a pile of GitHub PR notifications.
//
// Uses the same Microsoft Graph client-credentials flow as contact-email.ts.
// The Graph token helper is intentionally duplicated (rather than exported from
// contact-email.ts) to keep the contact path untouched by this feature; if a
// third caller appears, factor both into a shared graph-mail.ts.

const GRAPH_SCOPE = "https://graph.microsoft.com/.default";

export type DigestResult =
  | { ok: true }
  | { ok: false; reason: "not_configured" | "send_failed"; message: string };

/** Strip CR/LF so candidate titles can't inject mail headers, and trim. */
function sanitizeHeaderText(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

/** Minimal HTML escaping for values interpolated into the HTML body. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Only allow http(s) source links through to the email. */
function safeUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

/**
 * Send the review-queue digest. `reviewUrl` is the absolute URL of the admin
 * review page (derived from the request origin by the caller). No-op-safe: if
 * Graph isn't configured or there are no candidates, returns without throwing.
 */
export async function sendNewsDigest(
  candidates: DraftCandidate[],
  reviewUrl: string,
): Promise<DigestResult> {
  if (candidates.length === 0) {
    return { ok: true };
  }

  const to = env.CONTACT_TO_EMAIL?.trim();
  const from = env.CONTACT_FROM_EMAIL?.trim() || "contact@dlptest.com";
  const tenantId = env.GRAPH_TENANT_ID?.trim();
  const clientId = env.GRAPH_CLIENT_ID?.trim();
  const clientSecret = env.GRAPH_CLIENT_SECRET?.trim();

  if (!to || !tenantId || !clientId || !clientSecret) {
    return {
      ok: false,
      reason: "not_configured",
      message: "Graph email delivery is not configured.",
    };
  }

  let accessToken: string;
  try {
    accessToken = await getGraphToken(tenantId, clientId, clientSecret);
  } catch (error) {
    console.error("Graph token request failed (news digest):", error);
    return { ok: false, reason: "send_failed", message: "token request failed" };
  }

  const count = candidates.length;
  const subject = `[DLP Test] ${count} news ${count === 1 ? "story" : "stories"} waiting for review`;

  const items = candidates
    .map((c) => {
      const title = escapeHtml(sanitizeHeaderText(c.title));
      const why = c.why ? `<div style="color:#555;font-size:14px;margin-top:2px">${escapeHtml(sanitizeHeaderText(c.why))}</div>` : "";
      const src = safeUrl(c.sourceUrl);
      const srcLink = src
        ? `<div style="font-size:13px;margin-top:2px"><a href="${escapeHtml(src)}">${escapeHtml(src)}</a></div>`
        : "";
      return `<li style="margin-bottom:14px"><strong>${title}</strong>${why}${srcLink}</li>`;
    })
    .join("");

  const reviewLink = escapeHtml(reviewUrl);
  const html = `
    <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:640px">
      <p>${count} new data-security ${count === 1 ? "story" : "stories"} ${count === 1 ? "is" : "are"} waiting in the review queue.</p>
      <ol style="padding-left:18px">${items}</ol>
      <p><a href="${reviewLink}" style="display:inline-block;background:#0b5fff;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Review &amp; publish</a></p>
      <p style="color:#888;font-size:12px">${reviewLink}</p>
    </div>`.trim();

  const sendUrl = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(from)}/sendMail`;

  try {
    const response = await fetch(sendUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          subject: sanitizeHeaderText(subject),
          body: { contentType: "HTML", content: html },
          toRecipients: [{ emailAddress: { address: to } }],
        },
        saveToSentItems: false,
      }),
    });

    if (response.ok) return { ok: true };

    const detail = await response.text().catch(() => "");
    console.error("Graph sendMail failed (news digest):", response.status, detail);
    return { ok: false, reason: "send_failed", message: "sendMail failed" };
  } catch (error) {
    console.error("Graph sendMail error (news digest):", error);
    return { ok: false, reason: "send_failed", message: "sendMail error" };
  }
}

async function getGraphToken(
  tenantId: string,
  clientId: string,
  clientSecret: string,
): Promise<string> {
  const tokenUrl = `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`;

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
