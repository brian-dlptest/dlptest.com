// Local regex runner for validate.py: dlptest.com's DLP pattern library and RE2 engine,
// loaded straight from the site's source, so validation needs no production calls.
//
// These are the same modules behind the MCP server's list_dlp_patterns and regex_test
// tools (src/lib/regex/dlp-patterns.ts and engines.ts). Needs Node >= 22.18, which strips
// TypeScript types natively.
//
// Protocol: one JSON request per line on stdin, one JSON response per line on stdout.
//   {"op": "patterns"}                                    -> the pattern library
//   {"op": "match", "pattern", "flags", "engine", "text"} -> {ok, error, truncated,
//                                                            match_count, values}
// `values` holds the distinct matched strings.
import { createInterface } from "node:readline";

const root = new URL("../../../../", import.meta.url);
const { runMatch } = await import(new URL("src/lib/regex/engines.ts", root).href);
const { DLP_PATTERNS } = await import(new URL("src/lib/regex/dlp-patterns.ts", root).href);

// The MCP tool caps input at 25,000 characters and 1,000 matches per call. Locally there
// is no reason to chunk: the 50,000-record CRM export is scanned in one pass.
const LIMITS = { maxMatches: 5_000_000, maxInputLength: 100_000_000 };

for await (const line of createInterface({ input: process.stdin })) {
  const req = JSON.parse(line);
  let res;
  if (req.op === "patterns") {
    res = DLP_PATTERNS;
  } else {
    const r = runMatch(req.engine ?? "re2", req.pattern, req.flags ?? "g", req.text, LIMITS);
    res = {
      ok: r.ok,
      error: r.error,
      truncated: r.truncated,
      match_count: r.matches.length,
      values: [...new Set(r.matches.map((m) => m.value))],
    };
  }
  process.stdout.write(JSON.stringify(res) + "\n");
}
