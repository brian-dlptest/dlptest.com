import { env } from "cloudflare:workers";

// Upstream the subscribe service POSTs to. The URL isn't secret, so a
// hardcoded default is fine; SUBSCRIBE_API_URL overrides it to point a given
// Worker at a different upstream. The API key, however, is read from the
// Worker's secret store at runtime (set via `wrangler secret put`) and is
// NEVER inlined into the build — mirroring src/lib/contact-email.ts.
const DEFAULT_SUBSCRIBE_URL =
  "https://dlp-test-subscribe-email-database-production.up.railway.app/api/contacts";

export type SubscribeResult =
  | { status: "added" }
  | { status: "already_subscribed" }
  | { status: "skipped" }
  | { status: "error"; message: string };

/** Add name and email to the Railway contacts list. */
export async function addSubscriber(params: {
  email: string;
  name: string;
  company?: string;
}): Promise<SubscribeResult> {
  const upstreamUrl = env.SUBSCRIBE_API_URL?.trim() || DEFAULT_SUBSCRIBE_URL;
  const apiKey = env.SUBSCRIBE_API_KEY?.trim();

  if (!apiKey) {
    return { status: "skipped" };
  }

  const email = params.email.trim();
  const name = params.name.trim();
  const company = params.company?.trim();

  if (!email || !name) {
    return { status: "error", message: "Email and name are required." };
  }

  try {
    const upstream = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({
        email,
        name,
        company: company || undefined,
      }),
    });

    if (upstream.ok) {
      return { status: "added" };
    }
    if (upstream.status === 409) {
      return { status: "already_subscribed" };
    }

    const data = (await upstream.json().catch(() => ({}))) as {
      message?: string;
    };
    return {
      status: "error",
      message: data.message || "Subscribe request failed.",
    };
  } catch {
    return {
      status: "error",
      message: "Unable to reach the subscribe service.",
    };
  }
}
