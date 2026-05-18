const upstreamUrl =
  import.meta.env.PUBLIC_SUBSCRIBE_API_URL ??
  "https://dlp-test-subscribe-email-database-production.up.railway.app/api/contacts";
const apiKey = import.meta.env.PUBLIC_SUBSCRIBE_API_KEY ?? "";

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
