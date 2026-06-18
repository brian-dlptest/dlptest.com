import { env } from "cloudflare:workers";

import { SLUG_PATTERN, type CandidateRow } from "./news-candidates";

// Publishing = committing a generated Markdown post to git on both deploy
// branches, which the normal CI deploy ships to staging.dlptest.com and
// dlptest.com. Git stays the source of truth for live content; the review queue
// is only a staging area.

// owner/repo that holds the site content (same repo the feedback form targets).
const CONTENT_REPO = "brian-dlptest/dlptest.com";
// Branches to commit to. Publishing straight to live is the deliberate design:
// the Access-gated review page IS the approval gate, so the PR step is removed.
const PUBLISH_BRANCHES = ["main", "staging"];

export type PublishResult =
  | { ok: true; branches: string[] }
  | { ok: false; reason: "not_configured" | "exists" | "commit_failed"; message: string };

/** Double-quote a YAML scalar, escaping backslashes and quotes. */
function yamlString(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/**
 * Strip HTML tags from the Markdown body so a malicious candidate (e.g. one that
 * slipped past ingest) can't inject <script> or event handlers into the live,
 * build-rendered page. Leaves prose punctuation like "a < b" intact (only
 * tag-shaped `</?tag ...>` sequences are removed).
 */
export function sanitizeBody(body: string): string {
  return body
    .replace(/<\s*script[\s\S]*?<\s*\/\s*script\s*>/gi, "")
    .replace(/<\s*style[\s\S]*?<\s*\/\s*style\s*>/gi, "")
    .replace(/<\/?[a-zA-Z][^>]*>/g, "")
    .trim();
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

function ghHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "dlptest.com-news-publish",
  };
}

/** base64-encode UTF-8 content for the GitHub contents API. */
function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

/**
 * Commit the candidate's Markdown to src/content/news/<slug>.md on both deploy
 * branches. Fails if the file already exists on a branch (slug already
 * published). Token: NEWS_COMMIT_TOKEN, falling back to GITHUB_TOKEN — needs
 * `contents: write` on the repo.
 */
export async function publishCandidate(candidate: CandidateRow): Promise<PublishResult> {
  if (!SLUG_PATTERN.test(candidate.slug)) {
    return { ok: false, reason: "commit_failed", message: "invalid slug" };
  }

  const token = (env.NEWS_COMMIT_TOKEN || env.GITHUB_TOKEN)?.trim();
  if (!token) {
    return { ok: false, reason: "not_configured", message: "no commit token configured" };
  }

  const path = `src/content/news/${candidate.slug}.md`;
  const content = toBase64(renderMarkdown(candidate));
  const message = `news: publish ${candidate.slug}`;
  const committed: string[] = [];

  for (const branch of PUBLISH_BRANCHES) {
    const url = `https://api.github.com/repos/${CONTENT_REPO}/contents/${encodeURI(path)}`;
    const res = await fetch(url, {
      method: "PUT",
      headers: ghHeaders(token),
      body: JSON.stringify({ message, content, branch }),
    });

    if (res.ok) {
      committed.push(branch);
      continue;
    }

    const detail = await res.text().catch(() => "");
    // 422 with "sha" wording means the file already exists on that branch.
    if (res.status === 422 && /sha/i.test(detail)) {
      console.error(`[news-publish] ${path} already exists on ${branch}`);
      return { ok: false, reason: "exists", message: `${candidate.slug} already published on ${branch}` };
    }
    console.error(`[news-publish] commit failed on ${branch}`, res.status, detail);
    return {
      ok: false,
      reason: "commit_failed",
      message: `commit to ${branch} failed (${res.status})`,
    };
  }

  return { ok: true, branches: committed };
}
