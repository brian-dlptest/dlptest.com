import type { APIRoute } from "astro";
import { addSubscriber } from "@/lib/subscribe";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  let body: { email?: string; name?: string; company?: string };
  try {
    body = await request.json();
  } catch {
    return json({ message: "Invalid request body." }, 400);
  }

  const result = await addSubscriber({
    email: body.email ?? "",
    name: body.name ?? "",
    company: body.company,
  });

  if (result.status === "skipped") {
    return json({ message: "Subscribe is not configured." }, 503);
  }
  if (result.status === "error") {
    const status =
      result.message === "Email and name are required." ? 400 : 502;
    return json({ message: result.message }, status);
  }
  if (result.status === "already_subscribed") {
    return json({ message: "This email is already subscribed." }, 409);
  }

  return json({ ok: true }, 200);
};

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
