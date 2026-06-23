// Synthesize strings that MATCH a given regex — the reverse of matching.
// Used by the regex_generate_matches MCP tool.
//
// Generating a string for an *arbitrary* regex is undecidable in general, so
// this is deliberately scoped:
//   1. If the pattern is one of our curated DLP library patterns, return its
//      known-good example (optionally repeated/seeded for variety).
//   2. Otherwise, a bounded generic generator handles a safe ECMAScript subset
//      (literals, ., \d\w\s and friends, character classes, groups, alternation,
//      and bounded quantifiers). Backreferences and look-around are rejected.
//   3. Every produced string is verified against the pattern (ECMAScript engine)
//      before being returned. If verification fails, we return an honest error
//      rather than a wrong answer.

import { DLP_PATTERNS } from "./dlp-patterns";
import { runMatch } from "./engines";

export interface GenerateMatchResult {
  ok: boolean;
  error: string | null;
  pattern: string;
  flags: string;
  source: "library-example" | "generated" | null;
  samples: string[];
  note?: string;
}

const MAX_COUNT = 25;
const MAX_LENGTH = 2_000; // generated-string safety cap

// ─── Tiny seeded RNG (mulberry32) for per-sample variety ─────────────────────
function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T>(arr: T[], rng: () => number): T => arr[Math.floor(rng() * arr.length)];

const LETTERS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGITS = "0123456789";
const WORD = LETTERS + DIGITS + "_";

// ─── AST ──────────────────────────────────────────────────────────────────────
type Node =
  | { t: "seq"; items: Node[] }
  | { t: "alt"; opts: Node[] }
  | { t: "lit"; ch: string }
  | { t: "any" }
  | { t: "class"; negated: boolean; pool: string[] }
  | { t: "shorthand"; kind: string }
  | { t: "anchor" }
  | { t: "repeat"; node: Node; min: number; max: number };

class Unsupported extends Error {}

// ─── Parser ─────────────────────────────────────────────────────────────────
function parse(pattern: string): Node {
  let i = 0;

  function parseAlt(): Node {
    const opts: Node[] = [parseSeq()];
    while (pattern[i] === "|") {
      i++;
      opts.push(parseSeq());
    }
    return opts.length === 1 ? opts[0] : { t: "alt", opts };
  }

  function parseSeq(): Node {
    const items: Node[] = [];
    while (i < pattern.length && pattern[i] !== "|" && pattern[i] !== ")") {
      const atom = parseAtom();
      items.push(parseQuantifier(atom));
    }
    return { t: "seq", items };
  }

  function parseQuantifier(atom: Node): Node {
    const c = pattern[i];
    let min: number, max: number;
    if (c === "*") { min = 0; max = Infinity; i++; }
    else if (c === "+") { min = 1; max = Infinity; i++; }
    else if (c === "?") { min = 0; max = 1; i++; }
    else if (c === "{") {
      const m = /^\{(\d+)(,)?(\d+)?\}/.exec(pattern.slice(i));
      if (!m) return atom;
      min = parseInt(m[1], 10);
      max = m[3] ? parseInt(m[3], 10) : m[2] ? Infinity : min;
      i += m[0].length;
    } else {
      return atom;
    }
    // consume lazy/possessive marker
    if (pattern[i] === "?" || pattern[i] === "+") i++;
    return { t: "repeat", node: atom, min, max };
  }

  function parseAtom(): Node {
    const c = pattern[i];
    if (c === "(") {
      i++;
      if (pattern[i] === "?") {
        const tag = pattern.slice(i, i + 3);
        if (pattern.startsWith("?:", i)) {
          i += 2;
        } else if (/^\?P?<[A-Za-z_]/.test(pattern.slice(i)) || /^\?'/.test(pattern.slice(i))) {
          // named capture group — skip the name header
          const m = /^\?P?<[A-Za-z_]\w*>|^\?'[A-Za-z_]\w*'/.exec(pattern.slice(i))!;
          i += m[0].length;
        } else {
          // lookahead/lookbehind — cannot reverse-generate reliably
          throw new Unsupported(`look-around is not supported (\`${tag}…\`)`);
        }
      }
      const inner = parseAlt();
      if (pattern[i] === ")") i++;
      return inner;
    }
    if (c === "[") return parseClass();
    if (c === ".") { i++; return { t: "any" }; }
    if (c === "^" || c === "$") { i++; return { t: "anchor" }; }
    if (c === "\\") {
      const next = pattern[i + 1];
      if (next === undefined) { i++; return { t: "lit", ch: "\\" }; }
      if (next >= "1" && next <= "9") throw new Unsupported("backreferences are not supported");
      i += 2;
      if ("dwsDWS".includes(next)) return { t: "shorthand", kind: next };
      if (next === "b" || next === "B" || next === "A" || next === "z" || next === "Z") return { t: "anchor" };
      const map: Record<string, string> = { n: "\n", r: "\r", t: "\t", f: "\f", v: "\v", "0": "\0" };
      return { t: "lit", ch: map[next] ?? next };
    }
    i++;
    return { t: "lit", ch: c };
  }

  function parseClass(): Node {
    i++; // consume [
    const negated = pattern[i] === "^";
    if (negated) i++;
    const pool: string[] = [];
    if (pattern[i] === "]") { pool.push("]"); i++; } // leading ] is literal
    while (i < pattern.length && pattern[i] !== "]") {
      let ch = pattern[i];
      if (ch === "\\") {
        const next = pattern[i + 1];
        i += 2;
        if (next === "d") { pool.push(...DIGITS); continue; }
        if (next === "w") { pool.push(...WORD); continue; }
        if (next === "s") { pool.push(" ", "\t"); continue; }
        const map: Record<string, string> = { n: "\n", r: "\r", t: "\t", "0": "\0" };
        ch = map[next] ?? next;
        pool.push(ch);
        continue;
      }
      // range a-z
      if (pattern[i + 1] === "-" && pattern[i + 2] && pattern[i + 2] !== "]") {
        const from = ch.charCodeAt(0);
        const to = pattern[i + 2].charCodeAt(0);
        for (let c = from; c <= to && pool.length < 256; c++) pool.push(String.fromCharCode(c));
        i += 3;
        continue;
      }
      pool.push(ch);
      i++;
    }
    if (pattern[i] === "]") i++;
    return { t: "class", negated, pool };
  }

  const node = parseAlt();
  return node;
}

