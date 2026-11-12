/**
 * Tests that the data generator's values are what they claim to be.
 *
 * A "true positive" has to pass the rule a DLP engine checks (Luhn, mod 97, a
 * never-issued range...), and a near miss has to fail it. Getting this wrong is
 * silent: the page still shows plausible-looking numbers. It has happened here
 * more than once (card numbers that failed Luhn, IBANs that failed mod 97, NPIs
 * starting with the wrong digit, GitHub tokens with no checksum).
 *
 * The validators below are written from the published rules, separately from the
 * generator, and each is first checked against known-good and known-bad values.
 *
 * Loads the real src/lib/data-generator.ts through Node's type stripping (on by
 * default from 22.18; CI uses the latest 22.x), like scripts/news/edit.test.mjs.
 * The Custom Regex engine (src/lib/regex/generate-match.ts) can't be loaded this
 * way, so that field is tested here with a stand-in generator.
 */
import {
  CustomFieldError,
  FIELD_TYPE_DEFS,
  NEAR_MISS_TYPES,
  generateCustom,
  generateDataset,
} from "../src/lib/data-generator.ts";

let fail = 0;
function check(name, ok, detail = "") {
  console.log(`${ok ? "ok  " : "FAIL"}  ${name}`);
  if (!ok) {
    if (detail) console.log(`      ${detail}`);
    fail += 1;
  }
}
/** Checks every value and reports the first few that fail. */
function checkAll(name, values, isOk) {
  const bad = values.filter((v) => !isOk(v));
  check(`${name} (${values.length} values)`, bad.length === 0, `${bad.length} failed, e.g. ${bad.slice(0, 3).join(", ")}`);
}

// ─── Validators, from the published rules ────────────────────────────────────

const digits = (s) => s.replace(/\D/g, "");
const D = (s) => [...s].map(Number);

function luhn(num) {
  let sum = 0;
  [...num].reverse().forEach((ch, k) => {
    let x = Number(ch);
    if (k % 2 === 1) {
      x *= 2;
      if (x > 9) x -= 9;
    }
    sum += x;
  });
  return sum % 10;
}
const luhnOk = (num) => /^\d+$/.test(num) && luhn(num) === 0;

/** Remainder mod 97 with letters read as 10..35 (ISO 7064 / ISO 13616). */
function mod97(s) {
  let rem = 0;
  for (const ch of s) {
    const v = /[A-Z]/.test(ch) ? String(ch.charCodeAt(0) - 55) : ch;
    for (const c of v) rem = (rem * 10 + Number(c)) % 97;
  }
  return rem;
}

function ssn(v) {
  const m = /^(\d{3})\D?(\d{2})\D?(\d{4})$/.exec(v);
  if (!m) return false;
  const area = Number(m[1]);
  return area !== 0 && area !== 666 && area < 900 && m[2] !== "00" && m[3] !== "0000";
}

/** Luhn, a brand prefix this site generates, and that brand's length. */
function card(v) {
  const n = digits(v);
  if (!luhnOk(n)) return false;
  if (n[0] === "4") return [13, 16, 19].includes(n.length);
  if (/^5[1-5]/.test(n)) return n.length === 16;
  if (/^3[47]/.test(n)) return n.length === 15;
  if (/^6011/.test(n)) return n.length === 16;
  return false;
}

function routing(v) {
  if (!/^\d{9}$/.test(v)) return false;
  const d = D(v);
  const p = Number(v.slice(0, 2));
  const prefixOk = p <= 12 || (p >= 21 && p <= 32) || (p >= 61 && p <= 72) || p === 80;
  return prefixOk && (3 * (d[0] + d[3] + d[6]) + 7 * (d[1] + d[4] + d[7]) + d[2] + d[5] + d[8]) % 10 === 0;
}

const npi = (v) => /^[12]\d{9}$/.test(v) && luhnOk("80840" + v);

function dea(v) {
  if (!/^[ABFGMPR][A-Z9]\d{7}$/.test(v)) return false;
  const d = D(v.slice(2));
  return (d[0] + d[2] + d[4] + 2 * (d[1] + d[3] + d[5])) % 10 === d[6];
}

function nhs(v) {
  const n = digits(v);
  if (n.length !== 10) return false;
  const d = D(n);
  const c = 11 - (d.slice(0, 9).reduce((a, x, i) => a + x * (10 - i), 0) % 11);
  return c !== 10 && (c === 11 ? 0 : c) === d[9];
}

