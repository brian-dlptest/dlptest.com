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
 *   NEWS_MODEL           — optional; default claude-sonnet-5. Anthropic pins model
 *                          IDs per generation (no floating "latest" alias), so bump
 *                          this deliberately after checking migration notes.
 *   NEWS_EFFORT          — optional; default high. low|medium|high|xhigh|max.
 *   NEWS_LOOKBACK_DAYS   — optional; default 21. Minimum span the search window
 *                          always covers, so an outage gap can't be skipped.
 */

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import Anthropic from "@anthropic-ai/sdk";

// Pin an exact model ID here (or override per-run via NEWS_MODEL) — Anthropic
// doesn't offer a floating "latest" alias, since generation upgrades can carry
// breaking API/behavior changes. Bump this deliberately after checking release notes.
const MODEL = process.env.NEWS_MODEL?.trim() || "claude-sonnet-5";
// Research effort. Same pattern as NEWS_MODEL: tune via the Actions variable
// rather than a code change, so a quiet stretch can be probed without a PR.
const EFFORT = process.env.NEWS_EFFORT?.trim() || "high";
// How far back the search window always reaches, regardless of what has been
// published since. See computeCutoff() — this is the outage-recovery guarantee.
// Must exceed the longest plausible discovery outage; the 2026 one ran ~13 days.
const LOOKBACK_DAYS = (() => {
  const raw = Number(process.env.NEWS_LOOKBACK_DAYS);
  return Number.isFinite(raw) && raw > 0 ? raw : 21;
})();
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

/**
 * Discovery cutoff: the EARLIER of the newest pubDate and a fixed lookback
 * floor, so the search window can never skip past a gap.
 *
 * Using max(pubDate) alone was a silent data-loss bug. It is not "since the
 * last successful run" — it is "since the newest thing we happen to have
 * published". So when discovery is down (the 2026-07-26..08-07 credit
 * outage), any story announced inside that window becomes permanently
 * unreachable the moment a NEWER article publishes and drags the cutoff past
 * it. Hush Security's 07-28 Series A was lost exactly this way, and
 * hand-publishing the Black Hat roundup (pubDate 08-08) is what slammed the
 * window shut. Publishing was actively destroying our own recovery path.
 *
 * The floor makes recovery automatic: every run re-examines at least the last
 * NEWS_LOOKBACK_DAYS days regardless of what has been published since.
 * Re-examining is cheap and safe because correctness never depended on the
 * cutoff — duplicates are prevented by the slug exclusion list (repo filenames
 * + every slug in D1, any status). The cutoff is a search-efficiency hint, so
 * widening it costs some tokens and risks nothing.
 *
 * Caveat this does NOT solve: an outage longer than the lookback window still
 * loses stories. Raise NEWS_LOOKBACK_DAYS if the pipeline is ever down longer.
 */
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

  const lookbackFloor = Date.now() - LOOKBACK_DAYS * 864e5;
  // Earlier of the two. When the newest post is recent, the floor wins and we
  // look back further; when the site has been quiet longer than the window,
  // max(pubDate) wins and we keep the wider span rather than narrowing it.
  const cutoffMs = max > 0 ? Math.min(max, lookbackFloor) : lookbackFloor;
  return {
    cutoff: new Date(cutoffMs),
    basis: max > 0 && max < lookbackFloor ? "newest pubDate" : `${LOOKBACK_DAYS}d lookback floor`,
  };
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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Transient capacity errors worth retrying in-run (vs. a persistent block). */
function isTransientError(error) {
  return error?.status === 429 || error?.status === 529;
}

/**
 * Streaming message request with exponential backoff on transient capacity
 * errors (429 rate limit, 529 overloaded). Persistent errors — including a
 * drained credit balance — fail fast and bubble up to main()'s handler.
 *
 * Streaming (rather than messages.create) is load-bearing, not a style choice:
 * the research call runs a server-side web_search loop that can think and
 * search for many minutes with no bytes on the wire. A non-streaming request
 * sits idle through all of it and trips the SDK's HTTP timeout — which is what
 * killed run 31264538594 after 15m, and the SDK's own retries then re-billed
 * the same work twice more for nothing. Streaming keeps the connection active
 * so long calls complete instead of timing out.
 */
