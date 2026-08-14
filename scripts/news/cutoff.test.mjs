import { readFileSync, readdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

// Pull the REAL computeCutoff out of the source so we test shipped code,
// not a reimplementation of it.
const src = readFileSync("scripts/news/discover.mjs", "utf8");
const fnText = src.slice(
  src.indexOf("function computeCutoff"),
  src.indexOf("/** Slugs from existing repo filenames. */"),
);
const make = (lookbackDays) =>
  new Function("readdirSync", "readFileSync", "join", "LOOKBACK_DAYS",
    `${fnText}; return computeCutoff;`)(readdirSync, readFileSync, join, lookbackDays);

const day = 864e5;
function fixture(dates) {
  const dir = mkdtempSync(join(tmpdir(), "news-"));
  dates.forEach((d, i) =>
    writeFileSync(join(dir, `post-${i}.md`), `---\npubDate: ${d}\n---\nbody\n`));
  return dir;
}
const iso = (ms) => new Date(ms).toISOString();
let fail = 0;
const check = (name, got, want) => {
  const ok = got === want;
  if (!ok) fail++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}\n        got=${got}\n        want=${want}`);
};

// 1. Recent post → floor must win (this is the bug fix)
{
  const dir = fixture([iso(Date.now() - 2 * day)]);
  const { cutoff, basis } = make(21)(dir);
  check("recent post → 21d floor wins",
    cutoff.getTime() < Date.now() - 20 * day, true);
  check("  basis reported", basis, "21d lookback floor");
}
// 2. Dormant site (oldest > lookback) → max(pubDate) wins, window stays wide
{
  const old = Date.now() - 60 * day;
  const dir = fixture([iso(old)]);
  const { cutoff, basis } = make(21)(dir);
  check("dormant site → max(pubDate) wins", cutoff.getTime(), old);
  check("  basis reported", basis, "newest pubDate");
}
// 3. No posts at all → floor, no crash
{
  const dir = fixture([]);
  const { cutoff } = make(21)(dir);
  check("empty dir → floor", cutoff.getTime() < Date.now() - 20 * day, true);
}
// 4. THE REGRESSION: Hush (Jul 28) vs roundup published Aug 8.
//    Old behaviour cutoff = Aug 8 → Hush unreachable forever.
{
  const now = Date.parse("2026-08-15T15:00:00Z");
  const dir = fixture(["2026-08-08T12:00:00Z", "2026-07-23T00:00:00Z"]);
  const realNow = Date.now;
  Date.now = () => now;               // freeze clock
  const { cutoff } = make(21)(dir);
  Date.now = realNow;
  const hush = Date.parse("2026-07-28T12:00:00Z");
  check("Hush (Jul 28) inside window on Aug 15", cutoff.getTime() < hush, true);
  console.log(`        cutoff=${cutoff.toISOString()} vs hush=2026-07-28`);
}
// 5. Guard: outage longer than the window is still lost (documented limit)
{
  const now = Date.parse("2026-09-30T15:00:00Z");
  const realNow = Date.now;
  Date.now = () => now;
  const dir = fixture(["2026-09-29T00:00:00Z"]);
  const { cutoff } = make(21)(dir);
  Date.now = realNow;
  check("30d-old story NOT recovered by 21d window (known limit)",
    cutoff.getTime() > Date.parse("2026-08-25T00:00:00Z"), true);
}
console.log(fail === 0 ? "\nALL PASS" : `\n${fail} FAILURE(S)`);
process.exit(fail === 0 ? 0 : 1);
