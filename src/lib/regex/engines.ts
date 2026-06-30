// Multi-engine regex matching shared by the /regex/ page and the regex_test MCP
// tool. Two engines run here with zero WASM cost:
//
//   - "ecmascript": the native V8 `RegExp` (browser + Worker).
//   - "re2":        re2js, a pure-JS port of Google's RE2 — linear-time and
//                   ReDoS-safe, so it's the safe default for untrusted input.
//
// (The PCRE flavor is browser-only and lazy-loaded on the page; it never enters
// this module or the Worker bundle.)
//
// runMatch() is pure and synchronous so the MCP tool handler can stay sync.

import { RE2JS } from "re2js";

// "pcre" matching is browser-only (WASM, lazy-loaded by the page via
// src/lib/regex/pcre.ts). runMatch() here implements only the two WASM-free
// engines; it rejects "pcre" so the engine never accidentally runs in the
// Worker. The page produces the same MatchResult shape for PCRE.
export type RegexEngine = "ecmascript" | "re2" | "pcre";

export interface RegexGroup {
  /** 1-based capture group index. */
  index: number;
  /** Named-group name, when the group is named. */
  name: string | null;
  /** Matched text, or null when the group did not participate. */
  value: string | null;
  start: number | null;
  end: number | null;
}

export interface RegexMatchInfo {
  value: string;
  start: number;
  end: number;
  groups: RegexGroup[];
}

export interface MatchResult {
  ok: boolean;
  /** Compile/runtime error message, or null on success. */
  error: string | null;
  engine: RegexEngine;
  /** Whether all matches were collected (g flag) vs. just the first. */
  global: boolean;
  matches: RegexMatchInfo[];
  /** True when the match cap was hit and results were truncated. */
  truncated: boolean;
}

export interface RunOptions {
  maxMatches?: number;
  maxInputLength?: number;
  maxPatternLength?: number;
}

export interface ReplaceResult {
  ok: boolean;
  error: string | null;
  engine: RegexEngine;
  output: string;
}

/** Generous client-side defaults; the MCP tool passes tighter caps. */
export const DEFAULT_LIMITS = {
  maxMatches: 10_000,
  maxInputLength: 1_000_000,
  maxPatternLength: 5_000,
} as const;

/** Flags meaningful to each engine (used by the UI to enable/disable toggles). */
export const ENGINE_FLAGS: Record<RegexEngine, string[]> = {
  ecmascript: ["g", "i", "m", "s", "u", "y"],
  // RE2 is Unicode-aware by default and has no sticky mode; only these apply.
  re2: ["g", "i", "m", "s"],
  // PCRE: same common flags; unicode is enabled by the wrapper, no sticky mode.
  pcre: ["g", "i", "m", "s"],
};

function fail(engine: RegexEngine, global: boolean, message: string): MatchResult {
  return { ok: false, error: message, engine, global, matches: [], truncated: false };
}

function errMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export function runMatch(
  engine: RegexEngine,
  pattern: string,
  flags: string,
  text: string,
  opts: RunOptions = {},
): MatchResult {
  const maxMatches = opts.maxMatches ?? DEFAULT_LIMITS.maxMatches;
  const maxInputLength = opts.maxInputLength ?? DEFAULT_LIMITS.maxInputLength;
  const maxPatternLength = opts.maxPatternLength ?? DEFAULT_LIMITS.maxPatternLength;
  const global = flags.includes("g");

  if (pattern.length > maxPatternLength) {
    return fail(engine, global, `pattern exceeds ${maxPatternLength} characters`);
  }
  if (text.length > maxInputLength) {
    return fail(engine, global, `input exceeds ${maxInputLength} characters`);
  }
  if (engine === "pcre") {
    // PCRE runs in the browser only (WASM). It should never reach here.
    return fail(engine, global, "PCRE matching is only available in the browser");
  }
  if (pattern === "") {
    // An empty pattern matches the empty string at every position — noise, not
    // a useful result. Treat it as "nothing entered yet".
    return { ok: true, error: null, engine, global, matches: [], truncated: false };
  }

  return engine === "re2"
    ? runRe2(pattern, flags, text, global, maxMatches)
    : runEcma(pattern, flags, text, global, maxMatches);
}

// ─── ECMAScript (native RegExp) ──────────────────────────────────────────────

const ECMA_ALLOWED_FLAGS = new Set(["g", "i", "m", "s", "u", "y", "d"]);

function buildEcmaFlags(flags: string, global: boolean): string {
  let out = "";
  for (const ch of flags) {
    if (ECMA_ALLOWED_FLAGS.has(ch) && !out.includes(ch)) out += ch;
  }
  // 'd' gives per-group match indices; 'g' is required for matchAll iteration.
  if (!out.includes("d")) out += "d";
  if (global && !out.includes("g")) out += "g";
  if (!global) out = out.replace(/g/g, "");
  return out;
}

function toEcmaMatch(m: RegExpMatchArray | RegExpExecArray): RegexMatchInfo {
  const start = m.index ?? 0;
  const value = m[0];
  const indices = (m as { indices?: RegExpIndicesArray }).indices;
  const namedIndices = indices?.groups;

  const groups: RegexGroup[] = [];
  for (let i = 1; i < m.length; i++) {
    const span = indices?.[i];
    groups.push({
      index: i,
      name: null,
      value: m[i] ?? null,
      start: span ? span[0] : null,
      end: span ? span[1] : null,
    });
  }

  // Associate named groups to their numbered slot by matching span positions.
  if (namedIndices) {
    for (const [name, span] of Object.entries(namedIndices)) {
      if (!span) continue;
      const g = groups.find((x) => x.name === null && x.start === span[0] && x.end === span[1]);
      if (g) g.name = name;
    }
  }

  return { value, start, end: start + value.length, groups };
}

