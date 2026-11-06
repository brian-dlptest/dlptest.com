import { env } from "cloudflare:workers";

import { editsHash, normalizeEdits, type CandidateEdits, type EditError } from "./news-content";

// Data-access layer for the News Review Queue (D1 table `news_candidates`).
// Every query uses D1 prepared statements with bound parameters — never string
// interpolation — so candidate-supplied values can't alter the SQL.

export type CandidateStatus = "pending" | "published" | "rejected";

/** A draft post as it arrives from the discovery job (pre-insert). */
export type DraftCandidate = {
  slug: string;
  title: string;
  pubDate: string;
  categories: string[];
  excerpt: string;
  sourceUrl?: string | null;
  heroImage?: string | null;
  body: string;
  why?: string | null;
};

/** A row as stored/returned from D1. */
export type CandidateRow = {
  id: number;
  slug: string;
  title: string;
  pubDate: string;
  categories: string[];
  excerpt: string;
  sourceUrl: string | null;
  heroImage: string | null;
  body: string;
  why: string | null;
  status: CandidateStatus;
  discoveredAt: string;
  reviewedAt: string | null;
};

// Slugs become filenames and live URLs — keep them to a safe, traversal-proof
// alphabet. Shared by the ingest and publish endpoints.
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type Db = D1Database;

function db(): Db {
  const handle = env.NEWS_DB;
  if (!handle) {
    throw new Error("NEWS_DB binding is not configured");
  }
  return handle;
}

type RawRow = {
  id: number;
  slug: string;
  title: string;
  pub_date: string;
  categories: string;
  excerpt: string;
  source_url: string | null;
  hero_image: string | null;
  body: string;
  why: string | null;
  status: CandidateStatus;
  discovered_at: string;
  reviewed_at: string | null;
};

function mapRow(row: RawRow): CandidateRow {
  let categories: string[] = [];
  try {
    const parsed = JSON.parse(row.categories);
    if (Array.isArray(parsed)) categories = parsed.filter((c) => typeof c === "string");
  } catch {
    // Malformed JSON shouldn't break the whole list render.
  }
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    pubDate: row.pub_date,
    categories,
    excerpt: row.excerpt,
    sourceUrl: row.source_url,
    heroImage: row.hero_image,
    body: row.body,
    why: row.why,
    status: row.status,
    discoveredAt: row.discovered_at,
    reviewedAt: row.reviewed_at,
  };
}

/**
 * Insert a draft as a `pending` candidate. Slug collisions (a story already in
 * the queue — pending, published, or rejected) are ignored so the same story
 * is never queued twice. Returns true when a new row was inserted.
 */
export async function insertCandidate(draft: DraftCandidate): Promise<boolean> {
  const now = new Date().toISOString();
  const result = await db()
    .prepare(
      `INSERT INTO news_candidates
         (slug, title, pub_date, categories, excerpt, source_url, hero_image, body, why, status, discovered_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
       ON CONFLICT(slug) DO NOTHING`,
    )
    .bind(
      draft.slug,
      draft.title,
      draft.pubDate,
      JSON.stringify(draft.categories ?? []),
      draft.excerpt ?? "",
      draft.sourceUrl ?? null,
      draft.heroImage ?? null,
      draft.body,
      draft.why ?? null,
      now,
    )
    .run();
  // D1 reports affected rows in meta.changes; 0 means the ON CONFLICT fired.
  return (result.meta?.changes ?? 0) > 0;
}

/** All slugs already known to the queue, in any status (for dedupe). */
export async function knownSlugs(): Promise<string[]> {
  const { results } = await db()
    .prepare(`SELECT slug FROM news_candidates`)
    .all<{ slug: string }>();
  return (results ?? []).map((r) => r.slug);
}

/** Candidates in a given status, newest first. */
export async function listByStatus(status: CandidateStatus): Promise<CandidateRow[]> {
  const { results } = await db()
    .prepare(
      `SELECT * FROM news_candidates WHERE status = ? ORDER BY discovered_at DESC, id DESC`,
    )
    .bind(status)
    .all<RawRow>();
  return (results ?? []).map(mapRow);
}

/** A single candidate by id, or null. */
export async function getCandidate(id: number): Promise<CandidateRow | null> {
  const row = await db()
    .prepare(`SELECT * FROM news_candidates WHERE id = ?`)
    .bind(id)
    .first<RawRow>();
  return row ? mapRow(row) : null;
}

/**
 * Overwrite the reviewer-editable text of a `pending` candidate. Rediscovering
 * the same story can't clobber this: insertCandidate ignores known slugs.
 * Returns true when the row was actually updated.
 */
export async function updateCandidateText(id: number, edits: CandidateEdits): Promise<boolean> {
  const result = await db()
    .prepare(
      `UPDATE news_candidates
          SET title = ?, excerpt = ?, body = ?
        WHERE id = ? AND status = 'pending'`,
    )
    .bind(edits.title, edits.excerpt, edits.body, id)
    .run();
  return (result.meta?.changes ?? 0) > 0;
}

export type ApplyEditsResult =
  | { ok: true; candidate: CandidateRow; strippedHtml: boolean }
  | { ok: false; error: EditError | "stale_edit" | "already_reviewed" };

/**
 * Clean and store submitted text, returning the candidate as it now stands. A
 * submission whose `base` no longer matches the stored text came from an
 * out-of-date tab and is refused, unless its text is already what's stored (a
 * double-click, say), which is a harmless no-op.
 */
export async function applyEdits(
  candidate: CandidateRow,
  fields: { title?: unknown; excerpt?: unknown; body?: unknown; base?: unknown },
): Promise<ApplyEditsResult> {
  const normalized = normalizeEdits(fields);
  if (!normalized.ok) return normalized;
  const { edits, strippedHtml } = normalized;

  const unchanged =
    edits.title === candidate.title &&
    edits.excerpt === candidate.excerpt &&
    edits.body === candidate.body;
  if (!unchanged) {
    if (typeof fields.base === "string" && fields.base !== (await editsHash(candidate))) {
      return { ok: false, error: "stale_edit" };
    }
    if (!(await updateCandidateText(candidate.id, edits))) {
      return { ok: false, error: "already_reviewed" };
    }
  }
  return { ok: true, candidate: { ...candidate, ...edits }, strippedHtml };
}

/**
 * Move a candidate to a terminal status. Only transitions FROM `pending` so a
 * double-click or replayed request can't re-review an already-decided row.
 * Returns true when the row was actually updated.
 */
export async function markReviewed(id: number, status: "published" | "rejected"): Promise<boolean> {
  const now = new Date().toISOString();
  const result = await db()
    .prepare(
      `UPDATE news_candidates
          SET status = ?, reviewed_at = ?
        WHERE id = ? AND status = 'pending'`,
    )
    .bind(status, now, id)
    .run();
  return (result.meta?.changes ?? 0) > 0;
}
