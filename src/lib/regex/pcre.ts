// Browser-only PCRE engine wrapper. Lazy-loaded by the /regex/ page via dynamic
// import() so the ~0.5 MB base64-inlined WASM payload never enters the initial
// page bundle or the Worker. It produces the same MatchResult shape as
// engines.ts so the page can render PCRE results through the same code path.
//
// pcre2-wasm exposes per-match offsets only for the whole match (not per group),
// so capture-group start/end are reported as null for PCRE.

import { createPCRE2, FLAGS, type PCRE2 } from "pcre2-wasm";
import type { MatchResult, RegexGroup, RegexMatchInfo } from "./engines";

let instance: PCRE2 | null = null;
let pending: Promise<PCRE2> | null = null;

/** Instantiate (once) and cache the PCRE2 WASM engine. */
export async function loadPcre(): Promise<PCRE2> {
  if (instance) return instance;
  if (!pending) pending = createPCRE2().then((p) => (instance = p));
  return pending;
}

function pcreFlags(flags: string): number {
  let f = FLAGS.UTF;
  if (flags.includes("i")) f |= FLAGS.CASELESS;
  if (flags.includes("m")) f |= FLAGS.MULTILINE;
  if (flags.includes("s")) f |= FLAGS.DOTALL;
  return f;
}

interface RawPcreMatch {
  match: string;
  index: number;
  groups: (string | null)[];
  namedGroups?: Record<string, string | null>;
}

function toMatch(m: RawPcreMatch): RegexMatchInfo {
  const groups: RegexGroup[] = m.groups.map((g, i) => ({
    index: i + 1,
    name: null,
    value: g,
    start: null,
    end: null,
  }));
  // Map named groups onto their numbered slot by first matching value.
  if (m.namedGroups) {
    for (const [name, value] of Object.entries(m.namedGroups)) {
      const g = groups.find((x) => x.name === null && x.value === value);
      if (g) g.name = name;
    }
  }
  return { value: m.match, start: m.index, end: m.index + m.match.length, groups };
}

export async function runPcre(
  pattern: string,
  flags: string,
  text: string,
  maxMatches = 10_000,
): Promise<MatchResult> {
  const global = flags.includes("g");
  const base = { engine: "pcre" as const, global };

  if (pattern === "") {
    return { ok: true, error: null, ...base, matches: [], truncated: false };
  }

  let pcre2: PCRE2;
  try {
    pcre2 = await loadPcre();
  } catch (e) {
    return { ok: false, error: `failed to load PCRE engine: ${msg(e)}`, ...base, matches: [], truncated: false };
  }

  let re: ReturnType<PCRE2["compile"]>;
  try {
    re = pcre2.compile(pattern, pcreFlags(flags));
  } catch (e) {
    return { ok: false, error: msg(e), ...base, matches: [], truncated: false };
  }

  try {
    const raw = global
      ? (re.matchAll(text) as RawPcreMatch[])
      : (() => {
          const m = re.match(text) as RawPcreMatch | null;
          return m ? [m] : [];
        })();
    let truncated = false;
    let list = raw;
    if (list.length > maxMatches) {
      list = list.slice(0, maxMatches);
      truncated = true;
    }
    return { ok: true, error: null, ...base, matches: list.map(toMatch), truncated };
  } catch (e) {
    return { ok: false, error: msg(e), ...base, matches: [], truncated: false };
  } finally {
    re.destroy();
  }
}

function msg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
