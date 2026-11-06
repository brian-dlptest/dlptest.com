import type { CandidateRow } from "./news-candidates";

// Text rules for a news post: limits, cleanup of reviewer edits, HTML stripping
// and rendering to Markdown. No Worker imports, so scripts/news/edit.test.mjs
// can load this file directly under Node.

export const MAX_TITLE_LENGTH = 300;
export const MAX_EXCERPT_LENGTH = 600;
export const MAX_BODY_LENGTH = 20000;

/** The fields a reviewer can change in /admin/news. */
export type CandidateEdits = Pick<CandidateRow, "title" | "excerpt" | "body">;

export type EditError = "invalid_title" | "excerpt_too_long" | "invalid_body";

export type NormalizedEdits =
  | { ok: true; edits: CandidateEdits; strippedHtml: boolean }
  | { ok: false; error: EditError };

function asText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/**
 * Title and excerpt become YAML frontmatter. Publishing commits straight to
 * `main`, and a control character or a line starting with `---` there would
 * fail the production build, so both are kept to one line of printable text.
 */
function singleLine(value: string): string {
  return value
    .replace(/\s*[\u0000-\u001f\u007f-\u009f\u2028\u2029\ufffe\uffff]+\s*/g, " ")
    .trim();
}

/**
 * Clean and validate what the reviewer submitted. Browsers send textarea line
 * breaks as CRLF, so the body is normalized to LF before it is measured, stored
 * or published. `strippedHtml` is true when sanitizeBody removed something, so
 * the caller can tell the reviewer their text changed.
 */
export function normalizeEdits(raw: {
  title?: unknown;
  excerpt?: unknown;
  body?: unknown;
}): NormalizedEdits {
  const title = singleLine(asText(raw.title));
  if (!title || title.length > MAX_TITLE_LENGTH) return { ok: false, error: "invalid_title" };

  const excerpt = singleLine(asText(raw.excerpt));
  if (excerpt.length > MAX_EXCERPT_LENGTH) return { ok: false, error: "excerpt_too_long" };

  const unsanitized = asText(raw.body)
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .trim();
  const body = sanitizeBody(unsanitized);
  if (!body || body.length > MAX_BODY_LENGTH) return { ok: false, error: "invalid_body" };

  return { ok: true, edits: { title, excerpt, body }, strippedHtml: body !== unsanitized };
}

/**
 * Fingerprint of the editable text. The review page renders it into each form,
 * so a save from an out-of-date tab can be refused instead of overwriting newer
 * edits with older text.
 */
export async function editsHash({ title, excerpt, body }: CandidateEdits): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify([title, excerpt, body]));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Double-quote a YAML scalar, escaping backslashes and quotes. */
function yamlString(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

// Whole <script> and <style> blocks go, content included. A closing tag runs to
// the next `>`, because browsers also end the element on `</script foo>`.
const SCRIPT_BLOCK = /<script\b[\s\S]*?<\/script[^>]*>/gi;
const STYLE_BLOCK = /<style\b[\s\S]*?<\/style[^>]*>/gi;
const TAG = /<\/?[a-zA-Z][^>]*>/g;
// What is left of a tag after stripping: `<` before a letter, `/`, `!` or `?`.
const TAG_START = /<(?=[a-zA-Z/!?])/g;

/**
 * Strip HTML tags from the Markdown body so a malicious candidate (e.g. one that
 * slipped past ingest) can't inject <script> or event handlers into the live,
 * build-rendered page. Leaves prose punctuation like "a < b" intact.
 *
 * Stripping repeats until nothing changes, because removing one tag can join
 * the text around it into another: `<<b>img onerror=...>` becomes `<img ...>`.
 * Anything still shaped like the start of a tag afterwards, such as an
 * unterminated `<script` or a `<!--`, is escaped so Markdown shows it as text.
 * The result contains no tag start, so running it again changes nothing.
 */
export function sanitizeBody(body: string): string {
  let out = body;
  let previous: string;
  do {
    previous = out;
    out = out.replace(SCRIPT_BLOCK, "");
    out = out.replace(STYLE_BLOCK, "");
    out = out.replace(TAG, "");
  } while (out !== previous);
  return out.replace(TAG_START, "&lt;").trim();
}

/** Build the full `.md` file contents (frontmatter + body) for a candidate. */
export function renderMarkdown(candidate: CandidateRow): string {
  const lines = ["---"];
  lines.push(`title: ${yamlString(candidate.title)}`);
  lines.push(`slug: ${yamlString(candidate.slug)}`);
  // pubDate is an unquoted ISO instant, matching existing posts.
  lines.push(`pubDate: ${candidate.pubDate}`);
  const cats = candidate.categories.map((c) => yamlString(c)).join(", ");
  lines.push(`categories: [${cats}]`);
  lines.push(`excerpt: ${yamlString(candidate.excerpt)}`);
  if (candidate.sourceUrl) lines.push(`sourceUrl: ${yamlString(candidate.sourceUrl)}`);
  if (candidate.heroImage) lines.push(`heroImage: ${yamlString(candidate.heroImage)}`);
  lines.push("---", "");
  lines.push(sanitizeBody(candidate.body));
  lines.push("");
  return lines.join("\n");
}
