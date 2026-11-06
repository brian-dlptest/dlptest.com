/**
 * Tests for reviewer edits in /admin/news: what gets stored and what lands in
 * the published .md.
 *
 * Publishing commits straight to `main`, so frontmatter that won't parse fails
 * the production build. These run the rendered file through the same parser
 * Astro's content collections use.
 *
 * Loads the real src/lib/news-content.ts, which relies on Node's type stripping
 * (on by default from 22.18; CI uses the latest 22.x).
 */
import { parseFrontmatter } from "@astrojs/markdown-remark";

import {
  editsHash,
  MAX_BODY_LENGTH,
  MAX_EXCERPT_LENGTH,
  MAX_TITLE_LENGTH,
  normalizeEdits,
  renderMarkdown,
} from "../../src/lib/news-content.ts";

let fail = 0;
function check(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(`${ok ? "ok  " : "FAIL"}  ${name}`);
  if (!ok) {
    console.log(`      got  ${JSON.stringify(got)}`);
    console.log(`      want ${JSON.stringify(want)}`);
    fail += 1;
  }
}

const row = {
  id: 1,
  slug: "acme-dlp-raises-40m",
  title: "AI title",
  pubDate: "2026-06-17T13:00:00.000Z",
  categories: ["News", "DLP"],
  excerpt: "AI excerpt",
  sourceUrl: "https://example.com/story",
  heroImage: null,
  body: "AI body",
  why: null,
  status: "pending",
  discoveredAt: "2026-06-17T15:00:00.000Z",
  reviewedAt: null,
};

/** Normalize a submission, render it as published, and parse it back. */
function publishRoundTrip(fields) {
  const result = normalizeEdits(fields);
  if (!result.ok) throw new Error(`rejected: ${result.error}`);
  const { frontmatter, content } = parseFrontmatter(renderMarkdown({ ...row, ...result.edits }));
  return { title: frontmatter.title, excerpt: frontmatter.excerpt, body: content.trim() };
}

// Edited text reaches the published file.
check(
  "edited title, excerpt and body are in the .md",
  publishRoundTrip({ title: "My title", excerpt: "My excerpt", body: "AI body.\n\nMy own take." }),
  { title: "My title", excerpt: "My excerpt", body: "AI body.\n\nMy own take." },
);

// Browsers submit textarea line breaks as CRLF.
const crlf = normalizeEdits({ title: "T", excerpt: "", body: "One\r\n\r\nTwo\rThree\r\n" });
check("CRLF and CR in the body become LF", crlf.edits.body, "One\n\nTwo\nThree");
check("line-ending cleanup is not reported as stripped HTML", crlf.strippedHtml, false);
check(
  "the length limit counts LF line breaks, matching the textarea's maxlength",
  normalizeEdits({ title: "T", body: "a\r\n".repeat(MAX_BODY_LENGTH / 2).trim() }).ok,
  true,
);

// Frontmatter that would break the production build.
for (const [name, value] of [
  ["double quotes", 'He said "ship it"'],
  ["backslashes", "C:\\temp\\dlp"],
  ["a colon and a hash", "DLP: what # matters"],
  ["a trailing backslash", "ends with \\"],
  ["an emoji and accents", "Résumé 🚀"],
]) {
  check(`title and excerpt with ${name} survive YAML`, publishRoundTrip({ title: value, excerpt: value, body: "b" }), {
    title: value,
    excerpt: value,
    body: "b",
  });
}
check(
  "a line break plus --- in the excerpt can't end the frontmatter",
  publishRoundTrip({ title: "T", excerpt: "first\r\n---\r\nsecond", body: "b" }).excerpt,
  "first --- second",
);
check(
  "control characters don't reach the frontmatter",
  publishRoundTrip({ title: "a\u0000b\u000bc\u007fd\u0085e\ufffef", excerpt: "x\ty", body: "b" }),
  { title: "a b c d e f", excerpt: "x y", body: "b" },
);
check(
  "a body starting with a horizontal rule keeps the frontmatter intact",
  publishRoundTrip({ title: "T", excerpt: "", body: "---\n\nAfter the rule." }),
  { title: "T", excerpt: "", body: "---\n\nAfter the rule." },
);

// sanitizeBody still runs on edited text.
const html = normalizeEdits({ title: "T", body: "Keep <script>alert(1)</script>this <b>text</b>, and a < b." });
check("HTML is stripped from an edited body", html.edits.body, "Keep this text, and a < b.");
check("stripping HTML is reported", html.strippedHtml, true);
check(
  "renderMarkdown strips HTML from a stored body too",
  renderMarkdown({ ...row, body: "x <img src=x onerror=alert(1)> y" }).includes("onerror"),
  false,
);

// Limits and required fields.
const error = (fields) => normalizeEdits(fields).error ?? null;
check("empty title refused", error({ title: "", body: "b" }), "invalid_title");
check("whitespace-only title refused", error({ title: " \r\n ", body: "b" }), "invalid_title");
check("missing title refused", error({ body: "b" }), "invalid_title");
check("non-string title refused", error({ title: 7, body: "b" }), "invalid_title");
check("title at the limit accepted", error({ title: "t".repeat(MAX_TITLE_LENGTH), body: "b" }), null);
check("title over the limit refused", error({ title: "t".repeat(MAX_TITLE_LENGTH + 1), body: "b" }), "invalid_title");
check("empty excerpt accepted", error({ title: "T", excerpt: "", body: "b" }), null);
check("excerpt over the limit refused", error({ title: "T", excerpt: "e".repeat(MAX_EXCERPT_LENGTH + 1), body: "b" }), "excerpt_too_long");
check("empty body refused", error({ title: "T", body: "  \n " }), "invalid_body");
check("body that is only HTML refused", error({ title: "T", body: "<b></b>" }), "invalid_body");
check("body over the limit refused", error({ title: "T", body: "b".repeat(MAX_BODY_LENGTH + 1) }), "invalid_body");

// The out-of-date-tab fingerprint.
const a = { title: "T", excerpt: "E", body: "B" };
check("hash is stable for the same text", await editsHash(a), await editsHash({ ...a }));
check("hash covers the title", (await editsHash(a)) === (await editsHash({ ...a, title: "X" })), false);
check("hash covers the excerpt", (await editsHash(a)) === (await editsHash({ ...a, excerpt: "X" })), false);
check("hash covers the body", (await editsHash(a)) === (await editsHash({ ...a, body: "X" })), false);
check(
  "hash ignores other row columns, so the form and the row agree",
  await editsHash({ ...row, ...a }),
  await editsHash(a),
);

if (fail) {
  console.error(`\n${fail} check(s) failed`);
  process.exit(1);
}
console.log("\nAll edit checks passed.");
