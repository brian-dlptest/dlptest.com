import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

import {
  insertCandidate,
  knownSlugs,
  SLUG_PATTERN,
  type DraftCandidate,
} from "@/lib/news-candidates";
import { sendNewsDigest } from "@/lib/news-digest";

export const prerender = false;

// GET returns every slug already known to the queue (any status) so the
// discovery job can skip stories it has seen — including ones already rejected,
// which never appear in the repo. Same Bearer secret as POST.
export const GET: APIRoute = async ({ request }) => {
  const auth = await authorize(request);
  if (auth) return auth;
  try {
    const slugs = await knownSlugs();
    return json({ ok: true, slugs }, 200);
  } catch (error) {
    console.error("knownSlugs failed:", error);
    return json({ ok: false, error: "db_error" }, 500);
  }
};

// Ingest endpoint for the daily Claude discovery job (scripts/news/discover.mjs).
// It POSTs drafted candidates here; we validate, insert them as `pending`, and
// send one digest email. This is the trust boundary: a valid Bearer secret is
// required, and nothing here publishes to the live site — candidates can only
// ever enter the review queue, which is gated behind Cloudflare Access.

const MAX_BATCH = 25;

type IncomingCandidate = {
  slug?: unknown;
  title?: unknown;
  pubDate?: unknown;
  categories?: unknown;
  excerpt?: unknown;
  sourceUrl?: unknown;
  heroImage?: unknown;
  body?: unknown;
  why?: unknown;
};

export const POST: APIRoute = async ({ request }) => {
  const auth = await authorize(request);
  if (auth) return auth;

  let payload: { candidates?: unknown };
  try {
    payload = (await request.json()) as { candidates?: unknown };
  } catch {
    return json({ ok: false, error: "bad_json" }, 400);
  }

  const list = payload.candidates;
  if (!Array.isArray(list)) {
    return json({ ok: false, error: "candidates_must_be_array" }, 400);
  }
  if (list.length > MAX_BATCH) {
    return json({ ok: false, error: "batch_too_large", max: MAX_BATCH }, 400);
  }

  const drafts: DraftCandidate[] = [];
  const rejected: { index: number; reason: string }[] = [];
  list.forEach((raw, index) => {
    const result = validate(raw as IncomingCandidate);
    if (result.ok) drafts.push(result.draft);
    else rejected.push({ index, reason: result.reason });
  });

  let inserted = 0;
  const insertedDrafts: DraftCandidate[] = [];
  for (const draft of drafts) {
    try {
      if (await insertCandidate(draft)) {
        inserted += 1;
        insertedDrafts.push(draft);
      }
    } catch (error) {
      console.error("insertCandidate failed:", draft.slug, error);
      rejected.push({ index: -1, reason: `insert_failed:${draft.slug}` });
    }
  }

  // One digest for everything newly queued. Best-effort: a mail failure must not
  // fail the ingest (the candidates are already safely stored).
  let digestSent = false;
  if (insertedDrafts.length > 0) {
    const reviewUrl = new URL("/admin/news/", request.url).toString();
    try {
      const digest = await sendNewsDigest(insertedDrafts, reviewUrl);
      digestSent = digest.ok;
      if (!digest.ok) console.error("news digest not sent:", digest.reason, digest.message);
    } catch (error) {
      console.error("news digest threw:", error);
    }
  }

  return json(
    {
      ok: true,
      received: list.length,
      inserted,
      skipped: drafts.length - inserted,
      rejected,
      digestSent,
    },
    200,
  );
};

type ValidationResult =
  | { ok: true; draft: DraftCandidate }
  | { ok: false; reason: string };

function validate(c: IncomingCandidate): ValidationResult {
  const slug = str(c.slug);
  if (!slug || !SLUG_PATTERN.test(slug) || slug.length > 200) {
    return { ok: false, reason: "invalid_slug" };
  }
  const title = str(c.title);
  if (!title || title.length > 300) return { ok: false, reason: "invalid_title" };

  const pubDate = str(c.pubDate);
  if (!pubDate || Number.isNaN(Date.parse(pubDate))) {
    return { ok: false, reason: "invalid_pubDate" };
  }

  const body = str(c.body);
  if (!body || body.length > 20000) return { ok: false, reason: "invalid_body" };

  const excerpt = str(c.excerpt) ?? "";
  if (excerpt.length > 600) return { ok: false, reason: "excerpt_too_long" };

  let categories: string[] = [];
  if (Array.isArray(c.categories)) {
    categories = c.categories
      .filter((x): x is string => typeof x === "string")
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 12);
  }

  const sourceUrl = httpUrl(c.sourceUrl);
  if (c.sourceUrl != null && c.sourceUrl !== "" && !sourceUrl) {
    return { ok: false, reason: "invalid_sourceUrl" };
  }
  const heroImage = httpUrl(c.heroImage);
  if (c.heroImage != null && c.heroImage !== "" && !heroImage) {
    return { ok: false, reason: "invalid_heroImage" };
  }

  const why = str(c.why);

  return {
    ok: true,
    draft: {
      slug,
      title,
      pubDate: new Date(pubDate).toISOString(),
      categories,
      excerpt,
      sourceUrl,
      heroImage,
      body,
      why: why && why.length <= 300 ? why : null,
    },
  };
}

function str(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function httpUrl(value: unknown): string | null {
  const s = str(value);
  if (!s) return null;
  try {
    const u = new URL(s);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

/**
 * Shared Bearer-secret gate for both verbs. Returns a Response to short-circuit
 * with on failure, or null when the request is authorized.
 */
async function authorize(request: Request): Promise<Response | null> {
  const secret = env.NEWS_INGEST_SECRET?.trim();
  if (!secret) return json({ ok: false, error: "not_configured" }, 503);
  const provided = bearer(request.headers.get("authorization"));
  if (!provided || !(await timingSafeEqual(provided, secret))) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }
  return null;
}

function bearer(header: string | null): string | null {
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1].trim() : null;
}

// Constant-time comparison that doesn't leak length: hash both sides to a fixed
// 32-byte digest, then compare the digests with a constant-time XOR fold.
async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  const va = new Uint8Array(ha);
  const vb = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < va.length; i++) diff |= va[i] ^ vb[i];
  return diff === 0;
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