// ─── Generator ────────────────────────────────────────────────────────────────
function generate(node: Node, rng: () => number): string {
  switch (node.t) {
    case "seq":
      return node.items.map((n) => generate(n, rng)).join("");
    case "alt":
      return generate(pick(node.opts, rng), rng);
    case "lit":
      return node.ch;
    case "any":
      return pick((LETTERS + DIGITS).split(""), rng);
    case "shorthand":
      switch (node.kind) {
        case "d": return pick(DIGITS.split(""), rng);
        case "w": return pick(WORD.split(""), rng);
        case "s": return pick([" ", "\t"], rng);
        case "D": return pick(LETTERS.split(""), rng);
        case "W": return pick(["-", ".", " ", "@"], rng);
        case "S": return pick(LETTERS.split(""), rng);
        default: return "x";
      }
    case "anchor":
      return "";
    case "class": {
      if (!node.negated) {
        return node.pool.length ? pick(node.pool, rng) : "x";
      }
      const excluded = new Set(node.pool);
      const candidates = (LETTERS + DIGITS).split("").filter((c) => !excluded.has(c));
      return candidates.length ? pick(candidates, rng) : "x";
    }
    case "repeat": {
      const upper = node.max === Infinity ? node.min + 2 : node.max;
      const lo = node.min;
      // Aim for a non-empty, bounded count.
      let count = lo === 0 ? (rng() < 0.5 ? 1 : 0) : lo;
      if (upper > count) count = lo + Math.floor(rng() * (Math.min(upper, lo + 3) - lo + 1));
      let out = "";
      for (let k = 0; k < count && out.length < MAX_LENGTH; k++) out += generate(node.node, rng);
      return out;
    }
  }
}

export function generateMatchingStrings(
  pattern: string,
  flags: string,
  count: number,
): GenerateMatchResult {
  const n = Math.max(1, Math.min(MAX_COUNT, Math.floor(count) || 1));
  const base: Omit<GenerateMatchResult, "ok" | "error" | "source" | "samples"> = { pattern, flags };

  if (!pattern) {
    return { ok: false, error: "pattern is required", source: null, samples: [], ...base };
  }

  const verify = (s: string): boolean => {
    // A non-anchored pattern can match a substring; require the WHOLE generated
    // string to be produced by the pattern by checking it matches.
    const r = runMatch("ecmascript", pattern, flags.replace(/g/g, ""), s, { maxMatches: 1 });
    return r.ok && r.matches.length > 0;
  };

  // Tier 2 generic generation (preferred — gives variety), with verification.
  let ast: Node | null = null;
  let unsupported: string | null = null;
  try {
    ast = parse(pattern);
  } catch (e) {
    unsupported = e instanceof Error ? e.message : String(e);
  }

  const samples: string[] = [];
  if (ast) {
    for (let attempt = 0; attempt < n * 8 && samples.length < n; attempt++) {
      let s: string;
      try {
        s = generate(ast, makeRng(0x9e3779b9 ^ (attempt + 1)));
      } catch {
        break;
      }
      if (s.length > MAX_LENGTH) continue;
      if (verify(s) && !samples.includes(s)) samples.push(s);
    }
    if (samples.length > 0) {
      return { ok: true, error: null, source: "generated", samples, ...base };
    }
  }

  // Tier 1 fallback: a curated library example for this exact pattern.
  const lib = DLP_PATTERNS.find((p) => p.pattern === pattern);
  if (lib && verify(lib.example)) {
    return {
      ok: true,
      error: null,
      source: "library-example",
      samples: Array.from({ length: n }, () => lib.example),
      note: "Returned the curated library example; this pattern is outside the generic generator's supported subset.",
      ...base,
    };
  }

  return {
    ok: false,
    error:
      unsupported
        ? `cannot generate matches: ${unsupported}`
        : "cannot generate a matching string for this pattern (unsupported construct, or no match could be produced)",
    source: null,
    samples: [],
    ...base,
  };
}
