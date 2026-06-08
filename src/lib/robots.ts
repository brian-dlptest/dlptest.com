// robots.txt bodies, served dynamically by the middleware so the policy can
// differ per host/environment. A single static public/robots.txt can't do this
// — it ships identically to staging and prod, and (being a static asset) it
// also shadows the Worker. Serving from the middleware lets staging say
// "disallow everything" while production stays fully crawlable.

const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
  "Bytespider",
  "Meta-ExternalAgent",
  "Amazonbot",
  "DuckAssistBot",
];

/** Production policy: free, vendor-neutral resource — crawlers welcome. */
export const INDEXABLE_ROBOTS = [
  "# dlptest.com — robots policy",
  "#",
  "# This site is a free, vendor-neutral DLP testing resource. We deliberately",
  "# allow AI search and summarization bots so practitioners can discover and",
  "# share these guides through whichever tool they prefer.",
  "",
  "# Default policy",
  "User-agent: *",
  "Allow: /",
  "Disallow: /api/",
  "",
  "# Major AI assistants and search-style crawlers (explicitly allow)",
  ...AI_CRAWLERS.flatMap((ua) => [`User-agent: ${ua}`, "Allow: /", ""]),
  "Sitemap: https://dlptest.com/sitemap-index.xml",
  "",
].join("\n");

/**
 * Staging / preview policy: disallow everything, including AI crawlers, so the
 * unfinished/duplicate environment is never crawled, indexed, or used for AI.
 */
export const NOINDEX_ROBOTS = [
  "# Staging / preview — do not crawl, index, or use for AI training.",
  "User-agent: *",
  "Disallow: /",
  "",
  "# AI crawlers — explicitly disallowed here too.",
  ...AI_CRAWLERS.flatMap((ua) => [`User-agent: ${ua}`, "Disallow: /", ""]),
].join("\n");