const sin = (v) => /^[1-79]\d{8}$/.test(digits(v)) && luhnOk(digits(v));

function nin(v) {
  const m = /^([A-Z])([A-Z])\d{6}([A-Z])$/.exec(v.replace(/[^A-Z0-9]/g, ""));
  if (!m) return false;
  if ("DFIQUV".includes(m[1]) || "DFIOQUV".includes(m[2])) return false;
  if (["BG", "GB", "KN", "NK", "NT", "TN", "ZZ"].includes(m[1] + m[2])) return false;
  return "ABCD".includes(m[3]);
}

const IBAN_LENGTHS = { DE: 22, FR: 27, IT: 27, ES: 24, NL: 18, BE: 16, PL: 28, SE: 24, AT: 20, PT: 25, GB: 22 };
const CIN_ODD = [1, 0, 5, 7, 9, 13, 15, 17, 19, 21, 2, 4, 18, 20, 11, 3, 6, 8, 12, 14, 16, 10, 22, 25, 24, 23];
function italianCin(s) {
  const sum = [...s].reduce((a, ch, i) => {
    const v = /\d/.test(ch) ? Number(ch) : ch.charCodeAt(0) - 65;
    return a + (i % 2 === 0 ? CIN_ODD[v] : v);
  }, 0);
  return String.fromCharCode(65 + (sum % 26));
}
function iban(v) {
  if (v.length !== IBAN_LENGTHS[v.slice(0, 2)] || mod97(v.slice(4) + v.slice(0, 4)) !== 1) return false;
  const bban = v.slice(4);
  if (v.startsWith("NL")) return /^[A-Z]{4}\d{10}$/.test(bban);
  if (v.startsWith("IT")) return /^[A-Z]\d{10}[A-Z0-9]{12}$/.test(bban) && italianCin(bban.slice(1)) === bban[0];
  return /^[A-Z0-9]+$/.test(bban);
}

/** Per-country rules as python-stdnum implements them. */
function vat(v) {
  const n = v.slice(2);
  switch (v.slice(0, 2)) {
    case "DE": {
      if (!/^[1-9]\d{8}$/.test(n)) return false;
      let c = 5;
      for (const x of D(n)) c = ((((c || 10) * 2) % 11) + x) % 10;
      return c === 1;
    }
    case "FR": {
      if (!/^\d{11}$/.test(n)) return false;
      const siren = n.slice(2);
      return luhnOk(siren) && Number(n.slice(0, 2)) === Number(siren + "12") % 97;
    }
    case "IT": {
      if (!/^\d{11}$/.test(n) || /^0{7}/.test(n)) return false;
      const office = Number(n.slice(7, 10));
      return ((office >= 1 && office <= 100) || [120, 121, 888, 999].includes(office)) && luhnOk(n);
    }
    case "ES":
      return /^\d{8}[A-Z]$/.test(n) && "TRWAGMYFPDXBNJZSQVHLCKE"[Number(n.slice(0, 8)) % 23] === n[8];
    case "NL": {
      if (!/^\d{9}B\d{2}$/.test(n) || n.endsWith("00")) return false;
      const d = D(n.slice(0, 9));
      const elfproef = (d.slice(0, 8).reduce((a, x, i) => a + x * (9 - i), 0) - d[8]) % 11 === 0;
      return elfproef || mod97("NL" + n) === 1;
    }
    case "BE":
      return /^[01]\d{9}$/.test(n) && (Number(n.slice(0, 8)) + Number(n.slice(8))) % 97 === 0;
    case "PL": {
      if (!/^\d{10}$/.test(n)) return false;
      const d = D(n);
      return d.slice(0, 9).reduce((a, x, i) => a + x * [6, 5, 7, 2, 3, 4, 5, 6, 7][i], 0) % 11 === d[9];
    }
    case "SE":
      return /^\d{10}01$/.test(n) && luhnOk(n.slice(0, 10));
    case "AT":
      return /^U\d{8}$/.test(n) && (((6 - luhn(n.slice(1, 8))) % 10) + 10) % 10 === Number(n[8]);
    case "PT": {
      if (!/^\d{9}$/.test(n)) return false;
      const d = D(n);
      const s = d.slice(0, 8).reduce((a, x, i) => a + x * (9 - i), 0);
      return (((11 - s) % 11) + 11) % 11 % 10 === d[8];
    }
    default:
      return false;
  }
}

