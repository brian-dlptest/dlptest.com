#!/usr/bin/env node
/**
 * Invoke a Cursor Cloud Agent to discover post-cutoff data-security news,
 * draft markdown under src/content/news/, commit, and open a PR (via SDK).
 *
 * Intended runners:
 *   - GitHub Actions (.github/workflows/news-draft.yml) — secrets.CURSOR_API_KEY
 *   - Local manual smoke test — export CURSOR_API_KEY and NEWS_REPO_URL
 *
 * Prerequisites:
 *   - Cursor Cloud Agents enabled for the GitHub repo (dashboard connection).
 *   - API key from https://cursor.com/dashboard/cloud-agents or team service account.
 *
 * Env:
 *   CURSOR_API_KEY       — required
 *   GITHUB_REPOSITORY    — owner/repo (Actions injects automatically)
 *   NEWS_REPO_URL        — optional full clone URL (default https://github.com/$GITHUB_REPOSITORY)
 *   NEWS_BASE_REF        — branch to fork from (default: staging)
 */

import { Agent, CursorAgentError } from "@cursor/sdk";

function repoCloneUrl() {
  if (process.env.NEWS_REPO_URL?.trim()) return process.env.NEWS_REPO_URL.trim();
  const slug = process.env.GITHUB_REPOSITORY?.trim();
  if (!slug) {
    console.error(
      "Missing NEWS_REPO_URL or GITHUB_REPOSITORY — cannot infer GitHub clone URL.",
    );
    process.exit(1);
  }
  return `https://github.com/${slug}`;
}

const PROMPT = `You are updating the Data Security News section for dlptest.com (Astro site; posts live in src/content/news/).

Read and follow scripts/news/EDITORIAL.md exactly — it defines what Brian publishes vs. what to skip.

## Goal
Find credible industry stories dated AFTER the newest pubDate across existing posts in src/content/news/*.md, then draft new Markdown posts that match the editorial bar (DLP, DSPM, insider risk, vendor funding/M&A — not generic AI governance surveys, academic papers, or compliance-only attestations).

## Procedure
1. Scan every file matching src/content/news/*.md. Parse YAML frontmatter and compute the maximum pubDate — call this CUTOFF (ISO instant).
2. Using web search / browsing, identify substantive stories after CUTOFF through today's UTC date. Prioritize: vendor funding, acquisitions, DLP/DSPM/endpoint DLP/insider-risk product news, Israeli security M&A (Calcalist, Globes), SecurityWeek, vendor press releases.
3. Exclude duplicates: skip if an existing slug or title clearly covers the same event.
4. Reject low-fit topics listed in EDITORIAL.md (data virtualization partner integrations, LF surveys, pure research, IRAP/FedRAMP-only posts, etc.) even if recent.
5. For each qualifying story, create ONE new file src/content/news/<slug>.md where:
   - Filename stem equals frontmatter slug (WordPress-style kebab-case, lowercase).
   - Frontmatter matches src/content.config.ts schema exactly:
     title (string), slug (string), pubDate (ISO 8601 with offset), categories (array — include "News" plus tags like "DLP", "DSPM", "data protection", "Endpoint DLP" when relevant), excerpt (~200–280 chars, plain text), sourceUrl (HTTPS canonical primary source — Calcalist, vendor PR, SecurityWeek, etc.; NOT dlptest.com).
     Optionally heroImage only if you have a durable vendor CDN URL; otherwise omit.
   - Body: practitioner synthesis like existing posts — bold company names on first mention; short ### subheads OK; no press-release paste; optional "what this means for DLP" angle.
6. Prefer 0–2 strong posts per run over padding with weak fits.
7. Run npm run check && npm run build — fix any schema or Astro errors before finishing.
8. Commit only new/edited news markdown files with message:
   feat(news): add industry posts since <CUTOFF date>

If nothing qualifies after search, commit nothing and reply explaining no stories met the bar — still exit successfully (no empty commits).

Stay factual; flag uncertainty briefly where sources conflict.`;

async function main() {
  const apiKey = process.env.CURSOR_API_KEY?.trim();
  if (!apiKey) {
    console.error("CURSOR_API_KEY is required.");
    process.exit(1);
  }

  const url = repoCloneUrl();
  const startingRef = process.env.NEWS_BASE_REF?.trim() || "staging";

  console.log(`Cloud agent repo: ${url}`);
  console.log(`startingRef:      ${startingRef}`);

  try {
    const result = await Agent.prompt(PROMPT, {
      apiKey,
      cloud: {
        repos: [{ url, startingRef }],
        autoCreatePR: true,
        skipReviewerRequest: false,
      },
    });

    console.log("run status:", result.status);
    console.log("run id:    ", result.id);
    if (result.git?.branches?.length) {
      for (const b of result.git.branches) {
        console.log("git branch:", JSON.stringify(b));
      }
    }
    if (result.result) console.log("summary:\n", result.result);

    if (result.status === "error") {
      process.exit(2);
    }
  } catch (err) {
    if (err instanceof CursorAgentError) {
      console.error("SDK startup failure:", err.message);
      process.exit(1);
    }
    throw err;
  }
}

await main();
