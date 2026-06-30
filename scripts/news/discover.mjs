#!/usr/bin/env node
/**
 * Daily data-security news discovery, powered by Claude.
 *
 * Replaces the former Cursor Cloud Agent (scripts/news/run-cloud-draft.mjs).
 * Instead of opening pull requests, this drafts candidate posts and POSTs them
 * to the site's review queue (/api/news/candidates), where they wait for a
 * human Publish/Delete decision behind Cloudflare Access. Nothing here touches
 * the live site.
 *
 * Pipeline:
 *   1. Compute CUTOFF = newest pubDate across src/content/news/*.md.
 *   2. Fetch slugs already known to the queue (published + rejected) so we don't
 *      resurface anything — combined with the repo's own slugs.
 *   3. Research: Claude + web_search finds qualifying stories after CUTOFF,
 *      following scripts/news/EDITORIAL.md.
 *   4. Extract: a second, tool-free Claude call turns the research into
 *      structured candidate posts (JSON schema — no citations, no conflict).
 *   5. POST the candidates to the ingest endpoint (Bearer NEWS_INGEST_SECRET).
 *
 * Env:
 *   ANTHROPIC_API_KEY    — required
 *   NEWS_INGEST_SECRET   — required; Bearer secret for the ingest endpoint
 *   NEWS_SITE_URL        — optional; default https://dlptest.com
 *   NEWS_DIR             — optional; default src/content/news
 */

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-opus-4-8";
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(SCRIPT_DIR, "..", "..");

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`Missing required env var ${name}.`);
    process.exit(1);
  }
  return value;
}

/** Newest pubDate across all existing posts → ISO cutoff. */
function computeCutoff(newsDir) {
  const files = readdirSync(newsDir).filter((f) => f.endsWith(".md"));
  let max = 0;
  for (const file of files) {
    const text = readFileSync(join(newsDir, file), "utf8");
    const match = /^pubDate:\s*(.+)$/m.exec(text);
    if (!match) continue;
    const ts = Date.parse(match[1].trim().replace(/^["']|["']$/g, ""));
    if (!Number.isNaN(ts) && ts > max) max = ts;
  }
  return max > 0 ? new Date(max) : new Date(Date.now() - 14 * 864e5);
}

/** Slugs from existing repo filenames. */
function repoSlugs(newsDir) {
  return readdirSync(newsDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

/** Slugs already in the queue (published + rejected + pending). Best-effort. */
async function fetchKnownSlugs(siteUrl, secret) {
  try {
    const res = await fetch(new URL("/api/news/candidates/", siteUrl), {
      headers: { authorization: `Bearer ${secret}` },
    });
    if (!res.ok) {
      console.warn(`known-slugs fetch returned ${res.status}; continuing with repo slugs only.`);
      return [];
    }
    const data = await res.json();
    return Array.isArray(data.slugs) ? data.slugs : [];
  } catch (error) {
    console.warn("known-slugs fetch failed; continuing with repo slugs only:", error.message);
    return [];
  }
}

/** Phase 1 — research qualifying stories with web search. */
async function research(client, { editorial, cutoffIso, excludeSlugs, today }) {
  const prompt = `You are the editor for the Data Security News section of dlptest.com — practitioner notes for DLP/DSPM/insider-risk buyers.

Follow these editorial rules EXACTLY:
----- EDITORIAL.md -----
${editorial}
------------------------

Task: using web search, find credible industry stories published AFTER ${cutoffIso} and up to today (${today}) that meet the editorial bar (vendor funding, M&A, DLP/DSPM/endpoint-DLP/insider-risk product news; not generic AI-governance surveys, academic papers, or compliance-only attestations).

Do NOT include any story whose slug would collide with these already-covered slugs (kebab-case the headline to compare):
${excludeSlugs.length ? excludeSlugs.map((s) => `- ${s}`).join("\n") : "(none)"}

Prefer 0–2 strong stories over padding with weak fits. If nothing qualifies, say so explicitly.

For each qualifying story, write a short briefing: the headline, the primary source URL (canonical vendor PR / Calcalist / SecurityWeek — never dlptest.com), the publication date, and 3–5 sentences of practitioner synthesis including the DLP/DSPM angle. Stay factual and flag uncertainty where sources conflict.`;

  const tools = [{ type: "web_search_20260209", name: "web_search" }];
  let response = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    tools,
    messages: [{ role: "user", content: prompt }],
  });

  // Server-side web_search loop can pause after its iteration cap — resume.
  let guard = 0;
  const messages = [{ role: "user", content: prompt }];
  while (response.stop_reason === "pause_turn" && guard < 5) {
    messages.push({ role: "assistant", content: response.content });
    response = await client.messages.create({
      model: MODEL,
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      tools,
      messages,
    });
    guard += 1;
  }

  return response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

/** Phase 2 — turn the research text into structured candidate posts. */
async function extract(client, { report, cutoffIso }) {
  if (!report || /no (qualifying|stories|story)/i.test(report) && report.length < 400) {
    return [];
  }

  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      candidates: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            slug: { type: "string", description: "kebab-case, lowercase, [a-z0-9-] only" },
            title: { type: "string" },
            pubDate: { type: "string", description: "ISO 8601 with offset, after the cutoff" },
            categories: { type: "array", items: { type: "string" } },
            excerpt: { type: "string", description: "~200-280 chars, plain text" },
            sourceUrl: { type: "string", description: "canonical https source (not dlptest.com)" },
            body: { type: "string", description: "Markdown body; bold company names on first mention; no frontmatter" },
            why: { type: "string", description: "one line on why this clears the editorial bar" },
          },
          required: ["slug", "title", "pubDate", "categories", "excerpt", "sourceUrl", "body", "why"],
        },
      },
    },
    required: ["candidates"],
  };

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    output_config: { format: { type: "json_schema", schema } },
    messages: [
      {
        role: "user",
        content: `Cutoff (exclusive): ${cutoffIso}. Convert the research briefing below into structured candidate posts. Always include "News" in categories plus relevant lowercase topical tags (DLP, DSPM, Endpoint DLP, Insider Risk Management, data protection). The body should read like an informed practitioner note, not a press-release paste. If the briefing concludes nothing qualified, return an empty candidates array.\n\n----- RESEARCH -----\n${report}`,
      },
    ],
  });

  const text = response.content.find((b) => b.type === "text")?.text ?? "{}";
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed.candidates) ? parsed.candidates : [];
  } catch (error) {
    console.error("Failed to parse structured extraction output:", error.message);
    console.error("Raw:", text.slice(0, 500));
    return [];
  }
}

