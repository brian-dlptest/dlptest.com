import type { APIRoute } from "astro";

const upstreamUrl =
  import.meta.env.PUBLIC_SUBSCRIBE_API_URL ??
  "https://dlp-test-subscribe-email-database-production.up.railway.app/api/contacts";
const apiKey = import.meta.env.PUBLIC_SUBSCRIBE_API_KEY ?? "";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  if (!apiKey) {
    return json({ message: "Subscribe is not configured." }, 503);
  }

  let body: { email?: string; name?: string; company?: string };
  try {
    body = await request.json();
  } catch {
    return json({ message: "Invalid request body." }, 400);
  }

  const email = body.email?.trim() ?? "";
  const name = body.name?.trim() ?? "";
  const company = body.company?.trim();

  if (!email || !name) {
    return json({ message: "Email and name are required." }, 400);
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

    const data = await upstream.json().catch(() => ({}));
    return json(data, upstream.status);
  } catch {
    return json(
      { message: "Unable to reach the subscribe service. Please try again." },
      502,
    );
  }
};

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