/** Token usage accumulated across every call in a run, for cost comparison. */
const usageTotals = { calls: 0, input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };

/**
 * Print per-run token totals. Called on both the success and failure paths —
 * a run that dies partway still consumed tokens, and that is exactly the case
 * worth seeing. Note process.exit() skips `finally`, so this is called
 * explicitly rather than relied on there.
 */
function logUsage() {
  const { calls, input, output, cacheRead, cacheWrite } = usageTotals;
  if (calls === 0) return;
  console.log(
    `Usage (${MODEL}): ${calls} calls, ${input} in / ${output} out, ` +
      `cache ${cacheRead} read / ${cacheWrite} write`,
  );
}

function recordUsage(message) {
  const u = message?.usage;
  if (!u) return message;
  usageTotals.calls += 1;
  usageTotals.input += u.input_tokens ?? 0;
  usageTotals.output += u.output_tokens ?? 0;
  usageTotals.cacheRead += u.cache_read_input_tokens ?? 0;
  usageTotals.cacheWrite += u.cache_creation_input_tokens ?? 0;
  return message;
}

async function createMessage(client, params, { maxRetries = 4 } = {}) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return recordUsage(await client.messages.stream(params).finalMessage());
    } catch (error) {
      if (attempt >= maxRetries || !isTransientError(error)) throw error;
      const delayMs = 2 ** attempt * 1000;
      console.warn(`Transient API error (${error.status}); retry ${attempt + 1}/${maxRetries} in ${delayMs}ms…`);
      await sleep(delayMs);
    }
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

  // max_uses bounds how long a single call can run. Without it the server-side
  // search loop is unbounded, and a more search-eager model can stretch one
  // request past any client timeout. 12 is ample for finding 0–2 stories.
  const tools = [{ type: "web_search_20260209", name: "web_search", max_uses: 12 }];
  const request = {
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    // Was "medium" from 2026-08-08. Reverted to "high" (the API default) after
    // six consecutive zero-candidate runs: Sonnet 5 scopes work more tightly at
    // lower effort, and research output shrank from ~3.7k chars on the run that
    // found a story to ~1.6-2.4k on the empty ones. That is correlation, not
    // proof — RESEARCH_REPORT logging below is what will actually settle it.
    // Override per-run with the NEWS_EFFORT variable without a code change.
    output_config: { effort: EFFORT },
    tools,
  };
  let response = await createMessage(client, {
    ...request,
    messages: [{ role: "user", content: prompt }],
  });

  // Server-side web_search loop can pause after its iteration cap — resume.
  let guard = 0;
  const messages = [{ role: "user", content: prompt }];
  while (response.stop_reason === "pause_turn" && guard < 5) {
    messages.push({ role: "assistant", content: response.content });
    response = await createMessage(client, { ...request, messages });
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

  const response = await createMessage(client, {
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

/** Flatten an SDK error's message, including its structured body. */
function errorMessage(error) {
  return [error?.message, error?.error?.error?.message, error?.error?.message]
    .filter((s) => typeof s === "string")
    .join(" ")
    .toLowerCase();
}

/**
 * Billing / quota exhaustion. THIS MUST FAIL THE RUN.
 *
 * These errors never self-heal — a drained credit balance stays drained until
 * a human tops it up. This used to soft-exit 0 alongside capacity blips, on
 * the reasoning that a red cron "spams failure emails". The actual cost of
 * that reasoning: the 2026-07-26 balance ran out and the workflow reported
 * SUCCESS every morning for ~13 days while producing nothing. Nobody noticed
 * until the missing articles were spotted by hand. A silent green run is far
 * more expensive than a noisy red one, because red is the only signal that
 * reaches anyone.
 */
function isBillingError(error) {
  if (!error || typeof error !== "object") return false;
  const message = errorMessage(error);
  if (/credit balance is too low/.test(message)) return true;
  if (/billing|insufficient.*(credit|quota)|quota.*exceeded/.test(message)) return true;
  return false;
}

/**
 * Transient capacity pressure (429 rate limit / 529 overloaded) — genuinely
 * self-healing, and only reached here after createMessage() already burned
 * four exponential-backoff retries. Still worth skipping rather than failing:
 * tomorrow's run will very likely succeed.
 *
 * Deliberately NOT extended to connection timeouts. Those used to indicate a
 * real bug (a non-streaming request hitting the SDK's HTTP timeout, then
 * being re-billed twice by SDK retries) and should stay loud.
 */
function isTransientCapacityError(error) {
  return error?.status === 429 || error?.status === 529;
}

async function main() {
  const apiKey = requireEnv("ANTHROPIC_API_KEY");
  const ingestSecret = requireEnv("NEWS_INGEST_SECRET");
  const siteUrl = process.env.NEWS_SITE_URL?.trim() || "https://dlptest.com";
  const newsDir = join(REPO_ROOT, process.env.NEWS_DIR?.trim() || "src/content/news");

  const editorial = readFileSync(join(SCRIPT_DIR, "EDITORIAL.md"), "utf8");
  const { cutoff, basis: cutoffBasis } = computeCutoff(newsDir);
  const cutoffIso = cutoff.toISOString();
  const today = new Date().toISOString().slice(0, 10);

  const excludeSlugs = Array.from(
    new Set([...repoSlugs(newsDir), ...(await fetchKnownSlugs(siteUrl, ingestSecret))]),
  );

  console.log(`Cutoff:        ${cutoffIso}  (${cutoffBasis})`);
  console.log(`Today:         ${today}`);
  console.log(`Exclude slugs: ${excludeSlugs.length}`);
  console.log(`Site:          ${siteUrl}`);
  console.log(`Model:         ${MODEL}`);
  console.log(`Effort:        ${EFFORT}`);

  // timeout: generous ceiling for a long streaming research call.
  // maxRetries: the SDK retries connection errors by default (2 = 3 attempts).
  // A timed-out request usually still completes and bills server-side, so each
  // retry pays for work we then discard — 1 keeps a blip recoverable without
  // paying for the same research three times.
  const client = new Anthropic({ apiKey, timeout: 15 * 60 * 1000, maxRetries: 1 });

  console.log("Researching with web search...");
  const report = await research(client, { editorial, cutoffIso, excludeSlugs, today });
  console.log(`Research length: ${report.length} chars`);

  console.log("Extracting structured candidates...");
  const candidates = await extract(client, { report, cutoffIso });
  console.log(`Candidates drafted: ${candidates.length}`);

  if (candidates.length === 0) {
    console.log("Nothing met the bar — no candidates queued.");
    // Dump the research verbatim on empty runs. Without this a zero-candidate
    // day is indistinguishable from a genuinely quiet news week: six such runs
    // (2026-08-09..14) burned 120k-508k input tokens each and left no way to
    // tell whether the model found qualifying stories and rejected them, or
    // found nothing at all. The report is a few KB — cheap next to the run.
    console.log("----- RESEARCH REPORT (why nothing qualified) -----");
    console.log(report || "(empty report — the research call returned no text)");
    console.log("----- END RESEARCH REPORT -----");
    return;
  }

  const result = await ingest(siteUrl, ingestSecret, candidates);
  console.log("Ingest result:", JSON.stringify(result));
}

try {
  await main();
  logUsage();
} catch (error) {
  logUsage();
  const detail = error?.error?.error?.message || error?.message || String(error);

  // Billing/quota: fail RED. This never fixes itself, and a green run that
  // produced nothing is indistinguishable from a quiet news week — which is
  // exactly how the 2026-07-26 outage stayed invisible for ~13 days.
  if (isBillingError(error)) {
    console.error(`::error::News discovery FAILED — Anthropic billing/quota exhausted: ${detail}`);
    console.error("This does NOT self-heal. Top up at console.anthropic.com → Plans & Billing.");
    console.error("Failing red on purpose: a silent green run hid this for ~13 days in July 2026.");
    process.exit(1);
  }

  // Capacity: genuinely transient and already retried in-run. Skip quietly.
  if (isTransientCapacityError(error)) {
    console.warn(`::warning::News discovery skipped — Anthropic API at capacity: ${detail}`);
    console.warn("Soft-exiting 0; this is self-healing. Investigate if it repeats for several days.");
    process.exit(0);
  }

  console.error(error);
  process.exit(1);
}