async function ingest(siteUrl, secret, candidates) {
  const res = await fetch(new URL("/api/news/candidates/", siteUrl), {
    method: "POST",
    headers: {
      authorization: `Bearer ${secret}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ candidates }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`ingest failed ${res.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

/**
 * True when an error is a non-actionable operational condition rather than a
 * code bug — chiefly an exhausted Anthropic credit balance. The daily cron
 * shouldn't go red (and spam failure emails) every morning until billing is
 * topped up, so we soft-exit on these.
 */
function isSoftApiError(error) {
  if (!error || typeof error !== "object") return false;
  const status = error.status;
  // Drill into the SDK's structured body as well as the flattened message.
  const message = [
    error.message,
    error.error?.error?.message,
    error.error?.message,
  ]
    .filter((s) => typeof s === "string")
    .join(" ")
    .toLowerCase();
  if (/credit balance is too low/.test(message)) return true;
  if (/billing|insufficient.*(credit|quota)|quota.*exceeded/.test(message)) return true;
  // Capacity blips: overloaded (529) and rate limits (429) are transient.
  if (status === 429 || status === 529) return true;
  return false;
}

async function main() {
  const apiKey = requireEnv("ANTHROPIC_API_KEY");
  const ingestSecret = requireEnv("NEWS_INGEST_SECRET");
  const siteUrl = process.env.NEWS_SITE_URL?.trim() || "https://dlptest.com";
  const newsDir = join(REPO_ROOT, process.env.NEWS_DIR?.trim() || "src/content/news");

  const editorial = readFileSync(join(SCRIPT_DIR, "EDITORIAL.md"), "utf8");
  const cutoff = computeCutoff(newsDir);
  const cutoffIso = cutoff.toISOString();
  const today = new Date().toISOString().slice(0, 10);

  const excludeSlugs = Array.from(
    new Set([...repoSlugs(newsDir), ...(await fetchKnownSlugs(siteUrl, ingestSecret))]),
  );

  console.log(`Cutoff:        ${cutoffIso}`);
  console.log(`Today:         ${today}`);
  console.log(`Exclude slugs: ${excludeSlugs.length}`);
  console.log(`Site:          ${siteUrl}`);

  const client = new Anthropic({ apiKey });

  console.log("Researching with web search...");
  const report = await research(client, { editorial, cutoffIso, excludeSlugs, today });
  console.log(`Research length: ${report.length} chars`);

  console.log("Extracting structured candidates...");
  const candidates = await extract(client, { report, cutoffIso });
  console.log(`Candidates drafted: ${candidates.length}`);

  if (candidates.length === 0) {
    console.log("Nothing met the bar — no candidates queued.");
    return;
  }

  const result = await ingest(siteUrl, ingestSecret, candidates);
  console.log("Ingest result:", JSON.stringify(result));
}

try {
  await main();
} catch (error) {
  if (isSoftApiError(error)) {
    const detail = error.error?.error?.message || error.message || String(error);
    console.warn(`::warning::News discovery skipped — Anthropic API unavailable: ${detail}`);
    console.warn("Soft-exiting 0 so the scheduled run doesn't fail on a billing/capacity blip.");
    process.exit(0);
  }
  console.error(error);
  process.exit(1);
}