function runEcma(
  pattern: string,
  flags: string,
  text: string,
  global: boolean,
  maxMatches: number,
): MatchResult {
  let re: RegExp;
  try {
    re = new RegExp(pattern, buildEcmaFlags(flags, global));
  } catch (e) {
    return fail("ecmascript", global, errMessage(e));
  }

  const matches: RegexMatchInfo[] = [];
  let truncated = false;

  if (global) {
    for (const m of text.matchAll(re)) {
      if (matches.length >= maxMatches) {
        truncated = true;
        break;
      }
      matches.push(toEcmaMatch(m));
    }
  } else {
    const m = re.exec(text);
    if (m) matches.push(toEcmaMatch(m));
  }

  return { ok: true, error: null, engine: "ecmascript", global, matches, truncated };
}

// ─── RE2 (re2js, pure JS) ─────────────────────────────────────────────────────

function re2Flags(flags: string): number {
  let f = 0;
  if (flags.includes("i")) f |= RE2JS.CASE_INSENSITIVE;
  if (flags.includes("m")) f |= RE2JS.MULTILINE;
  if (flags.includes("s")) f |= RE2JS.DOTALL;
  return f;
}

function runRe2(
  pattern: string,
  flags: string,
  text: string,
  global: boolean,
  maxMatches: number,
): MatchResult {
  let compiled: RE2JS;
  try {
    compiled = RE2JS.compile(pattern, re2Flags(flags));
  } catch (e) {
    return fail("re2", global, errMessage(e));
  }

  let matcher: ReturnType<RE2JS["matcher"]>;
  try {
    matcher = compiled.matcher(text);
  } catch (e) {
    return fail("re2", global, errMessage(e));
  }

  // Map group index -> name from the compiled pattern's named groups.
  const nameByIndex = new Map<number, string>();
  const named = matcher.namedGroups ?? {};
  for (const [name, idx] of Object.entries(named)) {
    nameByIndex.set(idx as number, name);
  }

  const matches: RegexMatchInfo[] = [];
  let truncated = false;

  while (matcher.find()) {
    if (matches.length >= maxMatches) {
      truncated = true;
      break;
    }

    const start = matcher.start();
    const end = matcher.end();
    const value = matcher.group() ?? "";
    const groups: RegexGroup[] = [];
    const count = matcher.groupCount();

    for (let i = 1; i <= count; i++) {
      let gValue: string | null = null;
      let gStart: number | null = null;
      let gEnd: number | null = null;
      try {
        gValue = matcher.group(i);
        const s = matcher.start(i);
        const e = matcher.end(i);
        gStart = s >= 0 ? s : null;
        gEnd = e >= 0 ? e : null;
      } catch {
        // group didn't participate
      }
      groups.push({ index: i, name: nameByIndex.get(i) ?? null, value: gValue, start: gStart, end: gEnd });
    }

    matches.push({ value, start, end, groups });
    if (!global) break;
  }

  return { ok: true, error: null, engine: "re2", global, matches, truncated };
}

// ─── Substitution / replace ──────────────────────────────────────────────────

/**
 * Apply a replacement to text. ECMAScript and RE2 only (PCRE replace is
 * browser-only and lives in pcre.ts). Replacement syntax follows the engine:
 * ECMAScript uses $1 / $<name>; RE2 (Java-style) uses $1 / ${name}.
 */
export function runReplace(
  engine: RegexEngine,
  pattern: string,
  flags: string,
  text: string,
  replacement: string,
  opts: RunOptions = {},
): ReplaceResult {
  const maxInputLength = opts.maxInputLength ?? DEFAULT_LIMITS.maxInputLength;
  const maxPatternLength = opts.maxPatternLength ?? DEFAULT_LIMITS.maxPatternLength;
  const global = flags.includes("g");

  if (engine === "pcre") {
    return { ok: false, error: "PCRE replace is only available in the browser", engine, output: text };
  }
  if (pattern.length > maxPatternLength) {
    return { ok: false, error: `pattern exceeds ${maxPatternLength} characters`, engine, output: text };
  }
  if (text.length > maxInputLength) {
    return { ok: false, error: `input exceeds ${maxInputLength} characters`, engine, output: text };
  }
  if (pattern === "") {
    return { ok: true, error: null, engine, output: text };
  }

  if (engine === "re2") {
    let compiled: RE2JS;
    try {
      compiled = RE2JS.compile(pattern, re2Flags(flags));
    } catch (e) {
      return { ok: false, error: errMessage(e), engine, output: text };
    }
    try {
      const matcher = compiled.matcher(text);
      const output = global ? matcher.replaceAll(replacement) : matcher.replaceFirst(replacement);
      return { ok: true, error: null, engine, output };
    } catch (e) {
      return { ok: false, error: errMessage(e), engine, output: text };
    }
  }

  // ECMAScript
  let re: RegExp;
  // Replace honours the 'g' flag for all-vs-first; 'd' is irrelevant here.
  const f = buildEcmaFlags(flags, global).replace(/d/g, "");
  try {
    re = new RegExp(pattern, f);
  } catch (e) {
    return { ok: false, error: errMessage(e), engine, output: text };
  }
  try {
    return { ok: true, error: null, engine, output: text.replace(re, replacement) };
  } catch (e) {
    return { ok: false, error: errMessage(e), engine, output: text };
  }
}
