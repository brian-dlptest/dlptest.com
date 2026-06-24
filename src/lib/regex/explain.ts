// A pragmatic regex tokenizer that turns a pattern into a plain-English
// breakdown for the workbench's "Explanation" panel. ECMAScript-oriented but
// close enough to describe RE2 and PCRE patterns too. Pure and dependency-free.
//
// This is a descriptive aid, not a full parser — it favours readable output over
// exhaustively modelling every edge case.

export interface RegexToken {
  /** The exact source slice this token covers. */
  text: string;
  /** Plain-English description. */
  description: string;
}

const ESCAPE_DESCRIPTIONS: Record<string, string> = {
  d: "any digit (0–9)",
  D: "any non-digit",
  w: "any word character (letter, digit, or underscore)",
  W: "any non-word character",
  s: "any whitespace character",
  S: "any non-whitespace character",
  b: "a word boundary",
  B: "a non-word-boundary position",
  A: "start of the string",
  Z: "end of the string",
  z: "very end of the string",
  n: "a newline",
  r: "a carriage return",
  t: "a tab",
  f: "a form feed",
  v: "a vertical tab",
  "0": "a null character",
};

function describeQuantifier(q: string): string {
  let base: string;
  if (q.startsWith("*")) base = "zero or more times";
  else if (q.startsWith("+")) base = "one or more times";
  else if (q.startsWith("?")) base = "optional (zero or one time)";
  else {
    const m = /^\{(\d+)(,)?(\d+)?\}/.exec(q);
    if (m) {
      const [, n, comma, max] = m;
      if (comma && max) base = `between ${n} and ${max} times`;
      else if (comma) base = `at least ${n} times`;
      else base = `exactly ${n} time${n === "1" ? "" : "s"}`;
    } else {
      base = "repeated";
    }
  }
  if (q.endsWith("?")) return `${base} (lazy — as few as possible)`;
  if (q.endsWith("+") && !q.startsWith("+")) return `${base} (possessive)`;
  return base;
}

export function explainPattern(pattern: string): RegexToken[] {
  const tokens: RegexToken[] = [];
  let i = 0;
  let literalRun = "";

  const flushLiteral = () => {
    if (literalRun) {
      tokens.push({
        text: literalRun,
        description:
          literalRun.length === 1
            ? `the literal character "${literalRun}"`
            : `the literal text "${literalRun}"`,
      });
      literalRun = "";
    }
  };

  while (i < pattern.length) {
    const c = pattern[i];

    // Escapes
    if (c === "\\" && i + 1 < pattern.length) {
      flushLiteral();
      const next = pattern[i + 1];
      if (next === "u" && /^\\u\{[0-9a-fA-F]+\}/.test(pattern.slice(i))) {
        const m = /^\\u\{[0-9a-fA-F]+\}/.exec(pattern.slice(i))!;
        tokens.push({ text: m[0], description: "a Unicode code point" });
        i += m[0].length;
      } else if (next === "u" && /^[0-9a-fA-F]{4}/.test(pattern.slice(i + 2))) {
        tokens.push({ text: pattern.slice(i, i + 6), description: "a Unicode code point" });
        i += 6;
      } else if (next === "x" && /^[0-9a-fA-F]{2}/.test(pattern.slice(i + 2))) {
        tokens.push({ text: pattern.slice(i, i + 4), description: "a hexadecimal character" });
        i += 4;
      } else if (next >= "1" && next <= "9") {
        tokens.push({ text: `\\${next}`, description: `a backreference to group ${next}` });
        i += 2;
      } else if (ESCAPE_DESCRIPTIONS[next]) {
        tokens.push({ text: `\\${next}`, description: ESCAPE_DESCRIPTIONS[next] });
        i += 2;
      } else {
        tokens.push({ text: `\\${next}`, description: `the literal character "${next}"` });
        i += 2;
      }
      continue;
    }

    // Character class
    if (c === "[") {
      flushLiteral();
      let j = i + 1;
      const negated = pattern[j] === "^";
      if (negated) j++;
      if (pattern[j] === "]") j++; // a leading ] is a literal
      while (j < pattern.length && pattern[j] !== "]") {
        j += pattern[j] === "\\" ? 2 : 1;
      }
      const text = pattern.slice(i, Math.min(j + 1, pattern.length));
      const inner = text.replace(/^\[\^?/, "").replace(/\]$/, "");
      tokens.push({
        text,
        description: negated
          ? `any character NOT in the set: ${inner}`
          : `any single character in the set: ${inner}`,
      });
      i = j + 1;
      continue;
    }

    // Groups
    if (c === "(") {
      flushLiteral();
      const rest = pattern.slice(i);
      if (rest.startsWith("(?:")) {
        tokens.push({ text: "(?:", description: "start of a non-capturing group" });
        i += 3;
      } else if (rest.startsWith("(?=")) {
        tokens.push({ text: "(?=", description: "start of a positive lookahead" });
        i += 3;
      } else if (rest.startsWith("(?!")) {
        tokens.push({ text: "(?!", description: "start of a negative lookahead" });
        i += 3;
      } else if (rest.startsWith("(?<=")) {
        tokens.push({ text: "(?<=", description: "start of a positive lookbehind" });
        i += 4;
      } else if (rest.startsWith("(?<!")) {
        tokens.push({ text: "(?<!", description: "start of a negative lookbehind" });
        i += 4;
      } else {
        const named = /^\(\?P?<([A-Za-z_][\w]*)>/.exec(rest) || /^\(\?'([A-Za-z_][\w]*)'/.exec(rest);
        if (named) {
          tokens.push({ text: named[0], description: `start of a capturing group named "${named[1]}"` });
          i += named[0].length;
        } else {
          tokens.push({ text: "(", description: "start of a capturing group" });
          i += 1;
        }
      }
      continue;
    }

    if (c === ")") {
      flushLiteral();
      tokens.push({ text: ")", description: "end of the group" });
      i += 1;
      continue;
    }

    // Anchors / alternation / dot
    if (c === "|") { flushLiteral(); tokens.push({ text: "|", description: "OR — match either side (alternation)" }); i++; continue; }
    if (c === "^") { flushLiteral(); tokens.push({ text: "^", description: "start of the string (or line in multiline mode)" }); i++; continue; }
    if (c === "$") { flushLiteral(); tokens.push({ text: "$", description: "end of the string (or line in multiline mode)" }); i++; continue; }
    if (c === ".") { flushLiteral(); tokens.push({ text: ".", description: "any character (except newline, unless dotall is set)" }); i++; continue; }

    // Quantifiers
    if (c === "*" || c === "+" || c === "?") {
      flushLiteral();
      let q = c;
      const lookahead = pattern[i + 1];
      if (lookahead === "?" || (lookahead === "+" && c !== "+")) q += lookahead;
      tokens.push({ text: q, description: `the preceding token, ${describeQuantifier(q)}` });
      i += q.length;
      continue;
    }
    if (c === "{") {
      const m = /^\{\d+(,\d*)?\}\??/.exec(pattern.slice(i));
      if (m) {
        flushLiteral();
        tokens.push({ text: m[0], description: `the preceding token, ${describeQuantifier(m[0])}` });
        i += m[0].length;
        continue;
      }
    }

    // Plain literal character — accumulate
    literalRun += c;
    i++;
  }

  flushLiteral();
  return tokens;
}