function crc32(s) {
  let c = 0xffffffff;
  for (let i = 0; i < s.length; i++) {
    c ^= s.charCodeAt(i);
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (c ^ 0xffffffff) >>> 0;
}
const BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
/** ghp_ + 30 characters + CRC32 of those 30, base62, zero-padded to 6. */
function githubToken(v) {
  if (!/^ghp_[A-Za-z0-9]{36}$/.test(v)) return false;
  const tail = [...v.slice(34)].reduce((n, ch) => n * 62 + BASE62.indexOf(ch), 0);
  return crc32(v.slice(4, 34)) === tail;
}

const OPENAI_MARKER = ["T3Blbk", "FJ"].join(""); // split so secret scanners don't flag this file
const awsKeyId = (v) => /^(AKIA|ASIA)[A-Z2-7]{16}$/.test(v);
const stripeSecret = (v) => /^sk_live_[A-Za-z0-9]{24,}$/.test(v);
const openaiKey = (v) => new RegExp(`^sk-[A-Za-z0-9]{20}${OPENAI_MARKER}[A-Za-z0-9]{20}$`).test(v);
const googleKey = (v) => /^AIza[A-Za-z0-9_-]{35}$/.test(v);

/** NANP: area code not N11, N9X, 37X or 96X; exchange 2xx–9xx and not N11. */
function phone(v) {
  const n = digits(v);
  if (n.length !== 10) return false;
  const area = Number(n.slice(0, 3));
  const exchange = Number(n.slice(3, 6));
  const areaOk = area >= 200 && area % 100 !== 11 && Math.floor(area / 10) % 10 !== 9
    && !(area >= 370 && area <= 379) && !(area >= 960 && area <= 969);
  return areaOk && exchange >= 200 && exchange % 100 !== 11;
}

/** Field type → validator. Every near-miss type must be here (checked below). */
const VALIDATORS = {
  "ssn": ssn,
  "credit-card": card,
  "routing-number": routing,
  "npi": npi,
  "dea-number": dea,
  "nhs-number": nhs,
  "canada-sin": sin,
  "uk-nin": nin,
  "iban": iban,
  "eu-vat": vat,
  "github-token": githubToken,
  "aws-access-key": awsKeyId,
  "stripe-secret-key": stripeSecret,
  "openai-api-key": openaiKey,
  "google-api-key": googleKey,
  "phone": phone,
};

// ─── 1. The validators agree with published examples ─────────────────────────

const KNOWN = {
  "ssn": { good: ["078-05-1120", "899-99-9999"], bad: ["000-12-3456", "666-12-3456", "900-12-3456", "123-00-4567", "123-45-0000"] },
  "credit-card": { good: ["4111111111111111", "5555555555554444", "378282246310005", "6011111111111117"], bad: ["4111111111111112", "7111111111111114", "411111111111116"] },
  "routing-number": { good: ["021000021", "011000015"], bad: ["021000022", "501000020"] },
  "npi": { good: ["1234567893"], bad: ["1234567897", "3234567891"] },
  "dea-number": { good: ["AB1234563"], bad: ["AB1234564", "QB1234563"] },
  "nhs-number": { good: ["943 476 5919"], bad: ["943 476 5918"] },
  "canada-sin": { good: ["130 692 544"], bad: ["130 692 545", "830 692 541"] },
  "uk-nin": { good: ["AB 12 34 56 C"], bad: ["GB 12 34 56 C", "DA 12 34 56 C", "AO 12 34 56 C", "AB 12 34 56 E"] },
  "iban": { good: ["DE89370400440532013000", "NL91ABNA0417164300", "IT60X0542811101000000123456", "GB82WEST12345698765432"], bad: ["DE88370400440532013000", "DE8937040044053201300"] },
  "eu-vat": {
    good: ["DE136695976", "FR40303265045", "IT00743110157", "ES54362315K", "NL004495445B01", "NL002455799B11", "BE0403019261", "PL8567346215", "SE123456789701", "ATU13585627", "PT501964843"],
    bad: ["DE136695978", "FR41303265045", "IT00743110158", "ES54362315Z", "NL004495446B01", "BE0403019262", "PL8567346216", "SE123456789801", "ATU13585628", "PT501964844"],
  },
  "phone": { good: ["(212) 555-0147", "415-867-5309"], bad: ["(911) 234-5678", "(296) 234-5678", "(212) 411-1234", "(123) 456-7890"] },
};
check("CRC32 matches the standard test vector", crc32("123456789") === 0xcbf43926);
check("Italian CIN matches SWIFT's example IBAN", italianCin("0542811101000000123456") === "X");
for (const [type, { good, bad }] of Object.entries(KNOWN)) {
  const v = VALIDATORS[type];
  const wrong = [...good.filter((x) => !v(x)), ...bad.filter((x) => v(x))];
  check(`${type} validator: accepts known-good, rejects known-bad`, wrong.length === 0, `wrong on ${wrong.join(", ")}`);
}

// ─── 2. Generated values pass their rule ─────────────────────────────────────

const ROWS = 3000;
const types = Object.keys(VALIDATORS);
const plain = generateCustom(types.map((t) => ({ name: t, type: t, blankPct: 0 })), ROWS, 20261112);
for (const t of types) checkAll(`${t}: every generated value is valid`, plain.rows.map((r) => r[t]), VALIDATORS[t]);
check("no answer key unless a Near-miss % is set", !("nearMisses" in plain));

// With the delimiter options the page offers.
const delimited = generateCustom(
  [
    { name: "ssn", type: "ssn", blankPct: 0, delimiter: "" },
    { name: "credit-card", type: "credit-card", blankPct: 0, delimiter: " " },
    { name: "nhs-number", type: "nhs-number", blankPct: 0, delimiter: "-" },
    { name: "canada-sin", type: "canada-sin", blankPct: 0, delimiter: " " },
    { name: "uk-nin", type: "uk-nin", blankPct: 0, delimiter: "" },
    { name: "phone", type: "phone", blankPct: 0, delimiter: "." },
  ],
  500,
  7,
);
for (const t of Object.keys(delimited.rows[0])) checkAll(`${t} with a custom delimiter: still valid`, delimited.rows.map((r) => r[t]), VALIDATORS[t]);

// The preset datasets build some values with their own code paths (DEA from the
// last name, VAT and IBAN for the row's country), so check those too.
const PRESET_COLUMNS = { ssn: "ssn", ccn: "credit-card", routing: "routing-number", npi: "npi", dea: "dea-number", nhs: "nhs-number", sin: "canada-sin", nin: "uk-nin", iban: "iban", vat: "eu-vat", phone: "phone" };
for (const dataset of ["pii-ssn-ccn", "pii-ssn-dob", "pci-ccn-zip", "hipaa", "banking", "uk-identity", "canada-sin", "eu-vat", "npi-provider"]) {
  const { rows } = generateDataset({ dataset, count: 500, seed: 99 });
  for (const [column, type] of Object.entries(PRESET_COLUMNS)) {
    if (column in rows[0]) checkAll(`preset ${dataset}, column ${column}: valid`, rows.map((r) => r[column]), VALIDATORS[type]);
  }
}

// ─── 3. Near misses fail their rule, and the answer key is right ─────────────

const untested = NEAR_MISS_TYPES.filter((t) => !VALIDATORS[t]);
check("every near-miss type has a validator in this test", untested.length === 0, `add one for: ${untested.join(", ")}`);

const allNear = generateCustom(NEAR_MISS_TYPES.map((t) => ({ name: t, type: t, blankPct: 0, nearMissPct: 100 })), ROWS, 31337);
check("at 100%, every cell is in the answer key", allNear.nearMisses.length === ROWS * NEAR_MISS_TYPES.length);
for (const t of NEAR_MISS_TYPES) {
  const mine = allNear.nearMisses.filter((m) => m.field === t);
  checkAll(`${t}: no near miss passes the rule`, mine.map((m) => m.value), (v) => !VALIDATORS[t](v));
}
check(
  "each answer-key entry is the value in that row and column",
  allNear.nearMisses.every((m) => allNear.rows[m.row - 1][m.field] === m.value),
);
check("each answer-key entry says which rule it breaks", allNear.nearMisses.every((m) => m.reason.length > 10));

// A mix: everything not in the answer key must still be valid.
const mixedFields = NEAR_MISS_TYPES.map((t) => ({ name: t, type: t, blankPct: 10, nearMissPct: 30 }));
const mixed = generateCustom(mixedFields, ROWS, 4242);
const keyed = new Set(mixed.nearMisses.map((m) => `${m.row}|${m.field}`));
const unlabeled = [];
mixed.rows.forEach((row, i) => {
  for (const t of NEAR_MISS_TYPES) {
    if (row[t] !== "" && !keyed.has(`${i + 1}|${t}`) && !VALIDATORS[t](row[t])) unlabeled.push(`${t}=${row[t]}`);
  }
});
check("in a 30% mix, every value outside the answer key is valid", unlabeled.length === 0, unlabeled.slice(0, 3).join(", "));
const nonBlank = mixed.rows.reduce((n, row) => n + NEAR_MISS_TYPES.filter((t) => row[t] !== "").length, 0);
const share = mixed.nearMisses.length / nonBlank;
check(`a 30% Near-miss % gives about 30% (got ${(share * 100).toFixed(1)}%)`, share > 0.28 && share < 0.32);

// Near misses keep the field's delimiter, so they look like their neighbors.
const nearDelimited = generateCustom(
  [
    { name: "ssn", type: "ssn", blankPct: 0, nearMissPct: 100, delimiter: "." },
    { name: "card", type: "credit-card", blankPct: 0, nearMissPct: 100, delimiter: " " },
    { name: "nhs", type: "nhs-number", blankPct: 0, nearMissPct: 100, delimiter: "" },
  ],
  300,
  5,
);
check("SSN near misses keep the delimiter", nearDelimited.rows.every((r) => /^\d{3}\.\d{2}\.\d{4}$/.test(r.ssn)));
check("card near misses keep the delimiter", nearDelimited.rows.every((r) => /^[\d ]+$/.test(r.card) && r.card.includes(" ")));
check("NHS near misses keep 'no delimiter'", nearDelimited.rows.every((r) => /^\d{10}$/.test(r.nhs)));

const onPhone = generateCustom([{ name: "p", type: "phone", blankPct: 0, nearMissPct: 50 }], 50, 3);
check("a Near-miss % on a type without one changes nothing and adds no answer key", !("nearMisses" in onPhone) && onPhone.rows.every((r) => phone(r.p)));

// ─── 4. Seeds ────────────────────────────────────────────────────────────────

const again = generateCustom(mixedFields, ROWS, 4242);
check("the same seed gives the same data and the same answer key", JSON.stringify(again) === JSON.stringify(mixed));
const other = generateCustom(mixedFields, ROWS, 4243);
check("a different seed gives different data", JSON.stringify(other.rows) !== JSON.stringify(mixed.rows));

// ─── 5. Custom Regex plumbing (with a stand-in for the real regex generator) ──

const standIn = (pattern) =>
  pattern === "EMP-\\d{4}"
    ? { ok: true, next: (rand) => `EMP-${String(Math.floor(rand() * 10000)).padStart(4, "0")}` }
    : { ok: false, error: "look-around is not supported" };
const regexFields = [{ name: "emp", type: "custom-regex", blankPct: 0, pattern: "EMP-\\d{4}" }, { name: "ssn", type: "ssn", blankPct: 0 }];
const withRegex = generateCustom(regexFields, 200, 11, { regex: standIn });
check("Custom Regex values come from the pattern's generator", withRegex.rows.every((r) => /^EMP-\d{4}$/.test(r.emp)));
check("Custom Regex values follow the seed", JSON.stringify(generateCustom(regexFields, 200, 11, { regex: standIn })) === JSON.stringify(withRegex));
check("Custom Regex values vary", new Set(withRegex.rows.map((r) => r.emp)).size > 100);

function thrown(fn) {
  try {
    fn();
  } catch (e) {
    return e;
  }
  return null;
}
const badPattern = thrown(() => generateCustom([{ name: "emp", type: "custom-regex", blankPct: 0, pattern: "(?=x)" }], 5, 1, { regex: standIn }));
check("a pattern that can't be used is an error that names the field", badPattern instanceof CustomFieldError && badPattern.field === "emp" && badPattern.message === "emp: look-around is not supported");
const noEngine = thrown(() => generateCustom([{ name: "emp", type: "custom-regex", blankPct: 0, pattern: "x" }], 5, 1));
check("Custom Regex without a regex generator is an error, not blank values", noEngine instanceof CustomFieldError);
check("Custom Regex is a field type the page can offer", FIELD_TYPE_DEFS["custom-regex"]?.group === "Custom");

if (fail) {
  console.error(`\n${fail} check(s) failed`);
  process.exit(1);
}
console.log("\nAll generator checks passed.");
